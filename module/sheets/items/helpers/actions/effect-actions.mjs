import { onManageActiveEffect } from "../../../../helpers/effects.mjs";

export function activeEffectAction(event, target) {
    onManageActiveEffect(event, this.item)
}