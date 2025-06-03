import { rechargeSkill } from "./skill-activation.mjs";
import { manualSkillExpiry } from "./skill-expiry.mjs";

export async function handleSkillUsesAndCharges(actor, skill, modifierSkills) {
    const usesSkills = [...modifierSkills, skill]
        .filter(s => s.system.action.uses.hasUses)  // Filter those with uses
        .filter(s => s._id !== skill._id)           // Filter our the main skill
        .filter(s => !s.system.action.isActive);   // We only want to reduce uses where a skill is passive with 
    // a number of contributions. Activatable skills will already
    // have been decremented.
    const chargedSkills = [...modifierSkills, skill]
        .filter(s => s.system.action.charges.hasCharges); // Any charges should be decremented however.

    for (const index in usesSkills) {
        const skill = usesSkills[index];
        let currentCharges = skill.system.action.charges.value;
        if (currentCharges > 0) {
            continue;
        }

        const item = actor.items.find(i => i._id === skill._id);
        if (item.system.action.uses.asStacks && !item.system.action.uses.removeStackOnUse) {
            continue;
        }

        await rechargeSkill(actor, skill);
    }

    for (const index in chargedSkills) {
        const skill = chargedSkills[index];
        const currentCharges = skill.system.action.charges.value;
        const item = actor.items.find(i => i._id === skill._id);
        const updateCharges = currentCharges - 1;
        await item.update({ "system.action.charges.value": updateCharges });
        if (updateCharges <= 0) {
            const effect = actor.getEffectBySkillId(skill._id);
            if (effect) {
                await manualSkillExpiry(effect);
            }
        }
    }
}

export async function checkForTemporarySkillOutOfUses(skill, actor) {
    if (((skill.system.action.uses.hasUses && skill.system.action.uses.value === 0) && skill.system.action.charges.value === 0) || (skill.system.action.charges.hasCharges && skill.system.action.charges.value === 0)) {
        await cleanTemporarySkill(skill, actor);
    }
}

export async function cleanTemporarySkill(skill, actor) {
    if (skill.system.skillType === "temporary" && skill.system.action.uses.removeWhenNoUsesRemain) {
        const effect = actor.getEffectBySkillId(skill._id);
        if (effect) {
            await manualSkillExpiry(effect);
        } else {
            await skill.delete();
        }
    }
}

export function skillHasInfiniteUses(skill) {
    return !skill.system.action.uses.hasUses;
}

export function skillDoesNotUseCharges(skill) {
    return !skill.system.action.charges.hasCharges;
}

export function skillHasUsesRemaining(skill) {
    return skill.system.action.uses.hasUses && skill.system.action.uses.value > 0;
}

export function skillHasChargesRemaining(skill) {
    return skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0;
}