import AbbrewArmour from "./armour.mjs";
import AbbrewAttackBase from "./attack-base.mjs";

export default class AbbrewWeapon extends AbbrewArmour {

  static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "ITEM_WEAPON"];

  static defineSchema() {
    const schema = super.defineSchema();

    AbbrewWeapon.addWeaponSchema(schema);

    return schema;
  }

  static addWeaponSchema(schema) {
    const fields = foundry.data.fields;

    schema.isOverpowerTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });

    AbbrewAttackBase.addAttackSchema(schema);
  }

  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }


  // Post Active Effects
  prepareDerivedData() {
    super.prepareDerivedData();
  }
}
