import AbbrewItemBase from "./item-base.mjs";

// TODO: Needs a sheet
// TODO: Sheet needs to be able to accept limbs
// TODO: Need to handle drag and drop to actor
export default class AbbrewCreatureForm extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        // TODO: Traits that can apply down over e.g. canBleed, should add the same for Background e.g. darkvision
        schema.anatomy = new fields.ArrayField(
            new fields.SchemaField({
                name: new fields.StringField({ required: true, blank: true }),
                id: new fields.StringField({ required: true, blank: true }),
                image: new fields.StringField({ required: true, blank: true })
            })
        );

        return schema;
    }
}