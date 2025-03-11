import AbbrewSkillDeck from "./skill-deck.mjs";
import { addAttributesToSchema, prepareDerivedAttributeData } from "./utilities/attribute-increase-skill.mjs";

export default class AbbrewBackground extends AbbrewSkillDeck {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        addAttributesToSchema(schema);
        // TODO: Add modifiers to skills, allow basics to show modifiers e.g. speed *0.75 for dwarf
        schema.creatureForm = new fields.SchemaField({
            name: new fields.StringField({ required: true, blank: true }),
            id: new fields.StringField({ required: true, blank: true }),
            image: new fields.StringField({ required: true, blank: true })
        })

        return schema;
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
        prepareDerivedAttributeData(this);
    }
}