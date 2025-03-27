export default class AbbrewItemBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const schema = {};

    const fields = foundry.data.fields;

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.traits = new fields.StringField({ required: true, blank: true });
    schema.abbrewId = new fields.SchemaField({
      value: new fields.StringField({ required: true, blank: true }),
      uuid: new fields.StringField({ required: true, blank: true })
    });

    return schema;
  }

  // Prior to Active Effects
  prepareBaseData() {
    if (this.abbrewId.value === "") {
      this.abbrewId.value = this.generateAbbrewId();
      this.abbrewId.uuid = this.parent._id;
    }
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

  generateAbbrewId() {
    return `abbrew.${this.parent.type}.${this.parent.name.toLowerCase().replace(/\s/g, '')}.${this.parent._id}`
  }
}