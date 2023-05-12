import { useAttack } from "../documents/attackprofile.mjs";
import { ChatAbbrew } from "../helpers/chat.mjs";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import Tagify from "@yaireo/tagify";

/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */
export class AbbrewActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "actor"],
      template: "systems/abbrew/templates/actor/actor-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/abbrew/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareAttacks(context);
      this._prepareArmours(context);
      context.displayConditions = actorData.system.displayConditions;
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.statistics)) {
      v.label = game.i18n.localize(CONFIG.ABBREW.statistics[k]) ?? k;
    }
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
    const anatomy = [];
    const resources = [];
    const abilities = [];
    const gear = [];
    const features = [];
    const formModifiers = [];
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
      9: []
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to resources.
      if (i.type === 'anatomy') {
        anatomy.push(i);
      }
      // TODO: This should set e.g. speed / dex etc. multipliers calculated per limbs and the like
      else if (i.type === 'form') {
        if (JSON.parse(i.system.tags).filter(t => t.value === 'Base').length > 0) {
          context.baseForm = i;
        } else {
          formModifiers.push(i);
        }
      }
      // Append to resources.
      else if (i.type === 'resource') {
        resources.push(i);
      }
      // Append to gear.
      else if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to Abilities
      else if (i.type === 'ability') {
        abilities.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    // ABDOC: name here in context used in hbs to pull values
    context.resource = resources;
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.anatomy = anatomy;
    context.formModifiers = formModifiers;
    context.ability = abilities;
  }

  /* -------------------------------------------- */

  _prepareAttacks(context) {
    context.attacks = context.system.attacks;
  }

  /* -------------------------------------------- */

  _prepareArmours(context) {
    context.armours = context.system.armours;
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Defences
    const naturalArmourReduces = html[0].querySelector('input[name="system.armour.defences"]');
    if (naturalArmourReduces) {
      const settings = {
        dropdown: {
          maxItems: 20,           // <- mixumum allowed rendered suggestions
          classname: "tags-look", // <- custom classname for this dropdown, so it could be targeted
          enabled: 0,             // <- show suggestions on focus
          closeOnSelect: false    // <- do not hide the suggestions dropdown once an item has been selected
        },
        whitelist:['crushing', 'slashing', 'piercing', 'fire', 'water'],
      }
      var taggedNaturalArmourReduces = new Tagify(naturalArmourReduces, settings);
    }

    // Render Compendium
    html.find(".open-compendium").on("click", (event) => {
      if (event.currentTarget.dataset.compendium) {
          const compendium = game.packs.get(event.currentTarget.dataset.compendium);
          if (compendium) {
              compendium.render(true);
          }
      }
  });

    // Show/Hide Conditions
    html.find('.conditions-header').click(async ev => {
      const context = super.getData();
      await this.actor.update({ "system.displayConditions": !this.actor.system.displayConditions });
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable .item-image').click(this._onItemUse.bind(this));

    // attacks
    html.find('.equip-weapon').click(this._equipWeapon.bind(this));
    html.find('.rollable.attack').click(this._onAttackUse.bind(this));

    // armour
    html.find('.equip-armour').click(this._equipArmour.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  async _equipWeapon(event) {
    event.preventDefault();
    const dataSet = event.target.dataset
    const weaponId = dataSet.weaponid;
    const equip = dataSet.equip === "true";
    await this.actor.equipWeapon(weaponId, equip)
  }

  async _equipArmour(event) {
    event.preventDefault();
    const dataSet = event.target.dataset
    const armourId = dataSet.armourid;
    const equip = dataSet.equip === "true";
    await this.actor.equipArmour(armourId, equip)
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    // Check to make sure the newly created class doesn't take player over level cap
    if (type === "ability" && (this.actor.system.IP.current + 1 > this.actor.system.IP.total)) {
      const err = game.i18n.format("ABBREW.InspirationPointsExceededWarn", { max: this.actor.system.IP.total });
      return ui.notifications.error(err);
    }

    const itemData = {
      name: game.i18n.format("ABBREW.ItemNew", { type: game.i18n.localize(`ITEM.Type${type.capitalize()}`) }),
      type: type,
      system: { ...header.dataset.type }
    };
    delete itemData.system.type;

    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemUse(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const actor = this.actor;
    ChatAbbrew(dataset, element, actor);
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    // await this.displayCard(dataset, element, actor)
    return item.use({}, { event });
  }

  async _onAttackUse(event) {
    event.preventDefault();
    console.log(event);
    const data = event.target.dataset;
    const attack = this.actor.system.attacks.filter(a => a.id === data.attack)[0];
    const attackProfile = attack.profiles.flat().filter(ap => ap.id === + data.attackprofile)[0];
    useAttack(attack, attackProfile, this.actor);
  }
}
