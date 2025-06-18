export async function detectionModeControlAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case "add-detection-mode":
            return await addDetectionMode(item, target);
        case "remove-detection-mode":
            return await removeDetectionMode(item, target);
    }
}

async function addDetectionMode(item, target) {
    const detectionModes = foundry.utils.deepClone(item.system.senses.detectionModes);
    return await item.update({ "system.senses.detectionModes": [...detectionModes, {}] });
}

async function removeDetectionMode(item, target) {
    const id = target.closest("li").dataset.id;
    const detectionModes = foundry.utils.deepClone(item.system.senses.detectionModes);
    detectionModes.splice(Number(id), 1);
    return await item.update({ "system.senses.detectionModes": detectionModes });
}