import { handlePairedSkills } from "./skill-activation.mjs";
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