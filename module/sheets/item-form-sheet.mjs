import { AbbrewItemSheet } from "./item-sheet.mjs";
import Tagify from "@yaireo/tagify";


export class AbbrewItemFormSheet extends AbbrewItemSheet {
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        const requirements = html[0].querySelector('input[name="system.tags"]');
        if (requirements) {
            var taggedRequirements = new Tagify(requirements, {});
        }
    }

    /** @override */
    get template() {
        const path = "systems/abbrew/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-form-sheet.hbs`;
    }

}