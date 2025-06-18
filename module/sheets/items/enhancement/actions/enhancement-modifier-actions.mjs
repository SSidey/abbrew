export async function modificationAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case 'add-modification':
            return await addModification(item);
        case 'remove-modification':
            return await removeModification(item, target);
    }
}

async function addModification(item) {
    const modifications = item.system.modifications;
    return await item.update({ "system.modifications": [...modifications, {}] });
}

async function removeModification(item, target) {
    const id = target.closest("li").dataset.id;
    const modifications = foundry.utils.deepClone(item.system.modifications);
    modifications.splice(Number(id), 1);
    return await item.update({ "system.modifications": modifications });
}