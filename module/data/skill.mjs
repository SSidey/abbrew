import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewSkill extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.skillTraits = new fields.StringField({ ...blankString });
        schema.configurable = new fields.BooleanField({ required: true });
        schema.activatable = new fields.BooleanField({ required: true, label: "ABBREW.Activatable" });
        schema.action = new fields.SchemaField({
            activationType: new fields.StringField({ ...blankString }),
            actionCost: new fields.StringField({ ...blankString }),
            actionImage: new fields.StringField({ ...blankString }),
            duration: new fields.SchemaField({
                precision: new fields.StringField({ ...blankString }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            }),
            uses: new fields.NumberField({ ...requiredInteger, initial: -1 }),
            charges: new fields.SchemaField({
                hasCharges: new fields.BooleanField({ required: true, initial: false }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                max: new fields.NumberField({ ...requiredInteger, initial: 0 })
            }),
            isActive: new fields.BooleanField({ required: true }),
            modifiers: new fields.SchemaField({
                damage:
                    new fields.SchemaField({
                        self: new fields.ArrayField(
                            new fields.SchemaField({
                                value: new fields.StringField({ ...blankString }),
                                type: new fields.StringField({ ...blankString }),
                                operator: new fields.StringField({ ...blankString })
                            })
                        ),
                        target: new fields.ArrayField(
                            new fields.SchemaField({
                                value: new fields.StringField({ ...blankString }),
                                type: new fields.StringField({ ...blankString }),
                                operator: new fields.StringField({ ...blankString })
                            })
                        )
                    }),
                guard: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: new fields.StringField({ ...blankString }),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: new fields.StringField({ ...blankString }),
                        operator: new fields.StringField({ ...blankString })
                    })
                }),
                successes: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                risk: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        operator: new fields.StringField({ ...blankString })
                    })
                }),
                wounds: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString })
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString })
                        })
                    )
                }),
                lingeringWoundSuppression: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        })
                    )
                }),
                resolve: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                        operator: new fields.StringField({ ...blankString })
                    })
                }),
                resources: new fields.ArrayField(
                    new fields.SchemaField({
                        self: new fields.SchemaField({
                            name: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString }),
                        }),
                        target: new fields.SchemaField({
                            name: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString }),
                        })
                    })
                ),
                concepts: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            comparator: new fields.StringField({ ...blankString }),
                            operator: new fields.StringField({ ...blankString })
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            comparator: new fields.StringField({ ...blankString }),
                            operator: new fields.StringField({ ...blankString })
                        })
                    )
                })
            }),
            description: new fields.StringField({ ...blankString })
        });
        schema.skillType = new fields.StringField({ ...blankString });
        schema.path = new fields.SchemaField({
            value: new fields.StringField({ ...blankString }),
            archetype: new fields.StringField({ ...blankString })
        });
        schema.attributeIncrease = new fields.StringField({ ...blankString });
        schema.attributeIncreaseLong = new fields.StringField({ ...blankString });
        schema.attributeRankIncrease = new fields.StringField({ ...blankString });

        return schema;
    }

    // Post Active Effects
    prepareDerivedData() {
        if (this.attributeIncrease) {
            this.attributeIncreaseLong = game.i18n.localize(CONFIG.ABBREW.attributes[this.attributeIncrease]);
        }

        if (this.action.actionCost) {
            this.action.actionImage = this.getActionImageName(this.action.actionCost);
        }

        if (this.parent) {
            const queuedSkills = this.parent?.parent?.system?.queuedSkills ?? [];
            const activeSkills = this.parent?.parent?.system?.activeSkills ?? [];
            const id = this.parent?._id ?? null;
            this.action.isActive = queuedSkills.includes(id) || activeSkills.includes(id)
        }
    }

    getActionImageName(cost) {
        if (cost === "0" || cost > 5) {
            return "fa";
        }

        return "" + cost + "a";
    }
}