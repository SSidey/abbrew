import { getAttackSkillWithActions, getModifiedSkillActionCost, getParrySkillWithActions, handleSkillActivate } from '../helpers/skill.mjs';
import { doesNestedFieldExist, arrayDifference, getNumericParts, getSafeJson } from '../helpers/utils.mjs';
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
      if (!this.isHeldEquipStateChangePossible(changed.system.equipState)) {
        ui.notifications.info("You are already holding too many items, try stowing some");
        this.actor.sheet.render();
        return false;
      }
    }

    super._preUpdate(changed, options, userId);
  }

  // TODO: Drop items when not enough hands
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
        const index = requiredArmourPoints.indexOf(a);
        if (index > -1) { // only splice array when item is found
          requiredArmourPoints.splice(index, 1); // 2nd parameter means remove one item only
        } else {
          return false;
        }
      } else {
        result = false;
      }

      return result;
    }, true);

    return allRequiredAvailable;
  }

  isHeldEquipStateChangePossible(equipState) {
    const actorHands = this.actor.getActorAnatomy().reduce((result, a) => result += a.system.hands, 0);
    const equippedHeldItemHands = this.actor.getActorHeldItems().filter(i => i._id !== this._id).reduce((result, a) => result += getNumericParts(a.system.equipState), 0);
    const requiredHands = equippedHeldItemHands + getNumericParts(equipState);
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
      case 'overpower': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'parry': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'finisher': await this._onAcceptFinisherAction(message.rolls, message.flags.data, action); break;
    }
  }

  static async _onAcceptDamageAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      ui.notifications.info("Please select a token to accept the effect.");
      return;
    }

    const actor = tokens[0].actor;

    if (action === "parry" && !actor.doesActorHaveSkillTrait("skillTraining", "defensiveSkills", "base", "parry")) {
      ui.notifications.info("Please ensure you have the parry skill.");
      return;
    }

    if (action === "parry" && actor.doesActorHaveSkillDiscord("Parry")) {
      ui.notifications.info("You are prevented from parrying.");
      return;
    }

    if (action === "parry") {
      const actions = this.getActionCostForAccept(data, action);
      if (actions > 0 && !await actor.canActorUseActions(getModifiedSkillActionCost(actor, getParrySkillWithActions(actor, actions)))) {
        return;
      }
    }
    await actor.takeDamage(rolls, data, action);
  }

  static getActionCostForAccept(data, action) {
    return action === "parry" ? data.actionCost : 0;
  }

  static async _onAcceptFinisherAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      return;
    }

    await tokens[0].actor.takeFinisher(rolls, data);
  }

  async _onCreate(data, options, userId) {
    if (data.type === "skill") {
      const synergies = getSafeJson(data.system.skillModifiers.synergy, []).map(s => ({ value: s.value, id: this.actor.items.find(i => i.name === s.value)?._id, sourceId: s.sourceId })).filter(s => s.id);
      const discord = getSafeJson(data.system.skillModifiers.discord, []).map(s => ({ value: s.value, id: this.actor.items.find(i => i.name === s.value)?._id, sourceId: s.sourceId })).filter(s => s.id);
      const update = {};
      if (synergies.length > 0) {
        update["system.skillModifiers.synergy"] = JSON.stringify(synergies);
      }
      if (discord.length > 0) {
        update["system.skillModifiers.discord"] = JSON.stringify(discord);
      }

      if (Object.keys(update).length > 0) {
        await this.update(update);
      }

      await this.actor?.acceptSkillDeck(data);
    }
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

  async handleAttackDamageAction(actor, attackProfileId, attackMode) {
    const attackProfile = this.system.attackProfiles[attackProfileId];
    const actionCost = attackMode === "overpower" ? this.system.exertActionCost : this.system.actionCost;

    const id = actor.system.proxiedSkills[attackMode];

    const attackSkill = getAttackSkillWithActions(id, this.name, actionCost, this.img, attackProfile, attackMode, this.system.handsSupplied);

    await handleSkillActivate(actor, attackSkill);
  }
}
