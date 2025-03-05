export default class AbbrewRevealedItem {
    static addRevealedItemSchema(schema) {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.revealed = new fields.SchemaField({
            isRevealed: new fields.BooleanField({}),
            difficulty: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            tier: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 })
        });
    }
}