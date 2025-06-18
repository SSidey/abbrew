export async function damageControlAction(event, target) {
    const item = this.item;
    if (target.dataset.mode) {
        await onDamageAction(item, target)
    };
};

async function onDamageAction(item, target) {
    const mode = target.dataset.mode;
    switch (mode) {
        case 'add-damage':
            return await addDamage(item);
        case 'remove-damage':
            return await removeDamage(item, target.closest("li").dataset.id);
        case 'add-modifier-damage':
            return await addModifierDamage(item);;
        case 'remove-modifier-damage':
            return await removeModifierDamage(item, target.closest("li").dataset.id);;
    }
}

async function addDamage(item) {
    const damage = item.system.action.attackProfile.damage;
    const update = [...damage, {}];
    return await item.update({ "system.action.attackProfile.damage": update });
}

async function removeDamage(item, damageId) {
    const damage = item.system.action.attackProfile.damage;
    damage.splice(Number(damageId), 1);
    return await item.update({ "system.action.attackProfile.damage": damage });
}

async function addModifierDamage(item) {
    const damage = item.system.action.modifiers.attackProfile.damage;
    const update = [...damage, {}];
    return await item.update({ "system.action.modifiers.attackProfile.damage": update });
}

async function removeModifierDamage(item, damageId) {
    const damage = item.system.action.modifiers.attackProfile.damage;
    damage.splice(Number(damageId), 1);
    return await item.update({ "system.action.modifiers.attackProfile.damage": damage });
}