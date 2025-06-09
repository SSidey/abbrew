// Import sheet classes.
import { AbbrewItemSheet } from './sheets/item-sheet.mjs';
import { AbbrewActiveEffectSheet } from './sheets/active-effect-sheet.mjs'
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { ABBREW } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
// Import Documents Classes
import * as documents from './documents/_module.mjs';
import * as abbrewCanvas from './canvas/_module.mjs';
import * as abbrewApplication from './applications/_module.mjs';
import { handleActorWoundConditions, handleActorGuardConditions, handleCombatStart, handleCombatEnd, handleTurnChange } from './helpers/combat.mjs';
import { staticID, doesNestedFieldExist, getSafeJson, getObjectValueByStringPath } from './helpers/utils.mjs';
import { registerSystemSettings } from './settings.mjs';
import { AbbrewCreatureFormSheet } from './sheets/items/item-creature-form-sheet.mjs';
import { AbbrewSkillDeckSheet } from './sheets/items/item-skill-deck-sheet.mjs';
import { AbbrewAnatomySheet } from './sheets/items/item-anatomy-sheet.mjs';
import { AbbrewSkillSheet } from './sheets/items/item-skill-sheet.mjs';
import { AbbrewArchetypeSheet } from './sheets/items/item-archetype-sheet.mjs';
import { AbbrewPathSheet } from './sheets/items/item-path-sheet.mjs';
import { AbbrewAmmunitionSheet } from './sheets/items/item-ammunition-sheet.mjs';
import { AbbrewWeaponSheet } from './sheets/items/item-weapon-sheet.mjs';
import { AbbrewArmourSheet } from './sheets/items/item-armour-sheet.mjs';
import { AbbrewEnhancementSheet } from './sheets/items/item-enhancement-sheet.mjs';
import { AbbrewEquipmentSheet } from './sheets/items/item-equipment-sheet.mjs'
import { onWorldTimeUpdate } from './helpers/time.mjs';
import { activateSocketListener, emitForAll, SocketMessage } from './socket.mjs';
import { handleSkillActivate } from './helpers/skills/skill-activation.mjs';
import { Browser } from './sheets/browser.mjs';
import { AbbrewCharacterSheet } from './sheets/actor/character-sheet.mjs';
import { AbbrewNPCSheet } from './sheets/actor/npc-sheet.mjs';
const { FormDataExtended } = foundry.applications.ux;

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
    requestSkillCheckMacro,
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
    formula: '(@meta.tier.value)d10 + @attributes.agi.value + @attributes.wit.value + @modifiers.initiative',
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
    creatureForm: models.AbbrewCreatureForm,
    path: models.AbbrewPath,
    archetype: models.AbbrewArchetype,
    ammunition: models.AbbrewAmmunition,
    enhancement: models.AbbrewEnhancement,
    equipment: models.AbbrewEquipment
  }

  // Token Setup
  CONFIG.Token.documentClass = documents.AbbrewTokenDocument;
  CONFIG.Token.objectClass = abbrewCanvas.AbbrewToken;

  CONFIG.ui.chat = abbrewApplication.AbbrewChatLog;

  // Register System Settings  
  registerSystemSettings();

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.ActiveEffect.documentClass = documents.AbbrewActiveEffect;
  CONFIG.ActiveEffect.dataModels = {
    base: models.AbbrewActiveEffect
  }
  foundry.applications.apps.DocumentSheetConfig.registerSheet(documents.AbbrewActiveEffect, "abbrew", AbbrewActiveEffectSheet,
    {
      types: ["base", "passive", "temporary", "inactive"],
      makeDefault: true,
      label: "ABBREW.SheetLabels.ActiveEffect",
    }
  );

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet('core', ActorSheet);
  foundry.documents.collections.Actors.registerSheet('abbrew', AbbrewCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Actor',
  });
  foundry.documents.collections.Actors.registerSheet('abbrew', AbbrewNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Actor',
  });
  foundry.documents.collections.Items.unregisterSheet('core', ItemSheet);
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewItemSheet, {
    types: ["item", "feature", "spell", "wound"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Item',
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewEquipmentSheet, {
    types: ["equipment"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Equipment',
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewArmourSheet, {
    types: ["armour"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Armour',
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewWeaponSheet, {
    types: ["weapon"],
    makeDefault: true,
    label: 'ABBREW.SheetLabels.Weapon',
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewCreatureFormSheet, {
    types: ["creatureForm"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.CreatureForm"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewSkillDeckSheet, {
    types: ["skillDeck", "background"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.SkillDeck"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewAnatomySheet, {
    types: ["anatomy"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Anatomy"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewAmmunitionSheet, {
    types: ["ammunition"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Ammunition"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewSkillSheet, {
    types: ["skill"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Skill"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewArchetypeSheet, {
    types: ["archetype"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Archetype"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewPathSheet, {
    types: ["path"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Path"
  });
  foundry.documents.collections.Items.registerSheet('abbrew', AbbrewEnhancementSheet, {
    types: ["enhancement"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Enhancement"
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

Handlebars.registerHelper('getPropertyById', function (parent, child) {
  return parent[child];
});

Handlebars.registerHelper('hasValue', function (arg1, opts) {
  return arg1 !== null && arg1 !== undefined ? opts.fn(this) : getInverseIfAvailable(opts);
});

function getInverseIfAvailable(opts) {
  if (typeof opts.inverse === "function")
    return opts.inverse(this);
  else
    return null;
}

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

Handlebars.registerHelper("lt", function (val1, val2) {
  return parseFloat(val1) < parseFloat(val2);
})

Handlebars.registerHelper("gt", function (val1, val2) {
  return parseFloat(val1) > parseFloat(val2);
})

Handlebars.registerHelper("filter", function (array, path, filterValue) {
  const filtered = array?.filter(a => {
    const result = getObjectValueByStringPath(a, path)
    return result === filterValue
  });

  return filtered ?? [];
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
  await emitForAll("system.abbrew", new SocketMessage(null, "handleCombatTime", {}));
})

Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
})

Hooks.on("combatTurnChange", async (combat, prior, current) => {
  // if (canvas.tokens.get(current.tokenId).actor.isOwner) {
  //   
  // }
  if (game.user.isGM) {
    await handleTurnChange(prior, current, canvas.tokens.get(prior.tokenId)?.actor, canvas.tokens.get(current.tokenId).actor)
  }
})

Hooks.on("deleteCombat", async (document, options, userId) => {
  const actors = document.combatants.toObject().map(c => canvas.tokens.get(c.tokenId).actor);
  await handleCombatEnd(actors);
});

Hooks.on("updateToken", (document, changed, options, userId) => {
  // const combatId = game.combat._id;
  // document.flags.elevationruler.movementHistory.combatMoveData[combatId]lastMoveDistance;
  // use the selectedMovementType to determine?
  // stepping is 1 action, less than or equal to speed is 2 actions, over that is 4, then should show red or no ruler?
  // Once another action has been taken, reset for next movement?
  // console.log("Somewhere to hit");
});

Hooks.on("preUpdateItem", async (document, changed, options, userId) => {
  if (document.type === "skill") {
    if (doesNestedFieldExist(changed, "system.action.modifiers.resources.self")) {
      const resourceUpdate = changed.system.action.modifiers.resources.self;
      if (Array.isArray(resourceUpdate)) {
        resourceUpdate.forEach(r => {
          if ("type" in r) {
            r.type = getSafeJson(r.summary, [{ id: "" }])[0].id;
          }
        });
      }
    }

    if (doesNestedFieldExist(changed, "system.action.modifiers.resources.target")) {
      const resourceUpdate = changed.system.action.modifiers.resources.target;
      if (Array.isArray(resourceUpdate)) {
        changed.system.action.modifiers.resources.target.forEach(r => {
          if ("type" in r) {
            r.type = getSafeJson(r.summary, [{ id: "" }])[0].id;
          }
        });
      }
    }
  }
});

Hooks.on("updateItem", async (document, changed, options, userId) => {
  console.log(changed);
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("applyActiveEffect", applyCustomEffects);

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
      await effect.update({ "flags.abbrew.skill.stacks": stacks, "flags.statuscounter.visible": stacks > 1, });
    }
  }
});

Hooks.on("preUpdateItem", () => { })

Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
  const parent = effect.parent;
  if (["character", "npc"].includes(parent.type)) {
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

Hooks.on("actorMustDropItem", async (actor) => {
  const items = actor.getActorHeldItems().map(i => ({ label: i.name, value: i._id }));
  const anatomy = actor.system.anatomy;
  let selectedItem;
  if (items.length === 1) {
    selectedItem = actor.items.find(i => i._id === items[0].value);
  } else {
    const fields = foundry.applications.fields;
    const selectInput = fields.createSelectInput({
      options: items,
      name: 'items'
    })
    const selectGroup = fields.createFormGroup({
      input: selectInput,
      label: "Drop an Item"
    })

    const content = `${selectGroup.outerHTML}`

    let id = items[0]._id;
    try {
      id = await foundry.applications.api.DialogV2.prompt({
        window: { title: "Drop an Item (Title)" },
        content: content,
        ok: {
          label: "Drop",
          callback: (event, button, dialog) => button.form.elements.items.selectedOptions[0]?.value ?? button.form.elements.items.options[0].value
        }
      });
    } catch (ex) {
      console.log(`${actor.name} did not select a value.`);
    }

    selectedItem = actor.items.find(i => i._id === id);
  }

  const handsRequired = selectedItem.system.handsRequired;
  const handsAvailable = anatomy.hands;
  if (handsRequired === "versatile" && handsAvailable > 0 && selectedItem.system.handsSupplied > 1) {
    await selectedItem.update({ "system.handsSupplied": 1, "system.equipState": "held1H" });
  } else {
    await selectedItem.update({ "system.handsSupplied": 0, "system.equipState": "dropped" });
  }
})

// Hooks.on("createActiveEffect", (document, options, userId) => {
//   console.log("Created");
// });

// Hooks.on("preUpdateDocument", (document, changed, options, userId) => {
//   console.log("Preupdate");
// });

Hooks.on("updateActiveEffect", async (effect, update, options, user) => {
  if (effect.parent && effect.parent.type === "skill" && doesNestedFieldExist(update, "flags.abbrew.skill.stacks")) {
    const skill = effect.parent;
    await skill.update({ "system.action.uses.value": update.flags.abbrew.skill.stacks });
  }
});

// Hooks.on("preUpdateActiveEffect", async (effect, update, options, user) => {
// });

// Hooks.on("preDeleteActiveEffect", async (effect, options, userId) => {
//   console.log(effect);
// });

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
      }
    }
  }
});

Hooks.on("pauseGame", async function (paused) {
  console.log("paused");
  // const data = { content: { builderTitle: "Hello" }, buttons: {} };
  const browser = await new Browser().render(true);
  console.log("rendered");
});

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

async function requestSkillCheckMacro() {
  const fields = foundry.applications.fields;
  const nameInput = fields.createTextInput({
    name: "skillName",
    value: ""
  });

  const nameGroup = fields.createFormGroup({
    input: nameInput,
    label: "Skill Name",
    hint: ""
  });

  const textInput = fields.createTextInput({
    name: "skillId",
    value: ""
  });

  const textGroup = fields.createFormGroup({
    input: textInput,
    label: "Custom SkillId",
    hint: ""
  });

  const selectInput = fields.createSelectInput({
    options: [{ label: "", value: "" }, ...Object.entries(CONFIG.ABBREW.attributes).map(e => ({ label: game.i18n.localize(e[1]), value: e[0] }))],
    name: "selectId"
  });
  const selectGroup = fields.createFormGroup({
    input: selectInput,
    label: "Select a Skill",
    hint: "Strength Check"
  });

  const checkTypeSelect = fields.createSelectInput({
    options: [{ label: "Successes", value: "successes" }, { label: "Result", value: "result" }],
    name: "checkType"
  });
  const checkTypeSelectGroup = fields.createFormGroup({
    input: checkTypeSelect,
    label: "Select Check Type",
    hint: "Successes"
  });

  const difficultyInput = fields.createNumberInput({
    name: "difficulty",
    value: 0
  });

  const difficultyGroup = fields.createFormGroup({
    input: difficultyInput,
    label: "Difficulty",
    hint: ""
  });

  const successesInput = fields.createNumberInput({
    name: "successes",
    value: 0
  });

  const successesGroup = fields.createFormGroup({
    input: successesInput,
    label: "Successes Required",
    hint: ""
  });

  const content = `${nameGroup.outerHTML} ${textGroup.outerHTML} ${selectGroup.outerHTML} ${checkTypeSelectGroup.outerHTML} ${difficultyGroup.outerHTML} ${successesGroup.outerHTML}`

  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: "Select a Skill" },
    content: content,
    ok: {
      label: "Choose",
      callback: (event, button, dialog) => new FormDataExtended(button.form).object
    }
  });


  console.log(JSON.stringify(result));
  if (result.selectId) {
    const fundamentalSkill = CONFIG.ABBREW.fundamentalAttributeSkillMap[result.selectId];
    await requestSkillCheck(fundamentalSkill.name, [fundamentalSkill.id], result.checkType, result.difficulty, result.successes);
  } else if (result.skillId) {
    await requestSkillCheck(result.skillName, [result.skillId], result.checkType, result.difficulty, result.successes);
  } else {
    return;
  }
}

// skillIds: [AbbrewId.uuid]
export async function requestSkillCheck(checkName, skillIds, checkType, difficulty, successes) {
  let requirements = { modifierIds: skillIds, traits: [], checkType: checkType, isContested: false, successes: { total: 0, requiredValue: 0 }, result: { requiredValue: 0 }, contestedResult: { dice: [], modifier: 0 } };
  if (checkType === "successes") {
    requirements.successes.total = successes;
    requirements.successes.requiredValue = difficulty;
  } else if (checkType === "result") {
    requirements.result.requiredValue = difficulty;
  }

  const data = {};
  data["skillCheckRequest"] = requirements;
  const templateData = {
    mainSummary: { name: checkName },
    checkType: checkType,
    showSkillRequest: true
  };

  const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

  // const speaker = ChatMessage.getSpeaker({ actor: actor });
  const rollMode = game.settings.get('core', 'rollMode');
  // const label = `[${skill.system.skillType}] ${skill.name}`;

  ChatMessage.create({
    // speaker: speaker,
    rollMode: rollMode,
    // flavor: label,
    content: html,
    flags: { data: data, abbrew: { messasgeData: { /* speaker: speaker, */ rollMode: rollMode, /* flavor: label, */ templateData: templateData } } }
  });
}

function applyCustomEffects(actor, change) {
  console.log("CUSTOM");
}