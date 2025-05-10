import AbbrewPhysicalItem from "./item-physical.mjs";

export default class AbbrewAmmunition extends AbbrewPhysicalItem {

    static defineSchema() {
        const schema = super.defineSchema();

        this.addAmmunitionSchema(schema);

        return schema;
    }

    static addAmmunitionSchema(schema) {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.type = new fields.StringField({ required: true, blank: true });
        schema.attackModifier = new fields.SchemaField({
            critical: new fields.NumberField({ ...requiredInteger, initial: 10, min: 5 }),
            lethal: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 }),
            damage: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({ required: true, blank: true }),
                    value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    attributeModifier: new fields.StringField({ required: true, blank: true }),
                    attributeMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
                    damageMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
                    overallMultiplier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
                    penetration: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                })
            )
        }); // TODO: Skills granted on ammo and weapon use purely for that attack e.g. grant, activate on create, instant temporary 1use
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
    }

    prepareDerivedData() {
        // Build the formula dynamically using string interpolation
        const roll = this.roll;

        // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
    }
}