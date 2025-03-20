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
    // TODO: Make baseline and have weapon training for improved effect.
    this.isFeintTrained = this.doesParentActorHaveSkillTrait("skillEnabler", "offensiveSkills", "enable", "feint");
    this.isOverpowerTrained = this.doesParentActorHaveSkillTrait("skillEnabler", "offensiveSkills", "enable", "overpower");
  }

  doesParentActorHaveSkillTrait(feature, subFeature, effect, data) {
    return this?.parent?.actor?.doesActorHaveSkillTrait(feature, subFeature, effect, data) ?? false;
  }
}