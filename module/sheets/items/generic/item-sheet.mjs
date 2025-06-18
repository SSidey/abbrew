import { AbbrewItemBaseSheet } from './item-base-sheet.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewItemSheet extends AbbrewItemBaseSheet {

  TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.map(trait => ({
    ...trait,
    value: game.i18n.localize(trait.value)
  }))];

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
  }

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", icon: "fa-solid fa-book" },
      ],
      initial: "description",
      labelPrefix: "SHEET.ITEM.TABS"
    }
  }

}
