export async function ChatAbbrew(dataset, element, actor) {
    return;

    const itemId = element.closest('.item').dataset.itemId;
    const item = actor.items.get(itemId);

    const templateData = {
        actor,
        item,
        dataset,
        description: item.system.description
    };

    const html = await renderTemplate("systems/abbrew/templates/chat/item-card.hbs", templateData);

    // Create the ChatMessage data object
    const chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: html,
        flavor: item.name,
        speaker: ChatMessage.getSpeaker({ actor, token: actor.token }),
        flags: { "core.canPopout": true }
    };

    // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
    //   if ( (this.type === "consumable") && !this.actor.items.has(this.id) ) {
    //     chatData.flags["abbrew.itemData"] = templateData.item.toObject();
    //   }

    // Merge in the flags from options
    // chatData.flags = foundry.utils.mergeObject(chatData.flags, options.flags);

    /**
     * A hook event that fires before an item chat card is created.
     * @function abbrew.preDisplayCard
     * @memberof hookEvents
     * @param {Item5e} item             Item for which the chat card is being displayed.
     * @param {object} chatData         Data used to create the chat message.
     * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
     */
    // Hooks.callAll("abbrew.preDisplayCard", this, chatData, options);

    // Apply the roll mode to adjust message visibility
    // ChatMessage.applyRollMode(chatData, options.rollMode ?? game.settings.get("core", "rollMode"));

    const options = { createMessage: true };

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