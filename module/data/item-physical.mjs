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
        schema.equipState = new fields.StringField({ required: true, blank: false, initial: 'readied' });
        schema.handsSupplied = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.actionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.exertActionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
        schema.validEquipStates = new fields.ArrayField(
            new fields.SchemaField({
                label: new fields.StringField({ ...blankString }),
                value: new fields.StringField({ ...blankString }),
                cost: new fields.NumberField({ ...requiredInteger, initial: 0 })
            })
        );
        schema.nextValidEquipStates = new fields.ArrayField(
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
        schema.storage = new fields.SchemaField({
            hasStorage: new fields.BooleanField({ required: true, initial: false }),
            type: new fields.StringField({ ...blankString }),
            accessible: new fields.BooleanField({ required: true, initial: false }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            storedItems: new fields.ArrayField(
                new fields.StringField({ ...blankString })
            ),
            traitFilter: new fields.SchemaField({
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
            })
        });
        schema.storeIn = new fields.StringField({ ...blankString });

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


        this.validEquipStates = this.getValidEquipStates();
        this.handsSupplied = this.equipType === "innate" ? 1 : getNumericParts(this.equipState);
        this.actionCost = 0 + this.handsSupplied ?? 1;
        this.exertActionCost = 1 + this.handsSupplied ?? 2;
        this.equipPoints.required.parsed = getSafeJson(this.equipPoints.required.raw, []);
        this.equipPoints.provided.parsed = getSafeJson(this.equipPoints.provided.raw, []);
        if (this.storage.hasStorage && this.storage.traitFilter.raw) {
            this.storage.traitFilter.value = getSafeJson(this.storage.traitFilter.raw, []);
        } else {
            this.storage.traitFilter.value = [];
        }
        // 1 (Material) + Bonus from quality
        this.availableEnhancements = this.meta.quality - this.enhancements.reduce((result, enhancement) => result += enhancement.cost, 0);
        this.prepareStorageValue();

        super.prepareBaseData();
    }

    prepareStorageValue() {
        if (this.storage.hasStorage && this.parent.actor) {
            const storedItems = this.parent.actor.items.filter(i => this.storage.storedItems.includes(i._id));
            if (this.storage.type === "count") {
                this.storage.value = storedItems.filter(i => i.system.equipState === "stowed").map(i => i.system.quantity).reduce((total, count) => total += count, 0);
            } else if (this.storage.type === "heft") {
                this.storage.value = storedItems.filter(i => i.system.equipState === "stowed").map(i => i.system.quantity * i.system.heft).reduce((total, heft) => total += heft, 0);
            }
        }
    }

    getValidEquipStates() {
        if (this.equipType) {
            if (this.equipState === "worn") {
                return [{ value: "readied", label: "ABBREW.EquipStateChange.readied", cost: 2 }];
            }

            const baseEquipStateObject = this.getBaseEquipStates();
            const validEquipStates = Object.entries(baseEquipStateObject).map(s => ({ value: s[0], label: CONFIG.ABBREW.equipStateChange[s[0]], cost: this.getEquipStateChangeCost(s) }));

            return validEquipStates.filter(e => e.value !== this.equipState);
        }
    }

    getBaseEquipStates() {
        const base = CONFIG.ABBREW.equipState[this.equipType];

        switch (this.equipType) {
            case "innate":
            case "worn":
            case "none":
                return base;
            case "held":
                const validHands = CONFIG.ABBREW.hands[this.handsRequired]?.filterStates ?? [];
                return Object.keys(base).filter(key => !validHands?.includes(key)).reduce((obj, key) => { obj[key] = base[key]; return obj }, {});
        }
    }

    getEquipStateChangeCost(state) {
        if (state[0] === "dropped" || this.equipType === "innate") {
            return 0;
        } else if (state === "readied") {
            return 2;
        }
        else {
            return 1;
        }
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