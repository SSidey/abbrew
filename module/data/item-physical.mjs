import { getNumericParts } from '../helpers/utils.mjs';
import AbbrewItemBase from './item-base.mjs'

export default class AbbrewPhysicalItem extends AbbrewItemBase {

    static defineSchema() {
        const schema = super.defineSchema();
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.quantity = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
        schema.weight = new fields.NumberField({ required: true, nullable: false, initial: 0, min: 0 });
        schema.meta = new fields.SchemaField({
            size: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 }),
        });
        schema.equipType = new fields.StringField({ required: true, blank: true });
        schema.armourPoints = new fields.StringField({ required: true, blank: true });
        schema.handsRequired = new fields.StringField({ required: true, blank: true });
        schema.equipState = new fields.StringField({ required: true, blank: false, initial: 'stowed' });
        schema.handsSupplied = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.actionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.exertActionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.validEquipStates = new fields.ArrayField(
            new fields.SchemaField({
                label: new fields.StringField({ required: true, blank: true }),
                value: new fields.StringField({ required: true, blank: true }),
            })
        );
        schema.skills = new fields.SchemaField({
            granted: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({ required: true, blank: true }),
                    skillType: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    image: new fields.StringField({ required: true, blank: true }),
                    sourceId: new fields.StringField({ required: true, blank: true })
                })
            )
        });

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