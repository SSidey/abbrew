export async function _onAttackDamageAction(event, target) {
    event.preventDefault();
    const attackMode = target.dataset.attackType;
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    await item.handleAttackDamageAction(this.actor, attackProfileId, attackMode);
}

export async function _onAttackPickUpAction(event, target) {
    event.preventDefault();
    if (!await this.actor.canActorUseActions(1)) {
        return false;
    }

    if (!item.isHeldEquipStateChangePossible("held1H")) {
        ui.notifications.warn("You don't have free hands to pick that up");
        return false;
    }

    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    await item.update({ "system.equipState": "held1H" })
}

export async function _onAttackReloadAction(event, target) {
    event.preventDefault();
    const attackMode = "reload";
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    const attackProfiles = item.system.attackProfiles;
    const attackProfile = attackProfiles[attackProfileId];

    if (attackProfile.ammunition.value === attackProfile.ammunition.max) {
        ui.notifications.warn(`${item.name} is already fully loaded.`)
        return false;
    }

    const skill = getFundamentalSkillWithActionCost(attackMode, attackProfile.ammunition.reloadActionCost)
    if (!await this.actor.canActorUseActions(getModifiedSkillActionCost(this.actor, skill))) {
        return false;
    }

    const ammunitionId = attackProfile.ammunition.id;
    const ammunition = this.actor.items.get(ammunitionId);

    if (ammunition.system.quantity === 0) {
        ui.notifications.warn(`You have no ${ammunition.name} remaining.`)
        return false;
    }

    const reloadedAmount = Math.min(ammunition.system.quantity, (attackProfile.ammunition.max - attackProfile.ammunition.value));
    const updateAmmunitionAmount = ammunition.system.quantity -= reloadedAmount;
    attackProfiles[attackProfileId].ammunition.value = attackProfile.ammunition.value + reloadedAmount;
    await ammunition.update({ "system.quantity": updateAmmunitionAmount });
    await item.update({ "system.attackProfiles": attackProfiles });
}