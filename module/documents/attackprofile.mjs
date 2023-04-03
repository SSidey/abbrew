import { d10Roll } from "../helpers/dice.mjs";

Hooks.on('init', () => {
  $(document).on('click', '.damage-application button', onDamageAccept);
});

export class AbbrewAttackProfile {
  id = "";
  abilityModifier = "";
  damageBase = 0;
  isWeapon = false;
  weapon = {};
  isMagic = false;
  magic = {};

  constructor(id, abilityModifier, damageBase, isWeapon, weapon, isMagic, magic) {
    this.id = id;
    this.abilityModifier = abilityModifier;
    this.damageBase = damageBase;
    this.isWeapon = isWeapon;
    this.weapon = weapon;
    this.isMagic = isMagic;
    this.magic = magic;
  }
}

export async function useAttack(attack, attackProfile, actor) {

  let title = `${attack.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;

  const rollData = getRollData(actor, attack, attackProfile);

  // HERE: Look at skill rolls in 5e
  // TODO: FUCKER WAS COMING FROM HERE
  rollData.mod = 10;

  // Compose roll options
  const rollConfig = {
    parts: [attackProfile.abilityModifier, '@attackProfile.damageBase'],
    data: rollData,
    title,
    flavour: title,
    dialogOptions: {
      width: 400,
      top: null,
      left: window.innerWidth - 710
    },
    messageData: {
      "flags.abbrew.roll": { type: "attack", attack: attack.id, attackProfile: attackProfile.id },
      speaker: ChatMessage.getSpeaker({ actor: actor })
    },
    options: {
      "damageType": attackProfile.damageType
    }
  };

  const roll = await d10Roll(rollConfig);

  return roll;
}

function getRollData(actor, attack, attackProfile) {
  // If present, return the actor's roll data.
  if (!actor) return null;
  const rollData = actor.getRollData();
  // Grab the item's system data as well.
  rollData.attack = foundry.utils.deepClone(attack);
  rollData.attackProfile = foundry.utils.deepClone(attackProfile);
  rollData.criticalThreshold = getCriticalThreshold(actor, attackProfile);
  rollData.amplification = getAmplification(actor, attackProfile);
  rollData.weakness = getWeakness(actor, attackProfile);

  return rollData;
}

function getCriticalThreshold(actor, attackProfile) {
  const weaponThreshold = attackProfile.weapon.criticalThreshold;
  const damageType = attackProfile.weapon.damageType;
  const globalThreshold = actor.system.concepts['attack'].criticalThreshold;
  let damageTypeThreshold = 10;
  if (actor.system.concepts[damageType]) {
    damageTypeThreshold = actor.system.concepts[damageType].criticalThreshold;
  }

  const calculatedThreshold = Math.min(weaponThreshold, globalThreshold, damageTypeThreshold)

  // ABBREW: Minimum critical threshold is 5.
  return Math.max(calculatedThreshold, 5);
}

function getAmplification(actor, attackProfile) {
  const damageType = attackProfile.weapon.damageType;
  return actor.system.concepts[damageType] ? actor.system.concepts[damageType].amplification : 0;
}

function getWeakness(actor, attackProfile) {
  const damageType = attackProfile.weapon.damageType;
  return actor.system.concepts[damageType] ? actor.system.concepts[damageType].weakness : 0;
}

async function oold() {
  let options = {};

  // Ensure the options object is ready
  options = foundry.utils.mergeObject({
    configureDialog: true,
    createMessage: true,
    // "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
  }, options);

  const card = await displayCard(options, attack, attackProfile, actor);

  return card;
}

async function displayCard(options = {}, attack, attackProfile, actor) {

  // Render the chat card template
  const token = actor.token;
  const templateData = {
    actor: actor,
    tokenId: token?.uuid || null,
    item: this,
    data: { attack, attackProfile },
    labels: "",
    hasAttack: true,
    isHealing: false,
    hasDamage: true,
    isVersatile: false,
    isSpell: false,
    hasSave: false,
    hasAreaTarget: false,
    isTool: false,
    hasAbilityCheck: false
  };

  // Handle passed data / don't look for item
  const html = await renderTemplate("systems/abbrew/templates/chat/attack-card.hbs", templateData);

  // Create the ChatMessage data object
  const chatData = {
    user: game.user.id,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    content: html,
    flavor: attack.name,
    speaker: ChatMessage.getSpeaker({ actor: actor, token }),
    flags: { "core.canPopout": true }
  };

  // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
  //   if ( (this.type === "consumable") && !this.actor.items.has(this.id) ) {
  //     chatData.flags["abbrew.itemData"] = templateData.item.toObject();
  //   }

  // Merge in the flags from options
  chatData.flags = foundry.utils.mergeObject(chatData.flags, options.flags);

  /**
   * A hook event that fires before an item chat card is created.
   * @function abbrew.preDisplayCard
   * @memberof hookEvents
   * @param {Item5e} item             Item for which the chat card is being displayed.
   * @param {object} chatData         Data used to create the chat message.
   * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
   */
  Hooks.callAll("abbrew.preDisplayCard", this, chatData, options);

  // Apply the roll mode to adjust message visibility
  // ChatMessage.applyRollMode(chatData, options.rollMode ?? game.settings.get("core", "rollMode"));

  // const options = { createMessage: true };

  // Create the Chat Message or return its data
  const card = (options.createMessage !== false) ? await ChatMessage.create(chatData) : chatData;

  /**
   * A hook event that fires after an item chat card is created.
   * @function abbrew.displayCard
   * @memberof hookEvents
   * @param {Item5e} item              Item for which the chat card is being displayed.
   * @param {ChatMessage|object} card  The created ChatMessage instance or ChatMessageData depending on whether
   *                                   options.createMessage was set to `true`.
   */
  Hooks.callAll("abbrew.displayCard", this, card);

  return card;
}

async function onDamageAccept(event) {
  console.log(event);
  // Extract card data
  const button = event.currentTarget;
  const card = button.closest(".chat-message");
  const messageId = card.closest(".message").dataset.messageId;
  const message = game.messages.get(messageId);
  const tokens = canvas.tokens.controlled.filter((token) => token.actor);
  await tokens[0].actor.acceptDamage(message.rolls, message.flags.data);
}

export async function onAttackCardAction(event) {
  event.preventDefault();

  // Extract card data
  const button = event.currentTarget;
  // Disable Button
  button.disabled = true;
  const card = button.closest(".chat-card");
  const messageId = card.closest(".message").dataset.messageId;
  const message = game.messages.get(messageId);
  const action = button.dataset.action;

  // Recover the actor for the chat card
  const actor = await _getChatCardActor(card);
  if (!actor) return;

  // Validate permission to proceed with the roll
  const isTargetted = action === "contest";
  if (!(isTargetted || game.user.isGM || actor.isOwner)) {
    return;
  }

  // Get the Item from stored flag data or by the item ID on the Actor
  const storedData = message.getFlag("abbrew", "itemData");
  const item = storedData ? new this(storedData, { parent: actor }) : actor.attacks.get(card.dataset.itemId);
  if (!item) {
    const err = game.i18n.format("ABBREW.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name });
    return ui.notifications.error(err);
  }

  // TODO: Pull this up to the first dialog, we should pop the strong etc. one on
  // clicking the sheet, not here. Give option to accept the damage only
  await item.rollAttack({ event });

  // Re-enable the button
  button.disabled = false;
}

/**
* Get the Actor which is the author of a chat card
* @param {HTMLElement} card    The chat card being used
* @returns {Actor|null}        The Actor document or null
* @private
*/
async function _getChatCardActor(card) {

  // Case 1 - a synthetic actor from a Token
  if (card.dataset.tokenId) {
    const token = await fromUuid(card.dataset.tokenId);
    if (!token) return null;
    return token.actor;
  }

  // Case 2 - use Actor ID directory
  const actorId = card.dataset.actorId;
  return game.actors.get(actorId) || null;
}