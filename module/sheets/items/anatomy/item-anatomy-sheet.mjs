import { activeEffectAction } from '../helpers/actions/effect-actions.mjs';
import { _onDamageAction } from '../helpers/actions/damage-control-actions.mjs';
import { enhancementDelete } from '../helpers/actions/enhancement-actions.mjs';
import { deleteSkillDeckSkill } from '../helpers/actions/skill-deck-actions.mjs';
import { onDamageReductionAction } from '../helpers/actions/damage-reduction-control-actions.mjs';
import { RevealableTagsMixin } from '../helpers/tags/revealable-tags-mixin.mjs';
import { renderItemSheet, renderWeaponSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { anatomyDrops } from './drops/anatomy-drops.mjs';
import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';
import { EquipmentTagsMixin } from '../equipment/helpers/tags/equipment-tags-mixin.mjs';
import { ItemTraitsMixin } from '../helpers/tags/item-traits-mixin.mjs';
import { ItemContextMixin } from '../helpers/context/item-context-mixin.mjs';
import { deleteAnatomyWeapon } from './actions/anatomy-actions.mjs';
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewAnatomySheet extends DragDropMixin(RevealableTagsMixin(EquipmentTagsMixin(ItemTraitsMixin(ItemContextMixin(HandlebarsApplicationMixin(ItemSheetV2)))))) {

  // Whitelist for Description Traits
  TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.map(trait => ({
    ...trait,
    value: game.i18n.localize(trait.value)
  }))];

  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true
    },
    classes: ['abbrew', 'sheet', 'item'],
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-toolbox"
    },
    position: {
      width: 550,
      height: 900
    },
    dragDrop: [
      { dragSelector: null, dropSelector: null, callbacks: { drop: anatomyDrops } },
    ],
    actions: {
      effectControl: activeEffectAction,
      damageControl: _onDamageAction,
      enhancementDelete: enhancementDelete,
      skillDelete: deleteSkillDeckSkill,
      renderItemSheet: renderItemSheet,
      renderWeaponSheet: renderWeaponSheet,
      damageReductionControl: onDamageReductionAction,
      deleteAnatomyWeapon: deleteAnatomyWeapon
    }
  }

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
    attributes: {
      template: "systems/abbrew/templates/item/anatomy/tabs/anatomy-attributes.hbs",
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

  /** @override */
  async _prepareContext(options) {
    // Retrieve base data structure.
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    await this.prepareItemContext(context);

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "description":
      case "attributes":
        const itemData = context.document;
        context.item = itemData;
        context.actor = itemData.actor;
    }

    if (partId in context.tabs) {
      context.tab = context.tabs[partId];
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    if (!this.isEditable) return;

    this.bindDragDrops();
    this._activateTraits();
    this.activateAllEquipmentTraits();
    this.activateRevealSkillsFields();
  }
}
