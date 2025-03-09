import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewWound extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.wound = new fields.SchemaField({
            type: new fields.StringField({ ...blankString }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0 })
        });

        return schema;
    }
}