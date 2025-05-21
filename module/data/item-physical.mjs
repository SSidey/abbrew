import { getNumericParts, getSafeJson } from '../helpers/utils.mjs';
import AbbrewItemBase from './item-base.mjs'

export default class AbbrewPhysicalItem extends AbbrewItemBase {

    static defineSchema() {
        const schema = super.defineSchema();
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const blankString = { required: true, blank: true };

        schema.quantity = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
        schema.heft = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
        schema.complexity = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
        schema.meta = new fields.SchemaField(
            this.getMetaEntries()
        );
        schema.equipType = new fields.StringField({ ...blankString });
        schema.equipPoints = new fields.SchemaField({
            required: new fields.SchemaField({
                raw: new fields.StringField({ ...blankString }),
                parsed: new fields.ArrayField(
                    new fields.SchemaField({
                        value: new fields.StringField({ ...blankString })
                    })
                )
            }),
            provided: new fields.SchemaField({
                raw: new fields.StringField({ ...blankString }),
                parsed: new fields.ArrayField(
                    new fields.SchemaField({
                        value: new fields.StringField({ ...blankString })
                    })
                )
            })
        });
        schema.handsRequired = new fields.StringField({ ...blankString });
        schema.equipState = new fields.StringField({ required: true, blank: false, initial: 'stowed' });
        schema.handsSupplied = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.actionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.exertActionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.validEquipStates = new fields.ArrayField(
            new fields.SchemaField({
                label: new fields.StringField({ ...blankString }),
                value: new fields.StringField({ ...blankString }),
            })
        );
        schema.skills = new fields.SchemaField({
            granted: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ ...blankString }),
                    skillType: new fields.StringField({ ...blankString }),
                    id: new fields.StringField({ ...blankString }),
                    image: new fields.StringField({ ...blankString }),
                    sourceId: new fields.StringField({ ...blankString })
                })
            )
        });
        schema.availableEnhancements = new fields.NumberField({ ...requiredInteger, initial: 0 });

        return schema;
    }

    // Prior to Active Effects
    prepareBaseData() {
        switch (this.equipType) {
            case "none":
                this.clearHeldDetails();
                this.clearWornDetails();
                break;
            case "held":
                this.clearWornDetails();
                break;
            case "worn":
                this.clearHeldDetails();
                break;
        }

        const baseEquipStateObject = this.equipType === "innate" ? CONFIG.ABBREW.innateEquipState : CONFIG.ABBREW.wornEquipState;
        const baseEquipStates = Object.entries(baseEquipStateObject).map(s => ({ value: s[0], label: s[1] }));
        const validHands = CONFIG.ABBREW.hands[this.handsRequired]?.states ?? [];
        const additionalEquipStates = this.equipType === "innate" ? [] : validHands.map(s => ({ value: s, label: CONFIG.ABBREW.equipState[s] }))
        this.validEquipStates = [...additionalEquipStates, ...baseEquipStates];
        this.handsSupplied = this.equipType === "innate" ? 1 : getNumericParts(this.equipState);
        this.actionCost = 0 + this.handsSupplied ?? 1;
        this.exertActionCost = 1 + this.handsSupplied ?? 2;
        this.equipPoints.required.parsed = getSafeJson(this.equipPoints.required.raw, []);
        // 1 (Material) + Bonus from quality
        this.availableEnhancements = 1 + this.meta.quality - this.meta.tier - this.enhancements.reduce((result, enhancement) => result += enhancement.cost, 0);

        super.prepareBaseData();
    }

    clearHeldDetails() {
        this.hands = 0;
    }

    clearWornDetails() {
        this.equipPoints.required.raw = "[]";
    }

    // Post Active Effects
    prepareDerivedData() {
    }

    /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
    static migrateData(source) {
        return super.migrateData(source);
    }

    static getMetaEntries() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        return {
            ...AbbrewItemBase.getMetaEntries(),
            size: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 }),
            quality: new fields.NumberField({ ...requiredInteger, initial: 0 })
        }
    }
}