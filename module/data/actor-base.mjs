import { applyOperator, getOrderForOperator } from "../helpers/operators.mjs";
import { compareModifierIndices, getSafeJson } from "../helpers/utils.mjs";

export default class AbbrewActorBase extends foundry.abstract.TypeDataModel {

  get traitsData() {
    return this.traits !== "" ? JSON.parse(this.traits) : [];
  }

  get heldArmourGuard() {
    return this.parent.getActorHeldItems().filter(i => i.type === 'armour').reduce((result, a) => result += a.system.defense.guard, 0);
  }

  get anatomy() {
    return this._prepareAnatomy();
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const blankString = { required: true, blank: true }
    const schema = {};

    schema.traits = new fields.StringField({ required: true, blank: true });
    schema.actions = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 5 });
    schema.wounds = new fields.ArrayField(
      new fields.SchemaField({
        type: new fields.StringField({ required: true }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 })
      })
    );
    schema.activeSkills = new fields.ArrayField(
      new fields.StringField({ required: true, blank: true })
    );
    schema.queuedSkills = new fields.ArrayField(
      new fields.StringField({ required: true, blank: true })
    );
    schema.combinedAttacks = new fields.SchemaField({
      combineFor: new fields.StringField({ required: true, blank: true, nullable: true }),
      combined: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      base: new fields.SchemaField({
        id: new fields.StringField({ required: true, blank: true }),
        name: new fields.StringField({ required: true, blank: true }),
        actionCost: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        image: new fields.StringField({ required: true, blank: true }),
        attackMode: new fields.StringField({ required: true, blank: true }),
        handsSupplied: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        attackProfile: new fields.SchemaField({
          name: new fields.StringField({ required: true, blank: true }),
          attackType: new fields.StringField({ required: true, blank: true }),
          lethal: new fields.NumberField({ ...requiredInteger, initial: 0 }),
          critical: new fields.NumberField({ ...requiredInteger, initial: 10, min: 5 }),
          damage: new fields.ArrayField(
            new fields.SchemaField({
              type: new fields.StringField({ required: true, blank: true }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
              attributeModifier: new fields.StringField({ required: true, blank: true }),
              attributeMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
              damageMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
              overallMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 })
            })
          ),
          finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 }),
          hasStrongAttack: new fields.BooleanField({ required: true, nullable: false, initial: true })
        })
      },
        { nullable: true, initial: null }),
      additionalDamage: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ ...blankString }),
          value: new fields.NumberField({ ...requiredInteger }),
          attributeModifier: new fields.StringField({ ...blankString }),
          attributeMultiplier: new fields.NumberField({ ...requiredInteger }),
          damageMultiplier: new fields.NumberField({ ...requiredInteger }),
          overallMultiplier: new fields.NumberField({ ...requiredInteger }),
        })
      )
    })
    schema.defense = new fields.SchemaField({
      guard: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        label: new fields.StringField({ required: true, blank: true }),

      }),
      protection: new fields.SchemaField(Object.keys(CONFIG.ABBREW.damageTypes).reduce((obj, damageType) => {
        obj[damageType] = new fields.SchemaField({
          label: new fields.StringField({ required: true, blank: true }),
          type: new fields.StringField({ required: true, blank: true }),
          resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
        });
        return obj;
      }, {})),
      inflexibility: new fields.SchemaField({
        raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 10, max: 10 }),
        resistance: new fields.SchemaField({
          raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        })
      }),
      risk: new fields.SchemaField({
        raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 100 }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 10, max: 10 })
      }),
      resolve: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        label: new fields.StringField({ required: true, blank: true })
      }),
      recovery: new fields.SchemaField(Object.keys(CONFIG.ABBREW.lingeringWounds).reduce((obj, wound) => {
        const type = CONFIG.ABBREW.lingeringWounds[wound];
        obj[type] = new fields.SchemaField({
          label: new fields.StringField({ required: true, blank: true }),
          type: new fields.StringField({ required: true, blank: true }),
          value: new fields.NumberField({ ...requiredInteger, initial: 1 })
        });
        return obj;
      }, {}))
    });
    schema.resources = new fields.SchemaField({
      owned: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ required: true, blank: true }),
          name: new fields.StringField({ required: true, blank: true }),
          max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
        })
      ),
      values: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ required: true, blank: true }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        })
      )
    });

    schema.progression = new fields.SchemaField({
      archetypes: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ ...blankString }),
          roles: new fields.ArrayField(
            new fields.SchemaField({
              role: new fields.StringField({ ...blankString }),
              path: new fields.SchemaField({
                id: new fields.StringField({ ...blankString }),
                name: new fields.StringField({ ...blankString }),
              })
            })
          ),
          skills: new fields.SchemaField({
            total: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            ranks: new fields.NumberField({ ...requiredInteger, initial: 1 })
          }),
          specialised: new fields.BooleanField({ required: true, initial: false }),
          mastery: new fields.BooleanField({ required: true, initial: false }),
        }),
      )
    });

    schema.biography = new fields.StringField({ required: true, blank: true });

    schema.movement = new fields.SchemaField({
      baseSpeed: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    schema.meta = new fields.SchemaField({
      tier: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0, max: 10 })
      }),
      size: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      actionRecovery: new fields.NumberField({ ...requiredInteger, initial: 5, min: 0, max: 5 })
    });

    schema.skillTraining = new fields.ArrayField(
      new fields.SchemaField({
        type: new fields.StringField({ ...blankString }),
        value: new fields.NumberField({ ...requiredInteger })
      })
    )

    // Iterate over attribute names and create a new SchemaField for each.
    schema.attributes = new fields.SchemaField(Object.keys(CONFIG.ABBREW.attributes).reduce((obj, attribute) => {
      obj[attribute] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 }),
        tier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 }),
        rank: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        label: new fields.StringField({ required: true, blank: true })
      });
      return obj;
    }, {}));

    schema.momentum = new fields.NumberField({ ...requiredInteger, initial: 0 });

    return schema;
  }


  // Prior to Active Effects
  prepareBaseData() {
    // Loop through attribute scores, and determine their base rank.
    for (const key in this.attributes) {
      const totalIncrease = 0 + this.parent.items.filter(i => i.type === 'skill' && i.system.skillType === 'background' && i.system.attributeIncrease === key).length;
      this.attributes[key].value = Math.min(9, totalIncrease);
      this.attributes[key].rank = totalIncrease;
    }

    this.defense.risk.value = Math.floor(this.defense.risk.raw / 10);

    this.defense.resolve.max = 2 + Math.floor((this._getMaxFromPhysicalAttributes() + this._getMaxFromMentalAttributes()) / 2);

    this.skillTraining = ([
      { type: "attack", value: 0 },
      { type: "overpower", value: 0 },
      { type: "parry", value: 0 },
      { type: "feint", value: 0 },
      { type: "finisher", value: 0 },
      { type: "parryCounter", value: 0 },
      { type: "feintCounter", value: 0 }
    ])

    this.resources.owned = this._getOwnedResources();
    this._limitResourceValues();
    this._prepareDefenses();
  }

  _getOwnedResources() {
    const baseResources = this.parent.items
      .filter(i => i.type === "skill" && i.system.skillType === "resource" && i.system.resource.capacity != null && !i.system.resource.relatedResource)
      .reduce((result, resource) => {
        result[resource.system.abbrewId.uuid] = ({ name: resource.name, max: resource.system.resource.capacity });
        return result;
      }, {});

    const modifierResources = this.parent.items
      .filter(i => i.type === "skill" && i.system.skillType === "resource" && i.system.resource.operator && i.system.resource.relatedResource)
      .map(r => ({ ...r, id: JSON.parse(r.system.resource.relatedResource)[0].id, index: getOrderForOperator(r.operator) }))
      .sort(compareModifierIndices)

    const resources = modifierResources
      .reduce((result, resource) => {
        if (resource.id in result) {
          const initialCapacity = result[resource.id].max;
          result[resource.id].max = applyOperator(initialCapacity, resource.system.resource.capacity, resource.system.resource.operator);
        }

        return result;
      }, baseResources);

    return Object.entries(resources).map(e => ({ id: e[0], name: e[1].name, max: Math.max(0, e[1].max) }));
  }

  _limitResourceValues() {
    for (const index in this.resources.owned) {
      const ownedResource = this.resources.owned[index];
      const id = ownedResource.id;
      const max = ownedResource.max;
      const valueIndex = this.resources.values.findIndex(r => r.id === id);
      if (valueIndex != null && valueIndex > -1) {
        const valueResource = this.resources.values[valueIndex];
        this.resources.values[valueIndex] = ({ id: valueResource.id, value: Math.min(max, valueResource.value) });
      }
    }
  }

  _getMaxFromPhysicalAttributes() {
    return this._getMaxFromAttributes(['str', 'con', 'dex', 'agi']);
  }

  _getMaxFromMentalAttributes() {
    return this._getMaxFromAttributes(['int', 'wil', 'vis', 'wit']);
  }

  _getMaxFromAttributes(attributes) {
    return Object.keys(this.attributes).filter(a => attributes.includes(a)).reduce((result, attribute) => Math.max(result, this.attributes[attribute].value), 0);
  }

  // Post Active Effects
  prepareDerivedData() {
    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (const key in this.attributes) {
      const rankBonus = this.attributes[key].rank;
      // Handle attribute label localization.
      this.attributes[key].label = game.i18n.localize(CONFIG.ABBREW.attributes[key]) ?? key;
      // // Rank total for the attribute
      this.attributes[key].rank = rankBonus + this.parent.items.filter(i => i.type === 'skill' && i.system.skillType === 'path' && i.system.attributeRankIncrease === key).length;
      // Tier of the attribute
      this.attributes[key].tier = 1 + Math.floor(this.attributes[key].rank / 10);
    }

    for (const key in this.defense.protection) {
      this.defense.protection[key].label = game.i18n.localize(CONFIG.ABBREW.damageTypes[key].label) ?? key;
      this.defense.protection[key].type = key;
    }

    for (const key in this.defense.recovery) {
      this.defense.recovery[key].type = key;
      this.defense.recovery[key].label = game.i18n.localize(CONFIG.ABBREW.wounds[key].name) ?? type;
    }

    const anatomy = this._prepareAnatomy();

    this._prepareMovement(anatomy);

    this._prepareResolve();

    const skillTraining = this.parent.items.filter(i => i.type === "skill").filter(s => s.system.skillTraits).flatMap(s => getSafeJson(s.system.skillTraits, []).filter(st => st.feature === "skillTraining").map(st => st.data)).reduce((result, st) => { if (st in result) { result[st] += 1; } else { result[st] = 1; } return result; }, {});
    const mappedTraining = Object.entries(skillTraining).map(e => ({ type: e[0], value: e[1] }));
    this.skillTraining = foundry.utils.mergeObject(this.skillTraining, mappedTraining);

    this._limitResourceValues();
  }

  _prepareAnatomy() {
    const res = this.parent.items.filter(i => i.type == "anatomy").filter(a => !(a.system.isBroken || a.system.isDismembered)).reduce((result, a) => {
      const values = a.system;
      result.hands += values.hands;
      result.speed += values.speed;
      result.parts = result.parts.concat(JSON.parse(values.parts).map(a => a.value));
      return result;
    }, { hands: 0, speed: 0, parts: [] });
    return res;
  }

  _prepareMovement(anatomy) {
    this.movement.baseSpeed = this.attributes.agi.value * anatomy.speed;
  }

  _prepareDefenses() {
    const armour = this.parent.items.filter(i => i.type === 'armour');
    const anatomy = this.parent.items.filter(i => i.type === "anatomy");
    const wornArmour = this._getAppliedArmour(armour);
    this._prepareDamageReduction(wornArmour, anatomy);
    this._prepareGuard(wornArmour, anatomy);
    this._prepareInflexibility(wornArmour);
  }

  _getAppliedArmour(armour) {
    const wornArmour = armour.filter(a => ['worn', 'none'].includes(a.system.equipState)).filter(a => a.system.equipState === 'worn');
    const heldArmour = armour.filter(a => a.system.equipType === 'held').filter(a => a.system.equipState.startsWith('held'));
    return [...wornArmour, ...heldArmour];
  }

  _prepareResolve() {
    const currentResolve = this.defense.resolve.value;
    if (currentResolve > this.defense.resolve.max) {
      this.defense.resolve.value = this.defense.resolve.max;
    }
  }

  _prepareDamageReduction(wornArmour, anatomy) {
    const armour = wornArmour.filter(a => !a.system.isSundered);
    const armourProtection = armour.map(a => a.system.defense.protection).flat(1);
    const anatomyProtection = anatomy.map(a => a.system.defense.protection).flat(1);
    const protection = [...armourProtection, ...anatomyProtection];

    protection.filter(p => p.type !== "").forEach(dr => {
      const drType = dr.type;
      this.defense.protection[drType].resistance += dr.resistance;
      this.defense.protection[drType].immunity += dr.immunity;
      this.defense.protection[drType].weakness += dr.weakness;
    });
  }

  _prepareGuard(wornArmour, anatomy) {
    const armour = wornArmour.filter(a => !a.system.isSundered);
    this.defense.guard.base = this.attributes['wit'].value;
    // Handle damage type label localization.
    this.defense.guard.label = game.i18n.localize(CONFIG.ABBREW.Defense.guard) ?? key;

    const guardBonus = armour.map(a => a.system.defense.guard).reduce((a, b) => a + b, 0);
    this.defense.guard.max = this.defense.guard.base + guardBonus;

    if (this.defense.guard.value > this.defense.guard.max) {
      this.defense.guard.value = this.defense.guard.max;
    }
  }

  _prepareInflexibility(wornArmour) {
    const armour = wornArmour.filter(a => !a.system.isSundered);
    const armourInflexibility = armour.map(a => a.system.defense.inflexibility).reduce((a, b) => a + b, 0);
    const wornArmourInflexibility = wornArmour.map(a => a.system.defense.inflexibility).reduce((a, b) => a + b, 0);
    const weapons = this.parent.items.filter(i => i.type === 'weapon').filter(a => a.system.equipType === 'held').filter(a => a.system.equipState.startsWith('held'));
    const otherInflexibility = Math.max(0, weapons.reduce((result, w) => result += (w.system.weapon.heft * 2), 0) - this.attributes['str'].value);
    this.defense.inflexibility.resistance.raw = armourInflexibility;
    this.defense.inflexibility.raw = Math.floor((0 + wornArmourInflexibility + otherInflexibility) / 2); // TODO: - weapon drills as "Shield Training" is handled
    this.defense.inflexibility.resistance.value = Math.floor(armourInflexibility / 10);
  }

  getRollData() {
    let data = {};

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.attributes) {
      for (let [k, v] of Object.entries(this.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.tier = this.meta.tier.value;

    return data
  }
}