export default class AbbrewItemBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const schema = {};

    AbbrewItemBase.addItemSchema(schema);

    return schema;
  }

  static addItemSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.traits = new fields.StringField({ required: true, blank: true });
    schema.equipType = new fields.StringField({ required: true, blank: true });
    schema.armourPoints = new fields.StringField({ required: true, blank: true });
    schema.hands = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.equipState = new fields.StringField({ required: true, blank: false, initial: 'stowed' });
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
  }

  clearHeldDetails() {
    this.hands = 0;
  }

  clearWornDetails() {
    this.armourPoints = "[]";
  }
}