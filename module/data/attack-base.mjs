export default class AbbrewAttackBase extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const schema = super.defineSchema();

        AbbrewAttackBase.addAttackSchema(schema);

        return schema;
    }

    static addAttackSchema(schema) {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.attackProfiles = new fields.ArrayField(
            new fields.SchemaField({
                name: new fields.StringField({ required: true, blank: true }),
                attackType: new fields.StringField({ required: true, blank: true }),
                lethal: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                critical: new fields.NumberField({ ...requiredInteger, initial: 10, min: 5 }),
                reach: new fields.StringField({ required: true, blank: true }),
                range: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                rangedPenetration: new fields.NumberField({ ...requiredInteger, initial: 0 }),
                ammunition: new fields.SchemaField({
                    type: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true }),
                    value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                    reloadType: new fields.StringField({ required: true, blank: true }),
                    reloadActionCost: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 })
                }),
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
                ),
                finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 }),
                hasStrongAttack: new fields.BooleanField({ required: true, nullable: false, initial: true })
            })
        );
    }

    prepareDerivedData() { }
}