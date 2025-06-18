import AbbrewItemBase from "../item-base.mjs";

export default class AbbrewPath extends AbbrewItemBase {

    static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "ITEM_PATH"];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.roles = new fields.StringField({ required: true, blank: true });

        return schema;
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}