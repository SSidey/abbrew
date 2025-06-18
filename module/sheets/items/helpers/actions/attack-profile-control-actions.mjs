export async function onAttackProfileAction(event, target) {
    const action = target.dataset.mode;
    const item = this.item;
    switch (action) {
        case 'add-attack-profile':
            return await addAttackProfile(item);
        case 'remove-attack-profile':
            return await removeAttackProfile(item, target);
    }
}

async function addAttackProfile(item) {
    const attackProfiles = item.system.attackProfiles;
    return await item.update({ "system.attackProfiles": [...attackProfiles, {}] });
}

async function removeAttackProfile(item, target) {
    const id = target.closest("li").dataset.id;
    const attackProfiles = foundry.utils.deepClone(item.system.attackProfiles);
    attackProfiles.splice(Number(id), 1);
    return await item.update({ "system.attackProfiles": attackProfiles });
}