import { applyFullyParsedComplexModifiers, applyFullyParsedModifiers } from "../modifierBuilderFieldHelpers.mjs";
import { applyOperator } from "../operators.mjs";
import { getSafeJson, isASupersetOfB } from "../utils.mjs";
import { applySkillEffects, getModifierSkills } from "./skill-application.mjs";
import { isSpellComponent, isSpellComponentEssentia } from "./skill-chat.mjs";
import { addSkillToActiveSkills, addSkillToQueuedSkills, trackSkillDuration } from "./skill-duration.mjs";
import { checkAndExpire } from "./skill-expiry.mjs";
import { applySystemFundamentalSkill } from "./skill-fundamental-system-application.mjs";
import { handleSkillGrantOnActivation } from "./skill-grants.mjs";
import { mergeConceptCosts, mergeResourceSelfModifiers, mergeTierDiceChange } from "./skill-modifiers.mjs";

export async function handleSkillActivate(actor, skill, checkActions = true, includeSkillTraits = []) {
    const isSkillProxied = skill.system.isProxied;
    if (!skill.system.isActivatable) {
        ui.notifications.info(`${skill.name} can not be activated`);
        return false;
    }

    if (isSkillBlocked(actor, skill)) {
        if (!skill.system.skillModifiers.blockSilently) {
            ui.notifications.info(`You are blocked from using ${skill.name}`);
        }
        return false;
    }

    if (!areSkillActivationRequirementsMet(actor, skill)) {
        ui.notifications.info(`You have not activated the required skills to use ${skill.name}`);
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
    return await activateSkill(actor, skill, includeSkillTraits);
}

export function isSkillBlocked(actor, skill) {
    const skillDiscord = actor.items.filter(i => i.type === "skill").filter(s => s.system.skillModifiers.discord).flatMap(sk => getSafeJson(sk.system.skillModifiers.discord, []).map(s => ({ discord: s.id, skill: sk })));
    const skillId = skill.system.abbrewId.uuid;
    return skillDiscord.filter(s => s.discord === skillId).some(s => isDiscordApplied(skill, s.skill));
}

function isDiscordApplied(skill, discordSkill) {
    if (discordSkill.system.grantedBy.actor === "" || discordSkill.system.grantedBy.token === "") {
        return true;
    }

    if (discordSkill.system.skillModifiers.isActorGrantTriggerRequired) {
        return discordSkill.system.grantedBy.actor === skill.system.grantedBy.actor
            && (
                (discordSkill.system.grantedBy.token === skill.system.grantedBy.token)
                || !discordSkill.system.grantedBy.token
            )
    }

    return true;
}

export function areSkillActivationRequirementsMet(actor, skill) {
    const requiredSkills = getSafeJson(skill.system.activation.requiredActiveSkills, []).map(s => s.id);
    if (requiredSkills.length === 0) {
        return true;
    }

    const activeOrQueuedSkills = [...actor.system.activeSkills, ...actor.system.queuedSkills].map(id => actor.items.find(i => i._id === id).system.abbrewId.uuid);
    const passives = actor.items.filter(i => i.type === "skill").filter(s => !s.system.isActivatable).map(s => s.system.abbrewId.uuid);
    return isASupersetOfB([...activeOrQueuedSkills, ...passives], requiredSkills);
}

export function getModifiedSkillActionCost(actor, skill) {
    const minActions = 0;
    const modifierSkills = getModifierSkills(actor, skill);
    const modifierSkillsWithActionCostOperator = modifierSkills.filter(s => s.system.action.modifiers.actionCost.operator);
    const modifierSkillActionCosts = modifierSkillsWithActionCostOperator.map(s => s.system.action.modifiers.actionCost)
    return Math.max(minActions, modifierSkillActionCosts.reduce((result, actionCost) => {
        result = applyOperator(result, actionCost.value, actionCost.operator);
        return result;
    }, parseInt(skill.system.action.actionCost ?? 0)));
}

export async function handlePairedSkills(skill, actor) {
    if (skill.system.skills.paired.length > 0) {
        skill.system.skills.paired.forEach(async ps => {
            const pairedSkill = actor.items.find(s => s.system.abbrewId.uuid === ps.id);
            if (pairedSkill && pairedSkill.system.isActivatable) {
                await handleSkillActivate(actor, pairedSkill);
            } else if (pairedSkill && pairedSkill.system.action.removeOnPairedApply) {
                await pairedSkill.update({ "system.handleExpiryEffects": pairedSkill.system.action.handleRemovedSkillExpiry });
                await checkAndExpire(actor, pairedSkill);
            }
        });
    }
}

export async function handleActivateWithSkills(skill, actor) {
    const activateWithSkills = getActivateWithSkills(skill, actor);

    for (const index in activateWithSkills) {
        const nActor = await fromUuid(actor.uuid);
        await handleSkillActivate(nActor, activateWithSkills[index]);
    }
}

export function getActivateWithSkills(skill, actor) {
    return actor.items
        .filter(i => i.type === "skill")
        .filter(i => i.system.activation.activateWith)
        .filter(i => getSafeJson(i.system.activation.activateWith, []).map(a => a.id).includes(skill.system.abbrewId.uuid));
}

export function getDeactivateWithSkills(skill, actor) {
    return actor.items
        .filter(i => i.type === "skill")
        .filter(i => i.system.activation.deactivateWith)
        .filter(i => getSafeJson(i.system.activation.deactivateWith, []).map(a => a.id).includes(skill.system.abbrewId.uuid));
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
        const updateUses = skill.system.action.uses.value - 1;
        if (updateUses > -1) {
            updates["system.action.uses.value"] = updateUses;
        }
    }

    await item.update(updates);
}

function doesActorMeetSkillRequirements(actor, skill) {
    if (!doesActorMeetFlaggedTraitRequirements(actor, skill)) {
        return false;
    }

    const modifierSkills = getModifierSkills(actor, skill, skill.system.traits?.value.map(t => t.key));

    if (!doesActorMeetTierDiceRequirements(actor, skill, modifierSkills)) {
        return false;
    }

    if (!doesActorMeetResourceRequirements(actor, skill)) {
        return false;
    }

    if (!doesActorMeetConceptRequirements(actor, skill, modifierSkills)) {
        return false;
    }

    return true;
}

function doesActorMeetFlaggedTraitRequirements(actor, skill) {
    const requiredTraitsCurrent = new Set(getSafeJson(skill.system.activateIfFlaggedTrait.current, []).map(t => t.key));
    const restrictedTraitsCurrent = new Set(getSafeJson(skill.system.activateIfFlaggedTrait.restrictedCurrent, []).map(t => t.key));
    const requiredTraitsLast = new Set(getSafeJson(skill.system.activateIfFlaggedTrait.last, []).map(t => t.key));
    const restrictedTraitsLast = new Set(getSafeJson(skill.system.activateIfFlaggedTrait.restrictedLast, []).map(t => t.key));


    if (requiredTraitsCurrent.size > 0 || restrictedTraitsCurrent.size > 0) {
        const actorFlags = actor.flags.abbrew?.combat?.traits?.current ?? {};
        const flaggedTraits = new Set(Object.keys(actorFlags));
        if (flaggedTraits.size < requiredTraitsCurrent.size) {
            return false;
        }

        if (!flaggedTraits.isSupersetOf(requiredTraitsCurrent)) {
            return false;
        }

        if (flaggedTraits.intersection(restrictedTraitsCurrent).size > 0) {
            return false;
        }
    }

    if (requiredTraitsLast.size > 0 || restrictedTraitsLast.size > 0) {
        const actorFlags = actor.flags.abbrew?.combat?.traits?.last ?? {};
        const flaggedTraits = new Set(Object.keys(actorFlags));
        if (flaggedTraits.size < requiredTraitsLast.size) {
            return false;
        }

        if (!flaggedTraits.isSupersetOf(requiredTraitsLast)) {
            return false;
        }

        if (flaggedTraits.intersection(restrictedTraitsLast).size > 0) {
            return false;
        }
    }

    return true;
}

function doesActorMeetTierDiceRequirements(actor, skill, modifierSkills) {
    const mergedTierCosts = mergeTierDiceChange([skill, ...modifierSkills], actor);
    const result = applyFullyParsedModifiers(mergedTierCosts, actor, "system.meta.tier.dice");
    if (result["system.meta.tier.dice"] < 0) {
        ui.notifications.info(`You do not have enough tier dice to use ${skill.name}`);
        return false;
    }

    return true;
}

function doesActorMeetResourceRequirements(actor, skill) {
    const mergedSelfResources = mergeResourceSelfModifiers([skill], actor);
    const appliedSelfResource = applyFullyParsedComplexModifiers(mergedSelfResources, actor, "system.resources.values", "id");
    const insufficientResources = Object.entries(appliedSelfResource).flatMap(e => e[1].filter(v => v.value < 0)).map(v => actor.system.resources.owned.find(r => r.id === v.id).name);
    if (insufficientResources.length > 0) {
        const resourceNames = new Intl.ListFormat("en-GB", {
            style: "long",
            type: "conjunction",
        }).format(insufficientResources)
        ui.notifications.info(`You do not have enough ${resourceNames} to use ${skill.name}`);
        return false;
    }

    return true;
}

function doesActorMeetConceptRequirements(actor, skill, modifierSkills) {
    const conceptCosts = mergeConceptCosts([skill, ...modifierSkills], actor);
    const insufficientConcepts = Object.entries(conceptCosts).filter(c => c[1] < 0).filter(c => actor.system.concepts.available[c[0]].value < Math.abs(c[1])).map(c => game.i18n.localize(CONFIG.ABBREW.concepts[c[0]]))
    if (insufficientConcepts.length > 0) {
        const conceptNames = new Intl.ListFormat("en-GB", {
            style: "long",
            type: "conjunction",
        }).format(insufficientConcepts);
        ui.notifications.info(`You do not have enough ${conceptNames} to use ${skill.name}`);
        return false;
    }

    return true;
}

export async function activateSkill(actor, skill, includeSkillTraits = []) {
    await activateSkillEffects(skill);
    if (skill.system.action.activationType === "synergy") {
        await trackSkillDuration(actor, skill);
        await addSkillToQueuedSkills(actor, skill);
        const templateData = {
            actor: actor,
            tokenId: actor.token?.uuid || null,
            actionCost: skill.system.action.actionCost,
            mainSummary: {
                name: skill.name,
                description: skill.system.description
            },
            traits: skill.system.traits.value
        };

        const html = await foundry.applications.handlebars.renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

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

        await handleSkillGrantOnActivation(skill, actor, skill);
        await handleActivateWithSkills(skill, actor);
        return true;
    }

    if (await trackSkillDuration(actor, skill)) {
        await addSkillToActiveSkills(actor, skill);
    }

    let skillResult = {};
    if (CONFIG.ABBREW.fundamentalSystemSkillIds.includes(skill.system.abbrewId.uuid)) {
        await applySystemFundamentalSkill(actor, skill);
    } else {
        skillResult = await applySkillEffects(actor, skill, includeSkillTraits);
    }
    await handleSkillGrantOnActivation(skill, actor, skill);
    await handleConsumables(skill, actor);
    await handleSpellComponents(skill, actor);
    return skillResult;
}

async function handleSpellComponents(skill, actor) {
    if (isSpellComponent(skill)) {
        const components = actor.system.magic.spellComponents;
        const updateComponents = [...components, skill.name];
        const essentia = actor.system.magic.essentia;
        let updateEssentia = essentia;
        if (isSpellComponentEssentia(skill)) {
            updateEssentia = [...essentia, skill._id];
        }
        await actor.update({ "system.magic.spellComponents": updateComponents, "system.magic.essentia": updateEssentia });
    }
}

// TODO: Split stack option so they could dual wield consumables?
async function handleConsumables(skill, actor) {
    const grantingItem = skill.system.grantedBy.item;
    if (grantingItem) {
        const item = actor.items.find(i => i._id === grantingItem);
        if (item && getSafeJson(item.system.traits.raw, []).some(t => t.key === "consumable")) {
            if (item.system.quantity > 1) {
                const update = { "system.quantity": item.system.quantity - 1 };
                if (item.system.equipState.startsWith('held')) {
                    const newState = item.system.storeIn ? "stowed" : "dropped";
                    update["system.equipState"] = newState;
                }
                await item.update(update)
            } else {
                await item.delete();
            }
        }
    }
}

async function activateSkillEffects(skill) {
    const effects = skill.effects;
    if (effects) {
        const promises = [];
        effects.forEach(e => promises.push(e.update({ "disabled": false })));
        await Promise.all(promises);
    }
}
