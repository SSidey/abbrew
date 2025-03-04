import AbbrewAttackBase from "./attack-base.mjs";
import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewWeapon extends AbbrewItemBase {

  static defineSchema() {
    const schema = super.defineSchema();

    AbbrewWeapon.addWeaponSchema(schema);

    return schema;
  }

  static addWeaponSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };

    schema.weapon = new fields.SchemaField({
      size: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 })
    });

    AbbrewAttackBase.addAttackSchema(schema);
  }

  // Prior to Active Effects
  prepareBaseData() {

  }


  // Post Active Effects
  prepareDerivedData() {
    // Build the formula dynamically using string interpolation

    this.formula = `1d10x10cs10`;
  }
}