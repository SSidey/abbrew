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
    schema.isAttackTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isFinisherTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isFeintTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isOverpowerTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });

    AbbrewAttackBase.addAttackSchema(schema);
  }

  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }


  // Post Active Effects
  prepareDerivedData() {
    this.isAttackTrained = this.doesParentActorHaveSkillTrait("skillTraining", "offensiveSkills", "base", "attack") ?? false;
    this.isFinisherTrained = this.doesParentActorHaveSkillTrait("skillTraining", "offensiveSkills", "base", "finisher") ?? false;
    this.isFeintTrained = this.doesParentActorHaveSkillTrait("skillTraining", "offensiveSkills", "base", "feint") ?? false;
    this.isOverpowerTrained = this.doesParentActorHaveSkillTrait("skillTraining", "offensiveSkills", "base", "overpower") ?? false;
  }

  doesParentActorHaveSkillTrait(feature, subFeature, effect, data) {
    return this?.parent?.actor?.doesActorHaveSkillTrait(feature, subFeature, effect, data) ?? false;
  }
}
