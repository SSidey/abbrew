export async function _onItemChange(event) {
    const target = event.target;
    const itemId = target.closest('.item').dataset.itemId;
    const itemValuePath = target.name;
    const item = this.actor.items.get(itemId);
    const value = _getItemInputValue(target);
    const updates = {};
    updates[itemValuePath] = value;
    await item.update(updates);
}

function _getItemInputValue(target) {
    switch (target.type) {
        case 'checkbox':
            return target.checked;
        default:
            return target.value;
    }
}