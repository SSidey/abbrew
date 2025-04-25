export async function handleSkillUsesAndCharges(actor, skill, modifierSkills) {
    const usesSkills = [...modifierSkills, skill].filter(s => s.system.action.uses.hasUses).filter(s => s._id !== skill._id);
    const chargedSkills = [...modifierSkills, skill].filter(s => s.system.action.charges.hasCharges);

    for (const index in usesSkills) {
        const skill = usesSkills[index];
        let currentCharges = skill.system.action.charges.value;
        if (currentCharges > 0) {
            continue;
        }
        let currentUses = skill.system.action.uses.value
        const item = actor.items.find(i => i._id === skill._id);
        if (item.system.action.uses.asStacks && !item.system.action.uses.removeStackOnUse) {
            continue;
        }

        await item.update({ "system.action.uses.value": currentUses -= 1 });
    }

    for (const index in chargedSkills) {
        const skill = chargedSkills[index];
        let currentCharges = skill.system.action.charges.value;
        const item = actor.items.find(i => i._id === skill._id);
        await item.update({ "system.action.charges.value": currentCharges -= 1 });
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
            await effect.delete();
        } else {
            await skill.delete();
        }
    }
}

export function skillHasUsesRemaining(skill) {
    return !skill.system.action.uses.hasUses || (skill.system.action.uses.hasUses && skill.system.action.uses.value > 0);
}

export function skillHasChargesRemaining(skill) {
    return !skill.system.action.charges.hasCharges || (skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0);
}