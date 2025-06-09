/**
 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
 * @param {Event} event   The originating click event
 * @private
 */
export async function _onCreateItem(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const header = target;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
        name: name,
        type: type,
        system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
}

export async function _onEditItem(event, target) {
    const itemId = target.closest(".item").dataset?.itemId
    if (itemId) {
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }
};

export async function _onDeleteItem(event, target) {
    const li = target.closest('.item');
    const item = this.actor.items.get(li.dataset.itemId);
    item.delete();
    li.slideUp(200, () => this.render(false));
}

export async function _onStudyItem(event, target) {
    const li = target.closest('.item');
    const item = this.actor.items.get(li.dataset.itemId);
    const reveal = item.system.revealed;
    const revealSkills = reveal.revealSkills.parsed;
    if (revealSkills.length === 0) {
        ui.notifications.warn(`No Reveal Skills are set up for ${item.name} id: ${item._id}`);
        return;
    }
    const difficulty = reveal.difficulty;
    const tier = this.actor.system.meta.tier.value;
    const checkName = `Study ${item.name}`;
    await requestSkillCheck(checkName, revealSkills.map(s => s.id), "successes", difficulty, tier);
};

export async function _onItemToggleRevealed(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.revealed.isRevealed": !item.system.revealed.isRevealed });
}

export async function _onEquipStateChange(event, target) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const newEquipState = target.dataset.equipState;
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    const equipState = item.system.validEquipStates.find(e => e.value === newEquipState);
    if (!await this.actor.canActorUseActions(equipState.cost)) {
        return;
    }

    await item.update({ "system.equipState": newEquipState });
}