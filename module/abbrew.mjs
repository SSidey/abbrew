// Import sheet classes.
import { AbbrewActorSheet } from './sheets/actor-sheet.mjs';
import { AbbrewItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { ABBREW } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
// Import Documents Classes
import * as documents from './documents/_module.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.abbrew = {
    AbbrewActor: documents.AbbrewActor,
    AbbrewItem: documents.AbbrewItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.ABBREW = ABBREW;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @attributes.agi.value + @attributes.wit.value',
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = documents.AbbrewActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.AbbrewCharacter,
    npc: models.AbbrewNPC
  }
  CONFIG.Item.documentClass = documents.AbbrewItem;
  CONFIG.Item.dataModels = {
    item: models.AbbrewItem,
    feature: models.AbbrewFeature,
    spell: models.AbbrewSpell,
    skill: models.AbbrewSkill,
    anatomy: models.AbbrewAnatomy,
    armour: models.AbbrewArmour,
    weapon: models.AbbrewWeapon
  }

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('abbrew', AbbrewActorSheet, {
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('abbrew', AbbrewItemSheet, {
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Item',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('eq', function (arg1, arg2) {
  console.log('eq');
  return (arg1 === arg2);
});

Handlebars.registerHelper('pos', function (arg1) {
  console.log('pos');
  return (arg1 > 0);
});

Handlebars.registerHelper('getProperty', function (parent, child) {
  const preparedChild = child.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return "";
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
  return parent[preparedChild];
});

Handlebars.registerHelper('empty', function (collection) {
  if (!collection) {
    return false;
  }

  return collection.length === 0;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */
Hooks.on("applyActiveEffect", applyCustomEffects);

Hooks.on("renderChatLog", (app, html, data) => {
  documents.AbbrewItem.chatListeners(html);
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.abbrew.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'abbrew.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

function applyCustomEffects(actor, change) {
  console.log("CUSTOM");
}