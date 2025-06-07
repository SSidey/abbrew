import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'
import { getObjectValueByStringPath, getSafeJson, renderSheetForStoredItem } from '../../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewAnatomySheet extends ItemSheet {
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
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = this.item.getRollData();

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    context.config = CONFIG.ABBREW;

    return context;
  }

  /* -------------------------------------------- */

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
      whitelist: [...Object.values(CONFIG.ABBREW.equipPoints.points).map(key => game.i18n.localize(key))]
    };
    if (anatomyParts) {
      var taggedAnatomyParts = new Tagify(anatomyParts, anatomyPartsSettings);
    }
  }

  _activateRevealSkillsFields(html) {
    const revealSkills = html[0].querySelector('input[name="system.revealed.revealSkills.raw"]');
    const settings = {
      whitelist: CONFIG.ABBREW.fundamentalAttributeSkillSummaries,
      dropdown: {
        maxItems: 20,               // <- mixumum allowed rendered suggestions
        classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,                 // <- show suggestions on focus
        closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: false,             // <- Should duplicate tags be allowed or not
      placeholder: "Drop or select an attribute skill"
    };

    if (revealSkills) {
      var taggedRevealSkills = new Tagify(revealSkills, settings);
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

    this._activateAnatomyParts(html);
    this._activateRevealSkillsFields(html);

    html.on('dragover', (event) => {
      event.preventDefault();
    });

    // Delete Skill Summary
    html.on('click', '.anatomy-weapon-delete', async (ev) => {
      const li = $(ev.currentTarget).parents('.anatomy-weapon');
      if (li.data('id') || li.data('id') === 0) {
        const naturalWeapons = this.item.system.naturalWeapons;
        naturalWeapons.splice(li.data('id'), 1);
        await this.item.update({ "system.naturalWeapons": naturalWeapons });
      }
    });


    html.on('click', '.anatomy-weapon .anatomy-weapon-summary .image-container, .anatomy-weapon .anatomy-weapon-summary .name', async (event) => {
      await renderSheetForStoredItem(event, this.actor, "anatomy-weapon");
    });

    html.on('click', '.skill-deck-skill .skill-deck-summary .image-container, .skill-deck-skill .skill-deck-summary .name', async (event) => {
      await renderSheetForStoredItem(event, this.actor, "skill-deck-skill");
    });

    html.on('drop', async (event) => {
      if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
      }

      const droppedData = event.originalEvent.dataTransfer.getData("text")
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "weapon") {
          const storedWeapons = this.item.system.naturalWeapons;
          const updateWeapons = [...storedWeapons, { name: item.name, id: item.id, image: item.img, sourceId: item.uuid }];
          await this.item.update({ "system.naturalWeapons": updateWeapons });
        } else if (item.type === "skill") {
          const storedSkills = this.item.system.skills.granted;
          const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
          await this.item.update({ "system.skills.granted": updateSkills });
        }
      }
    })

    // TODO: Handle dropping skills onto the anatomy reveal field.
    // TODO: Instead of readonly, can we just if not gm disable input and remove dropdown? Also prevent drops like below?
    html.on('drop', 'tags.tagify', async (event) => {
      if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
      }

      const target = event.target;
      let inputElement = null;
      if (Object.values(target.classList).includes("tagify__input")) {
        inputElement = target.parentElement.nextElementSibling;
      } else if (Object.values(target.classList).includes("tagify")) {
        inputElement = target.nextElementSibling;
      } else {
        return;
      }

      if (inputElement.readOnly) {
        return;
      }

      const droppedData = event.originalEvent.dataTransfer.getData("text")
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (inputElement.dataset.droptype !== item.type) {
          return;
        }
        const value = item.name;
        const path = inputElement.name;
        const inputValue = getSafeJson(getObjectValueByStringPath(this.item, path), []);
        if (path.split(".").some(segment => !isNaN(segment))) {
          const pathSegments = path.split(".");
          const pathindex = pathSegments.findIndex(s => !isNaN(s));
          const index = pathSegments.find(s => !isNaN(s));
          const subPath = pathSegments.splice(pathindex + 1).join(".");
          const basePath = pathSegments.splice(0, pathindex).join(".");
          const baseElements = getObjectValueByStringPath(this.item, basePath);
          const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
          baseElements[index][subPath] = JSON.stringify(updateValue);
          const update = {};
          update[basePath] = baseElements;
          await this.item.update(update);
          return;
        }
        const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
        const update = {};
        update[path] = JSON.stringify(updateValue);
        await this.item.update(update);
      }
    })
  }
}
