export function addAttributesToSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };

    schema.attributes = new fields.SchemaField(Object.keys(CONFIG.ABBREW.attributes).reduce((obj, attribute) => {
        obj[attribute] = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 2 }),
            label: new fields.StringField({ required: true, blank: true }),
            isEnabled: new fields.BooleanField({ required: true, nullable: false, initial: false })
        });
        return obj;
    }, {}));
}

export function prepareDerivedAttributeData(obj) {
    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (const key in obj.attributes) {
        // Handle attribute label localization.
        obj.attributes[key].label = game.i18n.localize(CONFIG.ABBREW.attributes[key]) ?? key;
    }
}