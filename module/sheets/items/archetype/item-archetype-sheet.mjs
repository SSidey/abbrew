import { AbbrewPathSheet } from '../path/item-path-sheet.mjs';
import { deletePath } from './actions/archetype-actions.mjs';
import { ArchetypeTagsMixin } from './tags/archetype-tags.mjs';

export class AbbrewArchetypeSheet extends ArchetypeTagsMixin(AbbrewPathSheet) {

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
        requirements: {
            template: "systems/abbrew/templates/item/archetype/tabs/archetype-requirements.hbs",
            scrollable: [""]
        },
    }

    static DEFAULT_OPTIONS = {
        actions: {
            deletePath: deletePath
        }
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", icon: "fa-solid fa-book" },
                { id: "requirements", icon: "fa-solid fa-list" },
            ],
            initial: "description",
            labelPrefix: "SHEET.ITEM.TABS"
        }
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;
        this._activateArchetypeTags();
    }
}
