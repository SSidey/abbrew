import { parsePathSync } from "../modifierBuilderFieldHelpers.mjs";
import { getResultDice, getRollFormula, getTotalSuccessesForResult } from "./skill-roll.mjs";

export async function applyAttackProfiles(actor, skill, modifierSkills, fortune, templateData, data) {
    if (skill.system.action.attackProfile.isEnabled) {
        const token = actor.token;
        const baseAttackProfile = skill.system.action.attackProfile;
        const attackProfile = mergeAttackProfiles(baseAttackProfile, modifierSkills);
        const rollFormula = getRollFormula(actor.system.meta.tier.value, attackProfile.critical, fortune);
        const roll = new Roll(rollFormula, skill.system.actor);
        const result = await roll.evaluate();
        const attackMode = attackProfile.attackMode;
        const attributeMultiplier = getAttributeModifier(attackMode, attackProfile);
        const damage = Object.entries(attackProfile.damage.map(d => {
            if (d.type === "") {
                return null;
            }

            let attributeModifier = 0;
            if (d.attributeModifier) {
                attributeModifier = Math.floor(attributeMultiplier * actor.system.attributes[d.attributeModifier].value);
            }

            const finalDamage = Math.floor(d.overallMultiplier * (attributeModifier + (d.damageMultiplier * parsePathSync(d.value, actor, actor))));

            return { damageType: d.type, value: finalDamage, penetration: d.penetration };
        }).filter(d => d)
            .reduce((result, damage) => {
                if (damage.damageType in result) {
                    result[damage.damageType].value += damage.value;
                    result[damage.damageType].penetration = Math.min(damage.penetration, result[damage.penetration]) ?? 0;
                } else {
                    result[damage.damageType] = ({ value: damage.value, penetration: damage.penetration });
                }

                return result;
            }, {})).map(e => ({ damageType: e[0], value: e[1].value, penetration: e[1].penetration }));

        await actor.setFlag("abbrew", "combat.damage.lastDealt", damage);

        const resultDice = getResultDice(result);

        const totalSuccesses = getTotalSuccessesForResult(result);


        const finisher = attackMode === "finisher" ? mergeFinishers(baseAttackProfile, modifierSkills, actor) : null;
        const finisherDamageTypes = finisher ? Object.values(finisher).map(f => f.type) : attackProfile.damage.map(d => d.type).filter(d => d).filter(d => d !== "untyped").reduce((result, damageType) => { if (!result.includes(damageType)) { result.push(damageType) }; return result; }, []);

        const showAttack = ['attack', 'feint', 'finisher'].includes(attackMode);
        const isFeint = attackMode === 'feint';
        const isStrongAttack = ['overpower', 'ranged', 'aimedshot', 'thrown'].includes(attackMode);
        const showFinisher = attackMode === 'finisher' || totalSuccesses > 0;
        const isFinisher = attackMode === 'finisher';

        templateData = {
            ...templateData,
            attackProfile,
            totalSuccesses,
            resultDice,
            damage,
            actor: actor,
            tokenId: token?.uuid || null,
            showAttack,
            showFinisher,
            finisherDamageTypes,
            isStrongAttack,
            isFinisher,
            actionCost: skill.system.action.actionCost,
            showAttackResult: true
        };
        data = {
            ...data,
            totalSuccesses,
            damage,
            isFeint,
            isStrongAttack,
            attackProfile,
            attackingActor: actor,
            actionCost: skill.system.action.actionCost,
            attackerSkillTraining: actor.system.skillTraining,
            finisher: finisher,
        };
    }

    return [templateData, data];
}

function mergeAttackProfiles(attackProfile, allSkills) {
    return allSkills.reduce((result, s) => mergeAttackProfile(result, s.system.action.modifiers.attackProfile), attackProfile)
}

function mergeAttackProfile(base, attackProfile) {
    let baseAttackProfile = base;
    if (!attackProfile.isEnabled) {
        return baseAttackProfile;
    }

    if (attackProfile.attackType) {
        baseAttackProfile.attackProfile = attackProfile.attackType;
    }
    if (attackProfile.attackMode) {
        baseAttackProfile.attackMode = attackProfile.attackMode;
    }
    if (attackProfile.handsSupplied) {
        baseAttackProfile.handsSupplied = attackProfile.handsSupplied;
    }

    if (attackProfile.finisherLimit.value != null && attackProfile.finisherLimit.operator) {
        baseAttackProfile.finisherLimit = applyOperator(baseAttackProfile.finisherLimit.value ?? 0, attackProfile.finisherLimit.value, attackProfile.finisherLimit.operator)
    }
    if (attackProfile.critical.value != null && attackProfile.critical.operator) {
        baseAttackProfile.critical = applyOperator(baseAttackProfile.critical.value ?? 10, attackProfile.critical.value, attackProfile.critical.operator)
    }
    if (attackProfile.lethal.value != null && attackProfile.lethal.operator) {
        baseAttackProfile.lethal = applyOperator(baseAttackProfile.lethal.value ?? 0, attackProfile.lethal.value, attackProfile.lethal.operator)
    }

    const baseDamageList = base.damage;
    let modifyDamageList = attackProfile.damage.filter(d => d.modify);
    if (attackProfile.damage.some(d => d.modify === "all" && d.modifyType === "")) {
        modifyDamageList = new Array(baseDamageList.length).fill(attackProfile.damage.find(d => d.modify === "all"));
    } else {
        const allTypeModifiers = attackProfile.damage.filter(d => d.modify === "all" && d.modifyType !== "");
        var flags = [], output = [], l = allTypeModifiers.length, i;
        for (i = 0; i < l; i++) {
            if (flags[allTypeModifiers[i].modifyType]) continue;
            flags[allTypeModifiers[i].modifyType] = true;
            output.push(allTypeModifiers[i]);
        }
        let allTypeFilteredModifiers = attackProfile.damage.filter(d => ["skip", "add"].includes(d.modify));
        let modifyOnce = attackProfile.damage.filter(d => d.modify === "one" && !(d.modify === "one" && flags.includes(d.modifyType)));
        const replacedIndices = baseDamageList.reduce((result, m, i) => {
            let replacement = output.find(fm => fm.modifyType === m.type);
            if (!replacement) {
                const index = modifyOnce.findIndex(mo => mo.modifyType === m.type);
                const replacements = index > -1 ? modifyOnce.splice(index, 1) : [];
                replacement = replacements.length === 1 ? replacements[0] : null;
            }
            result[i] = replacement ? replacement : null;
            return result;
        }, []
        );
        modifyDamageList = replacedIndices.reduce((result, m, i) => {
            result[i] = m ? m : allTypeFilteredModifiers.shift();
            return result;
        }, []
        );
    }

    const last = Math.max(baseDamageList.length, modifyDamageList.length);
    const updatedDamage = [];
    for (let index = 0; index < last; index++) {
        const baseElement = baseDamageList[index] ?? null;
        const modifyElement = modifyDamageList[index] ?? null;

        if (baseElement && (!modifyElement || (modifyElement && modifyElement.modify === "skip"))) {
            updatedDamage.push(baseElement);
        } else if (baseElement && modifyElement && (modifyElement.modify === "one" || modifyElement.modify === "all")) {
            updatedDamage.push(applyModifierToDamageProfile(baseElement, modifyElement));
        } else if (modifyElement && modifyElement.modify === "add") {
            updatedDamage.push(baseElement);
            const newDamage = damageProfileFromModifier(modifyElement);
            if (newDamage) {
                updatedDamage.push(newDamage);
            }
        }
    }

    baseAttackProfile.damage = updatedDamage;

    return baseAttackProfile;
}

function applyModifierToDamageProfile(baseElement, modifyElement) {
    const type = modifyElement.type.length > 0 ? modifyElement.type : baseElement.type;
    const damage = (modifyElement.value && modifyElement !== "") ? modifyElement.value : baseElement.value;
    const attribute = modifyElement.attributeModifier.length > 0 ? modifyElement.attributeModifier : baseElement.attributeModifier;
    const penetration = baseElement.penetration + modifyElement.penetration;
    return ({
        type: type,
        value: damage,
        attributeModifier: attribute,
        attributeMultiplier: modifyElement.attributeMultiplier,
        damageMultiplier: modifyElement.damageMultiplier,
        overallMultiplier: modifyElement.overallMultiplier,
        penetration: penetration
    });
}

function damageProfileFromModifier(modifyElement) {
    if (!modifyElement.type) {
        return null;
    }

    let damage = modifyElement.value ?? 0;
    damage = damage !== "" ? damage : 0;

    return ({
        type: modifyElement.type,
        value: damage,
        attributeModifier: modifyElement.attributeModifier,
        attributeMultiplier: modifyElement.attributeMultiplier ?? 1,
        damageMultiplier: modifyElement.damageMultiplier ?? 1,
        overallMultiplier: modifyElement.overallMultiplier ?? 1,
        penetration: modifyElement.penetration ?? 0
    });
}

function getAttributeModifier(attackMode, attackProfile) {
    switch (attackMode) {
        case "overpower":
            return Math.max(1, attackProfile.handsSupplied);
        case "attack":
        case "feint":
            return 0.5 + (Math.max(1, attackProfile.handsSupplied) / 2);
        default:
            return 1;
    }
}

function mergeFinishers(baseAttackProfile, modifierSkills, actor) {
    const modifierAttackProfiles = modifierSkills.map(s => s.system.action.modifiers.attackProfile);

    const allAttackProfiles = [baseAttackProfile, ...modifierAttackProfiles];
    const finisherCost = mergeFinisherCost(allAttackProfiles);
    const mergedFinisherTypes = mergeFinisherType(allAttackProfiles);
    const finisherType = mergedFinisherTypes.length > 0 ? mergedFinisherTypes : "untyped";
    const finisherDescription = mergeFinisherDescriptions(allAttackProfiles);
    const finisherWounds = mergeFinisherWounds(allAttackProfiles, actor);

    if (finisherDescription.length === 0 && finisherWounds.length === 0) {
        return null;
    }

    const finisher = {};
    finisher[finisherCost] = { type: finisherType, wounds: finisherWounds, text: finisherDescription };
    return finisher;
}

function mergeFinisherCost(allAttackProfiles) {
    return allAttackProfiles.reduce((result, attackProfile) => result += attackProfile.finisher.cost, 0);
}

function mergeFinisherType(allAttackProfiles) {
    return allAttackProfiles.reduce((result, attackProfile) => { result = attackProfile.finisher.type; return result; }, "untyped");
}

function mergeFinisherDescriptions(allAttackProfiles) {
    return allAttackProfiles.map(a => a.finisher.description).filter(d => d).join("</br>");
}

function mergeFinisherWounds(allAttackProfiles, actor) {
    return mergeWoundsForTarget(allAttackProfiles.map(a => a.finisher.wounds), actor);
}

function mergeWoundsForTarget(woundArrays, actor) {
    return Object.entries(woundArrays.reduce((result, woundArray) => {
        woundArray.filter(w => !["suppress", "intensify"].includes(w.operator)).forEach(w => {
            if (w.type in result) {
                result[w.type] = applyOperator(result[w.type], parsePathSync(w.value, actor, actor), w.operator);
            } else {
                result[w.type] = applyOperator(0, parsePathSync(w.value, actor, actor), w.operator);
            }
        });

        return result;
    }, {})).map(e => ({ type: e[0], value: e[1] }));
}