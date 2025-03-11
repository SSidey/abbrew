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
import { handleTurnStart, handleActorWoundConditions, handleActorGuardConditions } from './helpers/combat.mjs';
import { staticID, doesNestedFieldExist } from './helpers/utils.mjs';
import { registerSystemSettings } from './settings.mjs';
import { AbbrewCreatureFormSheet } from './sheets/items/item-creature-form-sheet.mjs';
import { AbbrewSkillDeckSheet } from './sheets/items/item-skill-deck-sheet.mjs';
import { AbbrewAnatomySheet } from './sheets/items/item-anatomy-sheet.mjs';

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
    weapon: models.AbbrewWeapon,
    wound: models.AbbrewWound,
    background: models.AbbrewBackground,
    skillDeck: models.AbbrewSkillDeck,
    creatureForm: models.AbbrewCreatureForm
  }

  // Register System Settings  
  registerSystemSettings();

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
    types: ["item", "feature", "spell", "skill", "armour", "weapon", "wound"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Item',
  });
  Items.registerSheet('abbrew', AbbrewCreatureFormSheet, {
    types: ["creatureForm"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.CreatureForm"
  });
  Items.registerSheet('abbrew', AbbrewSkillDeckSheet, {
    types: ["skillDeck", "background"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.SkillDeck"
  });
  Items.registerSheet('abbrew', AbbrewAnatomySheet, {
    types: ["anatomy"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Anatomy"
  });

  _configureStatusEffects();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */

/**
 * Configure system status effects.
 */
function _configureStatusEffects() {
  const addEffect = (effects, { special, ...data }) => {
    data = foundry.utils.deepClone(data);
    data._id = staticID(`abbrew${data.id}`);
    data.img = data.icon ?? data.img;
    delete data.icon;
    effects.push(data);
    if (special) CONFIG.specialStatusEffects[special] = data.id;
  };
  CONFIG.statusEffects = Object.entries(CONFIG.ABBREW.statusEffects).reduce((arr, [id, data]) => {
    const original = CONFIG.statusEffects.find(s => s.id === id);
    addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
    return arr;
  }, []);
  // for ( const [id, {label: name, ...data}] of Object.entries(CONFIG.DND5E.conditionTypes) ) {
  //   addEffect(CONFIG.statusEffects, { id, name, ...data });
  // }
  // for ( const [id, data] of Object.entries(CONFIG.DND5E.encumbrance.effects) ) {
  //   addEffect(CONFIG.statusEffects, { id, ...data, hud: false });
  // }
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// Another useful helper is log {{log obj}} will log to console

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

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context, undefined, 2);
});

Handlebars.registerHelper('gm', function (opts) {
  if (game.users.current === game.users.activeGM) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Combat Hooks                                 */
/* -------------------------------------------- */

Hooks.on("combatStart", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData, updateOptions);
});

Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData, updateOptions);
})

Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
  // Causing issues as the initating client triggers this i.e. player before enemies will be unable to trigger the enemy bleed
  // await handleTurnStart(combat, updateData, updateOptions);
})

Hooks.on("combatTurnChange", async (combat, prior, current) => {
  if (canvas.tokens.get(current.tokenId).actor.isOwner) {
    await handleTurnStart(prior, current, canvas.tokens.get(current.tokenId).actor);
  }
})

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */
Hooks.on("applyActiveEffect", applyCustomEffects);

Hooks.on("renderChatLog", (app, html, data) => {
  documents.AbbrewItem.chatListeners(html);
});

Hooks.on("updateActor", async (actor, updates, options, userId) => {

  if (userId != game.user.id) { return; }

  if (doesNestedFieldExist(updates, "system.defense.guard.value")) {

    await handleActorGuardConditions(actor);

  }

  if (doesNestedFieldExist(updates, "system.wounds") || doesNestedFieldExist(updates, "system.defense.resolve")) {

    await handleActorWoundConditions(actor);

  }

});

Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
  console.log(data);
  if (data.type === "Item") {
    const id = data.uuid.split(".").pop(); // TODO: Check incase this breaks things.splice(1).shift();
    const item = game.items.get(id);
    if (item) {
      switch (item.type) {
        case "wound":
          await handleActorWoundDrop(actor, item);
          break;
        case "background":
          await handleActorBackgroundDrop(actor, item);
          break;
        case "skillDeck":
          await handleActorSkillDeckDrop(actor, item);
          break;
        case "creatureForm":
          await handleActorCreatureFormDrop(actor, item);
          break;
        case "anatomy":
          await handleActorAnatomyDrop(actor, item);
          break;
      }
    }
  }
});

async function handleActorWoundDrop(actor, item) {
  const wound = item.system.wound;
  await actor.acceptWound(wound.type, wound.value);
}

async function handleActorBackgroundDrop(actor, background) {
  await actor.acceptBackground(background);
  await actor.acceptSkillDeck(background);
  if (background.system.creatureForm.id) {
    const creatureForm = game.items.get(background.system.creatureForm.id);
    await actor.acceptCreatureForm(creatureForm);
  }
}

async function handleActorSkillDeckDrop(actor, skillDeck) {
  await actor.acceptSkillDeck(skillDeck)
}

async function handleActorCreatureFormDrop(actor, creatureform) {
  await actor.acceptCreatureForm(creatureform);
}

async function handleActorAnatomyDrop(actor, anatomy) {
  await actor.acceptAnatomy(anatomy);
}

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