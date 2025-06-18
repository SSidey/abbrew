/**
 * Handle one of the add or remove damage reduction buttons.
 * @param {Element} target  Button or context menu entry that triggered this action.
 * @param {string} action   Action being triggered.
 * @returns {Promise|void}
 */
export async function protectionModificationAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case "add-modification":
            return await addModification(item);
        case "remove-modification":
            return await removeModification(item, target);
    }
}

async function addModification(item) {
    const modifications = item.system.action.modifiers.protection;
    return await item.update({ "system.action.modifiers.protection": [...modifications, {}] });
}

async function removeModification(item, target) {
    const id = target.closest("li").dataset.id;
    const modifications = foundry.utils.deepClone(item.system.action.modifiers.protection);
    modifications.splice(Number(id), 1);
    return await item.update({ "system.action.modifiers.protection": modifications });
}