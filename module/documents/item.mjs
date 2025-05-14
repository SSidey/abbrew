import { doesNestedFieldExist, arrayDifference, getNumericParts, getSafeJson } from '../helpers/utils.mjs';
import { getAttackSkillWithActions, getParrySkillWithActions } from '../helpers/fundamental-skills.mjs';
import { emitForAll, SocketMessage } from '../socket.mjs';
import { applyOperator } from '../helpers/operators.mjs';
import { acceptSkillCheck } from '../helpers/skills/skill-check.mjs';
import { getModifiedSkillActionCost, handleSkillActivate } from '../helpers/skills/skill-activation.mjs';
import { trackSkillDuration } from '../helpers/skills/skill-duration.mjs';
import { manualSkillExpiry } from '../helpers/skills/skill-expiry.mjs';
import { handleGrantedSkills } from '../helpers/skills/skill-grants.mjs';
import { applyEnhancement } from '../helpers/enhancements/enhancement-application.mjs';
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

  async _preUpdate(changed, options, userId) {
    // TODO: Could have items grant extra slots e.g. "belt" slot, which you could then have "worn" equip on a scabbard (require 1 belt)
    // The scabbard which grants a sword slot so then you can wear your sword (worn items are less cost to draw?)
    if (doesNestedFieldExist(changed, "system.equipState") && this.system.equipType === "worn") {
      if (changed.system.equipState === 'worn' && this.type === 'armour') {
        if (!this.isWornEquipStateChangePossible()) {
          ui.notifications.info("You are already wearing too many items, try stowing some");
          this.actor.sheet.render();
          return false;
        } else {
          await this.grantSkills();
        }
      } else {
        if ((this.system.skills?.granted?.length ?? 0) > 0) {
          const grantedSkills = this.actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === this._id);
          this.actor.deleteEmbeddedDocuments("Item", grantedSkills.map(s => s._id));
        }
      }
    }

    if (doesNestedFieldExist(changed, "system.equipState") && this.system.equipType === "held") {
      if (changed.system.equipState.startsWith('held')) {
        if (!this.isHeldEquipStateChangePossible(changed.system.equipState)) {
          ui.notifications.info("You are already holding too many items, try stowing some");
          this.actor.sheet.render();
          return false;
        } else {
          await this.grantSkills();
        }
      } else if (changed.system.equipState === 'active') {
        await this.grantSkills();
      }
      else {
        if ((this.system.skills?.granted?.length ?? 0) > 0) {
          const grantedSkills = this.actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === this._id);
          this.actor.deleteEmbeddedDocuments("Item", grantedSkills.map(s => s._id));
        }
      }
    }

    if (doesNestedFieldExist(changed, "system.isDismembered") && changed.system.isDismembered === true) {
      foundry.utils.setProperty(changed, `system.equipState`, "dropped");
    }

    // Set appropriate values for concentration duration skill.
    if (doesNestedFieldExist(changed, "system.action.duration.isConcentration") && changed.system.action.duration.isConcentration === true) {
      foundry.utils.setProperty(changed, `system.action.duration.precision`, "6");
      foundry.utils.setProperty(changed, `system.action.duration.expireOnStartOfTurn`, false);
      foundry.utils.setProperty(changed, `system.action.duration.value`, 1);
    }

    if (doesNestedFieldExist(changed, "system.attackProfiles") && this.actor) {
      let newGrantPromises = [];
      const promises = [];
      let newAmmunition;
      this.system.attackProfiles.filter(p => p.attackType === "ranged").forEach((p, i) => {
        if (this.system.attackProfiles[i].ammunition.id !== changed.system.attackProfiles[i].ammunition.id) {
          const oldAmmunition = this.actor.items.get(p.ammunition.id);
          newAmmunition = this.actor.items.get(changed.system.attackProfiles[i].ammunition.id);
          if (oldAmmunition) {
            const oldGrants = oldAmmunition.system.skills.granted.map(g => g.id);
            const oldGranted = this.actor.items.filter(o => oldGrants.includes(o.system.abbrewId.uuid));
            oldGranted.forEach(o => promises.push(o.delete()));
          }
          if (newAmmunition) {
            const newGrants = newAmmunition.system.skills.granted;
            newGrants.map(n => fromUuid(n.sourceId));
            newGrantPromises = newGrants.map(n => fromUuid(n.sourceId));
          }
        }
      })

      const newGranted = await Promise.all(newGrantPromises) ?? [];
      promises.push(handleGrantedSkills(newGranted, this.actor, newAmmunition));
      await Promise.all(promises);
    }

    if (doesNestedFieldExist(changed, "system.isFavourited")) {
      if (this.actor) {
        if (changed.system.isFavourited) {
          const favourites = this.actor.system.favourites;
          const currentFavourites = favourites[this.type];
          const updateFavourites = [...currentFavourites, this._id];
          const update = { system: { favourites: favourites } };
          update.system.favourites[this.type] = updateFavourites;
          await this.actor.update(update);
        } else {
          const favourites = this.actor.system.favourites;
          const currentFavourites = favourites[this.type];
          const updateFavourites = currentFavourites.filter(f => f !== this._id);
          const update = { system: { favourites: favourites } };
          update.system.favourites[this.type] = updateFavourites;
          await this.actor.update(update);
        }
      }
    }

    return super._preUpdate(changed, options, userId);
  }

  async grantSkills() {
    const grantedSkillPromises = this.system.skills.granted.map(n => fromUuid(n.sourceId));
    const grantedSkills = await Promise.all(grantedSkillPromises);
    await handleGrantedSkills(grantedSkills, this.actor, this);
  }

  _onUpdate(changed, options, userId) {
    // console.log("CHANGE");
    super._onUpdate(changed, options, userId);
  }

  isWornEquipStateChangePossible() {
    const armourPoints = JSON.parse(this.system.armourPoints).map(ap => ap.value);
    const usedArmourPoints = this.actor.getActorWornArmour().flatMap(a => JSON.parse(a.system.armourPoints).map(ap => ap.value));
    const actorArmourPoints = this.actor.getActorAnatomy().parts;
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
    const actorHands = this.actor.getActorAnatomy().hands;
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
      case 'check': await this._onAcceptCheckAction(message.rolls, message.flags.data, messageId); break;
      case 'accept': await this._onAcceptEffectAction(message.rolls, message.flags.data, action); break;
      case 'damage': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'overpower': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'parry': await this._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
      case 'finisher': await this._onAcceptFinisherAction(message.rolls, message.flags.data, action, button.dataset.finisherType); break;
    }
  }

  static async _onAcceptCheckAction(rolls, data, messageId) {
    const message = game.messages.get(messageId);
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      ui.notifications.info("Please select a token to accept the effect.");
      return;
    }

    const actor = tokens[0].actor;

    const result = await acceptSkillCheck(actor, data.skillCheckRequest);

    const parsedResult = ({ name: result.actor.name, result: result.result, totalValue: result.totalValue, requiredValue: result.requiredValue, totalSuccesses: result.totalSuccesses, requiredSuccesses: result.requiredSuccesses, skillResult: result.skillResult, contestedResult: result.contestedResult })

    let templateData = message.flags.abbrew.messasgeData.templateData;

    templateData.skillCheck = templateData.skillCheck ? templateData.skillCheck : ({ attempts: [] });
    templateData.skillCheck.attempts = [...templateData.skillCheck.attempts, parsedResult];

    const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);
    // await updateMessageForCheck(messageId, html, templateData);
    emitForAll("system.abbrew", new SocketMessage(game.user.id, "updateMessageForCheck", { messageId, html, templateData }));
  }

  static async _onAcceptEffectAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      ui.notifications.info("Please select a token to accept the effect.");
      return;
    }

    const actor = tokens[0].actor;

    await actor.takeEffect(data, rolls, action);
  }

  static async _onAcceptDamageAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      ui.notifications.info("Please select a token to accept the effect.");
      return;
    }

    const actor = tokens[0].actor;

    if (action === "parry" && actor.doesActorHaveSkillDiscord(getParrySkillWithActions(0))) {
      ui.notifications.info("You are prevented from parrying.");
      return;
    }

    if (action === "parry") {
      const actions = this.getActionCostForAccept(data, action);
      if (actions > 0 && !await actor.canActorUseActions(getModifiedSkillActionCost(actor, getParrySkillWithActions(actions)))) {
        return;
      }
    }

    await actor.takeAttack(data, action);
  }

  static getActionCostForAccept(data, action) {
    return action === "parry" ? data.actionCost : 0;
  }

  static async _onAcceptFinisherAction(rolls, data, action, finisherType) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      return;
    }

    await tokens[0].actor.takeFinisher(rolls, data, finisherType);
  }

  async _preCreate(data, options, user) {
    if (game.user !== user) {
      return;
    }

    if (data.type === "skill") {
      if (this.actor && data.system.abbrewId) {
        const duplicateItem = this.actor.items.find(i => i.system.abbrewId.uuid === data.system.abbrewId.uuid);
        if (duplicateItem) {
          const uses = duplicateItem.system.action.uses;
          if (uses.hasUses && uses.asStacks) {
            await duplicateItem.update({ "system.action.uses.value": uses.value + data.system.action.uses.value });
            return false;
          }
        }
      }
    }

    return super._preCreate(data, options, user);
  }

  async _onCreate(data, options, userId) {
    if (game.user.id !== userId) {
      return;
    }

    if (data.type === "skill") {
      await this.actor?.acceptSkillDeck(data);
      if (this.actor && ((!this.system.isActivatable && this.system.action.duration.value > 0) || (this.system.skillType === "temporary"))) {
        await trackSkillDuration(this.actor, this);
      }
      if (this.actor && this.system.isActivatable && this.system.activateOnCreate) {
        await handleSkillActivate(this.actor, this, false);
      }
      if (this.actor && this.system.resource.fillCapacityOnCreate) {
        const id = this.system.resource.relatedResource ? JSON.parse(this.system.resource.relatedResource)[0].id : this._id;
        const capacity = this.system.resource.capacity ?? 0;
        await this.actor.handleResourceFill(id, capacity);
      }
      if (this.actor && data.effects.find(e => e.flags.abbrew.skill.stacks && data.system.action.uses.hasUses)) {
        const effect = this.effects.find(e => e.flags.abbrew.skill.stacks)
        const stacks = data.effects.find(e => e.flags.abbrew.skill.stacks).flags.abbrew.skill.stacks;
        const visible = stacks > 1;
        await effect.update({ "flags.statuscounter.visible": visible, "flags.statuscounter.value": stacks });
      }
    }
  }

  async _preDelete(options, userId) {
    if (this.actor) {
      const trackedEffects = [
        ...this.actor.effects.toObject().filter(e => e.flags.abbrew.skill?.trackDuration === this._id),
        ...this.actor.effects.toObject().filter(e => e.flags.abbrew.enhancement?.trackDuration === this._id)
      ];
      if (trackedEffects.length > 0) {
        this.actor.deleteEmbeddedDocuments("ActiveEffect", trackedEffects.map(e => e._id));
        return false;
      }

      if ((this.system.skills?.granted?.length ?? 0) > 0) {
        const grantedSkills = this.actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === this._id);
        this.actor.deleteEmbeddedDocuments("Item", grantedSkills.map(s => s._id));
      }

      // If we have one left then clear it out of archetype lists.
      if (this.actor.items.filter(i => i.type === "skill").filter(s => s.system.abbrewId.uuid === this.system.abbrewId.uuid).length === 1) {
        const archetypes = this.actor.items.filter(i => i.type === "archetype").filter(a => a.system.skillIds.includes(this.system.abbrewId.uuid));
        archetypes.forEach(async a => {
          const update = a.system.skillIds.filter(s => s !== this.system.abbrewId.uuid);
          await a.update({ "system.skillIds": update });
        });
      }

      if (this.type === "enhancement") {
        const promises = [];
        const grants = this.system.grantedIds;
        const granted = this.actor.items.filter(i => grants.includes(i._id));
        granted.forEach(o => promises.push(o.delete()));
        if (this.system.target.id && this.actor) {
          const enhancedItem = structuredClone(this.actor.items.find(i => i._id === this.system.target.id));
          if (enhancedItem) {
            applyEnhancement(this, this.actor, enhancedItem, true);
            await Item.implementation.updateDocuments([{ _id: this.system.target.id, ...enhancedItem }], { parent: this.actor });
          }
        }
        await Promise.all(promises);
      }
    }
  }

  _mergeRangedAttackAndAmmo(attackProfile, ammoAttackModifier) {
    attackProfile.critical = ammoAttackModifier.critical;
    attackProfile.lethal = ammoAttackModifier.lethal;
    attackProfile.finisherLimit = ammoAttackModifier.finisherLimit;
    const bonusPenetration = attackProfile.penetration;
    attackProfile.damage = ammoAttackModifier.damage;
    attackProfile.damage.forEach(d => d.penetration += bonusPenetration);

    return attackProfile;
  }

  _getActionCost(attackMode) {
    switch (attackMode) {
      case "overpower": return this.system.exertActionCost;
      case "ranged": return 1;
      case "aimedshot": return 2;
      default:
        return this.system.actionCost;
    }
  }

  async handleAttackDamageAction(actor, attackProfileId, attackMode) {
    let attackProfile = structuredClone(this.system.attackProfiles[attackProfileId]);
    let ammunitionId;

    if (["ranged", "aimedshot"].includes(attackMode)) {
      if (this.system.attackProfiles[attackProfileId].ammunition.value === 0) {
        ui.notifications.warn(`${this.name} needs to be reloaded.`)
        return;
      }

      ammunitionId = this.system.attackProfiles[attackProfileId].ammunition.id;
      const ammunition = this.actor.items.find(i => i._id === ammunitionId);
      if (ammunition) {
        const ammoAttackModifier = ammunition.system.attackModifier;
        attackProfile = this._mergeRangedAttackAndAmmo(attackProfile, ammoAttackModifier);
        const attackProfiles = this.system.attackProfiles;
        attackProfiles[attackProfileId].ammunition.value -= 1;
        await this.update({ "system.attackProfiles": attackProfiles });
      }
    }

    const actionCost = this._getActionCost(attackMode);
    const itemTriggerIds = [this._id, ammunitionId].filter(i => i);

    let combineForSkill = actor.items.filter(i => i.type === "skill").find(s => s._id === actor.system.combinedAttacks.combineFor);

    if (!combineForSkill) {
      const combineAttackSkills = actor.items.filter(i => i.type === "skill" && actor.system.queuedSkills.includes(i._id)).filter(s => s.system.action.modifiers.attackProfile.combineAttacks.isEnabled);
      if (combineAttackSkills.length > 0) {
        combineForSkill = combineAttackSkills[0];
        await actor.update({ "system.combinedAttacks.combineFor": combineForSkill._id });
      }
    }

    const combineSkill = combineForSkill ? ({
      name: combineForSkill.name,
      image: combineForSkill.img,
      id: combineForSkill._id,
      value: combineForSkill.system.action.modifiers.attackProfile.combineAttacks.value,
      actionCost: combineForSkill.system.action.actionCost,
      attackMode: combineForSkill.system.action.modifiers.attackProfile.attackMode,
      handsSupplied: combineForSkill.system.action.modifiers.attackProfile.handsSupplied,
      durationPrecision: combineForSkill.system.action.duration.precision,
      skillsGrantedOnAccept: combineForSkill.system.skills.grantedOnAccept
    }) : undefined;

    if (combineSkill) {
      const toCombine = combineSkill.value;
      const combined = actor.system.combinedAttacks.combined;
      if (actor.system.combinedAttacks.combined === 0 && !actor.system.combinedAttacks.base) {
        const base = { id: combineSkill.id, name: combineSkill.name, actionCost: combineSkill.actionCost, image: combineSkill.image, attackMode: combineSkill.attackMode, handsSupplied: combineSkill.handsSupplied, attackProfile: attackProfile };
        await actor.update({ "system.combinedAttacks.itemIds": itemTriggerIds, "system.combinedAttacks.combined": combined + 1, "system.combinedAttacks.base": base });
        return;
      }

      const combinedDamage = actor.system.combinedAttacks.additionalDamage;
      const fullItemIds = [...actor.system.combinedAttacks.itemIds, ...itemTriggerIds];
      const fullCombinedDamage = [...combinedDamage, ...attackProfile.damage];
      const totalCombined = combined + 1;
      if (totalCombined < toCombine) {
        await actor.update({ "system.combinedAttacks.combined": totalCombined, "system.combinedAttacks.additionalDamage": fullCombinedDamage })
      }

      let base = actor.system.combinedAttacks.base;
      base.attackProfile.damage = [...base.attackProfile.damage, ...fullCombinedDamage];
      let attackSkill = getAttackSkillWithActions(base.id, base.name, base.actionCost, base.image, base.attackProfile, base.attackMode, base.handsSupplied, [], actor._id, fullItemIds);
      attackSkill.system.action.attackProfile.finisherLimit = applyOperator(attackSkill.system.action.attackProfile.finisherLimit, combineForSkill.system.action.modifiers.attackProfile.finisherLimit.value, combineForSkill.system.action.modifiers.attackProfile.finisherLimit.operator, 0);
      attackSkill.system.action.attackProfile.critical = applyOperator(attackSkill.system.action.attackProfile.critical, combineForSkill.system.action.modifiers.attackProfile.critical.value, combineForSkill.system.action.modifiers.attackProfile.critical.operator, 5);
      attackSkill.system.action.attackProfile.lethal = applyOperator(attackSkill.system.action.attackProfile.lethal, combineForSkill.system.action.modifiers.attackProfile.lethal.value, combineForSkill.system.action.modifiers.attackProfile.lethal.operator, 0);

      if (combineSkill.durationPrecision === "0") {
        const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === combineSkill.id);
        await manualSkillExpiry(effect);
      }
      attackSkill.system.skills.grantedOnAccept = combineSkill.skillsGrantedOnAccept;

      await actor.update({ "system.combinedAttacks.combined": 0, "system.combinedAttacks.combineFor": null, "system.combinedAttacks.base": null, "system.combinedAttacks.additionalDamage": [] })
      await handleSkillActivate(actor, attackSkill, false);
      return;
    }

    const attackSkill = getAttackSkillWithActions(null, this.name, actionCost, this.img, attackProfile, attackMode, this.system.handsSupplied, [], actor._id, itemTriggerIds);

    await handleSkillActivate(actor, attackSkill);

    if (attackMode === "thrown") {
      await this.update({ "system.equipState": "dropped" });
    }
  }
}
