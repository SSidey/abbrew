export default class AbbrewActiveEffect extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const schema = {};

        const fields = foundry.data.fields;

        schema.modifiers = new fields.ArrayField(
            new fields.SchemaField({
                parseMode: new fields.StringField({ required: true, blank: true }),
                numerator: new fields.NumberField({ required: true, initial: 1, integer: true }),
                denominator: new fields.NumberField({ required: true, initial: 1, min: 1, integer: true })
            })
        );

        return schema;
    }
}