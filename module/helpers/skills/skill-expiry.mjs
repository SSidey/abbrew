import { handlePairedSkills } from "./skill-activation.mjs";

export async function handleInstantModifierExpiry(actor, modifierSkills) {
    for (const index in modifierSkills) {
        const skill = modifierSkills[index];
        if (skill.system.action.duration.precision === "0") {
            const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === skill._id);
            await effect?.delete();
        }

        await handlePairedSkills(skill, actor);
    }
}