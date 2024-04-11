export default class AbbrewActorBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.wounds = new fields.SchemaField({
      active: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 }),
        suppressed: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 }),
      }),
      healing: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 })
      }),
      resilience: new fields.NumberField({ ...requiredInteger, initial: 1 }),
      blood: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 100, min: 0, max: 100 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 100, min: 0, max: 100 })
      })
    });

    schema.defense = new fields.SchemaField({
      guard: new fields.SchemaField(Object.keys(CONFIG.ABBREW.facing).reduce((obj, facing) => {
        obj[facing] = new fields.SchemaField({
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          label: new fields.StringField({ required: true, blank: true })
        });
        return obj;
      }, {})),
      damageReduction: new fields.SchemaField(Object.keys(CONFIG.ABBREW.concepts).reduce((obj, concept) => {
        obj[concept] = new fields.SchemaField({
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          label: new fields.StringField({ required: true, blank: true })
        });
        return obj;
      }, {}))
    });

    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

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

    return schema;
  }


  // Prior to Active Effects
  prepareBaseData() {
    console.log('base');
    // Loop through attribute scores, and determine their base rank.
    for (const key in this.attributes) {
      this.attributes[key].rank = this.attributes[key].value;
    }

  }

  // Post Active Effects
  prepareDerivedData() {
    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (const key in this.attributes) {
      const rankBonus = this.attributes[key].rank;
      // Handle attribute label localization.
      this.attributes[key].label = game.i18n.localize(CONFIG.ABBREW.attributes[key]) ?? key;
      // // Rank total for the attribute
      this.attributes[key].rank = rankBonus + this.parent.items.filter(i => i.type === 'skill' && i.system.attributeIncrease === key).length;
      // Tier of the attribute
      this.attributes[key].tier = 1 + Math.floor(this.attributes[key].rank / 10);
    }

    for (const key in this.defense.damageTypes) {
      // Handle damage type label localization.
      this.defense.damageTypes[key].label = game.i18n.localize(CONFIG.ABBREW.damageTypes[key]) ?? key;
    }

    for (const key in this.defense.guard) {
      // Handle damage type label localization.
      this.defense.guard[key].label = game.i18n.localize(CONFIG.ABBREW.facing[key]) ?? key;
    }
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