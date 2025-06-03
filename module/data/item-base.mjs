import { compareModifierIndices, getSafeJson } from "../helpers/utils.mjs";

export default class AbbrewItemBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const schema = {};
    const blankString = { required: true, blank: true };
    const requiredInteger = { required: true, nullable: false, integer: true };
    const fields = foundry.data.fields;

    schema.name = new fields.SchemaField({
      base: new fields.StringField({ ...blankString }),
      parts: new fields.ArrayField(
        new fields.SchemaField({
          key: new fields.StringField({ ...blankString }),
          part: new fields.StringField({ ...blankString }),
          affix: new fields.StringField({ ...blankString }),
          order: new fields.NumberField({ ...requiredInteger })
        })
      )
    });
    schema.meta = new fields.SchemaField(this.getMetaEntries());
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
    schema.enhancements = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ ...blankString }),
        enhancementType: new fields.StringField({ ...blankString }),
        id: new fields.StringField({ ...blankString }),
        image: new fields.StringField({ ...blankString }),
        uuid: new fields.StringField({ ...blankString }),
        cost: new fields.NumberField({ ...requiredInteger, initial: 0 })
      })
    );

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

    this.prepareName();
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

  prepareName() {
    if (this.name.parts.length > 0) {
      if (!this.name.base) {
        this.name.base = this.parent.name;
      }

      const orderedPrefixes = this.name.parts.filter(p => p.affix === "-1").sort(compareModifierIndices).map(p => game.i18n.localize(p.part));
      const suffixes = this.name.parts.filter(p => p.affix === "1").map(p => game.i18n.localize(p.part));
      const fullNameArray = [...orderedPrefixes, this.name.base, ...suffixes];
      this.parent.name = fullNameArray.join(" ");
    } else if (this.name.base) {
      this.parent.name = this.name.base;
    }
  }

  static getMetaEntries() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    return { tier: new fields.NumberField({ ...requiredInteger, initial: 1 }) };
  }
}