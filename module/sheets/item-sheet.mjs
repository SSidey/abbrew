// TODO: Tagify and rollup using vite with .js?
import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { onManageRule } from "../rules/rules.mjs";
import { options } from "../rules/rule-field.mjs";
import Tagify from "@yaireo/tagify";

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
  async getData() {
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
    context.system.enrichedDescription = await TextEditor.enrichHTML(context.system.description, {
      async: true,
      relativeTo: this,
      links: true
    });

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

    // Weapon
    const requirements = html[0].querySelector('input[name="system.weapon.requirements"]');
    if (requirements) {
      var taggedRequirements = new Tagify(requirements, {});
    }

    // Armour
    const form = html[0].querySelector('input[name="system.armour.form"]');
    if (form) {
      const settings = {
        enforceWhitelist: true,
        mode: "select",
        whitelist: ["Humanoid", "Beast"],
      };
      var taggedForm = new Tagify(form, settings);
    }
    const anatomy = html[0].querySelector('input[name="system.armour.anatomy"]');
    if (anatomy) {
      const settings = {
        // mode: 'mix',
        // pattern: '#',
        // dropdown: {
        //    enabled: 1
        // },
        // whitelist:['alice','bob','foo','bar'],
        duplicates: true,
      }
      var taggedAnatomy = new Tagify(anatomy, settings);
    }
    const type = html[0].querySelector('input[name="system.armour.type"]');
    if (type) {
      const settings = {
        enforceWhitelist: true,
        mode: "select",
        whitelist: ["Cloth", "Hide", "Chain", "Plate", "Accessory"],
      };
      var taggedType = new Tagify(type, settings);
    }
    const armourPoints = html[0].querySelector('input[name="system.armour.armourPoints"]');
    if (type) {
      const settings = {
        dropdown: {
          maxItems: 20,           // <- mixumum allowed rendered suggestions
          classname: "tags-look", // <- custom classname for this dropdown, so it could be targeted
          enabled: 0,             // <- show suggestions on focus
          closeOnSelect: false    // <- do not hide the suggestions dropdown once an item has been selected
        },
        whitelist:['Abdomen','Chest_Left','Chest_Right','Shoulder_Left', 'Shoulder_Right', 'Upper_Arm', 'Lower_Arm', 'Hand', 'Finger', 'Upper_Leg', 'Lower_Leg', 'Foot', 'Head', 'Finger'],
        duplicates: true,
      }
      var taggedArmourPoints = new Tagify(armourPoints, settings);
    }

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));

    // Rules management
    html.find(".rule-control").click(async ev => await onManageRule(ev, this.item));

    // Render child item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Roll handlers, click handlers, etc. would go here.
  }

  async _updateObject(event, formData) {
    if ((event.handleObj && event.handleObj.type == 'change') || (event.type && event.type == 'change')) {

      if (event.currentTarget) {
        await this.manualUpdate(event, formData);
      }
      else {
        super._updateObject(event, formData);
      }
    } else {
      super._updateObject(event, formData);
    }
  }

  async manualUpdate(event, formData) {
    const target = event.currentTarget;
    if (target.classList.contains("rule-editor")) {
      const dataset = target.dataset;
      const ruleId = dataset.ruleId;
      const field = dataset.field;
      const updateData = formData[target.name];
      let rules = foundry.utils.deepClone(this.item.system.rules);
      const index = rules.findIndex(r => r.id == ruleId);
      rules[index][field] = updateData;
      if (field == "type") {
        rules[index].content = options[updateData].template();
      }
      return await this.item.update({
        "system.rules": rules
      });
    } else {
      super._updateObject(event, formData);
    }
  }

  close(options = {}) {
    console.log('closing sheet');
    // this.getData();
    options.submit = false;
    super.close(options);
  }
}
