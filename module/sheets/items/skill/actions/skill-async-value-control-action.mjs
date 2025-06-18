export async function asyncValueAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case "add":
            return await addAsyncValue(item, target);
        case "remove":
            return await removeAsyncValue(item, target);
    }
}

async function addAsyncValue(item, target) {
    let action = foundry.utils.deepClone(item.system.action);
    action.asyncValues = [...action.asyncValues, {}];
    return await item.update({ "system.action": action });
}

async function removeAsyncValue(item, target) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(item.system.action);
    action.asyncValues.splice(Number(id), 1);
    return await item.update({ "system.action": action });
}