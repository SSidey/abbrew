import { renderSheetForStoredItem } from "../../../../helpers/utils.mjs";

export async function renderItemSheet(event, target) {
    await renderSheetForStoredItem(event, this.actor, "skill-deck-skill");
}

export async function renderWeaponSheet(event, target) {
    await renderSheetForStoredItem(event, this.actor, "anatomy-weapon");
}

export async function renderAnatomySheet(event, target) {
    await renderSheetForStoredItem(event, this.actor, "creature-form-anatomy");
}