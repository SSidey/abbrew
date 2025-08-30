const { ArrayField, SchemaField, StringField } = foundry.data.fields;

export const summaryElement = () => new SchemaField({
    name: new StringField({ required: true, blank: true }),
    id: new StringField({ required: true, blank: true }),
    image: new StringField({ required: true, blank: true }),
    sourceId: new StringField({ required: true, blank: true })
})

export const summaryElementCollection = () => new ArrayField(
    summaryElement()
);