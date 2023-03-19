import { AbbrewAttackProfile } from "./attackprofile.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AbbrewActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
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

    // Prepare
    this._prepareAbilityModifiers(systemData);
    this._prepareAnatomy(systemData);
    this._prepareMovement(systemData);
    this._prepareDefenses(systemData);
    this._prepareArmour(systemData);
    this._preparePower(systemData);
    this._prepareActions(systemData);
    this._prepareFeatures(systemData);
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

  _prepareDefenses(systemData) {
    const defenses = Object.fromEntries(Object.entries(this.itemTypes.defense).map(([k, v]) => [v.name, v.system]));
    systemData.defenses = { ...systemData.defenses, ...defenses };
  }

  _prepareFeatures(systemData) {
    const weapons = this._getWeapons();
    const attacks = weapons.map(w => this._prepareWeaponAttack(w, systemData));
    systemData.attacks = attacks.flat();
  }

  _getWeapons() {
    return this._getItemWeapons().map(i => ({ "name": i.name, "img": i.img, "weaponId": i._id, "weight": i.system.weight, "concepts": i.system.concepts, "material": i.system.material, ...i.system.weapon }));
  }

  _getItemWeapons() {
    return this.itemTypes.item.filter(i => i.system.isWeapon);
  }

  _prepareWeaponAttack(weapon) {
    const results = weapon.weaponProfiles.split(',').map((wp, index) => {
      const profileParts = wp.split('-');
      const damageType = profileParts[0];
      const attackType = profileParts[1];
      // Handle Penalty here, check requirements are met.
      const requirements = JSON.parse(weapon.requirements);
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
        "@system.abilities.strength.mod",
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
      isEquipped: weapon.isEquipped,
      profiles: results
    }
  };

  async equipWeapon(id, equip) {
    const updates = [];
    updates.push({ _id: id, system: { weapon: { isEquipped: equip } } });
    await this.updateEmbeddedDocuments("Item", updates);
  };

  _prepareAbilityModifiers(systemData) {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the modifier using abbrew rules.
      ability.mod = Math.floor(ability.value / 2);
    }
  }

  _prepareMovement(systemData) {
    const base = systemData.abilities.agility.mod;
    const limbs = systemData.anatomy.filter(a => a.system.tagsArray.includes('primary')).length;
    systemData.movement.base = base * limbs;
  }

  _prepareArmour(systemData) {
    const constitutionModifier = systemData.abilities['constitution'].mod;
    let naturalBonuses = this.itemTypes.anatomy.map(a => a.system.armourBonus);
    const naturalValue = foundry.utils.getProperty(this, this.system.naturalArmour);
    naturalBonuses = naturalBonuses.map(b => { if (b === 'natural') { b = naturalValue; } return b; });
    const initialValue = 0;
    const fullArmourMax = naturalBonuses.map(b => +b).reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
    systemData.armour.max = fullArmourMax;

    const defensesArray = systemData.armour.defenses.replace(' ', '').split(',');
    systemData.armour.defensesArray = defensesArray;
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
    return Object.values(systemData.abilities).reduce(function (sum, ability) {
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
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
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

  async acceptDamage(damageRolls, attackData) {
    // Gets targets
    // [...(game.user.targets?.values() ?? [])].filter(t => !!t.actor)
    const actor = this;
    const systemData = this.system;
    let damage = damageRolls[0]._total;
    let damageRoll = damageRolls[0];
    // const modRoll = damageRolls[0];
    // modRoll.terms[0].rolls[0].terms[0].results[0] = {active: true, result: 1};
    // const newRoll = await CONFIG.Dice.AbbrewRoll.fromRoll(modRoll);
    let currentArmour = systemData.armour.value;
    let newArmour = currentArmour;

    const damageType = attackData.attackProfile.weapon.damageType;

    if (!systemData.defenses[damageType]) {
      const untypedCritical = await this.getCriticalDamage(damageRoll)
      await this.handleDamage(systemData, damage, "untyped", untypedCritical);
    }

    const damageTypeDefense = systemData.defenses[damageType];

    if (damageTypeDefense.absorb) {
      await this.absorbDamage(actor, systemData, damage);
      return;
    }
    if (damageTypeDefense.immune) {
      return;
    }

    if (damageTypeDefense.deflect && damageTypeDefense.conduct) {
      // NOOP
    }
    else if (damageTypeDefense.deflect) {
      damage = await this.deflectDamage(damageRoll);
    }
    else if (damageTypeDefense.conduct) {
      damage = await this.conductDamage(damageRoll);
    }

    if (damage <= 0) {
      return;
    }

    // Handle Resistance
    // Handle Amplification

    let criticalDamage = 0;
    if (damageTypeDefense.vulnerable && !damageTypeDefense.negate) {
      criticalDamage = 1;
    } else if (damageTypeDefense.negate && !damageTypeDefense.vulnerable) {
      criticalDamage = 0;
    } else {
      criticalDamage = await this.getCriticalDamage(damageRoll);
    }

    damage = damage -= damageTypeDefense.block;

    if (systemData.armour.defensesArray.includes(damageType)) {
      newArmour = currentArmour - damage;
      if (newArmour < 0) {
        damage = Math.abs(newArmour);
        newArmour = 0;
      }
    }

    const updates = await this.handleDamage(systemData, damage, damageType, criticalDamage, attackData.attackProfile);
    updates["system.armour.value"] = newArmour;

    await actor.update(updates);
  }

  async absorbDamage(actor, systemData, damage) {
    let currentBlood = systemData.blood.value;
    currentBlood = Math.min(currentBlood + damage, systemData.blood.fullMax);
    const maxBlood = Math.max(currentBlood, systemData.blood.max);
    await actor.update({ "system.blood.value": currentBlood, "system.blood.max": maxBlood });
  }

  async deflectDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    return damageRoll.total - diceResults;
  }

  async conductDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    const totalDice = damageRoll.terms[0].rolls[0].terms[0].results.length;
    const maximiseDifference = (totalDice * 10) - diceResults;
    return damageRoll.total + maximiseDifference;
  }

  async getCriticalDamage(damageRoll) {
    const criticalChecks = damageRoll.terms[0].rolls[0].terms[0].results.filter(r => r.result == 10).length;
    return criticalChecks;
  }

  async handleDamage(systemData, damage, damageType, criticalDamage, attackProfile) {

    if (damageType === "heat") {
      return await this.handleHeat(systemData, damage, criticalDamage, attackProfile);
    }

    if (["crushing", "slashing", "piercing", "untyped"].includes(damageType)) {
      return await this.handlePhysical(systemData, damage, criticalDamage, attackProfile);
    }
  }

  async handleHeat(systemData, damage, criticalDamage, attackProfile) {
    const healingWounds = systemData.wounds.healing += damage;
    const thermalState = systemData.state += attackProfile.thermalChange;
    // Can we add conditions automatically? would be good to add burned here...
    const updates = { "system.wounds.healing": damage };
    if (criticalDamage) {
      let currentBlood = systemData.blood.value -= damage;
      let maxBlood = systemData.blood.max -= damage;
      updates["system.blood.current"] = currentBlood;
      updates["system.blood.max"] = maxBlood;
    }
    return updates;
  }

  async handlePhysical(systemData, damage, criticalDamage, attackProfile) {
    const updates = {};

    if (systemData.canBleed) {
      let activeWounds = systemData.wounds.active += damage;
      updates["system.wounds.active"] = activeWounds;
    }

    if (systemData.suffersPain) {
      const pain = systemData.pain += damage;
      updates["system.pain"] = pain;
    }

    return updates;
  }

}