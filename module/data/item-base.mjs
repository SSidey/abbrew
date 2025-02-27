export default class AbbrewItemBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const schema = {};

    AbbrewItemBase.addItemSchema(schema);

    return schema;
  }

  static addItemSchema(schema) {
    const fields = foundry.data.fields;

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.traits = new fields.StringField({ required: true, blank: true });
    schema.equipState = new fields.StringField({ required: true, blank: false, initial: 'stowed' });
  }
}