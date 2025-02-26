import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewArmour extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.armourPoints = new fields.StringField({ required: true, blank: true });
        schema.defense = new fields.SchemaField({
            guard: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            inflexibility: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            protection: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({ required: true, blank: true }),
                    value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    label: new fields.StringField({ required: true, blank: true })
                })
            )
        });

        return schema;
    }

    prepareDerivedData() {
        // Build the formula dynamically using string interpolation
        const roll = this.roll;

        // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
    }
}