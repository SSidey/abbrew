import { mergeActorWounds, updateActorWounds } from '../helpers/combat.mjs';
import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import { activateSkill, applySkillEffects, rechargeSkill } from '../helpers/skill.mjs';
import Tagify from '@yaireo/tagify'

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
          initial: 'skills',
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
  getData() {
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
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

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
  _prepareCharacterData(context) {
    // Handle attribute scores.
    // for (let [k, v] of Object.entries(context.system.abilities)) {
    //   v.label = game.i18n.localize(CONFIG.ABBREW.abilities[k]) ?? k;
    // }
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
    const skills = { background: [], basic: [], path: [], resource: [], temporary: [], untyped: [] };
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
    const weapons = [];
    const equippedWeapons = [];

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
            skills.path.push(i)
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
      else if (i.type === 'anatomy') {
        anatomy.push(i);
      }
      else if (i.type === 'armour') {
        armour.push(i);
      }
      else if (i.type === 'weapon') {
        weapons.push(i);
        // TODO: May want to handle unarmed etc. differently i.e. worn weapons with no hands required.
        // TODO: Non physical weapons?
        // Unarmed technically should take 1h but stowed / dropped seem a little funny
        if (['held1H', 'held2H'].includes(i.system.equipState)) {
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
    context.skillSections = this.updateObjectValueByKey(this.getSkillSectionDisplays(CONFIG.ABBREW.skillTypes, skills), this.skillSectionDisplay);
    context.skills = skills;
    context.anatomy = anatomy;
    context.armour = armour;
    context.weapons = weapons;
    context.equippedWeapons = equippedWeapons;
  }

  skillSectionDisplay = {};

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

  _activateFatalWounds(html) {
    const fatalWounds = html[0].querySelector('input[name="system.defense.fatalWounds"]');
    const fatalWoundsSettings = {
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: false,             // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.wounds).map(wound => game.i18n.localize(wound.name))]
    };
    if (fatalWounds) {
      var taggedFatalWounds = new Tagify(fatalWounds, fatalWoundsSettings);
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
      const skill = this.actor.items.get(li.data('skillId'));
      skill.sheet.render(true);
    });

    html.on('click', '.skill-activate', this._onSkillActivate.bind(this))

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
      const skill = this.actor.items.get(li.data('skillId'));
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

    html.on('change', '.item input[type="checkbox"]', this._onItemChange.bind(this));

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    html.on('click', '.attack-damage-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'attack');
    });

    html.on('click', '.attack-feint-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'feint');
    });

    html.on('click', '.attack-strong-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'strong');
    });

    html.on('click', '.attack-finisher-button', async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, 'finisher');
    });

    html.on('click', '.skill-header', this._onToggleSkillHeader.bind(this));

    html.on('click', '.wound', this._onWoundClick.bind(this));

    html.on('contextmenu', '.wound', this._onWoundRightClick.bind(this));

    this._activateFatalWounds(html);
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
    const id = target.dataset.skillId;
    const skill = this.actor.items.get(id);
    if (skill.system.action.charges.hasCharges && skill.system.action.charges.value > 0) {
      await activateSkill(this.actor, skill);
      return;
    }

    if (!await this.actor.canActorUseActions(skill.system.action.actionCost)) {
      return;
    }

    await rechargeSkill(this.actor, skill);
    await activateSkill(this.actor, skill);
  }

  async _onAttackDamageAction(target, attackMode) {
    const itemId = target.closest('li.item').dataset.itemId;
    const attackProfileId = target.closest('li .attack-profile').dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    const attackProfile = item.system.attackProfiles[attackProfileId];
    const actions = attackMode === "strong" ? item.system.exertActionCost : item.system.actionCost;
    if (!await this.actor.canActorUseActions(actions)) {
      return;
    }

    const skillTraits = CONFIG.ABBREW.skillTriggers.find(s => s.subFeature === "attacks" && s.data === attackMode);

    const attackSkill = {
      name: item.name,
      system: {
        activatable: true,
        skillTraits: JSON.stringify([skillTraits]),
        skillType: "basic",
        attributeIncrease: "",
        attributeIncreaseLong: "",
        attributeRankIncrease: "",
        action: {
          activationType: "standalone",
          actionCost: actions,
          actionImage: item.img,
          duration: {
            precision: "0.01",
            value: 0
          },
          uses: {
            hasUses: false,
            value: 0,
            max: 0,
            period: ""
          },
          charges: {
            hasCharges: false,
            value: 0,
            max: 0
          },
          isActive: false,
          modifiers: {
            fortune: 0,
            attackProfile: { ...attackProfile, attackMode: attackMode, handsSupplied: item.system.handsSupplied },
            damage: {
              self: []
            },
            guard: {
              self: {
                value: 0,
                operator: ""
              },
              target: {
                value: 0,
                operator: ""
              }
            },
            risk: {
              self: {
                value: 0,
                operator: ""
              },
              target: {
                value: 0,
                operator: ""
              }
            },
            wounds: {
              self: [],
              target: []
            },
            resolve: {
              self: {
                value: 0,
                operator: ""
              },
              target: {
                value: 0,
                operator: ""
              }
            },
            resources: {
              self: [],
              target: []
            },
            conceepts: {
              self: [],
              target: []
            }
          }
        }
      }
    }

    await applySkillEffects(this.actor, attackSkill);
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
}
