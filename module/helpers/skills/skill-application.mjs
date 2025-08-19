import { makeSkillCheck, makeSkillCheckRequest } from "./skill-check.mjs";
import { handleInstantModifierExpiry } from "./skill-expiry.mjs";
import { checkForTemporarySkillExpiry, handleSkillUsesAndCharges, skillDoesNotUseCharges, skillHasChargesRemaining, skillHasInfiniteUses, skillHasUsesRemaining } from "./skill-uses.mjs";
import { areSkillActivationRequirementsMet, handleActivateWithSkills, handlePairedSkills, isSkillBlocked } from "./skill-activation.mjs";
import { filterSynergiesWithInsufficientResources, handleEarlySelfModifiers, handleLateSelfModifiers, handleTargetUpdates } from "./skill-modifiers.mjs";
import { applyAttackProfiles } from "./skill-attack.mjs";
import { renderChatMessage } from "./skill-chat.mjs";
import { getDialogValue } from "../modifierBuilderFieldHelpers.mjs";
import { getSafeJson, getTokenForActor } from "../utils.mjs";

export function getModifierSkills(actor, skill, includeTraits = []) {
    // Get all queued synergy skills (Only include filter out those with charges but 0 remaining)
    const queuedSkills = actor.items.toObject().filter(i => actor.system.queuedSkills.includes(i._id)).filter(s => skillHasChargesRemaining(s) || skillDoesNotUseCharges(s));
    // Get all synergies that apply to the main skill
    const queuedSynergies = queuedSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Get all passives (Only filter out those that have 0 uses and charges remaining)
    const passiveSkills = actor.items.toObject().filter(i => i.type === "skill" && i.system.isActivatable === false).filter(s => skillHasUsesRemaining(s) || skillHasChargesRemaining(s) || skillHasInfiniteUses(s));
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => s.system.skillModifiers.synergy).map(s => ({ skill: s, synergy: JSON.parse(s.system.skillModifiers.synergy).flatMap(s => [s.id, foundry.utils.parseUuid(s.sourceId).id]) })).filter(s => s.synergy.includes(skill.system.abbrewId.uuid)).map(s => s.skill)
    // Combine all relevant skills, filtering for those that are out of charges    
    const baseSynergies = [...passiveSynergies, ...queuedSynergies].filter(s => isSynergyValidForActiveSkills(actor, s)).filter(s => isSynergyValidForTrigger(skill, s)).filter(s => isSynergyValidForTraits(includeTraits, s));
    return filterSynergiesWithInsufficientResources(skill, baseSynergies, actor);
}

function isSynergyValidForActiveSkills(actor, skill) {
    const requiredSkills = getSafeJson(skill.system.activation.requiredActiveSkills, []).map(s => s.id);

    if (skill.system.isActivatable || requiredSkills.length === 0) {
        return true;
    }

    return areSkillActivationRequirementsMet(actor, skill);
}

function isSynergyValidForTrigger(skill, synergy) {
    if (!(synergy.system.skillModifiers.isActorGrantTriggerRequired || synergy.system.skillModifiers.isItemGrantTriggerRequired)) {
        return true;
    }

    if (synergy.system.skillModifiers.isActorGrantTriggerRequired && synergy.system.skillModifiers.isItemGrantTriggerRequired) {
        return (skill.system.sources.actor === synergy.system.grantedBy.actor) && (skill.system.sources.items.includes(synergy.system.grantedBy.item));
    }

    if (synergy.system.skillModifiers.isActorGrantTriggerRequired) {
        return skill.system.sources.actor === synergy.system.grantedBy.actor;
    }

    if (synergy.system.skillModifiers.isItemGrantTriggerRequired) {
        return skill.system.sources.items.includes(synergy.system.grantedBy.item);
    }

    return true;
}

function isSynergyValidForTraits(includeTraits, synergy) {
    const synergyTraits = getSafeJson(synergy.system.skillModifiers.synergyTraitFilter.raw, []);
    if (synergyTraits.length === 0) {
        return true;
    }

    if (includeTraits.length === 0) {
        return false;
    }

    const synergyTraitSet = new Set(synergyTraits.map(t => t.key));
    const includeTraitset = new Set(includeTraits);
    return includeTraitset.intersection(synergyTraitSet).size > 0;
}

async function getGroupedModifierSkills(actor, skill, includeTraits = []) {
    const mainModifierSkills = getModifierSkills(actor, skill, includeTraits);
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
            s.system.action.asyncValues.forEach(v => {
                if (skill.system.passedValuesForAsync.some(p => p.name === v.name)) {
                    const value = skill.system.passedValuesForAsync.find(p => p.name === v.name)?.value ?? 0;
                    v.value = value;
                }
            });
            if (s.system.action.asyncValues.some(v => !v.value)) {
                promises.push(preparseDialogs(actor, s.system.action.asyncValues));
            }
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
            Object.entries(s.system.action.modifiers.concepts).filter(x => x[1].type === "async").forEach(([conceptName, values]) => {
                handleAsyncResultsValue(s, values);
            })
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

function handleAsyncResultsValue(skill, field) {
    field.type = "numeric";
    field.value = skill.system.action.asyncValues.find(a => a.name === field.value)?.value ?? 0;
}

// TODO: More graceful handling of closed windows?
async function preparseDialogs(actor, asyncValues) {
    const result = await getDialogValue(actor, asyncValues);
    asyncValues.forEach(a => a.value = result[a.name])
}

function getSkillSummaries(skill, modifierSkills) {
    const mainSummary = ({ name: skill.name, description: skill.system.description });
    const modifierSummaries = modifierSkills.map(s => ({ name: s.name, description: s.system.description }));
    return [mainSummary, modifierSummaries];
}

function getSkillTraits(skill, modifierSkills) {
    const traits = [skill, ...modifierSkills]
        .flatMap(t => t.system.traits)
        .flatMap(t => {
            if (t.raw) {
                return getSafeJson(t.raw, [])
            }

            return t;
        });

    return traits.reduce((uniqueTraits, trait) => {
        if (!uniqueTraits.find(u => u.key === trait.key)) {
            uniqueTraits.push(trait);
        }

        return uniqueTraits;
    }, []);
}

function mergeFortune(allSkills) {
    return allSkills.reduce((result, s) => result += s.system.action.modifiers.fortune, 0);
}

function mergeSuccesses(allSkills) {
    return allSkills.reduce((result, s) => result += s.system.action.modifiers.successes, 0);
}

export async function applySkillEffects(actor, skill, includeTraits = []) {
    if (isSkillBlocked(actor, skill)) {
        ui.notifications.info(`You are blocked from using ${skill.name}`);
        return;
    }

    const shouldRenderChatMessage = (skill.system.isProxied === null || skill.system.isProxied === undefined) || (skill.system.isProxied != null && skill.system.isProxied === false);
    await actor.unsetFlag("abbrew", "combat.damage.lastDealt");

    let templateData = { actor: actor, user: game.user, skillCheck: { attempts: [] }, actorSize: actor.system.meta.size.value, actorTier: actor.system.meta.tier };

    const [asyncParsedSkill, mainModifierSkills, modifierSkills, allSkills] = await getGroupedModifierSkills(actor, skill, includeTraits);
    const [mainSummary, modifierSummaries] = getSkillSummaries(skill, modifierSkills);
    const skillTraits = getSkillTraits(skill, modifierSkills);

    templateData = {
        ...templateData,
        sources: skill.system.sources,
        mainSummary: mainSummary,
        modifierSummaries: modifierSummaries,
        traits: skillTraits
    };

    let data = {
        actor: actor, actorSize: actor.system.meta.size.value, actorTier: actor.system.meta.tier.value, traits: skillTraits, sources: { ...skill.system.sources, token: getTokenForActor(actor)?._id }
    };

    const fortune = mergeFortune(allSkills);
    const bonusSuccesses = mergeSuccesses(allSkills);
    const lateSelfUpdates = await handleEarlySelfModifiers(actor, allSkills);

    let skillResult;
    [skillResult, templateData, data] = await makeSkillCheck(actor, asyncParsedSkill, allSkills, fortune, bonusSuccesses, templateData, data);

    [skillResult, templateData, data] = await makeSkillCheckRequest(actor, asyncParsedSkill, modifierSkills, skill, skillResult, templateData, data);
    modifierSkills.filter(s => s.system.action.skillRequest.isEnabled).forEach(async s => {
        let modData = foundry.utils.deepClone(data);
        let modTemplate = foundry.utils.deepClone(templateData);
        let modSkillresult;
        [modSkillresult, modTemplate, modData] = await makeSkillCheckRequest(actor, s, [], null, modSkillresult, modTemplate, modData);
        await renderChatMessage(true, actor, s, modTemplate, modData);
    });

    [templateData, data] = await applyAttackProfiles(actor, asyncParsedSkill, modifierSkills, fortune, bonusSuccesses, templateData, data);

    // Target updates
    [templateData, data] = await handleTargetUpdates(actor, allSkills, templateData, data);

    await renderChatMessage(shouldRenderChatMessage, actor, asyncParsedSkill, templateData, data);

    await handleLateSelfModifiers(actor, lateSelfUpdates);

    await handleSkillUsesAndCharges(actor, skill, mainModifierSkills);
    await handlePairedSkills(skill, actor);
    await handleActivateWithSkills(skill, actor);
    await handleInstantModifierExpiry(actor, mainModifierSkills);
    await checkForTemporarySkillExpiry(skill, actor);

    return skillResult;
}
