/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export default class AbbrewItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = { ...super.getRollData() };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  static chatListeners(html) {
    html.on('click', '.card-buttons button[data-action]', this._onChatCardAction.bind(this));
  }

  static async _onChatCardAction(event) {
    // event.preventDefault();

    console.log('chat');

    // Extract card data
    const button = event.currentTarget;
    // TODO: Might want to do this for targeted effects?
    // button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;
    const actor = game.actors.get(card.dataset.actorId);
    const item = game.items.get(card.dataset.itemId);

    switch (action) {
      case 'damage': this._onAcceptDamageAction(actor, item, message.rolls, message.flags.data)
    }
  }

  static _onAcceptDamageAction(actor, item, rolls, data) {
    actor.takeDamage(rolls, data);
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
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      const result = await roll.evaluate();
      const token = this.actor.token;
      const damage = this.actor.system.attributes[item.system.attributeModifier].value + item.system.damage[0].value;
      const resultDice = result.dice[0].results.map(die => {
        let baseClasses = "roll die d10";
        if (die.success) {
          baseClasses = baseClasses.concat(' ', 'success')
        }

        if (die.exploded) {
          baseClasses = baseClasses.concat(' ', 'exploded');
        }

        return { result: die.result, classes: baseClasses };
      });

      const totalSuccesses = result.dice[0].results.reduce((total, r) => {
        if (r.success) {
          total += 1;
        }
        return total;
      }, 0);

      const templateData = {
        totalSuccesses,
        resultDice,
        actor: this.actor,
        item: this,
        tokenId: token?.uuid || null,
        damage
      };
      // TODO: Move this out of item and into a weapon.mjs
      const html = await renderTemplate("systems/abbrew/templates/chat/attack-card.hbs", templateData);
      result.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: html,
        flags: { data: { totalSuccesses, damage} }
      });
      return result;
    }
  }
}
