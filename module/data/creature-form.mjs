import AbbrewItemBase from "./item-base.mjs";

// TODO: Needs a sheet
// TODO: Sheet needs to be able to accept limbs
// TODO: Need to handle drag and drop to actor
export default class AbbrewCreatureForm extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }

        schema.anatomy = new fields.ArrayField(
            new fields.StringField({ ...blankString }),
        );

        return schema;
    }
}