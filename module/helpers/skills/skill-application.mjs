import { makeSkillCheck, makeSkillCheckRequest } from "./skill-check.mjs";
import { handleInstantModifierExpiry } from "./skill-expiry.mjs";
import { checkForTemporarySkillOutOfUses, handleSkillUsesAndCharges, skillDoesNotUseCharges, skillHasChargesRemaining, skillHasInfiniteUses, skillHasUsesRemaining } from "./skill-uses.mjs";
import { handlePairedSkills, isSkillBlocked } from "./skill-activation.mjs";
import { handleEarlySelfModifiers, handleLateSelfModifiers, handleTargetUpdates } from "./skill-modifiers.mjs";
import { applyAttackProfiles } from "./skill-attack.mjs";
import { renderChatMessage } from "./skill-chat.mjs";

export function getModifierSkills(actor, skill) {
    // Get all queued synergy skills (Only include filter out those with charges but 0 remaining)
    const queuedSkills = actor.items.toObject().filter(i => actor.system.queuedSkills.includes(i._id)).filter(s => skillHasChargesRemaining(s) || skillDoesNotUseCharges(s));
    // Get all synergies that apply to the main skill
    const queuedSynergies = queuedSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Get all passives (Only filter out those that have 0 uses and charges remaining)
    const passiveSkills = actor.items.toObject().filter(i => i.type === "skill" && i.system.isActivatable === false).filter(s => skillHasUsesRemaining(s) || skillHasChargesRemaining(s) || skillHasInfiniteUses(s));
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Combine all relevant skills, filtering for those that are out of charges    
    return [...passiveSynergies, ...queuedSynergies];
}

function getGroupedModifierSkills(actor, skill) {
    const mainModifierSkills = getModifierSkills(actor, skill);
    const modifierSkills = [...mainModifierSkills, ...skill.system.siblingSkillModifiers];
    const allSkills = [...modifierSkills, skill].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));
    return [mainModifierSkills, modifierSkills, allSkills]
}

function getSkillSummaries(skill, modifierSkills) {
    const mainSummary = ({ name: skill.name, description: skill.system.description });
    const modifierSummaries = modifierSkills.map(s => ({ name: s.name, description: s.system.description }));
    return [mainSummary, modifierSummaries];
}

function mergeFortune(allSkills) {
    return allSkills.reduce((result, s) => result += s.system.action.modifiers.fortune, 0);
}

export async function applySkillEffects(actor, skill) {
    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    const shouldRenderChatMessage = (skill.system.isProxied === null || skill.system.isProxied === undefined) || (skill.system.isProxied != null && skill.system.isProxied === false);
    await actor.unsetFlag("abbrew", "combat.damage.lastDealt");

    let templateData = { user: game.user, skillCheck: { attempts: [] }, actorSize: actor.system.meta.size, actorTier: actor.system.meta.tier };
    let data = { actorSize: actor.system.meta.size, actorTier: actor.system.meta.tier.value };

    const [mainModifierSkills, modifierSkills, allSkills] = getGroupedModifierSkills(actor, skill);
    const [mainSummary, modifierSummaries] = getSkillSummaries(skill, modifierSkills);

    templateData = {
        ...templateData,
        mainSummary: mainSummary,
        modifierSummaries: modifierSummaries
    };

    const fortune = mergeFortune(allSkills);
    const lateSelfUpdates = await handleEarlySelfModifiers(actor, allSkills);

    let skillResult;
    [skillResult, templateData, data] = await makeSkillCheck(actor, skill, allSkills, fortune, templateData, data);

    [skillResult, templateData, data] = await makeSkillCheckRequest(actor, skill, modifierSkills, skillResult, templateData, data);
    modifierSkills.filter(s => s.system.action.skillRequest.isEnabled).forEach(async s => {
        let modData = deepClone(data);
        let modTemplate = deepClone(templateData);
        let modSkillresult;
        [modSkillresult, modTemplate, modData] = await makeSkillCheckRequest(actor, s, [], modSkillresult, modTemplate, modData);
        await renderChatMessage(true, actor, s, modTemplate, modData);
    });

    [templateData, data] = await applyAttackProfiles(actor, skill, modifierSkills, fortune, templateData, data);

    // Target updates
    [templateData, data] = await handleTargetUpdates(actor, allSkills, templateData, data);

    await renderChatMessage(shouldRenderChatMessage, actor, skill, templateData, data);

    await handleLateSelfModifiers(actor, lateSelfUpdates);

    await handleSkillUsesAndCharges(actor, skill, mainModifierSkills);
    await handlePairedSkills(skill, actor);
    await handleInstantModifierExpiry(actor, mainModifierSkills);
    await checkForTemporarySkillOutOfUses(skill, actor);

    return skillResult;
}
