export async function _onDamageAction(event, target) {
    const action = target.dataset.mode;
    const item = this.item;
    switch (action) {
        case 'add-damage':
            return await addDamage(item);
        case 'remove-damage':
            return await removeDamage(item, target);
    }
}

async function addDamage(item) {
    const attackModifier = item.system.attackModifier;
    return await item.update({ "system.attackModifier.damage": [...attackModifier.damage, {}] });
}

async function removeDamage(item, target) {
    const id = target.closest("li").dataset.id;
    const attackModifier = foundry.utils.deepClone(item.system.attackModifier);
    attackModifier.damage.splice(Number(id), 1);
    return await item.update({ "system.attackModifier.damage": attackModifier.damage });
}