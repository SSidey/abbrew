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
    this._prepareArmour(systemData);
    this._preparePower(systemData);
    this._prepareActions(systemData);
    this._prepareAbilities(systemData);
  }

  _prepareAnatomy(systemData) {
    this.itemTypes.anatomy.forEach(
      a => {
        const tags = a.system.tags.replace(' ', '').split(',');
        a.system.tagsArray = tags;
      }
    );
    systemData.anatomy = this.itemTypes.anatomy;
  }

  _prepareAbilities(systemData) {
    const weapons = this.itemTypes.item.filter(i => i.system.isWeapon).map(i => ({ "weight": i.system.weight, "concepts": i.system.concepts, "material": i.system.material, ...i.system.weapon }));
    // TODO: create weapon profile here and add back to systemData, use that to create new items of the Ability Type as Active
    const attacks = weapons.map(w => this._prepareWeaponAttack(w, systemData));
    systemData.features = attacks;
  }

  _prepareWeaponAttack(weapon) {
    const results = weapon.weaponProfiles.split(',').map(wp => {
      const profileParts = wp.split('-');
      const damageType = profileParts[0];
      const attackType = profileParts[1];
      // Handle Penalty here, check requirements are met.
      const requirements = JSON.parse(weapon.requirements);
      let damageBase = 0;
      switch (profileParts[1]) {
        case "arc":
          damageBase = weapon.material.structure + (requirements.strength.value * (1 + weapon.minimumEffectiveReach)) + (weapon.material.tier * 5);
          break;
        case "thrust":
          damageBase = weapon.material.structure + (weapon.material.tier * 5);
          weapon.penetration = weapon.material.tier * 5;
          break;
        default:
          return;
      }

      return {
        abilityModifier: "@system.abilities.strength.mod",
        damageBase: damageBase,
        isWeapon: true,
        weapon: {
          requirements: weapon.requirements,
          reach: weapon.reach,
          minimumEffectiveReach: weapon.minimumEffectiveReach,
          focused: weapon.focused,
          penetration: weapon.penetration,
          traits: weapon.traits,
          handsSupplied: weapon.handsSupplied,
          handsRequired: weapon.handsRequired,
          traitsArray: weapon.traitsArray,
        },
        isMagic: false,
        magic: {
          mentalRange: 0
        },
        damageType: damageType,
        attackType: attackType
      };
    });

    return results;
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
    if (systemData.armour.max < constitutionModifier) {
      systemData.armour.max = constitutionModifier;
    }
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

}