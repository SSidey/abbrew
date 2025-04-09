import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewSkill extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredNumber = { required: true, nullable: false };
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.skillTraits = new fields.StringField({ ...blankString });
        schema.skillModifiers = new fields.SchemaField({
            synergy: new fields.StringField({ ...blankString }),
            discord: new fields.StringField({ ...blankString })
        });
        schema.configurable = new fields.BooleanField({ required: true });
        schema.isActivatable = new fields.BooleanField({ required: true, initial: false, label: "ABBREW.IsActivatable" });
        schema.activateOnCreate = new fields.BooleanField({ required: true, initial: false });
        schema.applyTurnStart = new fields.BooleanField({ required: true, initial: false });
        schema.applyTurnEnd = new fields.BooleanField({ required: true, initial: false });
        schema.applyOnExpiry = new fields.BooleanField({ required: true, initial: false });
        schema.skills = new fields.SchemaField({
            granted: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true, blank: true }),
                    skillType: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    image: new fields.StringField({ required: true, blank: true }),
                    sourceId: new fields.StringField({ required: true, blank: true }),
                })
            ),
            paired: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true, blank: true }),
                    skillType: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    image: new fields.StringField({ required: true, blank: true }),
                    sourceId: new fields.StringField({ required: true, blank: true }),
                })
            ),
            // TODO: Implement Grant on use
            grantedOnActivation: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true, blank: true }),
                    skillType: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    image: new fields.StringField({ required: true, blank: true }),
                    sourceId: new fields.StringField({ required: true, blank: true }),
                    grantTimes: new fields.NumberField({ ...requiredInteger, initial: 0 })
                })
            )
        });
        schema.resource = new fields.SchemaField({
            capacity: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            operator: new fields.StringField({ required: true, blank: true }),
            relatedResource: new fields.StringField({ nullable: true, initial: null })
        })
        schema.action = new fields.SchemaField({
            activationType: new fields.StringField({ ...blankString }),
            actionCost: new fields.StringField({ ...blankString, nullable: true }),
            actionImage: new fields.StringField({ ...blankString }),
            duration: new fields.SchemaField({
                precision: new fields.StringField({ ...blankString }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                expireOnStartOfTurn: new fields.BooleanField({ required: true, initial: true })
            }),
            uses: new fields.SchemaField({
                hasUses: new fields.BooleanField({ required: true, initial: false }),
                // TODO: Implement AsStacks
                asStacks: new fields.BooleanField({ required: true, initial: false }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                max: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                period: new fields.StringField({ ...blankString }),
                removeWhenNoUsesRemain: new fields.BooleanField({ required: true, initial: false })
            }),
            charges: new fields.SchemaField({
                hasCharges: new fields.BooleanField({ required: true, initial: false }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                max: new fields.NumberField({ ...requiredInteger, initial: 0 })
            }),
            isActive: new fields.BooleanField({ required: true }),
            // TODO: Implement skillRequest
            skillRequest: new fields.SchemaField({
                isContested: new fields.BooleanField({ required: true, initial: false }),
                selfRolls: new fields.SchemaField({
                    checkType: new fields.StringField({ ...blankString }),
                    modifiers: new fields.ArrayField(
                        new fields.SchemaField({
                            // name / id etc.
                        })
                    ),
                    results: new fields.SchemaField({
                        success: new fields.SchemaField({
                            description: new fields.StringField({ ...blankString }),
                            grantedSkills: new fields.StringField({ ...blankString })
                        }),
                        failure: new fields.SchemaField({
                            description: new fields.StringField({ ...blankString }),
                            grantedSkills: new fields.StringField({ ...blankString })
                        })
                    })
                }),
                targetRolls: new fields.SchemaField({
                    checkType: new fields.StringField({ ...blankString }),
                    modifiers: new fields.ArrayField(
                        new fields.SchemaField({
                            // name / id etc.
                        })
                    ),
                    results: new fields.SchemaField({
                        success: new fields.SchemaField({
                            description: new fields.StringField({ ...blankString }),
                            grantedSkills: new fields.StringField({ ...blankString })
                        }),
                        failure: new fields.SchemaField({
                            description: new fields.StringField({ ...blankString }),
                            grantedSkills: new fields.StringField({ ...blankString })
                        })
                    })
                })
            }),
            attackProfile: new fields.SchemaField({
                isEnabled: new fields.BooleanField({ required: true, initial: true }),
                name: new fields.StringField({ required: true, blank: true }),
                attackType: new fields.StringField({ required: true, blank: true }),
                lethal: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                critical: new fields.NumberField({ ...requiredInteger, initial: 10, min: 5 }),
                handsSupplied: new fields.NumberField({ ...requiredInteger, min: 0, max: 2, nullable: true }),
                attackMode: new fields.StringField({ required: true, blank: true }),
                finisher: new fields.SchemaField({
                    type: new fields.StringField({ required: true, blank: true }),
                    cost: new fields.NumberField({ nullable: true, min: 0, integer: true }),
                    description: new fields.StringField({ required: true, blank: true }),
                    wounds: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: new fields.StringField({ ...blankString }),
                            operator: new fields.StringField({ ...blankString })
                        })
                    )
                }),
                damage: new fields.ArrayField(
                    new fields.SchemaField({
                        type: new fields.StringField({ required: true, blank: true }),
                        value: new fields.StringField({ required: true, blank: true }),
                        attributeModifier: new fields.StringField({ required: true, blank: true }),
                        attributeMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                        damageMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                        overallMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                    })
                ),
                finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 })
            }),
            modifiers: new fields.SchemaField({
                fortune: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                actionCost: new fields.SchemaField({
                    value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                    operator: new fields.StringField({ ...blankString }),
                }),
                attackProfile: new fields.SchemaField({
                    combineAttacks: new fields.SchemaField({
                        isEnabled: new fields.BooleanField({ required: true }),
                        value: new fields.NumberField({ ...requiredInteger, min: 2, nullable: true }),
                    }),
                    attackType: new fields.StringField({ required: true, blank: true }),
                    attackMode: new fields.StringField({ required: true, blank: true }),
                    handsSupplied: new fields.NumberField({ ...requiredInteger, min: 0, max: 2, nullable: true }),
                    finisherLimit: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 10, nullable: true }),
                        operator: new fields.StringField({ required: true, blank: true })
                    }),
                    lethal: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 0, nullable: true }),
                        operator: new fields.StringField({ required: true, blank: true })
                    }),
                    critical: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 10, nullable: true }),
                        operator: new fields.StringField({ required: true, blank: true })
                    }),
                    finisher: new fields.SchemaField({
                        cost: new fields.NumberField({ nullable: true, min: 0, integer: true }),
                        wounds: new fields.ArrayField(
                            new fields.SchemaField({
                                type: new fields.StringField({ ...blankString }),
                                value: new fields.StringField({ ...blankString }),
                                operator: new fields.StringField({ ...blankString })
                            })
                        )
                    }),
                    damage: new fields.ArrayField(
                        new fields.SchemaField({
                            modify: new fields.StringField({ required: true, blank: true }),
                            modifyType: new fields.StringField({ required: true, blank: true }),
                            type: new fields.StringField({ required: true, blank: true, nullable: true }),
                            value: new fields.StringField({ required: true, blank: true }),
                            attributeModifier: new fields.StringField({ required: true, blank: true, nullable: true }),
                            attributeMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                            damageMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                            overallMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 })
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
                            // TODO: Should be Increase/Suppress/Reduce
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
                resources: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            summary: new fields.StringField({ required: true, blank: true }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString }),
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            summary: new fields.StringField({ required: true, blank: true }),
                            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                            operator: new fields.StringField({ ...blankString }),
                        })
                    ),
                }),
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
            })
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

    prepareBaseData() {
        super.prepareBaseData();
        if (this.isActivatable) {
            this.action.actionCostOperator = "";
        }
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
            this.action.isActive = queuedSkills.includes(id) || activeSkills.includes(id);
        }
    }

    getActionImageName(cost) {
        return "" + cost + "a";
    }
}