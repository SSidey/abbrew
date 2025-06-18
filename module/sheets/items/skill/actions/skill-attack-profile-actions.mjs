/**
 * Handle one of the add or remove damage reduction buttons.
 * @param {Element} target  Button or context menu entry that triggered this action.
 * @param {string} action   Action being triggered.
 * @returns {Promise|void}
 */
export async function attackProfileAction(target, action) {
    const mode = target.dataset.mode;
    const item = this.item;
    switch (mode) {
        case 'add-attack-profile':
            return await addAttackProfile(item);
        case 'remove-attack-profile':
            return await removeAttackProfile(item, target);
    }
}

async function addAttackProfile() {
    const attackProfiles = item.system.attackProfiles;
    return await item.update({ "system.attackProfiles": [...attackProfiles, {}] });
}

async function removeAttackProfile(target) {
    const id = target.closest("li").dataset.id;
    const attackProfiles = foundry.utils.deepClone(item.system.attackProfiles);
    attackProfiles.splice(Number(id), 1);
    return await item.update({ "system.attackProfiles": attackProfiles });
}