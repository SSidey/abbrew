import { getSafeJson } from "../helpers/utils.mjs";
import AbbrewItemBase from "./item-base.mjs";

export default class AbbrewSkill extends AbbrewItemBase {

    // TODO: Add Rank for path skills
    // TODO: Need to enrich skil check results i.e. number of success / fail
    // TODO: Skill improvement item (just a skill that merges in? Would need more than skill schema e.g. increasing duration)
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
        const blankString = { required: true, blank: true }
        const requiredNumber = { required: true, nullable: false };
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.skillModifiers = new fields.SchemaField({
            synergy: new fields.StringField({ ...blankString }),
            discord: new fields.StringField({ ...blankString }),
            // Whether or not to apply a skil in synergies, if true then the appropriate grantedBy 
            // id(s) must be present in sources for it to be included
            isActorGrantTriggerRequired: new fields.BooleanField({ required: true, intial: false }),
            isItemGrantTriggerRequired: new fields.BooleanField({ required: true, intial: false })
        });
        schema.isFavourited = new fields.BooleanField({ required: true, initial: false });
        schema.configurable = new fields.BooleanField({ required: true });
        schema.isActivatable = new fields.BooleanField({ required: true, initial: false, label: "ABBREW.IsActivatable" });
        schema.activateOnCreate = new fields.BooleanField({ required: true, initial: false });
        schema.applyTurnStart = new fields.BooleanField({ required: true, initial: false });
        schema.applyTurnEnd = new fields.BooleanField({ required: true, initial: false });
        schema.applyOnExpiry = new fields.BooleanField({ required: true, initial: false });
        schema.activateOnDamageAccept = new fields.BooleanField({ required: true, initial: false });
        // Who is sending the skill e.g. this will be tha attacker and their weapon's id on an attack
        schema.sources = new fields.SchemaField({
            actor: new fields.StringField({ ...blankString }),
            items: new fields.ArrayField(
                new fields.StringField({ ...blankString })
            )
        });
        schema.grantedBy = new fields.SchemaField({
            actor: new fields.StringField({ ...blankString }),
            item: new fields.StringField({ ...blankString })
        })
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
            grantedOnActivation: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true, blank: true }),
                    skillType: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    image: new fields.StringField({ required: true, blank: true }),
                    sourceId: new fields.StringField({ required: true, blank: true }),
                    grantTimes: new fields.NumberField({ ...requiredInteger, initial: 0 })
                })
            ),
            grantedOnAccept: new fields.ArrayField(
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
            // Used to modify other resource capacities.
            // This should be null for base resources.
            relatedResource: new fields.StringField({ nullable: true, initial: null }),
            fillCapacityOnCreate: new fields.BooleanField({ required: true, initial: false })
        })
        schema.action = new fields.SchemaField({
            activationType: new fields.StringField({ ...blankString }),
            actionCost: new fields.StringField({ ...blankString, nullable: true }),
            actionImage: new fields.StringField({ ...blankString }),
            duration: new fields.SchemaField({
                isConcentration: new fields.BooleanField({ required: true, initial: false }),
                precision: new fields.StringField({ ...blankString }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                expireOnStartOfTurn: new fields.BooleanField({ required: true, initial: true })
            }),
            uses: new fields.SchemaField({
                hasUses: new fields.BooleanField({ required: true, initial: false }),
                asStacks: new fields.BooleanField({ required: true, initial: false }),
                removeStackOnUse: new fields.BooleanField({ required: true, initial: true }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                max: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                period: new fields.StringField({ ...blankString }),
                stackRemovalActivation: new fields.BooleanField({ required: true, initial: false }),
                removeWhenNoUsesRemain: new fields.BooleanField({ required: true, initial: false })
            }),
            charges: new fields.SchemaField({
                hasCharges: new fields.BooleanField({ required: true, initial: false }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                max: new fields.NumberField({ ...requiredInteger, initial: 0 })
            }),
            isActive: new fields.BooleanField({ required: true }),
            asyncValues: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ ...blankString }),
                    type: new fields.StringField({ ...blankString }),
                    title: new fields.StringField({ ...blankString }),
                    numerator: new fields.NumberField({ ...requiredInteger, initial: 1 }),
                    denominator: new fields.NumberField({ ...requiredInteger, initial: 1 }),
                    value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                    minOperator: new fields.StringField({ ...blankString }),
                    min: new fields.StringField({ ...blankString }),
                    minType: new fields.StringField({ ...blankString }),
                    maxOperator: new fields.StringField({ ...blankString }),
                    max: new fields.StringField({ ...blankString }),
                    maxType: new fields.StringField({ ...blankString }),
                })
            ),
            skillCheck: this.getModifierBuilderField(),
            skillRequest: new fields.SchemaField({
                isEnabled: new fields.BooleanField({ required: true, initial: false }),
                isContested: new fields.BooleanField({ required: true, initial: false }),
                selfCheck: new fields.BooleanField({ required: true, initial: false }),
                checkType: new fields.StringField({ ...blankString }),
                requirements: new fields.SchemaField({
                    modifiers: new fields.StringField({ ...blankString }),
                    successes: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                    result: new fields.NumberField({ ...requiredInteger, initial: 0 })
                }),
                targetModifiers: new fields.StringField({ ...blankString }),
                results: new fields.SchemaField({
                    success: new fields.SchemaField({
                        description: new fields.StringField({ ...blankString })
                    }),
                    failure: new fields.SchemaField({
                        description: new fields.StringField({ ...blankString })
                    })
                })
            }),
            attackProfile: new fields.SchemaField({
                isEnabled: new fields.BooleanField({ required: true, initial: false }),
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
                        penetration: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
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
                    isEnabled: new fields.BooleanField({ required: true, initial: false, nullable: true }),
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
                    penetration: new fields.SchemaField({
                        value: new fields.NumberField({ ...requiredInteger, initial: 10, nullable: true }),
                        operator: new fields.StringField({ required: true, blank: true })
                    }),
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
                            modify: new fields.StringField({ required: true, blank: true }),
                            modifyType: new fields.StringField({ required: true, blank: true }),
                            type: new fields.StringField({ required: true, blank: true, nullable: true }),
                            value: new fields.StringField({ required: true, blank: true }),
                            attributeModifier: new fields.StringField({ required: true, blank: true, nullable: true }),
                            attributeMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                            damageMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                            overallMultiplier: new fields.NumberField({ ...requiredNumber, initial: 1, min: 0 }),
                            penetration: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                        })
                    )
                }),
                guard: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: this.getModifierBuilderField(),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: this.getModifierBuilderField(true),
                        operator: new fields.StringField({ ...blankString })
                    })
                }),
                risk: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: this.getModifierBuilderField(),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: this.getModifierBuilderField(true),
                        operator: new fields.StringField({ ...blankString }),
                        lateParse: new fields.BooleanField({ required: true, initial: false })
                    })
                }),
                wounds: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: this.getModifierBuilderField(),
                            operator: new fields.StringField({ ...blankString })
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            type: new fields.StringField({ ...blankString }),
                            value: this.getModifierBuilderField(true),
                            operator: new fields.StringField({ ...blankString })
                        })
                    )
                }),
                resolve: new fields.SchemaField({
                    self: new fields.SchemaField({
                        value: this.getModifierBuilderField(),
                        operator: new fields.StringField({ ...blankString })
                    }),
                    target: new fields.SchemaField({
                        value: this.getModifierBuilderField(true),
                        operator: new fields.StringField({ ...blankString }),
                    })
                }),
                resources: new fields.SchemaField({
                    self: new fields.ArrayField(
                        new fields.SchemaField({
                            summary: new fields.StringField({ required: true, blank: true }),
                            type: new fields.StringField({ ...blankString }),
                            value: this.getModifierBuilderField(false),
                            operator: new fields.StringField({ ...blankString }),
                        })
                    ),
                    target: new fields.ArrayField(
                        new fields.SchemaField({
                            summary: new fields.StringField({ required: true, blank: true }),
                            type: new fields.StringField({ ...blankString }),
                            value: this.getModifierBuilderField(true),
                            operator: new fields.StringField({ ...blankString }),
                        })
                    ),
                }),
                concepts: new fields.SchemaField(Object.keys(CONFIG.ABBREW.concepts).reduce((obj, concept) => {
                    obj[concept] = new fields.SchemaField({
                        name: new fields.StringField({ required: true, initial: concept }),
                        label: new fields.StringField({ required: true, initial: CONFIG.ABBREW.concepts[concept] }),
                        value: new fields.StringField({ ...blankString }),
                        operator: new fields.StringField({ ...blankString }),
                        type: new fields.StringField({ ...blankString }),
                        numerator: new fields.NumberField({ ...requiredInteger, initial: 1 }),
                        denominator: new fields.NumberField({ ...requiredInteger, initial: 1 })
                    });
                    return obj;
                }, {}))
            })
        });
        schema.skillType = new fields.StringField({ ...blankString });
        schema.path = new fields.SchemaField({
            raw: new fields.StringField({ ...blankString }),
            value: new fields.SchemaField({
                id: new fields.StringField({ ...blankString })
            })
        });
        schema.roles = new fields.SchemaField({
            raw: new fields.StringField({ ...blankString }),
            parsed: new fields.ArrayField(
                new fields.StringField({ ...blankString }),
            ),
        });
        schema.archetype = new fields.StringField({ ...blankString })
        schema.attributeIncrease = new fields.StringField({ ...blankString });
        schema.attributeIncreaseLong = new fields.StringField({ ...blankString });
        schema.attributeRankIncrease = new fields.StringField({ ...blankString });
        schema.isProxied = new fields.BooleanField({ required: true, initial: false });
        schema.siblingSkillModifiers = new fields.ArrayField(
            new fields.ObjectField({ nullable: false })
        );

        return schema;
    }

    static getModifierBuilderField(lateParseInitial = false) {
        const fields = foundry.data.fields;
        const blankString = { required: true, blank: true }
        const requiredNumber = { required: true, nullable: false };
        return new fields.ArrayField(
            new fields.SchemaField({
                operator: new fields.StringField({ ...blankString }),
                type: new fields.StringField({ ...blankString }),
                path: new fields.StringField({ ...blankString }),
                multiplier: new fields.NumberField({ ...requiredNumber, initial: 1 }),
                lateParse: new fields.BooleanField({ required: true, initial: lateParseInitial })
            })
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.isActivatable) {
            this.action.actionCostOperator = "";
        }

        for (const index in this.action.modifiers.resources.self) {
            const resourceField = this.action.modifiers.resources.self[index];
            const typeId = getSafeJson(resourceField.summary, [{ id: "" }])[0].id;
            this.action.modifiers.resources.self[index].type = typeId;
        };

        for (const index in this.action.modifiers.resources.target) {
            const resourceField = this.action.modifiers.resources.target[index];
            const typeId = getSafeJson(resourceField.summary, [{ id: "" }])[0].id;
            this.action.modifiers.resources.target[index].type = typeId;
        };

        if (this.path.raw) {
            this.path.value.id = getSafeJson(this.path.raw, [{ label: "" }])[0].id;
        }

        if (this.roles.raw) {
            this.roles.parsed = getSafeJson(this.roles.raw, []).map(r => r.label);
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