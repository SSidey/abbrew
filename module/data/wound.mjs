import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewWound extends AbbrewItemBase {

    static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "ITEM_WOUND"]

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.wound = new fields.SchemaField({
            type: new fields.StringField({ ...blankString, choices: CONFIG.ABBREW.wounds }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0 })
        });

        return schema;
    }
}