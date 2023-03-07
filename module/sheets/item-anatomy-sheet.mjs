import { AbbrewItemSheet } from "./item-sheet.mjs";

export class AbbrewItemAnatomySheet extends AbbrewItemSheet {
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        const getInput = (name) => html.querySelector(`input[name="${name}"]`);
    }

    /** @override */
    get template() {
        const path = "systems/abbrew/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-anatomy-sheet.hbs`;
    }

}