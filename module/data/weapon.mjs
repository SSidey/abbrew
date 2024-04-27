import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewArmour extends AbbrewItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hands = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.attackProfiles = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        damage: new fields.ArrayField(
          new fields.SchemaField({
            type: new fields.StringField({ required: true, blank: true }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            attributeModifier: new fields.StringField({ required: true, blank: true }),
          })
        )
      })
    );

    return schema;
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation

    this.formula = `1d10x10cs10`;
  }
}