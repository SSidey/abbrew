import { AbbrewSkillDeckSheet } from "../skill-deck/item-skill-deck-sheet.mjs";
import { deleteCreatureForm } from "./actions/backgroundActions.mjs";
import { backgroundDrops } from "./drops/background-drops.mjs";

export class AbbrewBackgroundSheet extends AbbrewSkillDeckSheet {

    /** @override */
    static DEFAULT_OPTIONS = {
        dragDrop: [
            { dragSelector: null, dropSelector: ".empty-summary-element.creature-form", callbacks: { drop: backgroundDrops } },
        ],
        actions: {
            deleteCreatureForm: deleteCreatureForm
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
            template: "systems/abbrew/templates/item/background/tabs/background-attributes.hbs",
            scrollable: [""]
        }
    }
}