import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { compareModifierIndices, getObjectValueByStringPath, getSafeJson } from "../helpers/utils.mjs"
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

export async function applySkillEffects(actor, skill) {
    await actor.unsetFlag("abbrew", "combat.damage.lastDealt");
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

    const prePhaseFilter = getPhaseFilter("pre");
    mergeGuardSelfModifiers(updates, allSkills, actor, prePhaseFilter);
    mergeRiskSelfModifiers(updates, allSkills, actor, prePhaseFilter);
    mergeResolveSelfModifiers(updates, allSkills, actor, prePhaseFilter);
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
        await handlePairedSkills(skill, actor);
    }

    let templateData = { allSummaries: allSummaries };
    let data = {};
    if (skill.system.action.attackProfile.isEnabled) {
        const baseAttackProfile = skill.system.action.attackProfile;
        const fortune = mergeFortune(allSkills);
        const attackProfile = mergeAttackProfiles(baseAttackProfile, modifierSkills);
        const rollFormula = getRollFormula(actor.system.meta.tier.value, attackProfile, fortune);
        const roll = new Roll(rollFormula, skill.system.actor);
        const result = await roll.evaluate();
        const token = actor.token;
        const attackMode = attackProfile.attackMode;
        const attributeMultiplier = getAttributeModifier(attackMode, attackProfile);
        const damage = Object.entries(attackProfile.damage.map(d => {
            let attributeModifier = 0;
            if (d.attributeModifier) {
                attributeModifier = Math.floor(attributeMultiplier * actor.system.attributes[d.attributeModifier].value);
            }
            /* 
                        Expects either a number value which will be returned early, or:
                        actor.<actorId>
             */
            const finalDamage = Math.floor(d.overallMultiplier * (attributeModifier + (d.damageMultiplier * parsePath(d.value, actor))));

            return { damageType: d.type, value: finalDamage };
        }).reduce((result, damage) => {
            if (damage.damageType in result) {
                result[damage.damageType] += damage.value;
            } else {
                result[damage.damageType] = damage.value;
            }

            return result;
        }, {})).map(e => ({ damageType: e[0], value: e[1] }));

        await actor.setFlag("abbrew", "combat.damage.lastDealt", damage);

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


        const targetUpdates = [];
        const targetPhaseFilter = getPhaseFilter("target");
        mergeGuardTargetModifiers(targetUpdates, allSkills, actor, targetPhaseFilter);
        mergeRiskTargetModifiers(targetUpdates, allSkills, actor, targetPhaseFilter);
        mergeResolveTargetModifiers(targetUpdates, allSkills, actor, targetPhaseFilter);
        const targetWounds = mergeWoundTargetModifiers(allSkills, actor, targetPhaseFilter);
        const targetResources = mergeTargetResources(allSkills, actor, targetPhaseFilter);
        const finisher = attackMode === "finisher" ? mergeFinishers(baseAttackProfile, modifierSkills, actor) : null;

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
        data = {
            ...data, totalSuccesses, damage, isFeint, isStrongAttack, attackProfile, attackingActor: actor, actionCost: skill.system.action.actionCost, attackerSkillTraining: actor.system.skillTraining, targetUpdates: targetUpdates, targetWounds: targetWounds, finisher: finisher, targetResources: targetResources
        };
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

    updates = {};

    const postPhaseFilter = getPhaseFilter("post");
    mergeGuardSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    mergeRiskSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    mergeResolveSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    mergeWoundSelfModifiers(updates, allSkills, actor, postPhaseFilter);
    await actor.update(updates);

    await handlePairedSkills(skill, actor);
    await cleanTemporarySkill(skill, actor);

    return {};
}

async function cleanTemporarySkill(skill, actor) {
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
            const pairedSkill = actor.items.filter(i => i.type === "skill" && i.system.isActivatable).find(s => s.system.abbrewId.uuid === foundry.utils.parseUuid(ps.sourceId).id);
            await handleSkillActivate(actor, pairedSkill);
        });
    }
}

function mergeFinishers(baseAttackProfile, modifierSkills, actor) {
    const modifierAttackProfiles = modifierSkills.map(s => s.system.action.modifiers.attackProfile);

    const allAttackProfiles = [baseAttackProfile, ...modifierAttackProfiles];
    const finisherCost = mergeFinisherCost(allAttackProfiles);
    const finisherType = mergeFinisherType(allAttackProfiles);
    const finisherDescription = mergeFinisherDescriptions(allAttackProfiles);
    const finisherWounds = mergeFinisherWounds(allAttackProfiles, actor);

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
        woundArray.filter(w => w.operator !== "suppress").forEach(w => {
            if (w.type in result) {
                result[w.type] = applyOperator(result[w.type], parsePath(w.value, actor), w.operator);
            } else {
                result[w.type] = applyOperator(0, parsePath(w.value, actor), w.operator);
            }
        });

        return result;
    }, {})).map(e => ({ type: e[0], value: e[1] }));
}

function getPhaseFilter(damagePhase) {
    switch (damagePhase) {
        case "target":
            return (v) => true;
        case "post":
            return (v) => typeof v === "string" && v.includes("damage");
        case "pre":
        default:
            return (v) => typeof v === "number" || (typeof v === "string" && !v.includes("damage"));
    }
}

function mergeGuardSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const guardModifiers = allSkills.filter(s => s.system.action.modifiers.guard.self.operator).filter(s => phaseFilter(s.system.action.modifiers.guard.self.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.guard.self.value, actor), operator: s.system.action.modifiers.guard.self.operator }));
    if (guardModifiers) {
        const currentGuard = actor.system.defense.guard.value;
        updates["system.defense.guard.value"] = mergeModifiers(guardModifiers, currentGuard);
    }
}

function mergeGuardTargetModifiers(updates, allSkills, actor, phaseFilter) {
    const guardModifiers = allSkills.filter(s => s.system.action.modifiers.guard.target.operator).filter(s => phaseFilter(s.system.action.modifiers.guard.target.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.guard.target.value, actor), operator: s.system.action.modifiers.guard.target.operator }));
    if (guardModifiers) {
        updates.push({ path: "system.defense.guard.value", value: mergeModifiers(guardModifiers, 0) });
    }
}

function mergeRiskSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const riskModifiers = allSkills.filter(s => s.system.action.modifiers.risk.self.operator).filter(s => phaseFilter(s.system.action.modifiers.risk.self.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.risk.self.value, actor), operator: s.system.action.modifiers.risk.self.operator }));
    if (riskModifiers) {
        const currentRisk = actor.system.defense.risk.raw;
        updates["system.defense.risk.raw"] = mergeModifiers(riskModifiers, currentRisk);
    }
}

function mergeRiskTargetModifiers(updates, allSkills, actor, phaseFilter) {
    const riskModifiers = allSkills.filter(s => s.system.action.modifiers.risk.target.operator).filter(s => phaseFilter(s.system.action.modifiers.risk.target.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.risk.target.value, actor), operator: s.system.action.modifiers.risk.target.operator }));
    if (riskModifiers) {
        updates.push({ path: "system.defense.risk.raw", value: mergeModifiers(riskModifiers, 0) });
    }
}

function mergeResolveSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const resolveModifiers = allSkills.filter(s => s.system.action.modifiers.resolve.self.operator).filter(s => phaseFilter(s.system.action.modifiers.resolve.self.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.resolve.self.value, actor), operator: s.system.action.modifiers.resolve.self.operator }));
    if (resolveModifiers) {
        const currentResolve = actor.system.defense.resolve.value;
        updates["system.defense.resolve.value"] = mergeModifiers(resolveModifiers, currentResolve);
    }
}

function mergeResolveTargetModifiers(updates, allSkills, actor, phaseFilter) {
    const resolveModifiers = allSkills.filter(s => s.system.action.modifiers.resolve.target.operator).filter(s => phaseFilter(s.system.action.modifiers.resolve.target.value)).map(s => ({ value: getSkillValueForPath(s.system.action.modifiers.resolve.target.value, actor), operator: s.system.action.modifiers.resolve.target.operator }));
    if (resolveModifiers) {
        updates.push({ path: "system.defense.resolve.value", value: mergeModifiers(resolveModifiers, 0) });
    }
}

function mergeWoundSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const woundModifiers = allSkills.filter(s => s.system.action.modifiers.wounds.self.length > 0).flatMap(s => s.system.action.modifiers.wounds.self.filter(w => w.type && w.value != null && w.operator).filter(w => w.operator !== "suppress").filter(s => phaseFilter(s.value)).map(w => ({ ...w, index: getOrderForOperator(w.operator) }))).sort(compareModifierIndices);
    if (woundModifiers.length > 0) {
        let updateWounds = actor.system.wounds;
        updateWounds = woundModifiers.reduce((result, w) => result = mergeWoundsWithOperator(result, [{ type: w.type, value: w.value }], w.operator), updateWounds)
        updates["system.wounds"] = updateWounds;
    }
}

function mergeWoundTargetModifiers(allSkills, actor, phaseFilter) {
    const woundModifiers = allSkills.filter(s => s.system.action.modifiers.wounds.target.length > 0).map(s => s.system.action.modifiers.wounds.target.filter(w => w.type && w.value != null && w.operator).filter(s => phaseFilter(s.value)));
    if (woundModifiers.length > 0) {
        return mergeWoundsForTarget(woundModifiers, actor)
    }
}

function mergeTargetResources(allSkills, actor, phaseFilter) {
    const resources = allSkills.filter(s => s.system.action.modifiers.resources.target.length > 0).flatMap(s => s.system.action.modifiers.resources.target.filter(r => r.summary && r.summary !== "" && r.value != null && r.operator).filter(r => phaseFilter(r.value))).map(r => ({ id: JSON.parse(r.summary)[0].id, value: parsePath(r.value, actor), operator: r.operator, index: getOrderForOperator(r.operator) })).sort(compareModifierIndices);
    if (resources.length > 0) {
        return Object.entries(resources.reduce((result, resource) => {
            const id = resource.id;
            if (id in result) {
                result[id] = applyOperator(result[resource.summary], resource.value, resource.operator);
            } else {
                result[id] = applyOperator(0, resource.value, resource.operator);
            }

            return result;
        }, {})).map(e => ({ id: e[0], value: e[1] }));
    }
}

function mergeResourceSelfModifiers(updates, allSkills, actor, phaseFilter) {
    const resourceModifiers = allSkills.filter(s => s.system.action.modifiers.resources.self.length > 0).flatMap(r => r.system.action.modifiers.resources.self).filter(r => r.summary).map(r => ({ id: JSON.parse(r.summary)[0].id, value: r.value, operator: r.operator, index: getOrderForOperator(r.operator) })).filter(s => phaseFilter(s.value)).filter(r => actor.system.resources.owned.some(o => o.id === r.id)).sort(compareModifierIndices);
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

    let damage = modifyElement.value ?? 0;
    damage = damage !== "" ? damage : 0;

    return ({
        type: modifyElement.type,
        value: damage,
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

function getSkillValueForPath(rawValue, actor) {/* 
        Expects either a number value which will be returned early, or:
        actor.<actorId>
     */
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

function isNumeric(value) {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value !== "string") return false // we only process strings!  
    return !isNaN(value) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(value)) // ...and ensure strings of whitespace fail
}

// TODO: Add html changed hook and preparse the value, setting to 0 if not correct syntax?
// TODO: Add format for status tracker? 
/* 
    Expects either a number value which will be returned early, or:
    actor.<pathToValue e.g. system.defense.guard.value>
    item.<pathToValue e.g. system.isActivatable>
    resource.<resourceId e.g. this is the abbrewId.uuid>
    damage.<"lastDealt"/"lastReceived"/"roundReceived", damageType e.g. "slashing">
 */
function parsePath(rawValue, actor) {
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
    const entity = (function () {
        switch (entityType) {
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();

    switch (entityType) {
        case 'resource':
            return getResourceValue(actor, rawValue.split('.').slice(1).shift());
        case 'damage':
            return getLastDamageValue(actor, rawValue.split('.').slice(1, 2).shift(), rawValue.split('.').slice(2).shift());
    }

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