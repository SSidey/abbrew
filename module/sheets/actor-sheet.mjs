import { mergeActorWounds, updateActorWounds } from '../helpers/combat.mjs';
import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'
import { getFundamentalAttributeSkill } from '../helpers/fundamental-skills.mjs';
import { cleanTemporarySkill } from '../helpers/skills/skill-uses.mjs';
import { handleSkillActivate } from '../helpers/skills/skill-activation.mjs';
import { manualSkillExpiry } from '../helpers/skills/skill-expiry.mjs';
import { filterKeys } from '../helpers/utils.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AbbrewActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['abbrew', 'sheet', 'actor'],
      width: 750,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'overview',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/abbrew/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

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
    context.enrichedBiography = await TextEditor.enrichHTML(
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
    const armour = [];
    const wornArmour = [];
    const weapons = [];
    const equippedWeapons = [];
    const archetypes = [];
    const archetypeSkills = [];
    const favouriteSkills = [];
    const activeSkills = [];

    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if (i.type === 'archetype') {
        archetypes.push(i);
        archetypeSkills[i._id] = context.items.filter(j => i.system.skillIds.includes(j.system.abbrewId.uuid));
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
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
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
          gear.push(i);
        } else {
          anatomy.push(i);
        }
      }
      else if (i.type === 'armour') {
        armour.push(i);
        if (['held1H', 'held2H', 'worn'].includes(i.system.equipState)) {
          wornArmour.push(i);
        }
      }
      else if (i.type === 'weapon') {
        weapons.push(i);
        // TODO: Non physical weapons?
        if (['held1H', 'held2H', 'active'].includes(i.system.equipState)) {
          equippedWeapons.push(i);
        }
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    const sections = this.getSkillSectionDisplays(CONFIG.ABBREW.skillTypes, skills);
    sections.favourites = favouriteSkills.length > 0 ? "grid" : "none";
    sections.active = activeSkills.length > 0 ? "grid" : "none";
    sections.archetypes = Object.keys(archetypeSkills).length > 0 ? "grid" : "none";
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
  }

  skillSectionDisplay = {};

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

  _activateTraits(html) {
    const traits = html[0].querySelector('input[name="system.traits"]');
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Render the skill sheet for viewing/editing prior to the editable check.
    html.on('click', '.skill-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.skill');
      const skill = this.actor.items.get(li.data('itemId'));
      skill.sheet.render(true);
    });

    html.on('click', '.skill-activate', this._onSkillActivate.bind(this));

    html.on('click', '.skill-deactivate', this._onSkillDeactivate.bind(this));

    html.on('click', '.skill-stack', this._onSkillStackRemove.bind(this));

    html.on('click', '.skill-concentrate', this._onSkillConcentrate.bind(this));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Delete Skill Item
    html.on('click', '.skill-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.skill');
      const skill = this.actor.items.get(li.data('itemId'));
      skill.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Edit Archetype Item
    html.on('click', '.archetype-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.archetype');
      const skill = this.actor.items.get(li.data('itemId'));
      skill.sheet.render(true);
    });

    // Delete Archetype Item
    html.on('click', '.archetype-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.archetype');
      const skill = this.actor.items.get(li.data('itemId'));
      skill.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    html.on('change', '.item-select', this._onItemChange.bind(this));

    html.on('change', '.item input', this._onItemChange.bind(this));

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    html.on('click', '.attribute-check', this._onAttributeSkill.bind(this));

    html.on('click', '.attack-damage-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'attack');
    });

    html.on('click', '.attack-feint-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'feint');
    });

    html.on('click', '.attack-overpower-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'overpower');
    });

    html.on('click', '.attack-finisher-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'finisher');
    });

    html.on('click', '.skill-header', this._onToggleSkillHeader.bind(this));
    html.on('click', '.archetypes-header', this._onToggleSkillHeader.bind(this));
    html.on('click', '.favourites-header', this._onToggleSkillHeader.bind(this));
    html.on('click', '.active-header', this._onToggleSkillHeader.bind(this));

    html.on('click', '.wound', this._onWoundClick.bind(this));

    html.on('contextmenu', '.wound', this._onWoundRightClick.bind(this));

    html.on('drop', '.archetype', async (event) => {
      event.preventDefault();
      if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
      }

      const droppedData = event.originalEvent.dataTransfer.getData("text")
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "skill") {
          const archetype = this.actor.items.find(i => i._id === event.currentTarget.dataset.itemId);
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
    })

    this._activateTraits(html);

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

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

  _onToggleSkillHeader(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const skillSection = target.nextElementSibling;
    if (skillSection.children.length === 0 || skillSection.style.display === "grid" || skillSection.style.display === '') {
      this.skillSectionDisplay[target.dataset.skillSection] = "none"
      skillSection.style.display = "none";
    } else {
      this.skillSectionDisplay[target.dataset.skillSection] = "grid"
      skillSection.style.display = "grid";
    }
  }

  _onWoundClick(event) {
    this.handleWoundClick(event, 1)
  }

  _onWoundRightClick(event) {
    this.handleWoundClick(event, -1)
  }

  handleWoundClick(event, modification) {
    const woundType = event.currentTarget.dataset.woundType;
    updateActorWounds(this.actor, mergeActorWounds(this.actor, [{ type: woundType, value: modification }]));
  }

  async _onSkillActivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);

    await handleSkillActivate(this.actor, skill);
  }

  async _onSkillDeactivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    const effect = this.actor.getEffectBySkillId(skill._id);
    if (effect) {
      await manualSkillExpiry(effect);
    }
  }

  async _onSkillStackRemove(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    if (skill) {
      const stackUpdate = skill.system.action.uses.value - 1;
      await skill.update({ "system.action.uses.value": stackUpdate });
      if (stackUpdate === 0) {
        await cleanTemporarySkill(skill, this.actor);
      }
    }
  }

  async _onSkillConcentrate(event) {
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

  async _onAttackDamageAction(target, attackMode) {
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    await item.handleAttackDamageAction(this.actor, attackProfileId, attackMode);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget;
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

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    console.log('actor roll');
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
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

  async _onAttributeSkill(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;
    const fundamental = CONFIG.ABBREW.fundamentalAttributeSkillMap[dataset.attribute];
    const skill = getFundamentalAttributeSkill(fundamental)
    await handleSkillActivate(this.actor, skill);
  }
}
