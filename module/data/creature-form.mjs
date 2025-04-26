import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewCreatureForm extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        schema.anatomy = new fields.ArrayField(
            new fields.SchemaField({
                name: new fields.StringField({ required: true, blank: true }),
                id: new fields.StringField({ required: true, blank: true }),
                image: new fields.StringField({ required: true, blank: true }),
                sourceId: new fields.StringField({ required: true, blank: true })
            })
        );

        return schema;
    }
}