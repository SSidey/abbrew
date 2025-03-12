import AbbrewAttackBase from "./attack-base.mjs";
import AbbrewPhysicalItem from "./item-physical.mjs";

export default class AbbrewWeapon extends AbbrewPhysicalItem {

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
    schema.isFeintTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isOverpowerTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isParryTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });

    AbbrewAttackBase.addAttackSchema(schema);
  }

  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }


  // Post Active Effects
  prepareDerivedData() {
    // Build the formula dynamically using string interpolation

    this.formula = `1d10x10cs10`;

    this.isFeintTrained = this.doesParentActorHaveSkillFlag("Feint");
    this.isOverpowerTrained = this.doesParentActorHaveSkillFlag("Overpower");
  }

  doesParentActorHaveSkillFlag(trait) {
    return this?.parent?.actor?.doesActorHaveSkillFlag(trait) ?? false;
  }
}