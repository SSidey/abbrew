import AbbrewItemBase from "./item-base.mjs";
import AbbrewArmour from "./armour.mjs";
import AbbrewRevealedItem from './revealedItem.mjs'

export default class AbbrewAnatomy extends AbbrewItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.parts = new fields.StringField({ required: true, blank: true });
    schema.speed = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    AbbrewRevealedItem.addRevealedItemSchema(schema);
    AbbrewArmour.addDefenseSchema(schema);

    return schema;
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation
    const roll = this.roll;

    // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
  }
}