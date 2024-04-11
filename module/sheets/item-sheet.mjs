import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
// import Tagify from '@yaireo/tagify'

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

    // const armourPoints = html[0].querySelector('input[name="system.armourPoints"]');
    // if (armourPoints) {
    //     var taggedArmourPoints = new Tagify(armourPoints, {});
    // }
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

  addDamageReduction() {
    const damageReduction = this.item.system.defense.damageReduction;
    return this.item.update({ "system.defense.damageReduction": [...damageReduction, {}] });
  }

  removeDamageReduction(target) {
    const id = target.closest("li").dataset.id;
    const defense = foundry.utils.deepClone(this.item.system.defense);
    defense.damageReduction.splice(Number(id), 1);
    return this.item.update({ "system.defense.damageReduction": defense.damageReduction });
  }
}
