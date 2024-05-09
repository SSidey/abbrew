import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewSkill extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredInteger = { required: true, nullable: false, integer: true };

        // TODO: Revisit this, collection of actions underneath as some will have e.g. 2action to activate vs 1action and 2 momentum
        // Likely just want to have an 'activatable' flag for any actions that can be used in that way.
        schema.activatable = new fields.BooleanField({ required: true, label: "ABBREW.Activatable" });
        schema.actions = new fields.ArrayField(
            new fields.SchemaField({
                activation: new fields.SchemaField({
                    type: new fields.StringField({ ...blankString }),
                    actionCost: new fields.SchemaField({
                        description: new fields.StringField({ ...blankString }),
                        value: new fields.NumberField({ ...requiredInteger })
                    }),
                    resourceCosts: new fields.SetField(new fields.StringField({required: true}))
                })
            })
        );
        schema.skillType = new fields.StringField({ ...blankString });
        schema.path = new fields.SchemaField({
            value: new fields.StringField({ ...blankString }),
            archetype: new fields.StringField({ ...blankString })
        });
        schema.attributeIncrease = new fields.StringField({ ...blankString });
        schema.attributeRankIncrease = new fields.StringField({ ...blankString });        

        return schema;
    }
}