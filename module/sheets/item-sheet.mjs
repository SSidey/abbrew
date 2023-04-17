import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { onManageRule } from "../helpers/rules.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/abbrew/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.item.effects);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) {
      return;
    }

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));

    // Rules management
    html.find(".rule-control").click(async ev => await onManageRule(ev, this.item));

    // Roll handlers, click handlers, etc. would go here.
  }

  async _updateObject(event, formData) {
    if (event.currentTarget.classList.contains("rule-editor")) {
      const ruleId = event.currentTarget.dataset.ruleId;
      const updateData = formData[event.currentTarget.dataset.formId];
      let rules = foundry.utils.deepClone(this.item.system.rules);
      const index = rules.findIndex(r => r.id == ruleId);
      rules[index].content = updateData;
      await this.item.update({
        "system.rules": rules
      });
    }
  }
}
