import { doesNestedFieldExist, arrayDifference } from '../helpers/utils.mjs';
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

  _preUpdate(changed, options, userId) {
    if (doesNestedFieldExist(changed, "system.equipState") && changed.system.equipState === 'worn' && this.type === 'armour') {
      if (!this.isWornEquipStateChangePossible()) {
        ui.notifications.info("You are already wearing too many items, try stowing some");
        this.actor.sheet.render();
        return false;
      }
    }


    if (doesNestedFieldExist(changed, "system.equipState") && changed.system.equipState.startsWith('held')) {
      if (!this.isHeldEquipStateChangePossible()) {
        ui.notifications.info("You are already holding too many items, try stowing some");
        this.actor.sheet.render();
        return false;
      }
    }

    super._preUpdate(changed, options, userId);
  }

  isWornEquipStateChangePossible() {
    const armourPoints = JSON.parse(this.system.armourPoints).map(ap => ap.value);
    const usedArmourPoints = this.actor.getActorWornArmour().flatMap(a => JSON.parse(a.system.armourPoints).map(ap => ap.value));
    const actorArmourPoints = this.actor.getActorAnatomy().flatMap(a => JSON.parse(a.system.parts).map(ap => ap.value));
    const availableArmourPoints = arrayDifference(actorArmourPoints, usedArmourPoints);
    if (!armourPoints.every(ap => availableArmourPoints.includes(ap))) {
      return false;
    }
    let requiredArmourPoints = availableArmourPoints.filter(ap => armourPoints.includes(ap));
    const allRequiredAvailable = armourPoints.reduce((result, a) => {
      if (requiredArmourPoints.length > 0 && requiredArmourPoints.includes(a)) {
        requiredArmourPoints.pop(a);
      } else {
        result = false;
      }

      return result;
    }, true);

    return allRequiredAvailable;
  }

  isHeldEquipStateChangePossible() {
    const actorHands = this.actor.getActorAnatomy().reduce((result, a) => result += a.system.hands, 0);
    const equippedHeldItemHands = this.actor.getActorHeldItems().reduce((result, a) => result += a.system.hands, 0);
    const requiredHands = equippedHeldItemHands + this.system.hands;
    return actorHands >= requiredHands;
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
      case 'damage': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'parry': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'finisher': await this._onAcceptFinisherAction(message.rolls, message.flags.data); break;
    }
  }

  static async _onAcceptDamageAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    await tokens[0].actor.takeDamage(rolls, data, action);
  }

  static async _onAcceptFinisherAction(rolls, data) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      return;
    }

    await tokens[0].actor.takeFinisher(rolls, data);
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
      // TODO: Replace with old
      console.log('general roll');
    }
  }
}
