import { getSafeJson } from "../helpers/utils.mjs";

export default class AbbrewItemBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const schema = {};
    const blankString = { required: true, blank: true };
    const fields = foundry.data.fields;

    schema.description = new fields.StringField({ ...blankString });
    schema.traits = new fields.SchemaField({
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
    });
    schema.abbrewId = new fields.SchemaField({
      value: new fields.StringField({ ...blankString }),
      uuid: new fields.StringField({ ...blankString })
    });

    return schema;
  }

  // Prior to Active Effects
  prepareBaseData() {
    if (this.abbrewId.value === "") {
      this.abbrewId.value = this.generateAbbrewId();
      this.abbrewId.uuid = this.parent._id;
    }

    if (this.traits.raw) {
      this.traits.value = getSafeJson(this.traits.raw, []);
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