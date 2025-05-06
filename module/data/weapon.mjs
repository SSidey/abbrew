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
      heft: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      complexity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    });
    schema.isOverpowerTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });

    AbbrewAttackBase.addAttackSchema(schema);
  }

  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }


  // Post Active Effects
  prepareDerivedData() {
    this.isOverpowerTrained = this.doesParentActorHaveSkillTrait("skillTraining", "offensiveSkills", "base", "overpower") ?? false;
  }

  doesParentActorHaveSkillTrait(feature, subFeature, effect, data) {
    return this?.parent?.actor?.doesActorHaveSkillTrait(feature, subFeature, effect, data) ?? false;
  }
}
