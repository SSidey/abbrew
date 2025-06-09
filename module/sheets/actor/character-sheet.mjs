import { _onCreateItem, _onDeleteItem, _onEditItem, _onEquipStateChange, _onItemToggleRevealed, _onStudyItem } from './helpers/actions/item-actions.mjs';
import { _onAttackDamageAction, _onAttackPickUpAction, _onAttackReloadAction } from './helpers/actions/attack-actions.mjs';
import { _onAttributeSkill, _onDeleteSkill, _onEditSkill, _onSkillActivate, _onSkillConcentrate, _onSkillDeactivate, _onSkillStackRemove } from './helpers/actions/skill-actions.mjs';
import { _onDeleteArchetype, _onEditArchetype } from './helpers/actions/archetype-actions.mjs';
import { _onAnatomyToggleBroken, _onAnatomyToggleDismembered } from './helpers/actions/anatomy-actions.mjs';
import { _onArmourToggleSundered } from './helpers/actions/armour-actions.mjs';
import { _onEffectControl } from './helpers/actions/effect-actions.mjs';
import { _onToggleSkillHeader } from './helpers/actions/ui-actions.mjs';
import { _onRoll } from './helpers/actions/rollable-actions.mjs';
import { _onChangeWoundValue } from './helpers/actions/wound-actions.mjs';
import { _onArchetypeDrop, _onArchetypeSkillDrop, _onContainerDrop } from './helpers/drag-drops/drops.mjs';
import { ActorTagsMixin } from './helpers/tags/actor-tags-mixin.mjs';
import { _onItemChange } from './helpers/selects/item-select.mjs';
import { _onAmmunitionSelect } from './helpers/selects/ammunition-select.mjs';
import { bindAllChange } from '../helpers/utility.mjs';
import { DragDropMixin } from '../helpers/drag-drop-mixin.mjs';
import { ActorContextMixin } from './helpers/context/prepare-context.mjs';
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;


/**
 * Extend the basic ActorSheet
 * @extends {ActorSheetV2}
 */
export class AbbrewCharacterSheet extends DragDropMixin(ActorTagsMixin(ActorContextMixin(HandlebarsApplicationMixin(ActorSheetV2)))) {

  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
    },
    classes: ['abbrew', 'sheet', 'actor'],
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-user"
    },
    position: {
      width: 750,
      height: 900
    },
    dragDrop: [
      { dragSelector: ".skill", dropSelector: null },
      { dragSelector: null, dropSelector: "[data-drop-type='archetype']", callbacks: { drop: _onArchetypeDrop } },
      { dragSelector: null, dropSelector: ".archetype", callbacks: { drop: _onArchetypeSkillDrop } },
      { dragSelector: "li.item", dropSelector: ".container", callbacks: { drop: _onContainerDrop } }
    ],
    actions: {
      createItem: _onCreateItem,
      editItem: _onEditItem,
      deleteItem: _onDeleteItem,
      studyItem: _onStudyItem,
      deleteSkill: _onDeleteSkill,
      editSkill: _onEditSkill,
      activateSkill: _onSkillActivate,
      deactivateSkill: _onSkillDeactivate,
      stackSkill: _onSkillStackRemove,
      concentrateSkill: _onSkillConcentrate,
      equipStateChange: _onEquipStateChange,
      editArchetype: _onEditArchetype,
      deleteArchetype: _onDeleteArchetype,
      effectControl: _onEffectControl,
      attributeCheck: _onAttributeSkill,
      toggleSkillHeader: _onToggleSkillHeader,
      changeWoundValue: { handler: _onChangeWoundValue, buttons: [0, 2] },
      handleAttack: _onAttackDamageAction,
      handleReload: _onAttackReloadAction,
      handlePickup: _onAttackPickUpAction,
      toggleBroken: _onAnatomyToggleBroken,
      toggleDismembered: _onAnatomyToggleDismembered,
      toggleRevealed: _onItemToggleRevealed,
      toggleSundered: _onArmourToggleSundered,
      rollable: _onRoll
    }
  }

  /** @override */
  static PARTS = {
    header: {
      template: "systems/abbrew/templates/actor/character-header.hbs"
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    overview: {
      template: "systems/abbrew/templates/actor/tabs/actor-overview.hbs",
      scrollable: [""]
    },
    defenses: {
      template: "systems/abbrew/templates/actor/tabs/actor-defenses.hbs",
      scrollable: [""]
    },
    skills: {
      template: "systems/abbrew/templates/actor/tabs/actor-skills.hbs",
      scrollable: [""]
    },
    items: {
      template: "systems/abbrew/templates/actor/tabs/actor-items.hbs",
      scrollable: [""]
    },
    description: {
      template: "systems/abbrew/templates/actor/tabs/actor-description.hbs",
      scrollable: [""]
    },
    effects: {
      template: "systems/abbrew/templates/actor/tabs/actor-effects.hbs",
      scrollable: [""]
    }
  }

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "overview", icon: "fa-solid fa-square-poll-vertical" },
        { id: "defenses", icon: "fa-solid fa-shield-halved" },
        { id: "skills", icon: "fa-solid fa-hurricane" },
        { id: "items", icon: "fa-solid fa-suitcase" },
        { id: "description", icon: "fa-solid fa-book" },
        { id: "effects", icon: "fa-solid fa-wand-magic-sparkles" }
      ],
      initial: "overview",
      labelPrefix: "SHEET.ACTOR.TABS"
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    await this.prepareActorContext(context);

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "overview":
      case "defenses":
      case "skills":
      case "items":
      case "biography":
      case "effects":
        const actorData = context.document;
        context.actor = actorData;
        context.items = actorData.items;
    }

    if (partId in context.tabs) {
      context.tab = context.tabs[partId];
    }

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.bindDragDrops();

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    bindAllChange(".item input", _onItemChange, this);
    bindAllChange(".attack-reload", _onAmmunitionSelect, this);

    this._activateTraits();
  }

  /** @inheritDoc */
  changeTab(tab, group, options) {
    super.changeTab(tab, group, options);
  }

  skillSectionDisplay = {};

  /* -------------------------------------------- */
}
