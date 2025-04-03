import { applyOperator } from "./operators.mjs";
import { getObjectValueByStringPath, getSafeJson } from "../helpers/utils.mjs"
import { mergeWoundsWithOperator } from "./combat.mjs";

export async function handleSkillActivate(actor, skill, checkActions = true) {
    if (!skill.system.isActivatable) {
        ui.notifications.info(`${skill.name} can not be activated`);
        return false;
    }

    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return false;
    }

    if (skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0) {
        await applySkillEffects(actor, skill);
        return true;
    }

    if (skill.system.action.uses.hasUses && !skill.system.action.uses.value > 0) {
        ui.info(`You don't have any more uses of ${skill.name}.`);
        return false;
    }

    if (checkActions) {
        if (!await actor.canActorUseActions(getModifiedSkillActionCost(actor, skill))) {
            return false;
        }
    }

    if (skill.system.action.activationType === "stackRemoval") {
        removeStackFromSkill(skill);
        return true;
    }

    await rechargeSkill(actor, skill);
    return await activateSkill(actor, skill);
}

export async function removeStackFromSkill(skill) {
    const stacks = skill.system.action.uses.value - 1;
    if (stacks > 0) {
        await skill.update({ "system.action.uses.value": stacks })
        return;
    }

    if (skill.system.skillType === "temporary" && skill.system.action.activationType !== "passive") {
        await skill.delete();
    }
}

async function activateSkill(actor, skill) {
    if (skill.system.action.activationType === "synergy") {
        await trackSkillDuration(actor, skill);
        await addSkillToQueuedSkills(actor, skill);
        const templateData = {
            actor: actor,
            tokenId: actor.token?.uuid || null,
            actionCost: skill.system.action.actionCost,
            title: skill.name,
            message: skill.system.description
        };

        const html = await renderTemplate("systems/abbrew/templates/chat/notification-card.hbs", templateData);

        const speaker = ChatMessage.getSpeaker({ actor: actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const label = `[${skill.system.skillType}] ${skill.name}`;
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: label,
            content: html,
            flags: {}
        });

        return true;
    }

    if (await trackSkillDuration(actor, skill)) {
        await addSkillToActiveSkills(actor, skill);
    }
    await applySkillEffects(actor, skill);
    return true;
}

export function getModifiedSkillActionCost(actor, skill) {
    // Question: Why was this a thing
    // const minActions = parseInt(skill.system.action.actionCost) === 0 ? 0 : 1;
    const minActions = 0;
    return Math.max(minActions, getModifierSkills(actor, skill).filter(s => s.system.action.modifiers.actionCost.operator).map(s => s.system.action.modifiers.actionCost).reduce((result, actionCost) => { result = applyOperator(result, actionCost.value, actionCost.operator); return result; }, skill.system.action.actionCost));
}

function getModifierSkills(actor, skill) {
    // Get all queued synergy skills
    const queuedSkills = actor.items.toObject().filter(i => actor.system.queuedSkills.includes(i._id)).filter(s => skillHasUsesRemaining(s));
    // Get all synergies that apply to the main skill
    const queuedSynergies = queuedSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).map(s => foundry.utils.parseUuid(s.sourceId).id) })).filter(s => s.synergy.includes(skill._id)).map(s => s.skill)
    // Get all passives
    const passiveSkills = actor.items.toObject().filter(i => i.type === "skill" && i.system.isActivatable === false).filter(s => skillHasUsesRemaining(s));
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill._id)).map(s => s.skill)
    // Combine all relevant skills, filtering for those that are out of charges    
    return [...passiveSynergies, ...queuedSynergies];
}

function skillHasUsesRemaining(skill) {
    return (!skill.system.action.uses.hasUses && !skill.system.action.charges.hasCharges) || (skill.system.action.uses.hasUses && skill.system.action.uses.value > 0) || (skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0);
}

export async function applySkillEffects(actor, skill) {
    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    let updates = {};

    const modifierSkills = getModifierSkills(actor, skill);
    const allSkills = [...modifierSkills, skill].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));
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
    for (const index in modifierSkills) {
        const skill = modifierSkills[index];
        if (skill.system.action.duration.precision === "0") {
            const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === skill._id);
            await effect?.delete();
        }
        if (skill.system.skills.paired.length > 0) {
            skill.system.skills.paired.forEach(async ps => {
                const pairedSkill = actor.items.filter(i => i.type === "skill" && i.system.isActivatable).find(s => s.system.abbrewId.uuid === foundry.utils.parseUuid(ps.sourceId).id);
                await handleSkillActivate(actor, pairedSkill);
            });
        }
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

            const finalDamage = d.overallMultiplier * (attributeModifier + (d.damageMultiplier * d.value));

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
        // TODO: Remove
        const showParry = true;
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
        data = { ...data, totalSuccesses, damage, isFeint, isStrongAttack, attackProfile, attackingActor: actor, actionCost: skill.system.action.actionCost, attackerSkillTraining: actor.system.skillTraining };
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
    const guardModifiers = allSkills.filter(s => s.system.action.modifiers.guard.self.operator).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.guard.self.value, actor), operator: s.system.action.modifiers.guard.self.operator }));
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
    const damage = modifyElement.value ?? baseElement.value;
    const attribute = modifyElement.attributeModifier.length > 0 ? modifyElement.attributeModifier : baseElement.attributeModifier;
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

function getSkillValueForPath(rawValue, actor) {
    return isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
}

export async function trackSkillDuration(actor, skill) {
    const duration = getSkillDuration(skill);
    if (duration && !(skill.system.action.activationType === "standalone" && skill.system.action.duration.precision === "0")) {
        await createDurationActiveEffect(actor, skill, duration);
        return true;
    }

    return false;
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
    if (!item) {
        return;
    }

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

export function getAttackSkillWithActions(id, name, actionCost, image, attackProfile, attackMode, handsSupplied) {
    return ({
        _id: id,
        name: name,
        system: {
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            action: {
                activationType: "standalone",
                actionCost: actionCost,
                actionImage: image,
                duration: {
                    precision: "0",
                    value: 0
                },
                uses: {
                    hasUses: false,
                    value: 0,
                    max: 0,
                    period: ""
                },
                charges: {
                    hasCharges: false,
                    value: 0,
                    max: 0
                },
                isActive: false,
                attackProfile: { ...attackProfile, attackMode: attackMode, handsSupplied: handsSupplied, critical: 11 - handsSupplied },
                modifiers: {
                    fortune: 0,
                    attackProfile: {},
                    damage: {
                        self: []
                    },
                    guard: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    resources: {
                        self: [],
                        target: []
                    },
                    conceepts: {
                        self: [],
                        target: []
                    }
                }
            }
        }
    });
}

export function getParrySkillWithActions(actor, actionCost) {
    const id = actor.system.proxiedSkills["parry"];
    const skill = actor.items.filter(i => i.type === "skill").find(s => s._id === id);

    return ({
        _id: id,
        name: "Parry",
        system: {
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            action: {
                activationType: "standalone",
                actionCost: actionCost,
                actionImage: skill.img,
                duration: {
                    precision: "0",
                    value: 0
                },
                uses: {
                    hasUses: false,
                    value: 0,
                    max: 0,
                    period: ""
                },
                charges: {
                    hasCharges: false,
                    value: 0,
                    max: 0
                },
                isActive: false,
                attackProfile: {},
                modifiers: {
                    fortune: 0,
                    attackProfile: {},
                    damage: {
                        self: []
                    },
                    guard: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    resources: {
                        self: [],
                        target: []
                    },
                    conceepts: {
                        self: [],
                        target: []
                    }
                }
            }
        }
    });
}