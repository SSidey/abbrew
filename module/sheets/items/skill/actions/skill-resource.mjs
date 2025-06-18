/**
  * Handle one of the add or remove wound reduction buttons.
  * @param {Element} target  Button or context menu entry that triggered this action.
  * @param {string} action   Action being triggered.
  * @returns {Promise|void}
  */
export async function skillActionModifierResourceAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case 'add-skill-action-modifier-resource-self':
            return addSkillActionModifierResource(item, target, "self");
        case 'remove-skill-action-modifier-resource-self':
            return removeSkillActionModifierResource(item, target, "self");
        case 'add-skill-action-modifier-resource-target':
            return addSkillActionModifierResource(item, target, "target");
        case 'remove-skill-action-modifier-resource-target':
            return removeSkillActionModifierResource(item, target, "target");
    }
}

async function addSkillActionModifierResource(item, target, actionTarget) {
    let action = foundry.utils.deepClone(item.system.action);
    action.modifiers.resources[actionTarget] = [...action.modifiers.resources[actionTarget], {}];
    return item.update({ "system.action": action });

}

async function removeSkillActionModifierResource(item, target, actionTarget) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(item.system.action);
    action.modifiers.resources[actionTarget].splice(Number(id), 1);
    return item.update({ "system.action": action });
}