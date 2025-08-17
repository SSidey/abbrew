import AbbrewSkillDeck from "./skill-deck.mjs";
import { prepareDerivedAttributeData } from "./utilities/attribute-increase-skill.mjs";

export default class AbbrewBackground extends AbbrewSkillDeck {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.creatureForm = new fields.SchemaField({
            name: new fields.StringField({ required: true, blank: true }),
            id: new fields.StringField({ required: true, blank: true }),
            image: new fields.StringField({ required: true, blank: true }),
            sourceId: new fields.StringField({ required: true, blank: true })
        })

        return schema;
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}