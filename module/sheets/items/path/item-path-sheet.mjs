import { AbbrewItemSheet } from '../generic/item-sheet.mjs';
import { PathTagsMixin } from './tags/path-tags.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewPathSheet extends PathTagsMixin(AbbrewItemSheet) {

    static PARTS = {
        header: {
            template: "systems/abbrew/templates/item/item/parts/item-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        description: {
            template: "systems/abbrew/templates/item/path/tabs/path-description.hbs",
            scrollable: [""]
        },
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;

        this.activatePathTags();
    }
}
