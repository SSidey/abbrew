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
