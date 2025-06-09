export async function _onAmmunitionSelect(event) {
    const target = event.currentTarget;
    const attackProfile = target.closest(".attack-profile")
    const weaponContainer = target.closest(".weapon-container");
    const profileId = attackProfile.dataset.attackProfileId;
    const weaponId = weaponContainer.dataset.itemId;
    const weapon = this.actor.items.find(i => i._id === weaponId);
    if (!weapon) {
        return;
    }
    const attackProfiles = structuredClone(weapon.system.attackProfiles);
    const profile = attackProfiles[profileId];
    const ammunition = this.actor.items.get(profile.ammunition.id);
    if (ammunition) {
        const ammunitionAmount = ammunition.system.quantity + profile.ammunition.value;
        await ammunition.update({ "system.quantity": ammunitionAmount });
    }
    attackProfiles[profileId].ammunition.id = target.value;
    attackProfiles[profileId].ammunition.value = 0;
    await weapon.update({ "system.attackProfiles": attackProfiles });
}