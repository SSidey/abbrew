import AbbrewItemBase from "../item-base.mjs";

export default class AbbrewSkillDeck extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.skills = new fields.ArrayField(
            new fields.SchemaField({
                name: new fields.StringField({ required: true, blank: true }),
                skillType: new fields.StringField({ required: true, blank: true }),
                id: new fields.StringField({ required: true, blank: true }),
                image: new fields.StringField({ required: true, blank: true })
            })
        );

        return schema;
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}