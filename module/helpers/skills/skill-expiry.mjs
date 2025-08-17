import { getActivateWithSkills, handlePairedSkills } from "./skill-activation.mjs";
import { applySkillEffects } from "./skill-application.mjs";

export async function handleInstantModifierExpiry(actor, modifierSkills) {
    for (const index in modifierSkills) {
        const skill = modifierSkills[index];
        if (skill.system.action.duration.precision === "0") {
            const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === skill._id);
            await manualSkillExpiry(actor, skill, effect);
        }

        await handlePairedSkills(skill, actor);
    }
}

export async function manualSkillExpiry(actor, skill, effect) {
    if (skill.system.applyOnExpiry) {
        await applySkillEffects(actor, skill);
    }

    await expireActivateAndDeactivateWithSkills(actor, skill);
    await expireSkillsGrantedOnActivation(actor, skill);

    await effect?.delete();
}

export async function checkAndExpire(actor, skill) {
    const effect = actor.getEffectBySkillId(skill._id);
    if (effect) {
        await manualSkillExpiry(actor, skill, effect);
    } else {
        await skill.delete();
    }
}

async function expireActivateAndDeactivateWithSkills(actor, skill) {
    const activateWithSkills = getActivateWithSkills(skill, actor).filter(s => s.system.activation.andDeactivateWith);
    if (activateWithSkills) {
        const deactivateWithPromises = activateWithSkills.map(s => checkAndExpire(actor, s));
        await Promise.all(deactivateWithPromises);
    }
}

async function expireSkillsGrantedOnActivation(actor, skill) {
    const grantedOnActivation = skill.system.skills.grantedOnActivation;
    if (grantedOnActivation.length > 0) {
        const abbrewIds = grantedOnActivation.map(s => s.id);
        const grantedSkills = actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === skill._id).filter(s => abbrewIds.includes(s.system.abbrewId.uuid));
        await actor.deleteEmbeddedDocuments("Item", grantedSkills.map(s => s._id));
    }
}