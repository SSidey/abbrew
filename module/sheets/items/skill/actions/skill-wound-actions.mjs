/**
  * Handle one of the add or remove wound reduction buttons.
  * @param {Element} target  Button or context menu entry that triggered this action.
  * @param {string} action   Action being triggered.
  * @returns {Promise|void}
  */
export async function skillActionModifierWoundAction(event, target) {
    const item = this.item;
    const mode = target.dataset.mode;
    switch (mode) {
        case 'add-skill-action-modifier-wound-self':
            return await addSkillActionModifierWound(item, target, "self");
        case 'remove-skill-action-modifier-wound-self':
            return await removeSkillActionModifierWound(item, target, "self");
        case 'add-skill-action-modifier-wound-target':
            return await addSkillActionModifierWound(item, target, "target");
        case 'remove-skill-action-modifier-wound-target':
            return await removeSkillActionModifierWound(item, target, "target");
        case 'add-skill-action-attackProfile-wound-finisher-modifier':
            return await addSkillActionAtackProfileWound(item, target);
        case 'remove-skill-action-attackProfile-wound-finisher-modifier':
            return await removeSkillActionAtackProfileWound(item, target);
        case 'add-skill-action-modifier-attackProfile-wound-finisher-modifier':
            return await addSkillActionModifierAtackProfileWound(item);
        case 'remove-skill-action-modifier-attackProfile-wound-finisher-modifier':
            return await removeSkillActionModifierAtackProfileWound(item, target);
    }
}

async function addSkillActionModifierWound(item, target, actionTarget) {
    let action = foundry.utils.deepClone(item.system.action);
    action.modifiers.wounds[actionTarget] = [...action.modifiers.wounds[actionTarget], {}];
    return await item.update({ "system.action": action });

}

async function removeSkillActionModifierWound(item, target, actionTarget) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(item.system.action);
    action.modifiers.wounds[actionTarget].splice(Number(id), 1);
    return await item.update({ "system.action": action });
}

async function addSkillActionAtackProfileWound(item,) {
    let action = foundry.utils.deepClone(item.system.action);
    action.attackProfile.finisher.wounds = [...action.attackProfile.finisher.wounds, {}];
    return await item.update({ "system.action": action });
}

async function removeSkillActionAtackProfileWound(item, target) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(item.system.action);
    action.attackProfile.finisher.wounds.splice(Number(id), 1);
    return await item.update({ "system.action": action });
}

async function addSkillActionModifierAtackProfileWound(item) {
    let action = foundry.utils.deepClone(item.system.action);
    action.modifiers.attackProfile.finisher.wounds = [...action.modifiers.attackProfile.finisher.wounds, {}];
    return await item.update({ "system.action": action });

}

async function removeSkillActionModifierAtackProfileWound(item, target) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(item.system.action);
    action.modifiers.attackProfile.finisher.wounds.splice(Number(id), 1);
    return await item.update({ "system.action": action });
}