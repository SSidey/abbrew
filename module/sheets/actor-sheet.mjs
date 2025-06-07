import { mergeActorWounds, updateActorWounds } from '../helpers/combat.mjs';
import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'
import { getFundamentalAttributeSkill, getFundamentalSkillWithActionCost } from '../helpers/fundamental-skills.mjs';
import { removeSkillStack } from '../helpers/skills/skill-uses.mjs';
import { getModifiedSkillActionCost, handleSkillActivate } from '../helpers/skills/skill-activation.mjs';
import { manualSkillExpiry } from '../helpers/skills/skill-expiry.mjs';
import { filterKeys, getSafeJson, isASupersetOfB } from '../helpers/utils.mjs';
import { requestSkillCheck } from '../abbrew.mjs';
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { FormDataExtended, DragDrop } = foundry.applications.ux;
// const { } = foundry.applications.ux.DragDrop.implementation


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AbbrewActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
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
      width: 750
    },
    dragDrop: [
      { dragSelector: ".skill", dropSelector: null },
      { dragSelector: null, dropSelector: "[data-drop-type='archetype']", callbacks: { drop: this._onArchetypeDrop } },
      { dragSelector: null, dropSelector: ".archetype", callbacks: { drop: this._onArchetypeSkillDrop } },
      { dragSelector: "li.item", dropSelector: ".container", callbacks: { drop: this._onContainerDrop } }
    ],
    actions: {
      createItem: this._onCreateItem,
      editItem: this._onEditItem,
      deleteItem: this._onDeleteItem,
      studyItem: this._onStudyItem,
      deleteSkill: this._onDeleteSkill,
      editSkill: this._onEditSkill,
      activateSkill: this._onSkillActivate,
      deactivateSkill: this._onSkillDeactivate,
      stackSkill: this._onSkillStackRemove,
      concentrateSkill: this._onSkillConcentrate,
      equipStateChange: this._onEquipStateChange,
      editArchetype: this._onEditArchetype,
      deleteArchetype: this._onDeleteArchetype,
      effectControl: this._onEffectControl,
      attributeCheck: this._onAttributeSkill,
      toggleSkillHeader: this._onToggleSkillHeader,
      changeWoundValue: { handler: this._onChangeWoundValue, buttons: [0, 2] },
      handleAttack: this._onAttackDamageAction,
      handleReload: this._onAttackReloadAction,
      handlePickup: this._onAttackPickUpAction,
      toggleBroken: this._onAnatomyToggleBroken,
      toggleDismembered: this._onAnatomyToggleDismembered,
      toggleRevealed: this._onAnatomyToggleRevealed,
      toggleSundered: this._onArmourToggleSundered,
      rollable: this._onRoll
    }
  }

  /** @override */
  static PARTS = {
    header: {
      template: "systems/abbrew/templates/actor/actor-header.hbs"
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
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    // Use a safe clone of the actor data for further operations.
    const actorData = context.document;
    context.actor = actorData;
    context.items = actorData.items;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareDefenses(actorData, context);
      this._prepareCharacterData(actorData, context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareDefenses(actorData, context);
      this._prepareCharacterData(actorData, context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    context.config = CONFIG.ABBREW;

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
    this.#dragDrop.forEach((d) => d.bind(this.element));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    this.element.querySelectorAll(".item input").forEach(i => i.addEventListener("change", this._onItemChange.bind(this)));
    this.element.querySelectorAll(".attack-reload").forEach(i => i.addEventListener("change", this._onAmmunitionSelect.bind(this)));

    this._activateTraits();
  }

  /** @inheritDoc */
  changeTab(tab, group, options) {
    super.changeTab(tab, group, options);
  }

  /**
 * Create drag-and-drop workflow handlers for this Application
 * @returns {DragDrop[]}     An array of DragDrop handlers
 * @private
 */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: d.callbacks?.drop.bind(this) ?? this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  #dragDrop;

  // Optional: Add getter to access the private property

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  static async _onStudyItem(event, target) {
    const li = target.closest('.item');
    const item = this.actor.items.get(li.dataset.itemId);
    const reveal = item.system.revealed;
    const revealSkills = reveal.revealSkills.parsed;
    if (revealSkills.length === 0) {
      ui.notifications.warn(`No Reveal Skills are set up for ${item.name} id: ${item._id}`);
      return;
    }
    const difficulty = reveal.difficulty;
    const tier = this.actor.system.meta.tier.value;
    const checkName = `Study ${item.name}`;
    await requestSkillCheck(checkName, revealSkills.map(s => s.id), "successes", difficulty, tier);
  };

  static async _onEditItem(event, target) {
    const itemId = target.closest(".item").dataset?.itemId
    if (itemId) {
      const item = this.actor.items.get(itemId);
      item.sheet.render(true);
    }
  };

  static async _onDeleteSkill(event, target) {
    const li = target.closest('.skill');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.delete();
    li.slideUp(200, () => this.render(false));
  }

  static async _onEditSkill(event, target) {
    const li = target.closest('.skill');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.sheet.render(true);
  };

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(actorData, context) {
    const resources = actorData.system.resources.owned.map(r => ({ id: r.id, name: r.name, value: actorData.system.resources.values.find(v => v.id === r.id)?.value ?? 0, max: r.max }));
    context.resources = resources;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.    
    const gear = [];
    const ammunition = [];
    // TODO: Exception when blank
    const ammunitionChoices = this.actor.items.filter(i => i.type === "ammunition").filter(i => i.system.storeIn && this.isContainerAccessible(this.actor.items.find(c => c._id === i.system.storeIn))).map(a => ({ label: a.name, type: a.system.type, value: a._id }));
    const features = [];
    const skills = { background: [], basic: [], path: [], resource: [], temporary: [], untyped: [], archetype: [], tier: [] };
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };
    const anatomy = [];
    const equipment = [];
    const armour = [];
    const wornArmour = [];
    const weapons = [];
    const equippedWeapons = [];
    const archetypes = [];
    const archetypeSkills = [];
    const favouriteSkills = [];
    const activeSkills = [];
    const enhancements = [];
    const storage = [];
    const playerRevealed = { anatomy: [], armour: [], weapons: [], traits: [] }

    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if (i.type === 'archetype') {
        archetypes.push(i);
        archetypeSkills[i._id] = context.items.filter(j => i.system.skillIds.includes(j.system.abbrewId.uuid));
      }

      if (["armour", "equipment"].includes(i.type) && i.system.storage.hasStorage) {
        const accessible = this.isContainerAccessible(i);
        storage.push({ container: i, contents: context.items.filter(ci => i.system.storage.storedItems.includes(ci._id)), isAccessible: accessible });
      }

      if (i.system.isFavourited) {
        favouriteSkills.push(i);
      }

      if (i.type === "skill" && i.system.action.isActive) {
        activeSkills.push(i);
      }
    }

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.system.storeIn) {
        if (i.type === 'weapon') {
          if (['held1H', 'held2H', 'active'].includes(i.system.equipState)) {
            equippedWeapons.push(i);
            if (i.system.revealed.isRevealed) {
              playerRevealed.weapons.push(i);
            }
          }
        }
        continue;
      }

      // Append to equipment.
      if (i.type === 'item') {
        equipment.push(i);
      }
      if (i.type === 'ammunition') {
        ammunition.push(i);
        ammunitionChoices.push({ name: i.name, type: i.system.type, id: i._id });
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        switch (i.system.skillType) {
          case 'background':
            skills.background.push(i);
            break;
          case 'basic':
            skills.basic.push(i);
            break;
          case 'path':
            skills.path.push(i);
            // archetypeSkills[i.archetypeId].push(i);
            break;
          case 'resource':
            skills.resource.push(i)
            break;
          case 'temporary':
            skills.temporary.push(i)
            break;
          default:
            skills.untyped.push(i);
        }
      }
      else if (i.type === "anatomy") {
        if (i.system.isDismembered) {
          equipment.push(i);
        } else {
          anatomy.push(i);
          if (i.system.revealed.isRevealed) {
            playerRevealed.anatomy.push(
              {
                item: i,
                grantedWeapons: context.items.filter(i => i.type === "weapon").filter(w => w.system.revealed.isRevealed && w.system.grantedBy === i._id),
                grantedSkills: context.items.filter(i => i.type === "skill").filter(w => w.system.revealed.isRevealed && w.system.grantedBy.item === i._id)
              }
            );
          }
        }
      }
      else if (i.type === 'armour') {
        armour.push(i);
        if (['held1H', 'held2H', 'worn'].includes(i.system.equipState)) {
          wornArmour.push(i);
          if (i.system.revealed.isRevealed) {
            playerRevealed.armour.push(i);
          }
        }
      }
      else if (i.type === 'weapon') {
        weapons.push(i);
        if (['held1H', 'held2H', 'active'].includes(i.system.equipState)) {
          equippedWeapons.push(i);
          if (i.system.revealed.isRevealed) {
            playerRevealed.weapons.push(i);
          }
        }
      }
      else if (i.type === "enhancement") {
        enhancements.push(i);
      }
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.ammunition = ammunition;
    context.ammunitionChoices = ammunitionChoices;
    context.spells = spells;
    const sections = this.getSkillSectionDisplays(CONFIG.ABBREW.skillTypes, skills);
    sections.favourites = favouriteSkills.length > 0 ? "grid" : "none";
    sections.active = activeSkills.length > 0 ? "grid" : "none";
    sections.archetypes = Object.keys(archetypeSkills).length > 0 ? "grid" : "none";
    sections.enhancements = enhancements.length > 0 ? "grid" : "none";
    const allSkillSections = this.updateObjectValueByKey(sections, this.skillSectionDisplay);
    context.allSkillSections = allSkillSections;
    context.skillSections = filterKeys(allSkillSections, ["background", "basic", "path", "resource", "temporary", "untyped"]);
    context.skills = skills;
    context.anatomy = anatomy;
    context.armour = armour;
    context.wornArmour = wornArmour;
    context.weapons = weapons;
    context.equippedWeapons = equippedWeapons;
    context.archetypes = archetypes;
    context.archetypeSkills = archetypeSkills;
    context.favouriteSkills = favouriteSkills;
    context.activeSkills = activeSkills;
    context.enhancements = enhancements;
    context.equipment = equipment;
    context.storage = storage;
    context.playerRevealed = playerRevealed;
  }

  skillSectionDisplay = {};

  _canUserView(user) {
    switch (this.object.type) {
      case "npc":
        return true;
      case 'character':
      default:
        return super._canUserView(user);
    }
  }

  isContainerAccessible(container) {
    return (container.system.storage.accessible && container.system.equipState === "worn") || container.system.equipState === "readied"
  }

  _prepareDefenses(actorData, context) {
    const activeProtection = Object.keys(actorData.system.defense.protection).reduce((result, key) => {
      const protection = actorData.system.defense.protection[key];
      if (protection.reduction !== 0 || protection.amplification !== 0 || protection.resistance !== 0 || protection.immunity !== 0 || protection.weakness !== 0) {
        result.push(protection);
      }

      return result;
    }, []);

    context.activeProtection = activeProtection;
  }

  /* -------------------------------------------- */

  getSkillSectionDisplays(skillTypes, skills) {
    return Object.fromEntries(this.getSkillSectionKeys(skillTypes).map(s => { return { "type": s, "display": skills[s].length > 0 ? 'grid' : 'none' } }).map(x => [x.type, x.display]));
  }

  /* -------------------------------------------- */

  updateObjectValueByKey = (obj1, obj2) => {
    var destination = Object.assign({}, obj1);
    Object.keys(obj2).forEach(k => {
      if (k in destination && k in obj2) {
        destination[k] = obj2[k];
      }
    });
    return destination;
  }

  /* -------------------------------------------- */

  getSkillSectionKeys(skillTypes) {
    return Object.keys(skillTypes);
  }

  /* -------------------------------------------- */

  _activateTraits() {
    const traits = this.element.querySelector('input[name="system.traits.raw"]');
    const traitsSettings = {
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: false,             // <- Should duplicate tags be allowed or not
      // whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => game.i18n.localize(trait.name))]
      whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => ({
        ...trait,
        value: game.i18n.localize(trait.value)
      }))],
    };
    if (traits) {
      var taggedTraits = new Tagify(traits, traitsSettings);
    }
  }

  /* -------------------------------------------- */

  async _onItemChange(event) {
    const target = event.target;
    const itemId = target.closest('.item').dataset.itemId;
    const itemValuePath = target.name;
    const item = this.actor.items.get(itemId);
    const value = this._getItemInputValue(target);
    const updates = {};
    updates[itemValuePath] = value;
    await item.update(updates);
  }

  _getItemInputValue(target) {
    switch (target.type) {
      case 'checkbox':
        return target.checked;
      default:
        return target.value;
    }
  }

  // Edit Archetype Item
  static async _onEditArchetype(event, target) {
    const li = target.closest('.archetype');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.sheet.render(true);
  };

  // Delete Archetype Item
  static async _onDeleteArchetype(event, target) {
    const li = target.closest('.archetype');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.delete();
  }

  // Active Effect management
  static async _onEffectControl(event, target) {
    const row = target.closest('li');
    const document =
      row.dataset.parentId === this.actor.id
        ? this.actor
        : this.actor.items.get(row.dataset.parentId);
    onManageActiveEffect(event, document);
  }

  static async _onToggleSkillHeader(event, target) {
    event.preventDefault();
    const skillSection = target.nextElementSibling;
    if (skillSection.children.length === 0 || skillSection.style.display === "grid" || skillSection.style.display === '') {
      this.skillSectionDisplay[target.dataset.skillSection] = "none"
      skillSection.style.display = "none";
    } else {
      this.skillSectionDisplay[target.dataset.skillSection] = "grid"
      skillSection.style.display = "grid";
    }
  }

  static async _onChangeWoundValue(event, target) {
    const woundType = target.dataset.woundType;
    const modifier = event.button === 2 ? -1 : 1;
    updateActorWounds(this.actor, mergeActorWounds(this.actor, [{ type: woundType, value: modifier }]));
  }

  static async _onSkillActivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);

    await handleSkillActivate(this.actor, skill);
  }

  static async _onSkillDeactivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    const effect = this.actor.getEffectBySkillId(skill._id);
    if (effect) {
      await manualSkillExpiry(this.actor, skill, effect);
    }
  }

  static async _onSkillStackRemove(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    if (skill) {
      await removeSkillStack(this.actor, skill);
    }
  }

  static async _onSkillConcentrate(event) {
    event.preventDefault();
    const actionCost = event.target.closest("button").dataset.actionCost
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    if (skill && game.combats.combats.length > 0) {
      const effect = skill.actor.effects.find(e => e.flags.abbrew.skill.trackDuration === skill._id);
      const updates = ({ duration: { rounds: 1, duration: 1, startTime: game.time.worldTime, startRound: game.combat.current.round } })
      await skill.actor.update({ "system.actions": skill.actor.system.actions - parseInt(actionCost) });
      await effect.update(updates);
    }
  }

  static async _onEquipStateChange(event, target) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
      return;
    }

    const newEquipState = target.dataset.equipState;
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    const equipState = item.system.validEquipStates.find(e => e.value === newEquipState);
    if (!await this.actor.canActorUseActions(equipState.cost)) {
      return;
    }

    await item.update({ "system.equipState": newEquipState });
  }

  static async _onAttackDamageAction(event, target) {
    event.preventDefault();
    const attackMode = target.dataset.attackType;
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    await item.handleAttackDamageAction(this.actor, attackProfileId, attackMode);
  }

  static async _onAttackPickUpAction(event, target) {
    event.preventDefault();
    if (!await this.actor.canActorUseActions(1)) {
      return false;
    }

    if (!item.isHeldEquipStateChangePossible("held1H")) {
      ui.notifications.warn("You don't have free hands to pick that up");
      return false;
    }

    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    await item.update({ "system.equipState": "held1H" })
  }

  static async _onAttackReloadAction(event, target) {
    event.preventDefault();
    const attackMode = "reload";
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    const attackProfiles = item.system.attackProfiles;
    const attackProfile = attackProfiles[attackProfileId];

    if (attackProfile.ammunition.value === attackProfile.ammunition.max) {
      ui.notifications.warn(`${item.name} is already fully loaded.`)
      return false;
    }

    const skill = getFundamentalSkillWithActionCost(attackMode, attackProfile.ammunition.reloadActionCost)
    if (!await this.actor.canActorUseActions(getModifiedSkillActionCost(this.actor, skill))) {
      return false;
    }

    const ammunitionId = attackProfile.ammunition.id;
    const ammunition = this.actor.items.get(ammunitionId);

    if (ammunition.system.quantity === 0) {
      ui.notifications.warn(`You have no ${ammunition.name} remaining.`)
      return false;
    }

    const reloadedAmount = Math.min(ammunition.system.quantity, (attackProfile.ammunition.max - attackProfile.ammunition.value));
    const updateAmmunitionAmount = ammunition.system.quantity -= reloadedAmount;
    attackProfiles[attackProfileId].ammunition.value = attackProfile.ammunition.value + reloadedAmount;
    await ammunition.update({ "system.quantity": updateAmmunitionAmount });
    await item.update({ "system.attackProfiles": attackProfiles });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  static async _onCreateItem(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const header = target;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  static async _onDeleteItem(event, target) {
    const li = target.closest('.item');
    const item = this.actor.items.get(li.dataset.itemId);
    item.delete();
    li.slideUp(200, () => this.render(false));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const element = target;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      } else if (dataset.rollType === "resource") {
        const resource = this.actor.system.resources.owned.find(r => r.id === dataset.id);
        const resourceValue = this.actor.system.resources.values.find(r => r.id === dataset.id);
        if (resource) {
          let result = 0;
          const fields = foundry.applications.fields;
          const input = fields.createNumberInput({
            name: resource.name,
            value: 0,
            min: 0,
            max: resource.max,
            required: true
          });

          const singleGroup = fields.createFormGroup({
            input: input,
            label: resource.name
          });

          const content = singleGroup.outerHTML;

          try {
            result = await foundry.applications.api.DialogV2.prompt({
              window: { title: "Restore Resource" },
              content: content,
              ok: {
                label: "Submit",
                callback: (event, button, dialog) => new FormDataExtended(button.form).object
              },
              rejectClose: true
            })
          } catch (ex) {
            console.log(ex);
            console.log(`${this.actor.name} did not enter a value.`);
            return;
          }

          const validatedResult = Math.min(resource.max, Math.max(0, Object.values(result)[0] + resourceValue.value));

          const resources = this.actor.system.resources.values;
          resources.find(r => r.id === dataset.id).value = validatedResult;
          await this.actor.update({ "system.resources.values": resources });
        }
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[attribute] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  static async _onAttributeSkill(event, target) {
    const element = target;
    const dataset = element.dataset;
    const fundamental = CONFIG.ABBREW.fundamentalAttributeSkillMap[dataset.attribute];
    const skill = getFundamentalAttributeSkill(fundamental)
    await handleSkillActivate(this.actor, skill);
  }

  static async _onAnatomyToggleBroken(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.isBroken": !item.system.isBroken });
  }

  static async _onAnatomyToggleDismembered(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.isDismembered": !item.system.isDismembered });
  }

  static async _onAnatomyToggleRevealed(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.revealed.isRevealed": !item.system.revealed.isRevealed });
  }

  static async _onArmourToggleSundered(event, target) {
    const itemId = target.closest(".item").dataset.itemId;
    const item = this.actor.items.find(i => i._id === itemId);
    await item.update({ "system.isSundered": !item.system.isSundered });
  }

  async _onAmmunitionSelect(event) {
    const target = event.currentTarget;
    const attackProfile = target.closest(".attack-profile")
    const weaponContainer = target.closest(".weapon-container");
    const profileId = attackProfile.dataset.attackProfileId;
    const weaponId = weaponContainer.dataset.itemId;
    const weapon = this.actor.items.find(i => i._id === weaponId);
    if (!weapon) {
      return;
    }
    const attackProfiles = structuredClone(weapon.system.attackProfiles);
    const profile = attackProfiles[profileId];
    const ammunition = this.actor.items.get(profile.ammunition.id);
    if (ammunition) {
      const ammunitionAmount = ammunition.system.quantity + profile.ammunition.value;
      await ammunition.update({ "system.quantity": ammunitionAmount });
    }
    attackProfiles[profileId].ammunition.id = target.value;
    attackProfiles[profileId].ammunition.value = 0;
    await weapon.update({ "system.attackProfiles": attackProfiles });
  }

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }


  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }


  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const el = event.currentTarget;
    if ('link' in event.target.dataset) return;

    // Extract the data you need
    let dragData = {
      type: "Item",
      uuid: this.actor.items.find(i => i._id === event.currentTarget.dataset.itemId).uuid
    };


    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }


  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) { }


  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
      return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data?.type === "Item" && data?.uuid)) {
      return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "archetype") {
      return;
    }

    await super._onDrop(event);
  }

  static async _onArchetypeDrop(event) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
      return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
      return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "archetype") {
      await Item.create(item, { parent: this.actor });
    }
  }

  static async _onArchetypeSkillDrop(event) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
      return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
      return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "skill") {
      const target = event.currentTarget;
      const archetype = this.actor.items.find(i => i._id === target.dataset.itemId);
      const archetypeRequirements = Object.values(archetype.system.roleRequirements);
      const archetypePaths = archetypeRequirements.map(r => r.path.id).filter(id => id !== "");
      const validPaths = new Set(archetypePaths);
      const validRoles = new Set(archetypePaths.flatMap(vp => CONFIG.ABBREW.paths.find(p => p.id === vp).roles));
      const itemPath = new Set([item.system.path.value.id]);
      const itemRoles = new Set(item.system.path.value.id === "abbrewpuniversal" ? item.system.roles.parsed : []);
      if ((validPaths.intersection(itemPath).size > 0) || (validRoles.intersection(itemRoles).size > 0)) {
        const skillIds = archetype.system.skillIds;
        const update = [...skillIds, item.system.abbrewId.uuid];
        await archetype.update({ "system.skillIds": update });
      } else {
        // TODO: Stop the item from creating?
        ui.notifications.warn(`That skill isn't valid for the archetype ${archetype.name}`);
      }
    }
  }

  static async _onContainerDrop(event) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
      return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
      return;
    }

    const item = await fromUuid(data.uuid);

    if (["armour", "equipment", "weapon", "ammunition"].includes(item.type)) {
      const containerId = event.currentTarget.dataset.itemId;
      const container = this.actor.items.find(i => i._id === containerId);
      if (!isASupersetOfB(item.system.traits.value.map(t => t.key), container.system.storage.traitFilter.value.map(t => t.key))) {
        return;
      }
      const containerValueIncrease = getContainerValueIncrease(container, item);
      if (container.system.storage.value + containerValueIncrease <= container.system.storage.max) {
        const storedItems = [...container.system.storage.storedItems, item._id];
        if (item.system.storeIn) {
          const oldContainerId = item.system.storeIn;
          const oldContainer = this.actor.items.find(i => i._id === oldContainerId);
          const oldContainerStoredItems = oldContainer.system.storage.storedItems.filter(i => i !== item._id);
          await oldContainer.update({ "system.storage.storedItems": oldContainerStoredItems });
        }
        await item.update({ "system.storeIn": containerId });
        await container.update({ "system.storage.storedItems": storedItems });
      }

      function getContainerValueIncrease(container, item) {
        let heftIncrease = item.system.quantity * item.system.heft;
        if (container.system.storage.hasStorage && container.system.storage.type === "heft") {
          heftIncrease += item.system.storage.value;
        }

        return heftIncrease;
      }
    }
  }
}
