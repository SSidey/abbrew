import { doesNestedFieldExist, arrayDifference, getNumericParts, getSafeJson } from '../helpers/utils.mjs';
import { getAttackSkillWithActions } from '../helpers/fundamental-skills.mjs';

import { applyOperator } from '../helpers/operators.mjs';
import { handleSkillActivate } from '../helpers/skills/skill-activation.mjs';
import { trackSkillDuration } from '../helpers/skills/skill-duration.mjs';
import { manualSkillExpiry } from '../helpers/skills/skill-expiry.mjs';
import { handleGrantedSkills } from '../helpers/skills/skill-grants.mjs';
import { applyEnhancement } from '../helpers/enhancements/enhancement-application.mjs';
import { postNotificationToChat } from '../sheets/items/helpers/chat/notification.mjs';
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
      if (changed.system.equipState === 'worn' && ["armour", "equipment"].includes(this.type)) {
        if (!this.isWornEquipStateChangePossible()) {
          ui.notifications.info("You are already wearing too many items, try stowing some");
          this.actor.sheet.render();
          return false;
        } else {
          await this.grantSkills();
        }
      } else if (changed.system.equipState === "readied" && !this.isHeldEquipStateChangePossible(changed.system.equipState)) {
        ui.notifications.info("You are already holding too many items, try stowing some");
        this.actor.sheet.render();
        return false;
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
      await postNotificationToChat(this.actor, "Anatomy Dismembered", `${this.name} was dismembered`);
      foundry.utils.setProperty(changed, `system.equipState`, "dropped");
      await postNotificationToChat(this.actor, "Item Dropped", `${this.actor.name} dropped ${this.name}`);
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

    if (doesNestedFieldExist(changed, "system.isDismembered") && this.actor) {
      if (changed.system.isDismembered) {
        const weaponPromises = this.actor.items.filter(i => i.type === "weapon").filter(i => i.system.grantedBy === this._id).map(i => i.delete());
        const skillPromises = this.actor.items.filter(i => i.type === "skill").filter(i => i.system.grantedBy.item === this._id).map(i => i.delete());

        await Promise.all([...weaponPromises, ...skillPromises]);
      }
      else {
        await this.actor.acceptAnatomy(this);
      }
    }

    return super._preUpdate(changed, options, userId);
  }

  async grantSkills() {
    const grantedSkillPromises = this.system.skills.granted.map(n => fromUuid(n.sourceId));
    const grantedSkills = await Promise.all(grantedSkillPromises);
    await handleGrantedSkills(grantedSkills, this.actor, this);
  }

  async _onUpdate(changed, options, userId) {
    if (doesNestedFieldExist(changed, "system.senses") && this.actor) {
      await this.handleSenses();
    }
    if (doesNestedFieldExist(changed, "system.light") && this.actor) {
      await this.handleLight();
    }

    super._onUpdate(changed, options, userId);
  }

  async handleDeleteActiveEffect(effect) {
    if (this.type === "skill" && this.system.skillType === "temporary") {
      await this.delete();
    }
  }

  async handleLight() {
    const light = this.system.light;
    const update = { "system.light": light };

    if (this.actor) {
      await this.actor.handleLight();
    }
  }

  async handleSenses() {
    if (this.actor) {
      const senseSkills = this.actor.items
        .filter(i => i.type === "skill")
        .filter(s => s.system.senses.modifiesSenses)
        .map(s => s.system.senses);
      const update = senseSkills.reduce((update, senses) => {
        update.sight.enabled = true;

        // TODO: Use this for all modifications here
        update.sight = this._getVisionModeForUpdate(update.sight, senses.sight);

        update.detectionModes = senses.detectionModes.reduce((detectionModes, mode) => {
          const oldMode = detectionModes.find(m => m.id === mode.id);
          if (oldMode) {
            if (mode.range === null || (mode.range && oldMode.range < mode.range)) {
              oldMode.range = mode.range;
              oldMode.enabled = true;
            }
          } else {
            detectionModes.push({ ...mode, enabled: true });
          }

          return detectionModes;
        }, update.detectionModes);

        return update;
      }, { sight: { enabled: true, range: 0, angle: 360, visionMode: "none" }, detectionModes: [] });

      if (update.detectionModes.length === 0) {
        update.detectionModes.push({ id: "none", enabled: true, range: 0 });
      }

      if (!update.sight.visionMode) {
        update.sight.visionMode = "none";
      }

      this._setDefaultsForVisionMode(update);

      await this.actor.update({ "system.senses": update });
    }
  }

  _setDefaultsForVisionMode(update) {
    const visionMode = CONFIG.Canvas.visionModes[update.sight.visionMode];
    const defaults = visionMode.vision.defaults;
    const desiredKeys = ["color", "attenuation", "contrast", "saturation", "brightness"]
    const desiredKeyDefaults = {
      color: null,
      attenuation: 0,
      contrast: 0,
      saturation: 0,
      brightness: 0,
    }
    const configValues = Object.keys(defaults).reduce((result, key) => {
      if (desiredKeys.includes(key)) {
        result[key] = defaults[key] ?? desiredKeyDefaults[key];
      }

      return result;
    }, {});

    const fullSight = { ...update.sight, ...configValues };
    update.sight = fullSight;
  }

  _getVisionModeForUpdate(updateMode, senseMode) {
    if (this.actor?.statuses.has("blind")) {
      return { enabled: true, range: null, angle: 360, visionMode: "blindness" };
    }

    const updatePriority = this.visionModePriority[updateMode.visionMode] ?? "none";
    const sensePriority = this.visionModePriority[senseMode.visionMode] ?? "none";
    return sensePriority > updatePriority ? senseMode : updateMode;
  }

  visionModePriority = {
    "none": 0,
    "tremorsense": 1,
    "hearing": 2,
    "basic": 3,
    "lightAmplification": 4,
    "monochromatic": 5,
    "darkvision": 6,
    "blindness": 100,
  }

  isWornEquipStateChangePossible() {
    const equipPoints = this.system.equipPoints.required.parsed.map(ap => ap.value);
    const usedEquipPoints = this.actor.getActorWornItems().flatMap(a => a.system.equipPoints.required.parsed.map(ap => ap.value));
    const actorEquipPoints = this.actor.getActorAnatomy().parts;
    const availableEquipPoints = arrayDifference(actorEquipPoints, usedEquipPoints);
    if (!equipPoints.every(ap => availableEquipPoints.includes(ap))) {
      return false;
    }
    let requiredEquipPoints = availableEquipPoints.filter(ap => equipPoints.includes(ap));
    const allRequiredAvailable = equipPoints.reduce((result, a) => {
      if (requiredEquipPoints.length > 0 && requiredEquipPoints.includes(a)) {
        const index = requiredEquipPoints.indexOf(a);
        if (index > -1) { // only splice array when item is found
          requiredEquipPoints.splice(index, 1); // 2nd parameter means remove one item only
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
    const readiedHeldItemHands = this.actor.items.filter(a => a.system.equipState && a.system.equipState === "readied").filter(i => i._id !== this._id).filter(i => i.type !== "anatomy" || (i.system.isDismembered)).length;
    const equipStateHands = equipState === "readied" ? 1 : getNumericParts(equipState);
    const requiredHands = readiedHeldItemHands + equippedHeldItemHands + equipStateHands;
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

  async _preCreate(data, options, user) {
    if (game.user !== user) {
      return;
    }

    if ((await super._preCreate(data, options, user)) === false) return false;

    if (data.type === "skill") {
      if (this.actor && data.system.abbrewId) {
        const duplicateItem = this.actor.items.find(i => i.system.abbrewId.uuid === this.system.abbrewId.uuid);
        if (duplicateItem && duplicateItem.type === "skill") {
          const uses = duplicateItem.system.action.uses;
          if (uses.hasUses && uses.asStacks) {
            await duplicateItem.update({ "system.action.uses.value": uses.value + data.system.action.uses.value });
            return false;
          }
        }
      }
    }

    if (this.actor && (data.system.sources && data.system.sources.actor === "")) {
      this.updateSource({ "system.sources.actor": this.actor._id });
    }

    if (this.actor && data.type === "weapon" && data.system.equipType === "innate") {
      this.updateSource({ "system.equipState": "inactive" });
    }
  }

  async _onDelete(options, userId) {
    if (this.type === "skill") {
      await this.handleSenses();
      await this.handleLight();
    }
  }

  async _onCreate(data, options, userId) {
    if (game.user.id !== userId) {
      return;
    }

    if (data.type === "skill") {
      await this.handleSenses();
      await this.handleLight();
      await this.actor?.acceptSkillDeck(this);
      if (this.actor && ((!this.system.isActivatable && this.system.action.duration.value > 0) || (this.system.skillType === "temporary"))) {
        await trackSkillDuration(this.actor, this);
      }
      if (this.actor && this.system.isActivatable && this.system.activateOnCreate) {
        await handleSkillActivate(this.actor, this, false);
      }
      if (this.actor && this.system.resource.fillCapacityOnCreate) {
        const id = this.system.resource.relatedResource ? JSON.parse(this.system.resource.relatedResource)[0].id : this.system.abbrewId.uuid;
        const capacity = this.system.resource.capacity ?? 0;
        await this.actor.handleResourceFill(id, capacity);
      }
      if (this.actor && data.effects.find(e => e.flags.abbrew?.skill?.stacks && data.system.action.uses.hasUses)) {
        const effect = this.effects.find(e => e.flags.abbrew.skill.stacks)
        const stacks = data.effects.find(e => e.flags.abbrew.skill.stacks).flags.abbrew.skill.stacks;
        const visible = stacks > 1;
        await effect.update({ "flags.statuscounter.visible": visible, "flags.statuscounter.value": stacks });
      }
      if (this.actor && data.system.innateConcepts.raw.length > 0) {
        const updateConcepts = [...this.actor.system.concepts.innate.value, ...getSafeJson(data.system.innateConcepts.raw)];
        await this.actor.update({ "system.concepts.innate.raw": JSON.stringify(updateConcepts) });
      }
    } else if (data.type === "anatomy") {
      await this.actor?.acceptAnatomy(this);
    }
  }

  async _preDelete(options, userId) {
    if (this.actor) {
      if (this.system.storeIn) {
        const container = this.actor.items.find(i => i._id === this.system.storeIn);
        if (container) {
          const containerStoredItems = container.system.storage.storedItems.filter(i => i !== this._id);
          await container.update({ "system.storage.storedItems": containerStoredItems });
        }
      }

      const trackedEffects = [
        ...this.actor.effects.toObject().filter(e => e.flags.abbrew).filter(e => e.flags.abbrew.skill?.trackDuration === this._id),
        ...this.actor.effects.toObject().filter(e => e.flags.abbrew).filter(e => e.flags.abbrew.enhancement?.trackDuration === this._id)
      ];
      if (trackedEffects.length > 0) {
        this.actor.deleteEmbeddedDocuments("ActiveEffect", trackedEffects.map(e => e._id));
        return false;
      }

      if ((this.system.skills?.granted?.length ?? 0) > 0) {
        const grantedSkills = this.actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === this._id);
        await this.actor.deleteEmbeddedDocuments("Item", grantedSkills.map(s => s._id));
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

      if (this.type === "anatomy" && this.actor && this.system.naturalWeapons.length > 0) {
        const weaponPromises = this.actor.items.filter(i => i.type === "weapon").filter(i => i.system.grantedBy === this._id).map(i => i.delete());
        const skillPromises = this.actor.items.filter(i => i.type === "skill").filter(i => i.system.grantedBy.item === this._id).map(i => i.delete());

        await Promise.all([...weaponPromises, ...skillPromises]);
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

  // TODO: Traits from weapon through to attack
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
      traits: combineForSkill.system.traits.raw,
      image: combineForSkill.img,
      id: combineForSkill._id,
      value: combineForSkill.system.action.modifiers.attackProfile.combineAttacks.value,
      actionCost: combineForSkill.system.action.actionCost,
      attackMode: combineForSkill.system.action.modifiers.attackProfile.attackMode,
      handsSupplied: combineForSkill.system.action.modifiers.attackProfile.handsSupplied,
      durationPrecision: combineForSkill.system.action.duration.precision,
      skillsGrantedOnAccept: combineForSkill.system.skills.grantedOnAccept,
      skillsGrantedOnExpiry: combineForSkill.system.skills.grantedOnExpiry
    }) : undefined;

    if (combineSkill) {
      const toCombine = combineSkill.value;
      const combined = actor.system.combinedAttacks.combined;
      if (actor.system.combinedAttacks.combined === 0 && !actor.system.combinedAttacks.base) {
        const base = { id: combineSkill.id, name: combineSkill.name, traits: combineSkill.traits, actionCost: combineSkill.actionCost, image: combineSkill.image, attackMode: combineSkill.attackMode, handsSupplied: combineSkill.handsSupplied, attackProfile: attackProfile };
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
      let attackSkill = getAttackSkillWithActions(base.id, base.name, base.traits, base.actionCost, base.image, base.attackProfile, base.attackMode, base.handsSupplied, [], actor._id, fullItemIds);
      attackSkill.system.action.attackProfile.finisherLimit = applyOperator(attackSkill.system.action.attackProfile.finisherLimit, combineForSkill.system.action.modifiers.attackProfile.finisherLimit.value, combineForSkill.system.action.modifiers.attackProfile.finisherLimit.operator, 0);
      attackSkill.system.action.attackProfile.critical = applyOperator(attackSkill.system.action.attackProfile.critical, combineForSkill.system.action.modifiers.attackProfile.critical.value, combineForSkill.system.action.modifiers.attackProfile.critical.operator, 5);
      attackSkill.system.action.attackProfile.lethal = applyOperator(attackSkill.system.action.attackProfile.lethal, combineForSkill.system.action.modifiers.attackProfile.lethal.value, combineForSkill.system.action.modifiers.attackProfile.lethal.operator, 0);

      if (combineSkill.durationPrecision === "0") {
        const effect = actor.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === combineSkill.id);
        await manualSkillExpiry(actor, combineSkill, effect);
      }
      attackSkill.system.skills.grantedOnAccept = combineSkill.skillsGrantedOnAccept;
      attackSkill.system.skills.grantedOnExpiry = combineSkill.skillsGrantedOnExpiry;

      await actor.update({ "system.combinedAttacks.combined": 0, "system.combinedAttacks.combineFor": null, "system.combinedAttacks.base": null, "system.combinedAttacks.additionalDamage": [] })
      await handleSkillActivate(actor, attackSkill, false);
      return;
    }

    const attackSkill = getAttackSkillWithActions(null, this.name, this.system.traits.raw, actionCost, this.img, attackProfile, attackMode, this.system.handsSupplied, [], actor._id, itemTriggerIds);

    await handleSkillActivate(actor, attackSkill);

    if (attackMode === "thrown") {
      await this.update({ "system.equipState": "dropped" });
    }
  }
}
