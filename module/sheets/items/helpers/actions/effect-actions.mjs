import { onManageActiveEffect } from "../../../../helpers/effects.mjs";

export async function activeEffectAction(event, target) {
    await onManageActiveEffect(event, this.item)
}