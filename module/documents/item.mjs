import { d10Roll } from "../helpers/dice.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class AbbrewItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  async use(config = {}, options = {}) {
    let item = this;
    const is = item.system;
    const as = item.actor.system;

    // Ensure the options object is ready
    options = foundry.utils.mergeObject({
      configureDialog: true,
      createMessage: true,
      "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
    }, options);

    const card = await this.displayCard(options);

    return card;
  }

  async displayCard(options={}) {

    // Render the chat card template
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token?.uuid || null,
      item: this,
      data: await this.getChatData(),
      labels: this.labels,
      hasAttack: this.hasAttack,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      isVersatile: this.isVersatile,
      isSpell: this.type === "spell",
      hasSave: this.hasSave,
      hasAreaTarget: this.hasAreaTarget,
      isTool: this.type === "tool",
      hasAbilityCheck: this.hasAbilityCheck
    };

    const html = await renderTemplate("systems/abbrew/templates/chat/item-card.hbs", templateData);

    // Create the ChatMessage data object
    const chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
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

  async getChatData(htmlOptions = {}) {
    const data = this.toObject().system;
    const labels = this.labels;

    // Rich text description
    data.description = await TextEditor.enrichHTML(data.description, {
      async: true,
      relativeTo: this,
      rollData: this.getRollData(),
      ...htmlOptions
    });

    // Item type specific properties
    const props = [];
    // switch ( this.type ) {
    //   case "consumable":
    //     this._consumableChatData(data, labels, props); break;
    //   case "equipment":
    //     this._equipmentChatData(data, labels, props); break;
    //   case "feat":
    //     this._featChatData(data, labels, props); break;
    //   case "loot":
    //     this._lootChatData(data, labels, props); break;
    //   case "spell":
    //     this._spellChatData(data, labels, props); break;
    //   case "tool":
    //     this._toolChatData(data, labels, props); break;
    //   case "weapon":
    //     this._weaponChatData(data, labels, props); break;
    // }

    // // Equipment properties
    // if ( data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.type) ) {
    //   if ( data.attunement === CONFIG.DND5E.attunementTypes.REQUIRED ) {
    //     props.push(CONFIG.DND5E.attunements[CONFIG.DND5E.attunementTypes.REQUIRED]);
    //   }
    //   props.push(
    //     game.i18n.localize(data.equipped ? "DND5E.Equipped" : "DND5E.Unequipped"),
    //     game.i18n.localize(data.proficient ? "DND5E.Proficient" : "DND5E.NotProficient")
    //   );
    // }

    // // Ability activation properties
    // if ( data.hasOwnProperty("activation") ) {
    //   props.push(
    //     labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""),
    //     labels.target,
    //     labels.range,
    //     labels.duration
    //   );
    // }

    // Filter properties and return
    data.properties = props.filter(p => !!p);
    return data;
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }

  static async _onChatCardAction(event) {
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
    const actor = await this._getChatCardActor(card);
    if (!actor) return;

    // Validate permission to proceed with the roll
    const isTargetted = action === "contest";
    if (!(isTargetted || game.user.isGM || actor.isOwner)) {
      return;
    }

    // Get the Item from stored flag data or by the item ID on the Actor
    const storedData = message.getFlag("abbrew", "itemData");
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      const err = game.i18n.format("ABBREW.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name });
      return ui.notifications.error(err);
    }

    await item.rollAttack({event});

    // Re-enable the button
    button.disabled = false;
  }

  async rollAttack(options = {}) {

    const { rollData, parts } = this.getAttack();

    let title = `${this.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;

    // HERE: Look at skill rolls in 5e
    rollData.mod = 10;

    // Compose roll options
    const rollConfig = foundry.utils.mergeObject({
      actor: this.actor,
      data: rollData,
      critical: this.getCriticalThreshold(),
      title,
      flavor: title,
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {
        "flags.abbrew.roll": { type: "attack", itemId: this.id, itemUuid: this.uuid },
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      }
    }, options);
    rollConfig.parts = parts.concat(options.parts ?? []);

    const roll = await d10Roll(rollConfig);

    return roll;

  }

  // TODO: Allow to change
  getCriticalThreshold() {
    return 10;
  }

  // TODO: Check this is needed
  getAttack() {
    const rollData = this.getRollData();
    const parts = [];
    return { rollData, parts };
  }


  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  /**
 * Get the Actor which is the author of a chat card
 * @param {HTMLElement} card    The chat card being used
 * @returns {Actor|null}        The Actor document or null
 * @private
 */
  static async _getChatCardActor(card) {

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

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor[]}            An Array of Actor documents, if any
   * @private
   */
  static _getChatCardTargets(card) {
    let targets = canvas.tokens.controlled.filter(t => !!t.actor);
    if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
    if (!targets.length) ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken"));
    return targets;
  }
}
