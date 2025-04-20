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
import { handleActorWoundConditions, handleActorGuardConditions, handleCombatStart } from './helpers/combat.mjs';
import { staticID, doesNestedFieldExist } from './helpers/utils.mjs';
import { registerSystemSettings } from './settings.mjs';
import { AbbrewCreatureFormSheet } from './sheets/items/item-creature-form-sheet.mjs';
import { AbbrewSkillDeckSheet } from './sheets/items/item-skill-deck-sheet.mjs';
import { AbbrewAnatomySheet } from './sheets/items/item-anatomy-sheet.mjs';
import { AbbrewSkillSheet } from './sheets/items/item-skill-sheet.mjs';
import { handleSkillActivate } from './helpers/skill.mjs';
import { onWorldTimeUpdate } from './helpers/time.mjs';
import { activateSocketListener, emitForAll, SocketMessage } from './socket.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.abbrew = {
    AbbrewActor: documents.AbbrewActor,
    AbbrewItem: documents.AbbrewItem,
    useSkillMacro,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.ABBREW = ABBREW;

  addWoundUtilities();

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
    types: ["item", "feature", "spell", "armour", "weapon", "wound"],
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
  Items.registerSheet('abbrew', AbbrewSkillSheet, {
    types: ["skill"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Skill"
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
    data.name = game.i18n.localize(data.name) ?? data.name;
    data.description = game.i18n.localize(data.description) ?? data.description;
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

/*--------------------------------------------*/

function addWoundUtilities() {
  const wounds = foundry.utils.deepClone(CONFIG.ABBREW.wounds);
  CONFIG.ABBREW.lingeringWoundTypes = Object.entries(wounds).filter(w => w[1].lingeringWounds.length > 0).map(w => w[0]);
  CONFIG.ABBREW.woundToLingeringWounds = Object.entries(wounds).filter(w => w[1].lingeringWounds.length > 0).reduce((result, wound) => { result[wound[0]] = wound[1].lingeringWounds; return result; }, {});
};

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// Another useful helper is log {{log obj}} will log to console

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('eq', function (arg1, arg2) {
  return (arg1 === arg2);
});

Handlebars.registerHelper('pos', function (arg1) {
  return (arg1 > 0);
});

Handlebars.registerHelper('getProperty', function (parent, child) {
  const preparedChild = child.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return "";
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
  return parent[preparedChild];
});

Handlebars.registerHelper('hasValue', function (arg1, opts) {
  return arg1 !== null && arg1 !== undefined ? opts.fn(this) : opts.inverse(this);
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
  if (game.user.isGM) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

Handlebars.registerHelper('isGM', function () {
  return game.user.isGM;
})

Handlebars.registerHelper('showGmSection', function (user, options) {
  const hideGmSection = game.settings.get("abbrew", "hideGmSection");
  const result = !hideGmSection || !game.users.get(user._id).isGM;
  return result;
})

Handlebars.registerHelper("eagerEvaluation", function (value, ...replacements) {
  const regex = /{{[^{}]*}}/g;

  for (let i = 0; i < replacements.length - 1; i++) {
    value = value.replace(regex, replacements[i]);
  }

  return value;
})

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => { createItemMacro(data, slot); return false; });

  activateSocketListener();
});

/* -------------------------------------------- */
/*  Combat Hooks                                 */
/* -------------------------------------------- */

Hooks.on("combatStart", async (combat, updateData, updateOptions) => {
  const actors = combat.combatants.toObject().map(c => canvas.tokens.get(c.tokenId).actor);
  await handleCombatStart(actors);
});

Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
  game.time.advance(CONFIG.ABBREW.durations.round.value);
})

Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
})

Hooks.on("combatTurnChange", async (combat, prior, current) => {
  if (canvas.tokens.get(current.tokenId).actor.isOwner) {
    await emitForAll("system.abbrew", new SocketMessage(null, "handleCombatTurnChange", { prior, current }));
  }
})

Hooks.on("updateToken", (document, changed, options, userId) => {
  // const combatId = game.combat._id;
  // document.flags.elevationruler.movementHistory.combatMoveData[combatId]lastMoveDistance;
  // use the selectedMovementType to determine?
  // stepping is 1 action, less than or equal to speed is 2 actions, over that is 4, then should show red or no ruler?
  // Once another action has been taken, reset for next movement?
  // console.log("Somewhere to hit");
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("applyActiveEffect", applyCustomEffects);

Hooks.on("renderChatLog", (app, html, data) => {
  documents.AbbrewItem.chatListeners(html);
});

Hooks.on("renderChatMessage", async function onMessageRendered(message, html, messageData) {
  //[data-visibility="gm"]
  if (!game.user.isGM) {
    html.find(`[data-visibility="gm"]`).remove();
  }
  if (game.user.isGM) {
    html.find(`[data-visibility="redacted"]`).remove();
    html.find(`[data-visibility="player"]`).remove();
  }

  // visibility based on actor owner
  let element = html.find("div [data-visibility]");
  if (element) {
    let actorId = element.data("visibility");
    if (actorId) {
      let actor = game.actors.get(actorId);
      if (actor && !actor.isOwner) {
        element.remove();
      }
    }
  }
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

Hooks.on("updateWorldTime", async (worldTime, td, options, userId) => {
  if (game.combat && game.combat.active) {
    return;
  }

  await onWorldTimeUpdate(worldTime, td, options, userId);
});

Hooks.on("updateItem", async (document, changed, options, userId) => {
  if (doesNestedFieldExist(changed, "system.action.uses.value")) {
    const effect = document.effects.find(e => e.flags.abbrew.skill.stacks);
    if (effect) {
      const stacks = changed.system.action.uses.value;
      await effect.update({ "flags.abbrew.skill.stacks": stacks });
    }
  }
});

Hooks.on("preUpdateItem", () => { })

Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
  console.log("deleted");
  const parent = effect.parent;
  if (parent.type === "character") {
    await parent.handleDeleteActiveEffect(effect);
  }
});

Hooks.on("dropCanvasData", (canvas, data) => {
  console.log("Canvas Drop")
});

Hooks.on("preCreateActiveEffect", effect => {
  const startingStacks = effect.flags?.abbrew?.skill?.stacks ?? effect.getFlag("statuscounter", "value") ?? 1
  effect.updateSource({
    "flags.statuscounter.config.dataSource": "flags.abbrew.skill.stacks",
    "flags.statuscounter.visible": startingStacks > 1,
    "flags.statuscounter.value": startingStacks,
    "flags.abbrew.skill.stacks": startingStacks,
  });
});

Hooks.on("createActiveEffect", (document, options, userId) => {
  console.log("Created");
});

Hooks.on("preUpdateDocument", (document, changed, options, userId) => {
  console.log("Preupdate");
});

Hooks.on("updateActiveEffect", async (effect, update, options, user) => {
  if (effect.parent && effect.parent.type === "skill" && doesNestedFieldExist(update, "flags.abbrew.skill.stacks")) {
    const skill = effect.parent;
    await skill.update({ "system.action.uses.value": update.flags.abbrew.skill.stacks });
  }
});

Hooks.on("preUpdateActiveEffect", async (effect, update, options, user) => {
});

Hooks.on("preDeleteActiveEffect", async (effect, options, userId) => {
  console.log(effect);
});

Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
  console.log(data);
  if (data.type === "Item") {
    const item = await fromUuid(data.uuid);
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
// TODO: Display resources somewhere.
/* -------------------------------------------- */
/*  Module Specific Hooks                                 */
/* -------------------------------------------- */

// Visual Active Effects

Hooks.on("visual-active-effects.createEffectButtons", function (eff, buttons) {
  // if (eff.name === "Steve") {
  buttons.push({
    label: "Toggle",
    callback: function () {
      eff.update({ disabled: !eff.disabled });
    }
  });
  // }
});

async function handleActorWoundDrop(actor, item) {
  const wound = item.system.wound;
  await actor.acceptWound(wound.type, wound.value);
}

async function handleActorBackgroundDrop(actor, background) {
  await actor.acceptBackground(background);
  await actor.acceptSkillDeck(background);
  if (background.system.creatureForm.id) {
    const creatureForm = await fromUuid(background.system.creatureForm.sourceId);
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
  if (data.type === 'Macro') {
    const macro = game.macros.find(m => m._id === foundry.utils.parseUuid(data.uuid).id);
    game.user.assignHotbarMacro(macro, slot);
    return false;
  }
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  let command = "";
  if (item.type === "skill") {
    await createSkillMacro(item, slot);
    return false;

  } else {
    await createRollMacro(data, item, slot);
    return false;
  }
}

async function createRollMacro(data, item, slot) {
  const command = `game.abbrew.rollItemMacro("${data.uuid}");`;

  // Create the macro command using the uuid.
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

async function createSkillMacro(skill, slot) {
  let command = "await game.abbrew.useSkillMacro(this);";
  let macro = game.macros.find(
    (m) => m.name === skill.name && skill.command === command
  );
  if (!macro) {
    const skillId = skill._id;
    macro = await Macro.create({
      name: skill.name,
      type: 'script',
      scope: 'actor',
      img: skill.img,
      command: command,
      flags: { 'abbrew.itemMacro': true, 'abbrew.skillMacro.skillId': skillId },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
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

async function useSkillMacro(macroData) {
  const skillId = macroData.flags.abbrew.skillMacro.skillId;

  const actor = game.user.character ?? getControlledActor();
  if (!actor) {
    ui.notifications.warn(`You must select a token.`);
    return;
  }

  const skill = actor.items.find(i => i._id === skillId);
  if (skill?.type !== "skill") {
    ui.notifications.warn(`${skill.name} is not a skill.`);
    return;
  }

  await handleSkillActivate(actor, skill);
}

function getControlledActor() {
  const tokens = canvas.tokens.controlled.filter((token) => token.actor);
  if (tokens.length === 0) {
    return null;
  }
  return tokens[0].actor;
}

function applyCustomEffects(actor, change) {
  console.log("CUSTOM");
}