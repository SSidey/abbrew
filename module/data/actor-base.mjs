export default class AbbrewActorBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.traits = new fields.StringField({ required: true, blank: true });

    schema.wounds = new fields.ArrayField(
      new fields.SchemaField({
        type: new fields.StringField({ required: true }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 })
      })
    );

    schema.defense = new fields.SchemaField({
      guard: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        label: new fields.StringField({ required: true, blank: true }),
        
      }),
      protection: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ required: true, blank: true }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          label: new fields.StringField({ required: true, blank: true })
        })
      ),
      inflexibility: new fields.SchemaField({
        raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 10, max: 10 }),
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
      canBleed: new fields.BooleanField({ required: true, nullable: false, initial: false }),
      fatalWounds: new fields.StringField({ required: true, blank: true })
    });

    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    schema.movement = new fields.SchemaField({
      baseSpeed: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });

    schema.meta = new fields.SchemaField({
      tier: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1, max: 10 })
      }),
    });

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
    console.log('base');
    // Loop through attribute scores, and determine their base rank.
    for (const key in this.attributes) {
      this.attributes[key].value = 0 + this.parent.items.filter(i => i.type === 'skill' && i.system.skillType === 'background' && i.system.attributeIncrease === key).length;
      this.attributes[key].rank = this.attributes[key].value;
    }

    this.defense.risk.value = Math.floor(this.defense.risk.raw / 10);

    // TODO: Set by tag
    this.defense.canBleed = this.traits ? JSON.parse(this.traits).filter(t => t.value === 'Can Bleed').length : false;

    // PLAYTEST: Does this feel good?
    this.defense.resolve.max = 2 + this._getMaxFromPhysicalAttributes() + this._getMaxFromMentalAttributes();
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

    for (const key in this.defense.damageTypes) {
      // Handle damage type label localization.
      // this.defense.damageTypes[key].label = game.i18n.localize(CONFIG.ABBREW.damageTypes[key]) ?? key;
    }

    const anatomy = this._prepareAnatomy();

    this._prepareMovement(anatomy);

    this._prepareDefenses(anatomy);

    this._prepareResolve();
  }

  _prepareAnatomy() {
    console.log('anatomy');
    const res = this.parent.items.filter(i => i.type == 'anatomy').reduce((result, a) => {
      const values = a.system;
      result.hands += values.hands;
      result.speed += values.speed;
      result.parts = result.parts.concat(JSON.parse(values.parts).map(a => a.value));
      return result;
    }, { hands: 0, speed: 0, parts: [] });
    return res;
  }

  _prepareMovement(anatomy) {
    console.log('movement');
    this.movement.baseSpeed = this.attributes.agi.value * anatomy.speed;
  }

  _prepareDefenses(anatomy) {
    const armour = this.parent.items.filter(i => i.type === 'armour');
    const wornArmour = this._getWornArmour(armour);
    this._prepareDamageReduction(wornArmour, anatomy);
    this._prepareGuard(wornArmour, anatomy);
    this._prepareInflexibility(wornArmour);
  }

  _getWornArmour(armour) {
    return armour.filter(a => a.system.equipState === 'worn')
  }

  _prepareResolve() {
    const currentResolve = this.defense.resolve.value;
    if (currentResolve > this.defense.resolve.max) {
      this.defense.resolve.value = this.defense.resolve.max;
    }
  }

  _prepareDamageReduction(armour, anatomy) {
    console.log('ARMOUR');
    const protection = armour.map(a => a.system.defense.protection).flat(1);

    const flatDR = protection.reduce((result, dr) => {
      const drType = dr.type;
      if (Object.keys(result).includes(drType)) {
        // if (result[drType].value < dr.value) {
        result[drType].value += dr.value;
        // }
        // if (result[drType].resistance < dr.resistance) {
        result[drType].resistance += dr.resistance;
        // }
        // if (result[drType].immunity < dr.immunity) {
        result[drType].immunity += dr.immunity;
        // }
        // if (result[drType].weakness < dr.weakness) {
        result[drType].weakness += dr.weakness;
        // }
      }
      else {
        result[drType] = { type: dr.type, value: dr.value, resistance: dr.resistance, immunity: dr.immunity, weakness: dr.weakness, label: dr.label };
      }
      return result;
    }, {}
    );

    this.defense.protection.length = 0;
    Object.values(flatDR).map(v => this.defense.protection.push(v));
  }

  _prepareGuard(armour, anatomy) {
    this.defense.guard.base = this.attributes['wit'].value;
    // Handle damage type label localization.
    this.defense.guard.label = game.i18n.localize(CONFIG.ABBREW.Defense.guard) ?? key;

    const guardBonus = armour.map(a => a.system.defense.guard).reduce((a, b) => a + b, 0);
    this.defense.guard.max = this.defense.guard.base + guardBonus;

    if (this.defense.guard.value > this.defense.guard.max) {
      this.defense.guard.value = this.defense.guard.max;
    }
  }

  _prepareInflexibility(armour) {
    const inflexibility = armour.map(a => a.system.defense.inflexibility).reduce((a, b) => a + b, 0);
    this.defense.inflexibility.raw = inflexibility;
    this.defense.inflexibility.value = Math.ceil(inflexibility / 10);
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