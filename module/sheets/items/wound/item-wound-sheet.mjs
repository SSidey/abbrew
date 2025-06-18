import { AbbrewItemBaseSheet } from '../generic/item-base-sheet.mjs';

export class AbbrewWoundSheet extends AbbrewItemBaseSheet {

    TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.map(trait => ({
        ...trait,
        value: game.i18n.localize(trait.value)
    }))];

    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            height: 600
        }
    }

    static PARTS = {
        header: {
            template: "systems/abbrew/templates/item/item/parts/item-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        description: {
            template: "systems/abbrew/templates/item/physical/tabs/item-physical-description.hbs",
            scrollable: [""]
        },
        attributes: {
            template: "systems/abbrew/templates/item/wound/tabs/wound-attributes.hbs",
            scrollable: [""]
        }
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", icon: "fa-solid fa-book" },
                { id: "attributes", icon: "fa-solid fa-square-poll-vertical" }
            ],
            initial: "description",
            labelPrefix: "SHEET.ITEM.TABS"
        }
    }
}
