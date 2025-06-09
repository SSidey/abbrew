export async function _onAnatomyToggleBroken(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.isBroken": !item.system.isBroken });
}

export async function _onAnatomyToggleDismembered(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.isDismembered": !item.system.isDismembered });
}