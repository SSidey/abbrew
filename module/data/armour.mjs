import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewArmour extends AbbrewItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    return schema;
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation
    const roll = this.roll;

    // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
  }
}