import AbbrewEquipment from "./item-equipment.mjs";
import AbbrewRevealedItem from "./revealedItem.mjs";

export default class AbbrewArmour extends AbbrewEquipment {

    static defineSchema() {
        const schema = super.defineSchema();
        const fields = foundry.data.fields;

        AbbrewRevealedItem.addRevealedItemSchema(schema);
        schema.isSundered = new fields.BooleanField({ required: true, nullable: false, initial: false })

        return schema;
    }

    prepareBaseData() {
        super.prepareBaseData();
    }

    prepareDerivedData() {
        // Build the formula dynamically using string interpolation
        const roll = this.roll;

        // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
    }
}