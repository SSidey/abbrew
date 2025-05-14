import { getNumericParts } from '../helpers/utils.mjs';
import { AbbrewEnhancement } from './_module.mjs';
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
        schema.meta = new fields.SchemaField({
            // Where to place tier :(
            size: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 }),
            quality: new fields.SchemaField({
                base: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                value: new fields.NumberField({ ...requiredInteger, initial: 0 })
            })
        });
        schema.equipType = new fields.StringField({ ...blankString });
        schema.armourPoints = new fields.StringField({ ...blankString });
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
        // TODO: Would need to set up calculations for everything in a base item type e.g. sword and work from there        
        schema.material = new fields.SchemaField({
            id: new fields.StringField({ ...blankString }),
            name: new fields.StringField({ ...blankString }),
            img: new fields.StringField({ ...blankString }),
            modifiers: new fields.SchemaField({
                heftSizeRatio: new fields.NumberField({ required: true, initial: 0, min: 0 }),
                heftAdjustment: new fields.NumberField({ required: true, initial: 0, min: 0 }),
                complexityAdjustment: new fields.NumberField({ required: true, initial: 0, min: 0 }),
                tier: new fields.NumberField({ ...requiredInteger, initial: 1 }),
                enhancementsUsed: new fields.NumberField({ ...requiredInteger, initial: 0 })
            })
        });
        schema.availableEnhancements = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.enhancements = new fields.ArrayField(
            new fields.SchemaField({
                name: new fields.StringField({ ...blankString }),
                enhancementType: new fields.StringField({ ...blankString }),
                id: new fields.StringField({ ...blankString }),
                image: new fields.StringField({ ...blankString }),
                uuid: new fields.StringField({ ...blankString })
            })
        )

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

        // TODO: Craft requirement is material + quality must === tier
        // TODO: This should be derived from the quality - material.enhancementsUsed
        this.availableEnhancements = 1 - this.enhancements.length;

        super.prepareBaseData();
    }

    clearHeldDetails() {
        this.hands = 0;
    }

    clearWornDetails() {
        this.armourPoints = "[]";
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
}