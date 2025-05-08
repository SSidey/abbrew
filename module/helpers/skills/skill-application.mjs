import { makeSkillCheck, makeSkillCheckRequest } from "./skill-check.mjs";
import { handleInstantModifierExpiry } from "./skill-expiry.mjs";
import { checkForTemporarySkillOutOfUses, handleSkillUsesAndCharges, skillDoesNotUseCharges, skillHasChargesRemaining, skillHasInfiniteUses, skillHasUsesRemaining } from "./skill-uses.mjs";
import { handlePairedSkills, isSkillBlocked } from "./skill-activation.mjs";
import { handleEarlySelfModifiers, handleLateSelfModifiers, handleTargetUpdates } from "./skill-modifiers.mjs";
import { applyAttackProfiles } from "./skill-attack.mjs";
import { renderChatMessage } from "./skill-chat.mjs";
import { getDialogValue } from "../modifierBuilderFieldHelpers.mjs";

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

async function getGroupedModifierSkills(actor, skill) {
    const mainModifierSkills = getModifierSkills(actor, skill);
    const [clonedSkill, clonedModifiers, clonedSiblingModifiers] = await handleAsyncModifierTypes(actor, skill, mainModifierSkills, skill.system.siblingSkillModifiers);
    const modifierSkills = [...clonedModifiers, ...clonedSiblingModifiers];
    const allSkills = [...modifierSkills, ...clonedSkill].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));

    return [...clonedSkill, mainModifierSkills, modifierSkills, allSkills]
}

async function handleAsyncModifierTypes(actor, skill, mainModifierSkills, siblingSkillModifiers) {
    const promises = [];
    const clonedSkill = [structuredClone(skill)];
    const clonedModifiers = structuredClone(mainModifierSkills);
    const clonedSiblingModifiers = structuredClone(siblingSkillModifiers);
    const skillsList = [clonedSkill, clonedModifiers, clonedSiblingModifiers]
    skillsList.forEach(skills => {
        skills.filter(s =>
            s.system.action.asyncValues.length > 0
        ).forEach(s => {
            promises.push(preparseDialogs(actor, s.system.action.asyncValues));
        })
    });

    await Promise.all(promises);

    skillsList.forEach(skills => {
        skills.filter(s =>
            s.system.action.modifiers.attackProfile.damage.some(d => d.value.split('.').slice(0, 1).shift() === "async") || s.system.action.skillCheck.some(x => x.type === "async") || s.system.action.modifiers.guard.self.value.some(x => x.type === "async") || s.system.action.modifiers.risk.self.value.some(x => x.type === "async") || s.system.action.modifiers.resolve.self.value.some(x => x.type === "async") || s.system.action.modifiers.wounds.self.some(w => w.value.some(x => x.type === "async")) || s.system.action.modifiers.resources.self.some(w => w.value.some(x => x.type === "async"))
            || s.system.action.modifiers.guard.target.value.some(x => x.type === "async") || s.system.action.modifiers.risk.target.value.some(x => x.type === "async") || s.system.action.modifiers.resolve.target.value.some(x => x.type === "async") || s.system.action.modifiers.wounds.target.some(w => w.value.some(x => x.type === "async")) || s.system.action.modifiers.resources.target.some(w => w.value.some(x => x.type === "async"))
        ).forEach(s => {
            s.system.action.skillCheck.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.guard.self.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.risk.self.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.resolve.self.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.attackProfile.damage.filter(d => d.value.split('.').slice(0, 1).shift() === "async").forEach(d => {
                handleSimpleAsyncResults(s, d);
            })
            s.system.action.modifiers.wounds.self.filter(w => w.value.filter(x => x.type === "async")).forEach(v => {
                v.value.filter(x => x.type === "async").forEach(y => {
                    handleAsyncResults(s, y);
                })
            });
            s.system.action.modifiers.resources.self.filter(w => w.value.filter(x => x.type === "async")).forEach(v => {
                v.value.filter(x => x.type === "async").forEach(y => {
                    handleAsyncResults(s, y);
                })
            });
            s.system.action.modifiers.guard.target.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.risk.target.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.resolve.target.value.filter(x => x.type === "async").forEach(v => {
                handleAsyncResults(s, v);
            });
            s.system.action.modifiers.wounds.target.filter(w => w.value.filter(x => x.type === "async")).forEach(v => {
                v.value.filter(x => x.type === "async").forEach(y => {
                    handleAsyncResults(s, y);
                })
            });
            s.system.action.modifiers.resources.target.filter(w => w.value.filter(x => x.type === "async")).forEach(v => {
                v.value.filter(x => x.type === "async").forEach(y => {
                    handleAsyncResults(s, y);
                })
            });
        });
    });


    return [clonedSkill, clonedModifiers, clonedSiblingModifiers];
}

function handleSimpleAsyncResults(skill, field) {
    const path = field.value.split('.').slice(1).join(".")
    field.value = skill.system.action.asyncValues.find(a => a.name === path)?.value ?? 0;
}

function handleAsyncResults(skill, field) {
    field.type = "numeric";
    field.path = skill.system.action.asyncValues.find(a => a.name === field.path)?.value ?? 0;
}


async function preparseDialogs(actor, asyncValues) {
    const result = await getDialogValue(actor, asyncValues);
    asyncValues.forEach(a => a.value = result[a.name])
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

    const [asyncParsedSkill, mainModifierSkills, modifierSkills, allSkills] = await getGroupedModifierSkills(actor, skill);
    const [mainSummary, modifierSummaries] = getSkillSummaries(skill, modifierSkills);

    templateData = {
        ...templateData,
        mainSummary: mainSummary,
        modifierSummaries: modifierSummaries
    };

    const fortune = mergeFortune(allSkills);
    const lateSelfUpdates = await handleEarlySelfModifiers(actor, allSkills);

    let skillResult;
    [skillResult, templateData, data] = await makeSkillCheck(actor, asyncParsedSkill, allSkills, fortune, templateData, data);

    [skillResult, templateData, data] = await makeSkillCheckRequest(actor, asyncParsedSkill, modifierSkills, skillResult, templateData, data);
    modifierSkills.filter(s => s.system.action.skillRequest.isEnabled).forEach(async s => {
        let modData = deepClone(data);
        let modTemplate = deepClone(templateData);
        let modSkillresult;
        [modSkillresult, modTemplate, modData] = await makeSkillCheckRequest(actor, s, [], modSkillresult, modTemplate, modData);
        await renderChatMessage(true, actor, s, modTemplate, modData);
    });

    [templateData, data] = await applyAttackProfiles(actor, asyncParsedSkill, modifierSkills, fortune, templateData, data);

    // Target updates
    [templateData, data] = await handleTargetUpdates(actor, allSkills, templateData, data);

    await renderChatMessage(shouldRenderChatMessage, actor, asyncParsedSkill, templateData, data);

    await handleLateSelfModifiers(actor, lateSelfUpdates);

    await handleSkillUsesAndCharges(actor, skill, mainModifierSkills);
    await handlePairedSkills(skill, actor);
    await handleInstantModifierExpiry(actor, mainModifierSkills);
    await checkForTemporarySkillOutOfUses(skill, actor);

    return skillResult;
}
