import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewSkill extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.configurable = new fields.BooleanField({ required: true });
        schema.activatable = new fields.BooleanField({ required: true, label: "ABBREW.Activatable" });
        schema.actions = new fields.ArrayField(
            new fields.SchemaField({
                requirements: new fields.SchemaField({
                    actionCost: new fields.StringField({ ...blankString }),
                    attackType: new fields.StringField({ ...blankString }),
                    concepts: new fields.StringField({ ...blankString }),
                    hands: new fields.NumberField({ required: true, initial: null, integer: true }),
                    momentum: new fields.SchemaField({
                        hasRequirement: new fields.BooleanField({ required: true, label: "ABBREW.HasRequirement" }),
                        requirement: new fields.NumberField({ ...requiredInteger, initial: 0, min: -10, max: 10 }),
                        change: new fields.NumberField({ ...requiredInteger, initial: 0, min: -20, max: 20 })
                    }),
                    resources: new fields.ArrayField(
                        new fields.SchemaField({
                            name: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger })
                        })
                    ),
                    weapon: new fields.BooleanField({ required: true, label: "ABBREW.EquippedWeapon" })
                }),
                modifiers: new fields.SchemaField({
                    damage: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 })
                        })
                    ),
                    guard: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                    successes: new fields.NumberField({ ...requiredInteger, initial: 0 })
                }),
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