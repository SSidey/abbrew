import { applyFullyParsedComplexModifiers } from "../modifierBuilderFieldHelpers.mjs";
import { applyOperator } from "../operators.mjs";
import { getSafeJson } from "../utils.mjs";
import { applySkillEffects, getModifierSkills } from "./skill-application.mjs";
import { addSkillToActiveSkills, addSkillToQueuedSkills, trackSkillDuration } from "./skill-duration.mjs";
import { handleGrantOnUse } from "./skill-grants.mjs";
import { mergeConceptCosts, mergeResourceSelfModifiers } from "./skill-modifiers.mjs";

export async function handleSkillActivate(actor, skill, checkActions = true, includeSkillTraits = []) {
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
    return await activateSkill(actor, skill, includeSkillTraits);
}

export function isSkillBlocked(actor, skill) {
    const skillDiscord = actor.items.filter(i => i.type === "skill").filter(s => s.system.skillModifiers.discord).flatMap(s => getSafeJson(s.system.skillModifiers.discord, []).map(s => s.id));
    const skillId = skill.system.abbrewId.uuid;
    return skillDiscord.includes(skillId);
}

export function getModifiedSkillActionCost(actor, skill) {
    const minActions = 0;
    return Math.max(minActions, getModifierSkills(actor, skill).filter(s => s.system.action.modifiers.actionCost.operator).map(s => s.system.action.modifiers.actionCost).reduce((result, actionCost) => { result = applyOperator(result, actionCost.value, actionCost.operator); return result; }, skill.system.action.actionCost));
}

export async function handlePairedSkills(skill, actor) {
    if (skill.system.skills.paired.length > 0) {
        skill.system.skills.paired.forEach(async ps => {
            const pairedSkill = actor.items.filter(i => i.type === "skill" && i.system.isActivatable).find(s => s.system.abbrewId.uuid === ps.id);
            await handleSkillActivate(actor, pairedSkill);
        });
    }
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
    const modifierSkills = getModifierSkills(actor, skill);
    const mergedSelfResources = mergeResourceSelfModifiers([...modifierSkills, skill], actor);
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

async function activateSkill(actor, skill, includeSkillTraits = []) {
    await activateSkillEffects(skill);
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
    const skillResult = await applySkillEffects(actor, skill, includeSkillTraits);
    await handleGrantOnUse(skill, actor);
    await handleConsumables(skill, actor);
    return skillResult;
}

// TODO: Split stack option so they could dual wield consumables?
async function handleConsumables(skill, actor) {
    const grantingItem = skill.system.grantedBy.item;
    if (grantingItem) {
        const item = actor.items.find(i => i._id === grantingItem);
        if (getSafeJson(item.system.traits.raw, []).some(t => t.key === "consumable")) {
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
