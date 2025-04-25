import { applySkillEffects, getModifierSkills } from "./skill-application.mjs";
import { addSkillToActiveSkills, addSkillToQueuedSkills, trackSkillDuration } from "./skill-duration.mjs";

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

export function isSkillBlocked(actor, skill) {
    const skillDiscord = actor.items.filter(i => i.type === "skill").filter(s => s.system.skillModifiers.discord).flatMap(s => getSafeJson(s.system.skillModifiers.discord, []).map(s => s.id));
    const skillId = skill.system.abbrewId.uuid;
    return skillDiscord.includes(skillId);
}

export function getModifiedSkillActionCost(actor, skill) {
    // Question: Why was this a thing
    // const minActions = parseInt(skill.system.action.actionCost) === 0 ? 0 : 1;
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
        let currentUses = skill.system.action.uses.value
        updates["system.action.uses.value"] = currentUses -= 1;
    }

    await item.update(updates);
}

function doesActorMeetSkillRequirements(actor, skill) {
    // TODO: Preparse for the early skills with resources
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