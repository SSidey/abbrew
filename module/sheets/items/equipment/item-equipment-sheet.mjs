import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';
import { ItemTraitsMixin } from '../helpers/tags/item-traits-mixin.mjs';
import { physicalItemDrops } from '../helpers/drops/physical-item-drops.mjs';
import { ItemContextMixin } from '../helpers/context/item-context-mixin.mjs';
import { activeEffectAction } from '../helpers/actions/effect-actions.mjs';
import { enhancementDelete } from '../helpers/actions/enhancement-actions.mjs';
import { deleteSkillDeckSkill } from '../helpers/actions/skill-deck-actions.mjs';
import { _onDamageAction } from '../helpers/actions/damage-control-actions.mjs';
import { EquipmentTagsMixin } from './helpers/tags/equipment-tags-mixin.mjs';
import { onDamageReductionAction } from '../helpers/actions/damage-reduction-control-actions.mjs';
import { renderItemSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { RevealableTagsMixin } from '../helpers/tags/revealable-tags-mixin.mjs';
import { revealSkillDrop } from './helpers/drops/revealSkillDrops.mjs';
import { resetNameAction } from './helpers/actions/base-name-actions.mjs';
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewEquipmentSheet extends DragDropMixin(RevealableTagsMixin(EquipmentTagsMixin(ItemTraitsMixin(ItemContextMixin(HandlebarsApplicationMixin(ItemSheetV2)))))) {

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
      icon: "fa-solid fa-toolbox",
      controls: [
        {
          action: "resetName",
          icon: "fa-solid fa-signature",
          label: "WINDOW_BUTTONS.resetName",
          ownership: "OWNER",
          visible: () => game.user.isGM
        }
      ]
    },
    position: {
      width: 550,
      height: 900
    },
    dragDrop: [
      { dragSelector: null, dropSelector: null, callbacks: { drop: physicalItemDrops } },
      { dragSelector: null, dropSelector: ".reveal-skills tags", callbacks: { drop: revealSkillDrop } },
    ],
    actions: {
      effectControl: activeEffectAction,
      damageControl: _onDamageAction,
      enhancementDelete: enhancementDelete,
      skillDelete: deleteSkillDeckSkill,
      renderItemSheet: renderItemSheet,
      damageReductionControl: onDamageReductionAction,
      resetName: resetNameAction
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
        { id: "attributes", icon: "fa-solid fa-square-poll-vertical" },
        { id: "skills", icon: "fa-solid fa-hurricane" },
        { id: "storage", icon: "fa-solid fa-box" }
      ],
      initial: "description",
      labelPrefix: "SHEET.ITEM.TABS"
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Retrieve base data structure.
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    await this.prepareItemContext(context);
    context.datasets = { baseName: { action: "resetName" } };

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "description":
      case "attributes":
      case "skills":
      case "storage":
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

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    this._activateTraits();
    this.activateAllEquipmentTraits();
    this.activateRevealSkillsFields();
    this.bindDragDrops();
  }
}
