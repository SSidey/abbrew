import { AbbrewEquipmentSheet } from '../equipment/item-equipment-sheet.mjs';
import { onAttackProfileAction } from '../helpers/actions/attack-profile-control-actions.mjs';
import { WeaponContextMixin } from './helpers/context/weapon-context-mixin.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewWeaponSheet extends WeaponContextMixin(AbbrewEquipmentSheet) {

  // Whitelist for Description Traits
  TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.filter(t => ["item", "material"].includes(t.feature)).map(trait => ({
    ...trait,
    value: game.i18n.localize(trait.value)
  }))];

  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      attackProfileControl: onAttackProfileAction
    }
  }

  /** @override */
  static PARTS = {
    header: {
      template: "systems/abbrew/templates/item/physical/parts/item-physical-header.hbs"
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: "systems/abbrew/templates/item/physical/tabs/item-physical-description.hbs",
      scrollable: [""]
    },
    attackprofiles: {
      template: "systems/abbrew/templates/item/weapon/tabs/weapon-attack-profiles.hbs",
      scrollable: [""]
    },
    attributes: {
      template: "systems/abbrew/templates/item/equipment/tabs/equipment-attributes.hbs",
      scrollable: [""]
    },
    skills: {
      template: "systems/abbrew/templates/item/physical/tabs/item-physical-skills.hbs",
      scrollable: [""]
    },
    storage: {
      template: "systems/abbrew/templates/item/physical/tabs/item-physical-storage.hbs",
      scrollable: [""]
    }
  }

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", icon: "fa-solid fa-book" },
        { id: "attackprofiles", icon: "" },
        { id: "attributes", icon: "fa-solid fa-square-poll-vertical" },
        { id: "skills", icon: "fa-solid fa-hurricane" },
        { id: "storage", icon: "fa-solid fa-box" }
      ],
      initial: "description",
      labelPrefix: "SHEET.ITEM.TABS"
    }
  }


  /** @override */
  async _prepareContext(options) {
    // Retrieve base data structure.
    const context = await super._prepareContext(options);

    await this.prepareWeaponContext(context);

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "attackprofiles":
        const itemData = context.document;
        context.item = itemData;
        context.actor = itemData.actor;
    }

    if (partId in context.tabs) {
      context.tab = context.tabs[partId];
    }

    return context;
  }
}
