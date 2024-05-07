import AbbrewAttackBase from "./attack-base.mjs";
import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewWeapon extends AbbrewItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hands = new fields.SchemaField(
      {
        required: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        occupied: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      }
    );
    
    AbbrewAttackBase.addAttackSchema(schema);

    return schema;
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation

    this.formula = `1d10x10cs10`;
  }
}