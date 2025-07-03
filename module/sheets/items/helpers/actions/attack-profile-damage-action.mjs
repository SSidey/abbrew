export function _onDamageAction(event, target) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case 'add-damage':
            return addDamage(item, target);
        case 'remove-damage':
            return removeDamage(item, target);
    }
}

function addDamage(item, target) {
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(item.system.attackProfiles);
    const damage = attackProfiles[attackProfileId].damage;
    attackProfiles[attackProfileId].damage = [...damage, {}];
    return item.update({ "system.attackProfiles": attackProfiles });
}

function removeDamage(item, target) {
    const damageId = target.closest("li").dataset.id;
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(item.system.attackProfiles);
    attackProfiles[attackProfileId].damage.splice(Number(damageId), 1);
    return item.update({ "system.attackProfiles": attackProfiles });
}