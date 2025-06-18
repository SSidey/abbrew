export async function onDamageReductionAction(event, target) {
    const action = target.dataset.mode;
    const item = this.item;
    switch (action) {
        case await 'add-damage-reduction':
            return addDamageReduction(item);
        case await 'remove-damage-reduction':
            return removeDamageReduction(item, target);
    }
}

async function addDamageReduction(item) {
    const protection = item.system.defense.protection;
    return await item.update({ "system.defense.protection": [...protection, {}] });
}

async function removeDamageReduction(item, target) {
    const id = target.closest("li").dataset.id;
    const defense = foundry.utils.deepClone(item.system.defense);
    defense.protection.splice(Number(id), 1);
    return await item.update({ "system.defense.protection": defense.protection });
}