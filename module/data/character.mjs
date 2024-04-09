import AbbrewActorBase from "./actor-base.mjs";

export default class AbbrewCharacter extends AbbrewActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    return schema;
  }

  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }

  // Post Active Effects
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  getRollData() {
    const data = super.getRollData();

    return data;
  }
}