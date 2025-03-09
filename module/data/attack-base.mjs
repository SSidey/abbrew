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
                damage: new fields.ArrayField(
                    new fields.SchemaField({
                        type: new fields.StringField({ required: true, blank: true }),
                        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
                        attributeModifier: new fields.StringField({ required: true, blank: true }),
                    })
                ),
                finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 }),
                // TODO: Should the number of actions required for attack/strong be hands and hands + 1?
                hasStrongAttack: new fields.BooleanField({ required: true, nullable: false, initial: true })
            })
        );
    }

    prepareDerivedData() { }
}