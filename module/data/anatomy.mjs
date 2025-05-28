import AbbrewPhysicalItem from "./item-physical.mjs";
import AbbrewRevealedItem from './revealedItem.mjs'
import AbbrewEquipment from "./item-equipment.mjs";

export default class AbbrewAnatomy extends AbbrewPhysicalItem {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.parts = new fields.StringField({ required: true, blank: true });
    schema.isBroken = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isDismembered = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.hands = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.speed = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    AbbrewRevealedItem.addRevealedItemSchema(schema);
    AbbrewEquipment.addDefenseSchema(schema);
    schema.naturalWeapons = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        id: new fields.StringField({ required: true, blank: true }),
        image: new fields.StringField({ required: true, blank: true }),
        sourceId: new fields.StringField({ required: true, blank: true })
      })
    );

    return schema;
  }

  // TODO: Add revealed button
  // TODO: NPC sheet and player view that shows revealed armour / anatomy
  prepareDerivedData() {
    // Build the formula dynamically using string interpolation
    const roll = this.roll;

    // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
  }
}