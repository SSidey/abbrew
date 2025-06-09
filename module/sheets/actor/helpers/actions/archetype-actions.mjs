// Edit Archetype Item
export async function _onEditArchetype(event, target) {
    const li = target.closest('.archetype');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.sheet.render(true);
};

// Delete Archetype Item
export async function _onDeleteArchetype(event, target) {
    const li = target.closest('.archetype');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.delete();
}