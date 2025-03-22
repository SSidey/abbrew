import { applyOperator } from "./operators.mjs";
import { getObjectValueByStringPath, getSafeJson, intersection } from "../helpers/utils.mjs"
import { mergeWoundsWithOperator } from "./combat.mjs";

export async function removeStackFromSkill(skill) {
    const stacks = skill.system.action.uses.value - 1;
    if (stacks > 0) {
        await skill.update({ "system.action.uses.value": stacks })
        return;
    }

    await skill.delete();
}

export async function activateSkill(actor, skill) {
    if (!skill.system.isActivatable) {
        ui.notifications.info(`${skill.name} can not be activated`);
        return;
    }

    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    if (skill.system.action.activationType === "synergy") {
        await trackSkillDuration(actor, skill);
        await addSkillToQueuedSkills(actor, skill);
        return;
    }

    if (skill.system.action.duration.precision !== "0" && skill.system.action.duration.value !== 0) {
        await trackSkillDuration(actor, skill);
        await addSkillToActiveSkills(actor, skill);
    }

    await applySkillEffects(actor, skill);
}

export async function applySkillEffects(actor, skill) {
    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    let updates = {};
    // Get all queued synergy skills
    const queuedSkills = actor.items.toObject().filter(i => actor.system.queuedSkills.includes(i._id));
    // Get all synergies that apply to the main skill
    const queuedSynergies = queuedSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: getSafeJson(s.system.skillModifiers.synergy, []).map(s => s.id) })).filter(s => s.synergy.includes(skill._id)).map(s => s.skill)
    // Get all passives
    const passiveSkills = actor.items.toObject().filter(i => i.system.isActivatable === false);
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: getSafeJson(s.system.skillModifiers.synergy, []).map(s => s.id) })).filter(s => s.synergy.includes(skill._id)).map(s => s.skill)
    // Combine all relevant skills, filtering for those that are out of charges
    const allSkills = [...passiveSynergies, ...queuedSynergies, skill].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));
    const modifierSkills = [...passiveSynergies, ...queuedSynergies];
    const allSummaries = allSkills.map(s => ({ name: s.name, description: s.system.description }));
    // Explicitly get any skills with charges for later use
    const usesSkills = allSkills.filter(s => s.system.action.uses.hasUses).filter(s => s._id !== skill._id);
    const chargedSkills = allSkills.filter(s => s.system.action.charges.hasCharges);

    mergeGuardSelfModifiers(updates, allSkills, actor);
    mergeWoundSelfModifiers(updates, allSkills, actor);


    await actor.update(updates);
    for (const index in usesSkills) {
        const skill = usesSkills[index];
        let currentCharges = skill.system.action.charges.value;
        if (currentCharges > 0) {
            continue;
        }
        let currentUses = skill.system.action.uses.value
        const item = actor.items.find(i => i._id === skill._id);
        await item.update({ "system.action.uses.value": currentUses -= 1 });
    }
    for (const index in chargedSkills) {
        const skill = chargedSkills[index];
        let currentCharges = skill.system.action.charges.value;
        const item = actor.items.find(i => i._id === skill._id);
        await item.update({ "system.action.charges.value": currentCharges -= 1 });
    }

    let templateData = { allSummaries: allSummaries };
    let data = {};
    if (skill.system.action.attackProfile) {
        const baseAttackProfile = skill.system.action.attackProfile;
        const fortune = mergeFortune(allSkills);
        const attackProfile = mergeAttackProfiles(baseAttackProfile, modifierSkills);
        const rollFormula = getRollFormula(actor.system.meta.tier.value, attackProfile, fortune);
        const roll = new Roll(rollFormula, skill.system.actor);
        const result = await roll.evaluate();
        const token = actor.token;
        const attackMode = attackProfile.attackMode;
        const attributeMultiplier = getAttributeModifier(attackMode, attackProfile);
        const damage = attackProfile.damage.map(d => {
            let attributeModifier = 0;
            if (d.attributeModifier) {
                attributeModifier = Math.floor(attributeMultiplier * actor.system.attributes[d.attributeModifier].value);
            }

            const finalDamage = attributeModifier + d.value;

            return { damageType: d.type, value: finalDamage };
        });

        const resultDice = result.dice[0].results.map(die => {
            let baseClasses = "roll die d10";
            if (die.success) {
                baseClasses = baseClasses.concat(' ', 'success')
            }

            if (die.exploded) {
                baseClasses = baseClasses.concat(' ', 'exploded');
            }

            return { result: die.result, classes: baseClasses };
        });

        const totalSuccesses = result.dice[0].results.reduce((total, r) => {
            if (r.success) {
                total += 1;
            }
            return total;
        }, 0) + attackProfile.lethal;


        const showAttack = ['attack', 'feint', 'finisher'].includes(attackMode);
        const isFeint = attackMode === 'feint';
        const showParry = game.user.targets.some(t => t.actor.doesActorHaveSkillTrait("skillEnabler", "defensiveSkills", "enable", "parry"));
        const isStrongAttack = attackMode === 'overpower';
        const showFinisher = attackMode === 'finisher' || totalSuccesses > 0;
        const isFinisher = attackMode === 'finisher';
        // TODO: Get all of the descriptions together into an array
        // TODO: Update the chat card to display the descriptions
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
            isStrongAttack,
            isFinisher,
            showParry,
            actionCost: skill.system.action.actionCost
        };
        data = { ...data, totalSuccesses, damage, isFeint, isStrongAttack, attackProfile, attackingActor: actor, actionCost: skill.system.action.actionCost };
    }

    // TODO: Move this out of item and into a weapon.mjs / skill-card.mjs
    const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${skill.system.skillType}] ${skill.name}`;
    ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: html,
        flags: { data: data }
    });
    return {};
}

function mergeGuardSelfModifiers(updates, allSkills, actor) {
    const guardModifiers = allSkills.filter(s => s.system.action.modifiers.guard.self.operator).map(s => ({ value: getSkillValueForPath("system.action.modifiers.guard.self.value", s, s.system.action.modifiers.guard.self.value, actor), operator: s.system.action.modifiers.guard.self.operator }));
    if (guardModifiers) {
        const currentGuard = actor.system.defense.guard.value;
        updates["system.defense.guard.value"] = mergeModifiers(guardModifiers, currentGuard);
    }
}

function mergeWoundSelfModifiers(updates, allSkills, actor) {
    const woundModifiers = allSkills.filter(s => s.system.action.modifiers.wounds.self.length > 0).flatMap(s => s.system.action.modifiers.wounds.self.filter(w => w.type && w.value != null && w.operator).map(w => ({ ...w, index: getOrderForOperator(w.operator) }))).sort(compareModifierIndices);
    if (woundModifiers.length > 0) {
        let updateWounds = actor.system.wounds;
        updateWounds = woundModifiers.reduce((result, w) => result = mergeWoundsWithOperator(result, [{ type: w.type, value: w.value }], w.operator), updateWounds)
        updates["system.wounds"] = updateWounds;
    }
}

function mergeFortune(allSkills) {
    return allSkills.reduce((result, s) => result += s.system.action.modifiers.fortune, 0);
}

function mergeAttackProfiles(attackProfile, allSkills) {
    return allSkills.reduce((result, s) => mergeAttackProfile(result, s.system.action.modifiers.attackProfile), attackProfile)
}

function mergeAttackProfile(base, attackProfile) {
    let baseAttackProfile = base;
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
        baseAttackProfile.finisherLimit.value = applyOperator(baseAttackProfile.finisherLimit.value, attackProfile.finisherLimit.value, attackProfile.finisherLimit.operator)
    }
    if (attackProfile.critical.value != null && attackProfile.critical.operator) {
        baseAttackProfile.critical.value = applyOperator(baseAttackProfile.critical.value, attackProfile.critical.value, attackProfile.critical.operator)
    }
    if (attackProfile.lethal.value != null && attackProfile.lethal.operator) {
        baseAttackProfile.lethal.value = applyOperator(baseAttackProfile.lethal.value, attackProfile.lethal.value, attackProfile.lethal.operator)
    }

    const baseDamageList = base.damage;
    const modifyDamageList = attackProfile.damage.some(d => d.modify === "all") ? new Array(baseDamageList.damage.length).fill(attackProfile.damage.find(d => d.modify === "all")[0]) : attackProfile.damage.filter(d => d.modify);
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
    const type = modifyElement.type ?? baseElement.type;
    const damage = modifyElement.value ?? baseElement.value;
    const attribute = modifyElement.attributeModifier.length ? modifyElement.attributeModifier.length : baseElement.attributeModifier;
    return ({
        type: type,
        value: damage,
        attributeModifier: attribute,
        attributeMultiplier: modifyElement.attributeMultiplier,
        damageMultiplier: modifyElement.damageMultiplier,
        overallMultiplier: modifyElement.overallMultiplier
    });
}

function damageProfileFromModifier(modifyElement) {
    if (!modifyElement.type) {
        return null;
    }

    return ({
        type: modifyElement.type,
        value: modifyElement.value ?? 0,
        attributeModifier: modifyElement.attributeModifier,
        attributeMultiplier: modifyElement.attributeMultiplier ?? 1,
        damageMultiplier: modifyElement.damageMultiplier ?? 1,
        overallMultiplier: modifyElement.overallMultiplier ?? 1
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

function getRollFormula(tier, attackProfile, fortune) {
    // 1d10x10cs10
    const diceCount = tier + fortune;
    const explodesOn = attackProfile.critical;
    const successOn = attackProfile.critical;
    return `${diceCount}d10x${explodesOn}cs${successOn}`;
}

function mergeModifiers(modifiers, value) {
    const sortedModifiers = modifiers.map(m => ({ ...m, order: getOrderForOperator(m.operator) })).sort(compareModifierIndices);
    return sortedModifiers.reduce((result, modifier) => applyOperator(result, modifier.value, modifier.operator), value)
}

function getOrderForOperator(operator) {
    switch (operator) {
        case "equal":
            return 0;
        case "add":
            return 1;
        case "minus":
            return 2;
        default:
            return -1;
    }
}

function compareModifierIndices(modifier1, modifier2) {
    if (modifier1.order < modifier2.order) {
        return -1;
    } else if (modifier1.order > modifier2.order) {
        return 1;
    }

    return 0;
}

function getSkillValueForPath(path, skill, rawValue, actor) {
    const skillTraits = getSafeJson(skill.system.skillTraits, []);
    const valueReplacers = skillTraits.filter(st => st.feature === "valueReplacer" && st.subFeature === path && st.effect === "replace");
    if (valueReplacers?.length) {
        const valueReplacer = valueReplacers.shift();
        const value = parsePath(valueReplacer.data, actor)
        return value;
    }

    return isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
}

export async function trackSkillDuration(actor, skill) {
    const duration = getSkillDuration(skill);
    if (duration) {
        await createDurationActiveEffect(actor, skill, duration);
    }
}

async function addSkillToActiveSkills(actor, skill) {
    const skills = actor.system.activeSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.activeSkills": updateSkills });
}

async function addSkillToQueuedSkills(actor, skill) {
    const skills = actor.system.queuedSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.queuedSkills": updateSkills });
}

function getSkillDuration(skill) {
    const precision = skill.system.action.duration.precision;
    const duration = {};
    if (precision === "-1") {
        return duration;
    }

    // TODO: remove on next standalone.
    // Return 1 Turn Duration for Instants, remove on next standalone.
    if (precision === "0") {
        duration["turns"] = 1;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = 0.01;
        return duration;
    }

    const value = Math.max(1, skill.system.action.duration.value);
    duration["startTime"] = game.time.worldTime;

    if (precision === "6") {
        duration["rounds"] = value;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "rounds";
        duration["duration"] = value;
        return duration;
    }

    if (precision === "0.01") {
        duration["turns"] = value;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = (value / 100).toFixed(2);
        return duration;
    }

    const seconds = precision * value;
    duration["duration"] = seconds;
    duration["seconds"] = seconds;
    duration["type"] = "seconds"
    return duration;
}

async function createDurationActiveEffect(actor, skill, duration) {
    const conditionEffectData = {
        _id: actor._id,
        name: game.i18n.localize(skill.name),
        img: skill.img,
        changes: [],
        disabled: false,
        duration: duration,
        description: game.i18n.localize(skill.description),
        origin: `Actor.${actor._id}`,
        tint: '',
        transfer: false,
        statuses: [],
        flags: { abbrew: { skill: { type: skill.system.action.activationType, trackDuration: skill._id } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
}

export async function rechargeSkill(actor, skill) {
    const item = actor.items.find(i => i._id === skill._id);
    let updates = {};
    if (skill.system.action.charges.hasCharges) {
        const maxCharges = skill.system.action.charges.max;
        updates["system.action.charges.value"] = maxCharges;
    }
    if (skill.system.action.uses.hasUses) {
        let currentUses = skill.system.action.uses.value
        updates["system.action.uses.value"] = currentUses -= 1;
    }

    await item.update(updates);
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function parsePath(rawValue, actor) {
    const entityType = rawValue.split('.').slice(0, 1).shift();
    const entity = (function () {
        switch (entityType) {
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();
    const path = (function () {
        switch (entityType) {
            case 'actor':
                return rawValue.split('.').slice(1).join('.');
            case 'item':
                return rawValue.split('.').slice(2).join('.');
        }
    })();
    if (getObjectValueByStringPath(entity, path) != null) {
        return getObjectValueByStringPath(entity, path);
    }
}

export function isSkillBlocked(actor, skill) {
    // TODO: May Require Refinement for durations.
    const skillDiscord = actor.items.filter(i => i.type === "skill").filter(s => s.system.skillModifiers.discord).flatMap(s => getSafeJson(s.system.skillModifiers.discord, []).map(s => s.id));
    const skillId = skill._id;
    return skillDiscord.includes(skillId);
}