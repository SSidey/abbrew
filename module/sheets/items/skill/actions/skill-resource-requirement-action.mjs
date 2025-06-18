/**
  * Handle one of the add or remove damage reduction buttons.
  * @param {Element} target  Button or context menu entry that triggered this action.
  * @param {string} action   Action being triggered.
  * @returns {Promise|void}
  */
export async function skillActionResourceRequirementAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case 'add-skill-action-resource-requirement':
            return await addSkillActionResourceRequirement(item, target);
        case 'remove-skill-action-resource-requirement':
            return await removeSkillActionResourceRequirement(item, target);
    }
}

async function addSkillActionResourceRequirement(item, target) {
    const actionId = target.closest(".action").dataset.id;
    let actions = foundry.utils.deepClone(item.system.actions);
    actions[actionId].requirements.resources = [...actions[actionId].requirements.resources, {}];
    return await item.update({ "system.actions": actions });
}

async function removeSkillActionResourceRequirement(item, target) {
    const id = target.closest("li").dataset.id;
    const actionId = target.closest(".action").dataset.id;
    const actions = foundry.utils.deepClone(item.system.actions);
    actions[actionId].requirements.resources.splice(Number(id), 1);
    return await item.update({ "system.actions": actions });
}