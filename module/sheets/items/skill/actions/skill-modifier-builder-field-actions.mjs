import { getObjectValueByStringPath } from "../../../../helpers/utils.mjs";

export async function modifierControlAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case "add-modifier":
            return await addModifier(item, target);
        case "remove-modifier":
            return await removeModifier(item, target);
    }
}

async function addModifier(item, target) {
    const dataset = target.closest("li").dataset;
    const parent = target.closest(".modifier-field-parent");
    if (parent) {
        const parentDataset = parent.dataset;
        const parentId = parentDataset.id;
        const parentPath = parentDataset.path;
        const parentField = foundry.utils.deepClone(getObjectValueByStringPath(item, parentPath));
        parentField[parentId].value = [...parentField[parentId].value, {}];
        const update = {};
        update[parentPath] = parentField;
        return await item.update(update);
    } else {
        const path = dataset.path;
        const modifierBuilderField = foundry.utils.deepClone(getObjectValueByStringPath(item, path));
        const updatedField = [...modifierBuilderField, {}];
        const update = {};
        update[path] = updatedField;
        return await item.update(update);
    }
}

async function removeModifier(item, target) {
    const dataset = target.closest("li").dataset;
    const parent = target.closest(".modifier-field-parent");
    const id = dataset.id;
    if (parent) {
        const parentDataset = parent.dataset;
        const parentId = parentDataset.id;
        const parentPath = parentDataset.path;
        const parentField = foundry.utils.deepClone(getObjectValueByStringPath(item, parentPath));
        parentField[parentId].value.splice(Number(id), 1);
        const update = {};
        update[parentPath] = parentField;
        return await item.update(update);
    } else {
        const path = dataset.path;
        const modifierBuilderField = foundry.utils.deepClone(getObjectValueByStringPath(item, path));
        modifierBuilderField.splice(Number(id), 1);
        const update = {};
        update[path] = modifierBuilderField;
        return await item.update(update);
    }

}