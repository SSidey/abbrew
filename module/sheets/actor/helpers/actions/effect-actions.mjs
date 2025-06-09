import { onManageActiveEffect } from "../../../../helpers/effects.mjs";

// Active Effect management
export async function _onEffectControl(event, target) {
    const row = target.closest('li');
    const document =
        row.dataset.parentId === this.actor.id
            ? this.actor
            : this.actor.items.get(row.dataset.parentId);
    onManageActiveEffect(event, document);
}