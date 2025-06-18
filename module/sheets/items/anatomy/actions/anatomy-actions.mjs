export async function deleteAnatomyWeapon(event, target) {
    const li = target.closest('.anatomy-weapon');
    if (li.dataset.id || li.dataset.id === 0) {
        const naturalWeapons = this.item.system.naturalWeapons;
        naturalWeapons.splice(li.dataset.id, 1);
        await this.item.update({ "system.naturalWeapons": naturalWeapons });
    }
}