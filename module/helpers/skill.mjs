import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { compareModifierIndices, getObjectValueByStringPath, getSafeJson } from "../helpers/utils.mjs"
import { mergeWoundsWithOperator } from "./combat.mjs";
import { getFundamentalAttributeSkill } from "./fundamental-skills.mjs";

export async function handleSkillActivate(actor, skill, checkActions = true) {
    const isSkillProxied = skill.system.isProxied;
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
        ui.notifications.info(`You don't have any more uses of ${skill.name}.`);
        return false;
    }

    if (!doesActorMeetSkillRequirements(actor, skill)) {
        return false;
    }

    if (checkActions) {
        if (!await actor.canActorUseActions(getModifiedSkillActionCost(actor, skill))) {
            return false;
        }
    }

    await rechargeSkill(actor, skill);
    skill.system.isProxied = isSkillProxied;
    return await activateSkill(actor, skill);
}

function doesActorMeetSkillRequirements(actor, skill) {
    const insufficientResources = skill.system.action.modifiers.resources.self.filter(r => r.operator === "minus").map(r => { const summary = JSON.parse(r.summary)[0]; return ({ id: summary.id, name: summary.value, value: r.value }) }).filter(r => !actor.system.resources.values.some(vr => vr.id === r.id) || (actor.system.resources.values.some(vr => vr.id === r.id) && actor.system.resources.values.find(vr => vr.id === r.id).value < r.value));
    if (insufficientResources.length > 0) {
        const resourceNames = new Intl.ListFormat("en-GB", {
            style: "long",
            type: "conjunction",
        }).format(insufficientResources.map(r => r.name))
        ui.notifications.info(`You do not have enough ${resourceNames} to use ${skill.name}`);
        return false;
    }

    return true;
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

        await handleGrantOnUse(skill, actor);
        return true;
    }

    if (await trackSkillDuration(actor, skill)) {
        await addSkillToActiveSkills(actor, skill);
    }
    const skillResult = await applySkillEffects(actor, skill);
    await handleGrantOnUse(skill, actor);
    return skillResult;
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
    const queuedSynergies = queuedSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Get all passives
    const passiveSkills = actor.items.toObject().filter(i => i.type === "skill" && i.system.isActivatable === false).filter(s => skillHasUsesRemaining(s));
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Combine all relevant skills, filtering for those that are out of charges    
    return [...passiveSynergies, ...queuedSynergies];
}

function skillHasUsesRemaining(skill) {
    return (!skill.system.action.uses.hasUses && !skill.system.action.charges.hasCharges) || (skill.system.action.uses.hasUses && skill.system.action.uses.value > 0) || (skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0);
}

export async function acceptSkillCheck(actor, requirements) {
    const skill = getSkillById(actor, requirements.modifierIds);
    if (skill && skill.system.action.skillCheck) {
        const skillResult = await handleSkillActivate(actor, skill);
        if (requirements.isContested) {
            if (requirements.checkType === "successes") {
                const requiredValues = requirements.contestedResult.dice.slice(0, requirements.contestedResult.baseDicePool).map(d => d.result + requirements.contestedResult.modifier).sort((a, b) => b - a);
                const resultValues = skillResult.dice.slice(0, skillResult.baseDicePool).map(d => d.result + requirements.contestedResult.modifier).sort((a, b) => b - a);
                const dicePoolDiff = requirements.contestedResult.dice.length - skillResult.dice.length;
                const diceToCheck = Math.min(requirements.contestedResult.baseDicePool, skillResult.baseDicePool);
                let requiredSuccesses = 0;
                let providedSuccesses = 0;
                if (dicePoolDiff > 0) {
                    requiredSuccesses += dicePoolDiff;
                } else if (dicePoolDiff < 0) {
                    providedSuccesses += Math.abs(dicePoolDiff);
                }

                for (let i = 0; i < diceToCheck; i++) {
                    if (requiredValues[i] >= resultValues[i]) {
                        requiredSuccesses += 1;
                    } else {
                        providedSuccesses += 1;
                    }
                }

                return ({ actor: actor, result: providedSuccesses > requiredSuccesses, totalSuccesses: providedSuccesses, requiredSuccesses: requiredSuccesses, skillResult: skillResult, contestedResult: requirements.contestedResult });
            } else if (requirements.checkType === "result") {
                const requiredValue = Math.max(...requirements.contestedResult.dice.map(d => d.result)) + requirements.contestedResult.modifier;
                const totalValue = Math.max(...skillResult.dice.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue > requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult, contestedResult: requirements.contestedResult });
            }
        } else {
            if (requirements.checkType === "successes") {
                const diceResults = skillResult.dice.map(d => d.result + skillResult.modifier).reduce((result, value) => {
                    if (value >= requirements.successes.requiredValue) {
                        result += 1;
                    }

                    return result;
                }, 0);
                const critSuccesses = skillResult.dice.reduce((result, die) => {
                    if (die.result === 10) {
                        result += 1;
                    }

                    return result;
                }, 0);
                const totalSuccesses = diceResults + critSuccesses;
                return ({ actor: actor, result: totalSuccesses >= requirements.successes.total, totalSuccesses: totalSuccesses, requiredSuccesses: requirements.successes.total, skillResult: skillResult });
            } else if (requirements.checkType === "result") {
                const requiredValue = requirements.result.requiredValue;
                const totalValue = Math.max(...skillResult.dice.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue >= requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult });
            }
        }
    }
}

function getSkillById(actor, skillIds) {
    const actorSkills = actor.items.filter(i => i.type === "skill");
    const fundamentalSkillIds = CONFIG.ABBREW.fundamentalAttributeSkillIds;
    const fundamentalSkills = CONFIG.ABBREW.fundamentalAttributeSkills;

    const skill = skillIds.reduce((result, id) => {
        if (!result) {
            if (fundamentalSkillIds.includes(id)) {
                const fundamental = fundamentalSkills[id];
                result = getFundamentalAttributeSkill(fundamental);
            } else {
                result = actorSkills.find(s => s.system.abbrewId.uuid === id);
            }
        }

        return result;
    }, null);

    skill.system.isProxied = true;

    return skill;
}

export async function applySkillEffects(actor, skill) {
    const renderChatMessage = (skill.system.isProxied === null || skill.system.isProxied === undefined) || (skill.system.isProxied != null && skill.system.isProxied === false);
    await actor.unsetFlag("abbrew", "combat.damage.lastDealt");
    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    let updates = {};

    const mainModifierSkills = getModifierSkills(actor, skill);
    const modifierSkills = [...mainModifierSkills, ...skill.system.siblingSkillModifiers];
    const allSkills = [...modifierSkills, skill].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));
    const mainSummary = ({ name: skill.name, description: skill.system.description });
    const modifierSummaries = modifierSkills.map(s => ({ name: s.name, description: s.system.description }));
    // Explicitly get any skills with charges for later use
    const usesSkills = [...mainModifierSkills, skill].filter(s => s.system.action.uses.hasUses).filter(s => s._id !== skill._id);
    const chargedSkills = [...mainModifierSkills, skill].filter(s => s.system.action.charges.hasCharges);

    const prePhaseFilter = getPhaseFilter("pre");
    let guardSelfUpdate, riskSelfUpdate, resolveSelfUpdate;
    [guardSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeGuardSelfModifiers(allSkills, actor, prePhaseFilter);
    [riskSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeRiskSelfModifiers(allSkills, actor, prePhaseFilter);
    [resolveSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeResolveSelfModifiers(allSkills, actor, prePhaseFilter);
    updates = { ...updates, ...guardSelfUpdate, ...riskSelfUpdate, ...resolveSelfUpdate };
    mergeWoundSelfModifiers(updates, allSkills, actor, prePhaseFilter);
    mergeResourceSelfModifiers(updates, allSkills, actor, prePhaseFilter);
    await actor.update(updates);

    for (const index in usesSkills) {
        const skill = usesSkills[index];
        let currentCharges = skill.system.action.charges.value;
        if (currentCharges > 0) {
            continue;
        }
        let currentUses = skill.system.action.uses.value
        const item = actor.items.find(i => i._id === skill._id);
        if (item.system.action.uses.asStacks && !item.system.action.uses.removeStackOnUse) {
            continue;
        }

        await item.update({ "system.action.uses.value": currentUses -= 1 });
    }

    for (const index in chargedSkills) {
        const skill = chargedSkills[index];
        let currentCharges = skill.system.action.charges.value;
        const item = actor.items.find(i => i._id === skill._id);
        await item.update({ "system.action.charges.value": currentCharges -= 1 });
    }

    for (const index in mainModifierSkills) {
        const skill = mainModifierSkills[index];
        if (skill.system.action.duration.precision === "0") {
            const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === skill._id);
            await effect?.delete();
        }
        // Trigger modifier pairs early. TODO: Why?
        await handlePairedSkills(skill, actor);
    }

    const fortune = mergeFortune(allSkills);
    const token = actor.token;
    let templateData = { user: game.user, mainSummary: mainSummary, modifierSummaries: modifierSummaries, skillCheck: { attempts: [] } };
    let data = {};
    let skillResult = { dice: [], modifier: 0, baseDicePool: 0, result: false, isContested: false };

    if (skill.system.action.skillCheck.length > 0) {
        const combinedSkillModifier = allSkills
            .flatMap(s => parseModifierFieldValue(s.system.action.skillCheck, actor, s))
            .reduce((result, check) => {
                result = applyOperator(result, check.path, check.operator);
                return result;
            }, 0);

        const attributeTiers = allSkills.flatMap(s => s.system.action.skillCheck.filter(c => c.type === "actor" && c.path.includes("system.attributes") && c.path.includes("value")).map(a => getObjectValueByStringPath(actor, a.path.replace(".value", ".tier"))));

        const tier = getTierFromArray(attributeTiers);
        const critical = 10;
        const rollFormula = getRollFormula(tier, critical, fortune);
        const skillRoll = new Roll(rollFormula, skill.system.actor);
        const result = await skillRoll.evaluate();
        const resultDice = getResultDice(result);
        skillResult.dice = resultDice;
        skillResult.modifier = combinedSkillModifier;
        const baseDicePool = getDiceCount(tier, fortune);
        skillResult.baseDicePool = baseDicePool;
        skillResult.simpleResult = baseDicePool === 0 ? combinedSkillModifier : Math.max(resultDice.slice(0, baseDicePool).map(d => d.result + combinedSkillModifier));
        data.skillCheckResult = skillResult;
        templateData = {
            ...templateData,
            showSkillResult: true,
            skillResult: skillResult
        };
    }

    if (skill.system.action.skillRequest.isEnabled) {
        const skillRequest = skill.system.action.skillRequest;
        let requirements = { modifierIds: [], checkType: skillRequest.checkType, isContested: skillRequest.isContested, successes: { total: 0, requiredValue: 0 }, result: { requiredValue: 0 }, contestedResult: { dice: [], modifier: 0 } };
        const targetModifiers = getSafeJson(skillRequest.targetModifiers).map(m => m.id);
        requirements.modifierIds = targetModifiers;
        if (skillRequest.isContested) {
            const modifierIds = getSafeJson(skillRequest.requirements.modifiers, []).map(m => m.id);
            const skill = getSkillById(actor, modifierIds);
            skill.system.siblingSkillModifiers.push(...modifierSkills);

            if (skill) {
                const contestResult = await handleSkillActivate(actor, skill);
                requirements.contestedResult = contestResult;
                skillResult = contestResult;
                skillResult.isContested = true;
            }

        } else {
            requirements.isContested = false;
            if (skillRequest.checkType === "successes") {
                requirements.successes.total = skillRequest.requirements.successes;
                requirements.successes.requiredValue = skillRequest.requirements.result;
            } else if (skillRequest.checkType === "result") {
                requirements.result.requiredValue = skillRequest.requirements.result;
            }
        }

        if (skillRequest.selfCheck) {
            const selfResult = await acceptSkillCheck(actor, requirements);
            skillResult = selfResult.skillResult;
            skillResult.result = selfResult.result;
        } else {
            data.skillCheckRequest = requirements;
            templateData = {
                ...templateData,
                showSkillRequest: true
            };
        }

        data.skillCheckResult = skillResult;
        templateData = {
            ...templateData,
            showSkillResult: true,
            skillResult: skillResult
        };
    }

    // TODO: Give another way to render the card and allow for an accept button
    if (skill.system.action.attackProfile.isEnabled) {
        const baseAttackProfile = skill.system.action.attackProfile;
        const attackProfile = mergeAttackProfiles(baseAttackProfile, modifierSkills);
        const rollFormula = getRollFormula(actor.system.meta.tier.value, attackProfile.critical, fortune);
        const roll = new Roll(rollFormula, skill.system.actor);
        const result = await roll.evaluate();
        const attackMode = attackProfile.attackMode;
        const attributeMultiplier = getAttributeModifier(attackMode, attackProfile);
        const damage = Object.entries(attackProfile.damage.map(d => {
            let attributeModifier = 0;
            if (d.attributeModifier) {
                attributeModifier = Math.floor(attributeMultiplier * actor.system.attributes[d.attributeModifier].value);
            }

            const finalDamage = Math.floor(d.overallMultiplier * (attributeModifier + (d.damageMultiplier * parsePath(d.value, actor, actor))));

            return { damageType: d.type, value: finalDamage, penetration: d.penetration };
        }).reduce((result, damage) => {
            if (damage.damageType in result) {
                result[damage.damageType].value += damage.value;
                result[damage.penetration].penetration = Math.min(damage.penetration, result[damage.penetration]) ?? 0;
            } else {
                result[damage.damageType] = ({ value: damage.value, penetration: damage.penetration });
            }

            return result;
        }, {})).map(e => ({ damageType: e[0], value: e[1].value, penetration: e[1].penetration }));

        await actor.setFlag("abbrew", "combat.damage.lastDealt", damage);

        const resultDice = getResultDice(result);

        const totalSuccesses = getTotalSuccessesForResult(result);


        const finisher = attackMode === "finisher" ? mergeFinishers(baseAttackProfile, modifierSkills, actor) : null;
        const finisherDamageTypes = finisher ? finisher.type : attackProfile.damage.map(d => d.type);

        const showAttack = ['attack', 'feint', 'finisher'].includes(attackMode);
        const isFeint = attackMode === 'feint';
        const isStrongAttack = attackMode === 'overpower';
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

    // Target updates
    const skillsGrantedOnAccept = mergeSkillsGrantedOnAccept(allSkills);
    let targetUpdates = [];
    const targetPhaseFilter = getPhaseFilter("target");
    const [, guardTargetUpdate] = mergeGuardTargetModifiers(allSkills, actor, targetPhaseFilter);
    const [, riskTargetUpdate] = mergeRiskTargetModifiers(allSkills, actor, targetPhaseFilter);
    const [, resolveTargetUpdate] = mergeResolveTargetModifiers(allSkills, actor, targetPhaseFilter);
    targetUpdates = [guardTargetUpdate, riskTargetUpdate, resolveTargetUpdate];
    const targetWounds = mergeWoundTargetModifiers(allSkills, actor, targetPhaseFilter);
    const targetResources = mergeTargetResources(allSkills, actor, targetPhaseFilter);

    data = {
        ...data,
        targetUpdates: targetUpdates,
        targetWounds: targetWounds,
        targetResources: targetResources,
        skillsGrantedOnAccept: skillsGrantedOnAccept,
    };

    // TODO: Move this out of item and into a weapon.mjs / skill-card.mjs
    const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${skill.system.skillType}] ${skill.name}`;
    if (renderChatMessage) {
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: label,
            content: html,
            flags: { data: data, abbrew: { messasgeData: { speaker: speaker, rollMode: rollMode, flavor: label, templateData: templateData } } }
        });
    }

    updates, guardSelfUpdate, riskSelfUpdate, resolveSelfUpdate = {};

    const postPhaseFilter = getPhaseFilter("post");
    [guardSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeGuardSelfModifiers(allSkills, actor, postPhaseFilter);
    [riskSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeRiskSelfModifiers(allSkills, actor, postPhaseFilter);
    [resolveSelfUpdate, /* Ignore Late Evaluated Modifiers */] = mergeResolveSelfModifiers(allSkills, actor, postPhaseFilter);
    updates = { ...updates, ...guardSelfUpdate, ...riskSelfUpdate, ...resolveSelfUpdate };
    mergeWoundSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    mergeResourceSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    await actor.update(updates);

    // Trigger Paired Skills after completion.
    await handlePairedSkills(skill, actor);
    await cleanTemporarySkills(skill, actor);

    return skillResult;
}

function getTierFromArray(array) {
    const arrayValue = Math.min(...array);
    return arrayValue === Number.POSITIVE_INFINITY ? 0 : arrayValue;
}

function getResultDice(result) {
    const groupedDice = result.dice[0].results.reduce((result, die) => {
        if (result.base.length === 0) {
            result.base.push(die);
            return result;
        }

        if (result.base[result.base.length - 1].exploded && (result.stack.length === 0 || result.stack[result.stack.length - 1].exploded)) {
            result.stack.push(die);
        } else {
            result.base.push(die);
            result.explosions.push(...result.stack);
            result.stack = [];
        }

        return result;
    }, { base: [], stack: [], explosions: [] });

    const orderedDice = [...groupedDice.base, ...groupedDice.explosions, ...groupedDice.stack];

    return orderedDice.map(die => {
        let baseClasses = "roll die d10";
        if (die.success) {
            baseClasses = baseClasses.concat(' ', 'success')
        }

        if (die.exploded) {
            baseClasses = baseClasses.concat(' ', 'exploded');
        }

        return { result: die.result, classes: baseClasses };
    });
}

function getTotalSuccessesForResult(result, lethal = 0) {
    const totalSuccesses = result.dice[0].results.reduce((total, r) => {
        if (r.success) {
            total += 1;
        }
        return total;
    }, 0);

    return totalSuccesses > 0 ? totalSuccesses + lethal : totalSuccesses;
}

function mergeSkillsGrantedOnAccept(allSkills) {
    return allSkills.filter(s => s.system.skills.grantedOnAccept.length > 0).flatMap(s => s.system.skills.grantedOnAccept);
}

async function handleGrantOnUse(skill, actor) {
    if (skill.system.skills.grantedOnActivation.length > 0) {
        skill.system.skills.grantedOnActivation.forEach(async s => {
            const grantedSkill = await fromUuid(s.sourceId);
            if (grantedSkill) {
                await Item.create(grantedSkill, { parent: actor });
            }
        });
    }
}

async function cleanTemporarySkills(skill, actor) {
    if (((skill.system.action.uses.hasUses && skill.system.action.uses.value === 0) && skill.system.action.charges.value === 0) || (skill.system.action.charges.hasCharges && skill.system.action.charges.value === 0)) {
        const effect = actor.getEffectBySkillId(skill._id);
        if (effect) {
            await effect.delete();
        }

        if (skill.system.skillType === "temporary" && skill.system.action.uses.removeWhenNoUsesRemain) {
            await skill.delete();
        }
    }
}

async function handlePairedSkills(skill, actor) {
    if (skill.system.skills.paired.length > 0) {
        skill.system.skills.paired.forEach(async ps => {
            const pairedSkill = actor.items.filter(i => i.type === "skill" && i.system.isActivatable).find(s => s.system.abbrewId.uuid === ps.id);
            await handleSkillActivate(actor, pairedSkill);
        });
    }
}

function mergeFinishers(baseAttackProfile, modifierSkills, actor) {
    const modifierAttackProfiles = modifierSkills.map(s => s.system.action.modifiers.attackProfile);

    const allAttackProfiles = [baseAttackProfile, ...modifierAttackProfiles];
    const finisherCost = mergeFinisherCost(allAttackProfiles);
    const finisherType = mergeFinisherType(allAttackProfiles) ?? "untyped";
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

function getPhaseFilter(damagePhase) {
    switch (damagePhase) {
        case "target":
            return (v) => true;
        case "post":
            return (v) => ["damage.lastDealt", "damage.lastReceived", "damage.roundReceived"].includes(v.type);
        case "pre":
        default:
            return (v) => !["damage.lastDealt", "damage.lastReceived", "damage.roundReceived"].includes(v.type);
    }
}

function mergeSimpleSelfModifier(allSkills, actor, phaseFilter, operatorFunction, valueFunction, target, updatePath) {
    let update = {};
    const phaseValidSkills = allSkills.filter(s => operatorFunction(s)).filter(s => phaseFilter(valueFunction(s)));
    const anyLateParse = phaseValidSkills.flatMap(s => valueFunction(s)).some(s => s.lateParse)
    let modifiers = phaseValidSkills.map(s => ({ values: parseModifierFieldValue(valueFunction(s), actor, s), operator: operatorFunction(s) }));
    if (!anyLateParse) {
        let updateValue = target === "self" ? getObjectValueByStringPath(actor, updatePath) : 0;
        updateValue = mergeModifiers(modifiers.map(m => ({ value: mergeModifiers(m.values.map(v => ({ value: v.path, operator: v.operator })), 0), operator: m.operator })).flat(), updateValue);
        update[updatePath] = updateValue;
        modifiers = [];
    }

    return [update, { path: updatePath, update: modifiers }];
}

function mergeGuardSelfModifiers(allSkills, actor, phaseFilter) {
    const target = "self";
    return mergeGuardModifiers(allSkills, actor, phaseFilter, target);
}

function mergeGuardTargetModifiers(allSkills, actor, phaseFilter) {
    const target = "target";
    return mergeGuardModifiers(allSkills, actor, phaseFilter, target);
}

function mergeGuardModifiers(allSkills, actor, phaseFilter, target) {
    const operatorFunction = s => s.system.action.modifiers.guard[target].operator,
        valueFunction = s => s.system.action.modifiers.guard[target].value,
        updatePath = "system.defense.guard.value";
    return mergeSimpleSelfModifier(allSkills, actor, phaseFilter, operatorFunction, valueFunction, target, updatePath);
}

function mergeRiskSelfModifiers(allSkills, actor, phaseFilter) {
    const target = "self";
    return mergeRiskModifiers(allSkills, actor, phaseFilter, target);
}

function mergeRiskTargetModifiers(allSkills, actor, phaseFilter) {
    const target = "target";
    return mergeRiskModifiers(allSkills, actor, phaseFilter, target);
}

function mergeRiskModifiers(allSkills, actor, phaseFilter, target) {
    const operatorFunction = s => s.system.action.modifiers.risk[target].operator,
        valueFunction = s => s.system.action.modifiers.risk[target].value,
        updatePath = "system.defense.risk.raw";
    return mergeSimpleSelfModifier(allSkills, actor, phaseFilter, operatorFunction, valueFunction, target, updatePath);
}

function mergeResolveSelfModifiers(allSkills, actor, phaseFilter) {
    const target = "self";
    return mergeResolveModifiers(allSkills, actor, phaseFilter, target);
}

function mergeResolveTargetModifiers(allSkills, actor, phaseFilter) {
    const target = "target";
    return mergeResolveModifiers(allSkills, actor, phaseFilter, target);
}

function mergeResolveModifiers(allSkills, actor, phaseFilter, target) {
    const operatorFunction = s => s.system.action.modifiers.resolve[target].operator,
        valueFunction = s => s.system.action.modifiers.resolve[target].value,
        updatePath = "system.defense.resolve.value";
    return mergeSimpleSelfModifier(allSkills, actor, phaseFilter, operatorFunction, valueFunction, target, updatePath);
}

function mergeWoundSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const woundModifiers = allSkills
        .filter(s => s.system.action.modifiers.wounds.self.length > 0)
        .flatMap(s => s.system.action.modifiers.wounds.self
            .filter(w => w.type && w.value != null && w.operator)
            .filter(w => !["suppress", "intensify"].includes(w.operator))
            .filter(s => phaseFilter(s.value))
            .map(w => ({ ...w, value: mergeModifiers(parseModifierFieldValue(w.value, actor, w).map(r => ({ value: r.path, operator: r.operator })), 0), index: getOrderForOperator(w.operator) })))
        .sort(compareModifierIndices);
    if (woundModifiers.length > 0) {
        let updateWounds = actor.system.wounds;
        updateWounds = woundModifiers.reduce((result, w) => result = mergeWoundsWithOperator(result, [{ type: w.type, value: w.value }], w.operator), updateWounds)
        updates["system.wounds"] = updateWounds;
    }
}

function mergeWoundsForTarget(woundArrays, actor) {
    return Object.entries(woundArrays.reduce((result, woundArray) => {
        woundArray.filter(w => !["suppress", "intensify"].includes(w.operator)).forEach(w => {
            if (w.type in result) {
                result[w.type] = applyOperator(result[w.type], parsePath(w.value, actor, actor), w.operator);
            } else {
                result[w.type] = applyOperator(0, parsePath(w.value, actor, actor), w.operator);
            }
        });

        return result;
    }, {})).map(e => ({ type: e[0], value: e[1] }));
}

function mergeWoundTargetModifiers(allSkills, actor, phaseFilter) {
    return allSkills
        .filter(s => s.system.action.modifiers.wounds.target.length > 0)
        .flatMap(s => s.system.action.modifiers.wounds.target
            .filter(w => w.type && w.value != null && w.operator)
            .filter(w => !["suppress", "intensify"].includes(w.operator))
            .filter(s => phaseFilter(s.value))
            .map(w => ({ ...w, value: parseModifierFieldValue(w.value, actor, w) })))
        .sort(compareModifierIndices);
}

function mergeTargetResources(allSkills, actor, phaseFilter) {
    return allSkills
        .filter(s => s.system.action.modifiers.resources.target.length > 0)
        .flatMap(r => r.system.action.modifiers.resources.target)
        .filter(r => r.summary)
        .map(r => ({ id: JSON.parse(r.summary)[0].id, value: r.value, operator: r.operator, index: getOrderForOperator(r.operator) }))
        .filter(s => phaseFilter(s.value))
        .filter(r => actor.system.resources.owned.some(o => o.id === r.id))
        .sort(compareModifierIndices)
}

function mergeResourceSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const resourceModifiers = allSkills
        .filter(s => s.system.action.modifiers.resources.self.length > 0)
        .flatMap(r => r.system.action.modifiers.resources.self)
        .filter(r => r.summary)
        .map(r => ({ id: JSON.parse(r.summary)[0].id, value: r.value, operator: r.operator, index: getOrderForOperator(r.operator) }))
        .filter(s => phaseFilter(s.value))
        .filter(r => actor.system.resources.owned.some(o => o.id === r.id))
        .sort(compareModifierIndices)
        .map(r => ({ id: r.id, operator: r.operator, value: reduceParsedModifiers(parseModifierFieldValue(r.value, null, r)) }));

    if (resourceModifiers.length > 0) {
        const baseValues = actor.system.resources.values ?? [];
        let updateResources = baseValues.filter(r => r.id).reduce((result, resource) => {
            result[resource.id] = ({ value: resource.value });
            return result;
        }, {});

        updateResources = resourceModifiers.reduce((result, resource) => {
            if (resource.id in result) {
                const initialCapacity = result[resource.id].value;
                result[resource.id].value = applyOperator(initialCapacity, resource.value, resource.operator, 0, actor.system.resources.owned.find(r => r.id === resource.id).max);
            } else {
                result[resource.id] = ({ value: applyOperator(0, resource.value, resource.operator, 0, actor.system.resources.owned.find(r => r.id === resource.id).max) });
            }

            return result;
        }, updateResources)
        updates["system.resources.values"] = Object.entries(updateResources).map(e => ({ id: e[0], value: e[1].value }));
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
    if (attackProfile.penetration.value != null && attackProfile.penetration.operator) {
        baseAttackProfile.penetration.value = applyOperator(baseAttackProfile.penetration.value, attackProfile.penetration.value, attackProfile.penetration.operator)
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

function getRollFormula(tier, critical, fortune) {
    // 1d10x10cs10
    const diceCount = getDiceCount(tier, fortune);
    const explodesOn = critical;
    const successOn = critical;
    return `${diceCount}d10x>=${explodesOn}cs>=${successOn}`;
}

function getDiceCount(tier, fortune) {
    return tier + fortune;
}

// [{ value: Number, operator: String }, ...], value: Number
export function mergeModifiers(modifiers, value) {
    const sortedModifiers = modifiers.map(m => ({ ...m, order: getOrderForOperator(m.operator) })).sort(compareModifierIndices);
    return sortedModifiers.reduce((result, modifier) => applyOperator(result, modifier.value, modifier.operator), value)
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
        duration["type"] = "turns";
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
        flags: { abbrew: { skill: { type: skill.system.action.activationType, trackDuration: skill._id, expiresOn: skill.system.action.duration.expireOnStartOfTurn ? "start" : "end" } } }
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

// [{ operator: String, type: String, path: String, multiplier: Number, lateParse: Boolean }], actor
// [{ operator: String, type: String, path: String, multiplier: Number, lateParse: Boolean }]
export function parseModifierFieldValue(modifierFieldValue, actor, source) {
    const values = modifierFieldValue.filter(f => f.path !== "" && f.path != null && f.path !== undefined);
    const parsedValues = [];

    values.forEach(v => {
        if (v.lateParse) {
            parsedValues.push({ ...v, lateParse: false });
            return;
        }

        const fullPath = [v.type, v.path].join(".");
        let parsedValue = 0;
        if (v.type === "numeric") {
            parsedValue = parseInt(v.path) ?? 0;
        } else {
            parsedValue = parsePath(fullPath, actor, source) ?? 0;
        }

        if (!isNaN(parsedValue)) {
            parsedValue = Math.floor(parsedValue * v.multiplier);
            parsedValue = { ...v, type: "numeric", path: parsedValue, multiplier: 1 };
            parsedValues.push(parsedValue);
        }
    });

    return parsedValues;
}

export function reduceParsedModifiers(parsedValues) {
    return parsedValues.reduce((result, value) => {
        result = applyOperator(result, value.path, value.operator);
        return result;
    }, 0)
}


// TODO: Add html changed hook and preparse the value, setting to 0 if not correct syntax?
// TODO: Add format for status tracker? 
/* 
    Expects either a number value which will be returned early, or:
    actor.<pathToValue e.g. system.defense.guard.value>
    item.<pathToValue e.g. system.isActivatable>
    resource.<resourceId e.g. this is the abbrewId.uuid>
    damage.<"lastDealt"/"lastReceived"/"roundReceived", damageType e.g. all damage "all" / specific "slashing">
 */
function parsePath(rawValue, actor, source) {
    if (typeof rawValue != "string") {
        return rawValue;
    }

    if (!isNaN(rawValue)) {
        return parseFloat(rawValue);
    }

    if (rawValue === "") {
        return 0;
    }

    const entityType = rawValue.split('.').slice(0, 1).shift();

    switch (entityType) {
        case 'resource':
            return getResourceValue(actor, rawValue.split('.').slice(1).shift());
        case 'damage':
            return getLastDamageValue(actor, rawValue.split('.').slice(1, 2).shift(), rawValue.split('.').slice(2).shift());
    }

    const entity = (function () {
        switch (entityType) {
            case 'this':
                return source;
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();

    const path = (function () {
        switch (entityType) {
            case 'this':
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

function getResourceValue(actor, id) {
    return actor.system.resources.values.find(r => r.id === id)?.value ?? 0;
}

function getLastDamageValue(actor, instance, damageType) {
    if (!["lastDealt", "lastReceived", "roundReceived"].includes(instance)) {
        return 0;
    }
    const damage = actor.flags.abbrew.combat.damage[instance];
    if (!damage) {
        return 0;
    }

    if (damageType === "all") {
        return damage.map(d => d.value).reduce((partial, value) => partial += value, 0);
    }

    if (damage.some(d => d.damageType === damageType)) {
        return damage.find(d => d.damageType === damageType).value;
    }

    return 0;
}

export function isSkillBlocked(actor, skill) {
    const skillDiscord = actor.items.filter(i => i.type === "skill").filter(s => s.system.skillModifiers.discord).flatMap(s => getSafeJson(s.system.skillModifiers.discord, []).map(s => s.id));
    const skillId = skill.system.abbrewId.uuid;
    return skillDiscord.includes(skillId);
}