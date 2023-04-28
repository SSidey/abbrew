import { AbbrewAttackProfile } from "./attackprofile.mjs";
import { prepareRules, applyRule } from "../rules/rules.mjs";
import { writeToPath } from "../helpers/write-to-path.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AbbrewActor extends Actor {
  ruleOverrides;

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    console.log('before');
    super.prepareData();
    console.log('between');
    console.log('after');
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    console.log('is it before?');
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.abbrew || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    // super.applyActiveEffects()
    // Prepare
    this._processRules(this);
    this._prepareAbilityModifiers(systemData);
    this._prepareAnatomy(systemData);
    this._prepareMovement(systemData);
    this._prepareDefences(systemData);
    this._prepareArmour(systemData);
    this._preparePower(systemData);
    this._prepareActions(systemData);
    this._prepareFeatures(systemData);
  }

  async _updateObject(event, formData) {
    console.log('here');
    // call super with revert to rawActor merged with actual changes?
    await super._updateObject(event, formData);
  }

  _onUpdate(data, options, userId) {
    console.log('here2');
    // call super with revert to rawActor merged with actual changes?
    super._onUpdate(data, options, userId);

  }

  async _preUpdate(changed, options, user) {
    console.log('pre-update');

    if (this.ruleOverrides) {
      let flatChanges = flattenObject(changed, 1);
      let flatChangesArray = Object.keys(flatChanges).map((key) => [key, flatChanges[key]]);
      const overrideKeys = Object.keys(this.ruleOverrides);
      flatChangesArray.forEach(c => {
        if (overrideKeys.includes(c[0]) && this.ruleOverrides[c[0]].overrideValue == c[1]) {
          const path = c[0];
          let keys = path.split('.');
          let prop = keys.pop();
          let parent = keys.reduce((obj, key) => obj[key], changed);
          delete parent[prop];
        }
      })
    }

    super._preUpdate(changed, options, user);
  }


  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    console.log(`Update Object: ${embeddedName}`);
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  _processRules(actorData) {
    this.prepareItems(this);
    this.resetItems(this);
    prepareRules(this);
    if (actorData.system.rules.length == 0) {
      this.ruleOverrides = [];
      return;
    }

    let changes = [];
    this.ruleOverrides = [];
    actorData.ruleOverrides = [];
    actorData.system.rules
      .filter(
        r => r.valid
      ).sort((r1, r2) => r2.priority - r1.priority)
      .forEach(r => {
        const ruleChange = applyRule(r, actorData);
        if (Object.keys(ruleChange).length == 0) {
          return;
        }
        changes[ruleChange.target] = {
          overrideValue: ruleChange.value,
          sourceValue: ruleChange.sourceValue,
          targetType: ruleChange.targetType,
          targetElement: ruleChange.targetElement
        };
        actorData.ruleOverrides[ruleChange.target] = changes[ruleChange.target];
      });

    this.ruleOverrides = changes;
  }

  /**
   * Reset item overridden fields to pre-rule values.
   * @param {AbbrewActor} actorData    
   */
  prepareItems(actorData) {
    actorData.items.filter(i => i.system.rules.length > 0).forEach(i => {
      i.system.rules.forEach(r => {
        if (r.source.actor && r.source.item) {
          return;
        }
        r.source.actor = this.id;
        r.source.item = i.id;
        r.source.uuid = `Actor.${this.id}.Item.${i.id}`;
      });
      const item = actorData.items.get(i.id);
      writeToPath(item, 'system.rules', i.system.rules)
    });
  }

  resetItems(actorData) {
    if (!actorData.ruleOverrides) {
      return;
    }
    for (const [key, override] of Object.entries(actorData.ruleOverrides)) {
      if (override.targetType == "Item") {
        const item = actorData.items.get(override.targetElement);
        const path = key;
        let keys = path.split('.');
        let itemValue = keys.reduce((obj, key) => obj[key], item);
        if (itemValue == override.overrideValue) {
          writeToPath(item, path, override.sourceValue);
        }
      }
    }
  }

  async _updateDocuments(documentClass, { updates, options, pack }, user) {
    console.log('update-documents');
    super._updateDocuments(documentClass, { updates, options, pack }, user);
  }

  _prepareAnatomy(systemData) {
    this.itemTypes.anatomy.forEach(
      a => {
        const tags = a.system.tags.replace(' ', '').split(',');
        a.system.tagsArray = tags;
        const armourPoints = a.system.armourPoints.replace(' ', '').split(',');
        a.system.armourPointsArray = armourPoints;
      }
    );
    systemData.anatomy = this.itemTypes.anatomy;
  }

  _prepareDefences(systemData) {
    const defences = Object.fromEntries(Object.entries(this.itemTypes.defence).map(([k, v]) => [v.name, v.system]));
    systemData.defences = { ...systemData.defences, ...defences };
  }

  _prepareFeatures(systemData) {
    const weapons = this._getWeapons();
    const attacks = weapons.map(w => this._prepareWeaponAttack(w, systemData));
    systemData.attacks = attacks.flat();
  }

  _getWeapons() {
    return this._getItemWeapons().map(i => ({ "name": i.name, "img": i.img, "weaponId": i._id, "weight": i.system.weight, "concepts": i.system.concepts, "material": i.system.material, "equipState": i.system.equipState, ...i.system.weapon }));
  }

  _getItemWeapons() {
    return this.itemTypes.item.filter(i => i.system.isWeapon);
  }

  _prepareWeaponAttack(weapon) {
    const results = weapon.weaponProfiles.split(',').map((wp, index) => {
      const profileParts = wp.split('-');
      const damageType = profileParts[0].replace(' ', '');
      const attackType = profileParts[1];
      // Handle Penalty here, check requirements are met.
      const requirements = { strength: { value: 5 } }; // JSON.parse(weapon.requirements);
      let damageBase = 0;
      switch (profileParts[1]) {
        case "arc":
          damageBase = + weapon.material.structure + (requirements.strength.value * (1 + weapon.minimumEffectiveReach)) + (weapon.material.tier * 5);
          break;
        case "thrust":
          damageBase = + weapon.material.structure + (weapon.material.tier * 5);
          weapon.penetration = weapon.material.tier * 5;
          break;
        default:
          return;
      }

      return new AbbrewAttackProfile(
        index,
        "@system.statistics.strength.mod",
        damageBase,
        true,
        {
          requirements: weapon.requirements,
          reach: weapon.reach,
          minimumEffectiveReach: weapon.minimumEffectiveReach,
          focused: weapon.focused,
          penetration: weapon.penetration,
          traits: weapon.traits,
          handsSupplied: weapon.handsSupplied,
          handsRequired: weapon.handsRequired,
          traitsArray: weapon.traitsArray,
          criticalThreshold: weapon.criticalThreshold,
          damageType: damageType,
          attackType: attackType
        },
        false,
        {}
      );
    });

    return {
      id: weapon.weaponId,
      name: weapon.name,
      image: weapon.img || "icons/svg/sword.svg",
      isWeapon: true,
      isEquipped: weapon.equipState.wielded,
      profiles: results
    }
  };

  async equipWeapon(id, equip) {
    const updates = [];
    updates.push({ _id: id, system: { equipState: { wielded: equip } } });
    await this.updateEmbeddedDocuments("Item", updates);
  };

  async equipArmour(id, equip) {
    const updates = [];
    updates.push({ _id: id, system: { equipState: { worn: equip } } });
    await this.updateEmbeddedDocuments("Item", updates);
  }

  _prepareAbilityModifiers(systemData) {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.statistics)) {
      // Calculate the modifier using abbrew rules.
      ability.mod = Math.floor(ability.value / 2);
    }
  }

  _prepareMovement(systemData) {
    const base = systemData.statistics.agility.mod;
    const limbs = systemData.anatomy.filter(a => a.system.tagsArray.includes('primary')).length;
    systemData.movement.base = base * limbs;
  }

  _prepareArmour(systemData) {
    systemData.armours = this.itemTypes.item.filter(a => a.system.isArmour);
    let naturalBonuses = this.itemTypes.anatomy.map(a => a.system.armourBonus);
    const naturalValue = foundry.utils.getProperty(this, this.system.naturalArmour);
    naturalBonuses = naturalBonuses.map(b => { if (b === 'natural') { b = naturalValue; } return b; });
    const initialValue = 0;
    const fullArmourMax = naturalBonuses.map(b => +b).reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
    systemData.armour.max = fullArmourMax;

    const defencesArray = systemData.armour.defences.replaceAll(' ', '').split(',');
    systemData.armour.defencesArray = defencesArray;
  }

  _preparePower(systemData) {
    const result = this._sumValues(systemData);
    systemData.attributes.power.value = result;
  }

  _prepareActions(systemData) {
    const actions = 3;
    systemData.actions = { current: actions, maximum: actions };
  }

  // TODO: Generalise or change
  _sumValues(systemData) {
    return Object.values(systemData.statistics).reduce(function (sum, ability) {
      return sum += ability.value;
    }, 0);
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = (systemData.cr * systemData.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.statistics) {
      for (let [k, v] of Object.entries(data.statistics)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(html) {
    html.on('click', '.damage-application button', this.onDamageAccept.bind(this));
  }

  /* async */static onDamageAccept(event) {
    console.log(event);
    // Extract card data
    const button = event.currentTarget;
    const card = button.closest(".chat-message");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    /* await */ tokens[0].actor.acceptDamage(message.rolls, message.flags.data);
  }


  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  dot(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
  }

  normalize(vector) {
    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y); //calculating length
    vector.x = vector.x / length; //assigning new value to x (dividing x by length of the vector)
    vector.y = vector.y / length; //assigning new value to y
    return vector;
  };

  convertFoundryAngle(angle) {
    const angleDiff = angle - 270;
    return angleDiff > 0 ? 360 - angleDiff : Math.abs(angleDiff);
  }

  // Directly Down is 0, Left is 90, Up 180, Right 270
  /* async */ acceptDamage(damageRolls, attackData) {
    let actor = this;
    let systemData = this.system;
    let damage = damageRolls[0]._total;
    let damageRoll = damageRolls[0];
    let damagePenetrate = attackData.attackProfile.weapon.penetration;
    // const modRoll = damageRolls[0];
    // modRoll.terms[0].rolls[0].terms[0].results[0] = {active: true, result: 1};
    // const newRoll = await CONFIG.Dice.AbbrewRoll.fromRoll(modRoll);
    var placeables = /* await */ game.canvas.tokens.placeables;
    var token = /* await */ placeables.filter(p => p.document.actorId == this.id && p.controlled)[0];
    var nonAllyTokens = /* await */ placeables.filter(p => p.document.disposition != token.document.disposition);
    var center = token.center;

    var tokenAngle = this.toRadians(this.convertFoundryAngle(token.document.rotation));
    var nonAllyAngle = this.toRadians(this.convertFoundryAngle(nonAllyTokens[0].document.rotation));

    // TODO: Get normal to this, so we can determine left vs right
    var tokenVector = { x: Math.cos(tokenAngle), y: Math.sin(tokenAngle) };
    var nonAllyVector = { x: Math.cos(nonAllyAngle), y: Math.sin(nonAllyAngle) };
    var vectorToFace = { x: token.center.x - nonAllyTokens[0].center.x, y: nonAllyTokens[0].center.y - token.center.y };

    tokenVector = this.normalize(tokenVector);
    tokenVector = Object.values(tokenVector);
    nonAllyVector = this.normalize(nonAllyVector);
    nonAllyVector = Object.values(nonAllyVector);
    vectorToFace = this.normalize(vectorToFace);
    vectorToFace = Object.values(vectorToFace);
    var isNonAllyFacing = vectorToFace.map((x, i) => vectorToFace[i] * nonAllyVector[i]).reduce((m, n) => m + n);
    var matching = tokenVector.map((x, i) => tokenVector[i] * nonAllyVector[i]).reduce((m, n) => m + n);
    console.log('enemy facing: ' + Math.round(isNonAllyFacing * 100000) / 100000);
    console.log('which side: ' + Math.round(matching * 100000) / 100000);
    // Matching: Positive if behind the target?
    // Matching: 0 if side
    // Matching: Negative if front
    // more sense to reverse and go from the attacker?
    // Then reverse and check which side

    let currentArmour = systemData.armour.value;
    let newArmour = currentArmour;

    const damageType = attackData.attackProfile.weapon.damageType;

    if (!systemData.defences[damageType]) {
      const untypedCritical = this.getCriticalExplosions(damageRoll, 0, 0)
      this.handleDamage(systemData, damage, "untyped", untypedCritical);
    }

    const damageTypeDefence = systemData.defences[damageType];

    if (damageTypeDefence.absorb) {
      this.absorbDamage(actor, systemData, damage);
      return;
    }
    if (damageTypeDefence.immune) {
      return;
    }

    if (damageTypeDefence.deflect && damageTypeDefence.conduct) {
      // NOOP
    }
    else if (damageTypeDefence.deflect) {
      damage = this.deflectDamage(damageRoll);
    }
    else if (damageTypeDefence.conduct) {
      damage = this.conductDamage(damageRoll);
    }

    // TODO: Handle Resistance
    // TODO: Handle Amplification

    let criticalExplosions = this.getCriticalExplosions(damageRoll, damageTypeDefence.vulnerable, damageTypeDefence.negate);

    if (systemData.armour.defencesArray.includes(damageType)) {
      const penetrate = damageTypeDefence.penetrate + damagePenetrate;

      const adjustedBlock = Math.max(0, damageTypeDefence.block - penetrate);
      const adjustedPenetration = Math.max(0, penetrate - damageTypeDefence.block)

      const fullDamage = damage;
      let adjustedArmour = currentArmour + adjustedBlock - adjustedPenetration;
      adjustedArmour = adjustedArmour < 0 ? 0 : adjustedArmour;
      const damageThroughArmour = adjustedArmour - damage;
      if (damageThroughArmour < 0) {
        damage = Math.min(Math.abs(damageThroughArmour), fullDamage);
      } else {
        damage = 0;
      }

      const damageThroughBlock = adjustedBlock - fullDamage;
      const adjustedDamageThroughBlock = damageThroughBlock > 0 ? 0 : damageThroughBlock;
      newArmour = Math.max(0, currentArmour - Math.abs(adjustedDamageThroughBlock));
    }

    let updates = {};
    if (damage > 0) {
      updates = this.handleDamage(systemData, damage, damageType, criticalExplosions, attackData.attackProfile);
    }

    updates["system.armour.value"] = newArmour;

    actor.update(updates);
  }

  absorbDamage(actor, systemData, damage) {
    let currentBlood = systemData.blood.value;
    currentBlood = Math.min(currentBlood + damage, systemData.blood.fullMax);
    const maxBlood = Math.max(currentBlood, systemData.blood.max);
    actor.update({ "system.blood.value": currentBlood, "system.blood.max": maxBlood });
  }

  deflectDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    return damageRoll.total - diceResults;
  }

  conductDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    const totalDice = damageRoll.terms[0].rolls[0].terms[0].results.length;
    const maximiseDifference = (totalDice * 10) - diceResults;
    return damageRoll.total + maximiseDifference;
  }

  getCriticalExplosions(damageRoll, vulnerable, negate) {
    const criticalThreshold = +damageRoll.terms[0].rolls[0].terms[0].modifiers[0].split('=')[1];
    const criticalChecks = damageRoll.terms[0].rolls[0].terms[0].results.filter(r => r.result >= criticalThreshold).length;
    return criticalChecks - negate + vulnerable;
  }

  handleDamage(systemData, damage, damageType, criticalExplosions, attackProfile) {

    if (damageType === "heat") {
      return this.handleHeat(systemData, damage, criticalExplosions, attackProfile);
    }

    if (["crushing", "slashing", "piercing", "untyped"].includes(damageType)) {
      return this.handlePhysical(systemData, damage, criticalExplosions, attackProfile);
    }
  }

  handleHeat(systemData, damage, criticalExplosions, attackProfile) {
    const healingWounds = systemData.wounds.healing += damage;
    const thermalState = systemData.state += attackProfile.thermalChange;
    // Can we add conditions automatically? would be good to add burned here...
    const updates = { "system.wounds.healing": damage };
    if (criticalExplosions) {
      let currentBlood = systemData.blood.value -= damage;
      let maxBlood = systemData.blood.max -= damage;
      updates["system.blood.current"] = currentBlood;
      updates["system.blood.max"] = maxBlood;
    }
    return updates;
  }

  handlePhysical(systemData, damage, criticalExplosions, attackProfile) {
    const updates = {};

    if (systemData.canBleed) {
      let activeWounds = systemData.wounds.active += damage;
      updates["system.wounds.active"] = activeWounds;
    }

    if (systemData.suffersPain) {
      const pain = systemData.pain += damage;
      updates["system.pain"] = pain;
    }

    if (criticalExplosions) {
      switch (attackProfile.weapon.damageType) {
        case "crushing":
          this.handleCrushingCritical(updates, damage, criticalExplosions);
          break;
        case "slashing":
          this.handleSlashingCritical(updates, damage, criticalExplosions);
          break;
        case "piercing":
          this.handlePiercingCritical(updates, damage, criticalExplosions);
          break;
        default:
          break;
      }
    }

    return updates;
  }

  handleCrushingCritical(updates, damage, _) {
    updates["system.conditions.sundered"] = damage;
  }

  handleSlashingCritical(updates, damage, _) {
    updates["system.wounds.active"] += damage;
  }

  handlePiercingCritical(updates, _, criticalExplosions) {
    updates["system.conditions.gushingWounds"] = criticalExplosions;
  }
}