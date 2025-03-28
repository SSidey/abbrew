import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['abbrew', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/abbrew/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = this.item.getRollData();

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.actions = this.prepareActions(itemData.system);
    context.flags = itemData.flags;

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    context.config = CONFIG.ABBREW;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );

    html.find(".damage-reduction-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onDamageReductionAction(t, t.dataset.action);
    });

    html.find(".damage-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onDamageAction(t, t.dataset.action);
    });

    html.find(".attack-profile-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onAttackProfileAction(t, t.dataset.action);
    });

    html.find(".skill-action-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onSkillActionAction(t, t.dataset.action);
    });

    html.find(".skill-action-resource-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onSkillActionResourceRequirementAction(t, t.dataset.action);
    });

    html.find(".skill-action-modifier-wound-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onSkillActionModifierWoundAction(t, t.dataset.action);
    });

    html.find(".skill-action-modifier-damage-control").click(event => {
      const t = event.currentTarget;
      if (t.dataset.action) this._onSkillActionModifierDamageAction(t, t.dataset.action);
    });

    html.find(".skill-configuration-section :input").prop("disabled", !this.item.system.configurable);

    this._activateArmourPoints(html);
    this._activateAnatomyParts(html);
    this._activateSkillFlags(html);
  }

  prepareActions(system) {
    let actions = system.actions;

    return actions;
  }

  _activateArmourPoints(html) {
    const armourPoints = html[0].querySelector('input[name="system.armourPoints"]');
    const armourPointsSettings = {
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,             // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.armourPoints.points).map(key => game.i18n.localize(key))]
    };
    if (armourPoints) {
      var taggedArmourPoints = new Tagify(armourPoints, armourPointsSettings);
    }
  }

  _activateAnatomyParts(html) {
    const anatomyParts = html[0].querySelector('input[name="system.parts"]');
    const anatomyPartsSettings = {
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,             // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.armourPoints.points).map(key => game.i18n.localize(key))]
    };
    if (anatomyParts) {
      var taggedAnatomyParts = new Tagify(anatomyParts, anatomyPartsSettings);
    }
  }

  _activateSkillFlags(html) {
    const skillFlags = html[0].querySelector('input[name="system.skillFlags"]');
    const skillFlagSettings = {
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,             // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.skillFlags).map(key => game.i18n.localize(key))]
    };
    if (skillFlags) {
      var taggedSkillFlags = new Tagify(skillFlags, skillFlagSettings);
    }
  }

  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onDamageReductionAction(target, action) {
    switch (action) {
      case 'add-damage-reduction':
        return this.addDamageReduction();
      case 'remove-damage-reduction':
        return this.removeDamageReduction(target);
        break;
    }
  }

  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onDamageAction(target, action) {
    switch (action) {
      case 'add-damage':
        return this.addDamage(target);
      case 'remove-damage':
        return this.removeDamage(target);
        break;
    }
  }

  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onAttackProfileAction(target, action) {
    switch (action) {
      case 'add-attack-profile':
        return this.addAttackProfile();
      case 'remove-attack-profile':
        return this.removeAttackProfile(target);
        break;
    }
  }

  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onSkillActionAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case 'add-skill-action':
          return this.addSkillAction();
        case 'remove-skill-action':
          return this.removeSkillAction(target);
          break;
      }
    }
  }

  /**
    * Handle one of the add or remove damage reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionResourceRequirementAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case 'add-skill-action-resource-requirement':
          return this.addSkillActionResourceRequirement(target);
        case 'remove-skill-action-resource-requirement':
          return this.removeSkillActionResourceRequirement(target);
          break;
      }
    }
  }

  /**
    * Handle one of the add or remove wound reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionModifierWoundAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case 'add-skill-action-modifier-wound':
          return this.addSkillActionModifierWound(target);
        case 'remove-skill-action-modifier-wound':
          return this.removeSkillActionModifierWound(target);
      }
    }
  }

  addSkillActionModifierWound(target) {
    let action = foundry.utils.deepClone(this.item.system.action);
    action.modifiers.wounds.self = [...action.modifiers.wounds.self, {}];
    return this.item.update({ "system.action": action });

  }

  removeSkillActionModifierWound(target) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(this.item.system.action);
    action.modifiers.wounds.self.splice(Number(id), 1);
    return this.item.update({ "system.action": action });
  }

  /**
    * Handle one of the add or remove damage reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionModifierDamageAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case 'add-skill-action-modifier-damage':
          return this.addSkillActionModifierDamage(target);
        case 'remove-skill-action-modifier-damage':
          return this.removeSkillActionModifierDamage(target);
      }
    }
  }

  addSkillActionModifierDamage(target) {
    const actionId = target.closest(".action").dataset.id;
    let actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].modifiers.damage = [...actions[actionId].modifiers.damage, {}];
    return this.item.update({ "system.actions": actions });

  }

  removeSkillActionModifierDamage(target) {
    const id = target.closest("li").dataset.id;
    const actionId = target.closest(".action").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].modifiers.damage.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }

  addSkillActionResourceRequirement(target) {
    const actionId = target.closest(".action").dataset.id;
    let actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].requirements.resources = [...actions[actionId].requirements.resources, {}];
    return this.item.update({ "system.actions": actions });
  }

  removeSkillActionResourceRequirement(target) {
    const id = target.closest("li").dataset.id;
    const actionId = target.closest(".action").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].requirements.resources.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }

  addSkillAction() {
    const actions = this.item.system.actions;
    return this.item.update({ "system.actions": [...actions, {}] });
  }

  removeSkillAction(target) {
    const id = target.closest("li").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }

  addAttackProfile() {
    const attackProfiles = this.item.system.attackProfiles;
    return this.item.update({ "system.attackProfiles": [...attackProfiles, {}] });
  }

  removeAttackProfile(target) {
    const id = target.closest("li").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    attackProfiles.splice(Number(id), 1);
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }

  addDamageReduction() {
    const protection = this.item.system.defense.protection;
    return this.item.update({ "system.defense.protection": [...protection, {}] });
  }

  removeDamageReduction(target) {
    const id = target.closest("li").dataset.id;
    const defense = foundry.utils.deepClone(this.item.system.defense);
    defense.protection.splice(Number(id), 1);
    return this.item.update({ "system.defense.protection": defense.protection });
  }

  addDamage(target) {
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    const damage = attackProfiles[attackProfileId].damage;
    attackProfiles[attackProfileId].damage = [...damage, {}];
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }

  removeDamage(target) {
    const damageId = target.closest("li").dataset.id;
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    attackProfiles[attackProfileId].damage.splice(Number(damageId), 1);
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }
}
