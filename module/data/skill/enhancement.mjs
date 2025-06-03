import { getSafeJson } from "../../helpers/utils.mjs";
import AbbrewSkillDeck from "./skill-deck.mjs";

export default class AbbrewEnhancement extends AbbrewSkillDeck {

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredNumber = { required: true, nullable: false };
        const requiredInteger = { ...requiredNumber, integer: true };
        const blankString = { required: true, blank: true };
        const schema = super.defineSchema();

        schema.targetType = new fields.StringField({ ...blankString });
        schema.target = new fields.SchemaField({
            name: new fields.StringField({ ...blankString }),
            id: new fields.StringField({ ...blankString }),
            uuid: new fields.StringField({ ...blankString })
        });
        schema.enhancementType = new fields.StringField({ ...blankString });
        schema.traitFilter = new fields.SchemaField({
            raw: new fields.StringField({ ...blankString }),
            value: new fields.ArrayField(
                new fields.SchemaField({
                    key: new fields.StringField({ ...blankString }),
                    value: new fields.StringField({ ...blankString }),
                    feature: new fields.StringField({ ...blankString }),
                    subFeature: new fields.StringField({ ...blankString }),
                    effect: new fields.StringField({ ...blankString }),
                    data: new fields.StringField({ ...blankString }),
                    exclude: new fields.ArrayField(
                        new fields.StringField({ ...blankString })
                    )
                })
            )
        });
        schema.modifications = new fields.ArrayField(
            new fields.SchemaField({
                operator: new fields.StringField({ ...blankString }),
                path: new fields.StringField({ ...blankString }),
                filterPath: new fields.StringField({ ...blankString }),
                filterValue: new fields.StringField({ ...blankString }),
                subPath: new fields.StringField({ ...blankString }),
                subPathFilter: new fields.StringField({ ...blankString }),
                subPathFilterValue: new fields.StringField({ ...blankString }),
                field: new fields.StringField({ ...blankString }),
                type: new fields.StringField({ ...blankString }),
                value: new fields.StringField({ ...blankString }),
                numerator: new fields.NumberField({ ...requiredNumber, initial: 1 }),
                denominator: new fields.NumberField({ ...requiredNumber, initial: 1 }),
            })
        );
        schema.duration = new fields.SchemaField({
            precision: new fields.StringField({ ...blankString }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            expireOnStartOfTurn: new fields.BooleanField({ required: true, initial: true })
        });
        schema.grantedIds = new fields.ArrayField(
            new fields.StringField({ ...blankString })
        );
        schema.cost = new fields.NumberField({ ...requiredInteger, initial: 1 });

        return schema;
    }

    prepareBaseData() {
        super.prepareBaseData();

        if (this.traitFilter.raw) {
            this.traitFilter.value = getSafeJson(this.traitFilter.raw, []);
        }
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}