// Import document classes.
import { AbbrewActor } from "./documents/actor.mjs";
import { AbbrewItem } from "./documents/item.mjs";
// Import sheet classes.
import { AbbrewActorSheet } from "./sheets/actor-sheet.mjs";
import { AbbrewItemSheet } from "./sheets/item-sheet.mjs";
import { AbbrewItemAnatomySheet } from "./sheets/item-anatomy-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { ABBREW } from "./helpers/config.mjs";
import AbbrewRoll from "./helpers/abbrew-roll.mjs";
import { handleTurnStart } from "./helpers/turn-start.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {

  Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });  

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.abbrew = {
    AbbrewActor,
    AbbrewItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.ABBREW = ABBREW;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @abilities.dexterity.mod + @abilities.agility.mod + @abilities.wits.mod",
    decimals: 2
  };

  // Record Configuration Values
  CONFIG.Dice.AbbrewRoll = AbbrewRoll;
  CONFIG.Dice.rolls.push(AbbrewRoll);

  // Define custom Document classes
  CONFIG.Actor.documentClass = AbbrewActor;
  CONFIG.Item.documentClass = AbbrewItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("abbrew", AbbrewActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  // Items.registerSheet("abbrew", AbbrewItemSheet, { makeDefault: true });
  const sheetEntries = [
    ["anatomy", AbbrewItemAnatomySheet],
    ["item", AbbrewItemSheet],
    ["feature", AbbrewItemSheet],
    ["spell", AbbrewItemSheet],
    ["resource", AbbrewItemSheet],
    ["attack", AbbrewItemSheet],    
    ["defense", AbbrewItemSheet]
  ]
  for (const [type, Sheet] of sheetEntries) {
    Items.registerSheet("abbrew", Sheet, {
      types: [type],
      label: game.i18n.localize(ABBREW.SheetLabel, { type: type }),
      makeDefault: true,
    });
  }

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function () {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper("isNumber", function(value) {
  return typeof value === "number";
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
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
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.abbrew.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "abbrew.itemMacro": true }
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
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}

Hooks.on("renderChatLog", (app, html, data) => AbbrewItem.chatListeners(html));

Hooks.on("abbrew.ability", function (ability) {
  console.log("Hooked on " + ability);
});

Hooks.once("dragRuler.ready", (SpeedProvider) => {
  class AbbrewSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: "walk", default: 0x00FF00, name: "abbrew.speeds.walk" },
        { id: "dash", default: 0xFFFF00, name: "abbrew.speeds.dash" },
        { id: "run", default: 0xFF8000, name: "abbrew.speeds.run" }
      ]
    }

    getRanges(token) {
      const baseSpeed = token.actor.system.movement.base

      // A character can always walk it's base speed and dash twice it's base speed
      const ranges = [
        { range: baseSpeed, color: "walk" },
        { range: baseSpeed * 2, color: "dash" },
        { range: baseSpeed * 3, color: "run" }
      ]

      return ranges
    }
  }

  dragRuler.registerSystem("abbrew", AbbrewSpeedProvider)
})

Hooks.on("combatStart", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData, updateOptions);
});

Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData, updateOptions);
})

Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData, updateOptions);
})