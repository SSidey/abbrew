import { getModifiedSkillActionCost, handleSkillActivate, trackSkillDuration } from '../helpers/skill.mjs';
import { doesNestedFieldExist, arrayDifference, getNumericParts } from '../helpers/utils.mjs';
import FundamentalSkills, { getAttackSkillWithActions, getParrySkillWithActions } from '../helpers/fundamental-skills.mjs';
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

    await actor.takeAttack(data, rolls, action);
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
      await this.actor?.acceptSkillDeck(data);
      if (this.actor && !this.system.isActivatable && this.system.action.duration.value > 0) {
        await trackSkillDuration(this.actor, this);
      }
      if (this.actor && this.system.isActivatable && this.system.activateOnCreate) {
        await handleSkillActivate(this.actor, this, false);
      }
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

    let combineForSkill = actor.items.filter(i => i.type === "skill").find(s => s._id === actor.system.combinedAttacks.combineFor);

    if (!combineForSkill) {
      const combineAttackSkills = actor.items.filter(i => i.type === "skill" && actor.system.queuedSkills.includes(i._id)).filter(s => s.system.action.modifiers.attackProfile.combineAttacks.isEnabled);
      if (combineAttackSkills.length > 0) {
        combineForSkill = combineAttackSkills[0];
        await actor.update({ "system.combinedAttacks.combineFor": combineForSkill._id });
      }
    }

    const combineSkill = combineForSkill ? ({ name: combineForSkill.name, image: combineForSkill.img, id: combineForSkill._id, value: combineForSkill.system.action.modifiers.attackProfile.combineAttacks.value, actionCost: combineForSkill.system.action.actionCost, attackMode: combineForSkill.system.action.modifiers.attackProfile.attackMode, handsSupplied: combineForSkill.system.action.modifiers.attackProfile.handsSupplied, durationPrecision: combineForSkill.system.action.duration.precision }) : undefined;

    if (combineSkill) {
      const toCombine = combineSkill.value;
      const combined = actor.system.combinedAttacks.combined;
      if (actor.system.combinedAttacks.combined === 0 && !actor.system.combinedAttacks.base) {
        const base = { id: combineSkill.id, name: combineSkill.name, actionCost: combineSkill.actionCost, image: combineSkill.image, attackMode: combineSkill.attackMode, handsSupplied: combineSkill.handsSupplied, attackProfile: attackProfile };
        await actor.update({ "system.combinedAttacks.combined": combined + 1, "system.combinedAttacks.base": base });
        return;
      }

      const combinedDamage = actor.system.combinedAttacks.additionalDamage;
      const fullCombinedDamage = [...combinedDamage, ...attackProfile.damage];
      const totalCombined = combined + 1;
      if (totalCombined < toCombine) {
        await actor.update({ "system.combinedAttacks.combined": totalCombined, "system.combinedAttacks.additionalDamage": fullCombinedDamage })
      }

      let base = actor.system.combinedAttacks.base;
      base.attackProfile.damage = [...base.attackProfile.damage, ...fullCombinedDamage];
      const attackSkill = getAttackSkillWithActions(base.id, base.name, base.actionCost, base.image, base.attackProfile, base.attackMode, base.handsSupplied);
      if (combineSkill.durationPrecision === "0") {
        const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === combineSkill.id);
        await effect?.delete();
      }
      await actor.update({ "system.combinedAttacks.combined": 0, "system.combinedAttacks.combineFor": null, "system.combinedAttacks.base": null, "system.combinedAttacks.additionalDamage": [] })
      await handleSkillActivate(actor, attackSkill, false);
      return;
    }

    const attackSkill = getAttackSkillWithActions(id, this.name, actionCost, this.img, attackProfile, attackMode, this.system.handsSupplied);

    await handleSkillActivate(actor, attackSkill);
  }
}
