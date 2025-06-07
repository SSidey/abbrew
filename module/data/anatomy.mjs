import AbbrewPhysicalItem from "./item-physical.mjs";
import AbbrewEquipment from "./item-equipment.mjs";

export default class AbbrewAnatomy extends AbbrewPhysicalItem {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.parts = new fields.StringField({ required: true, blank: true });
    schema.isBroken = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isDismembered = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.hands = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.speed = new fields.SchemaField(Object.keys(CONFIG.ABBREW.speeds).reduce((obj, speed) => {
      obj[speed] = new fields.SchemaField({
        label: new fields.StringField({ required: true, blank: true }),
        value: new fields.NumberField({ required: true, nullable: true, integer: true, min: 0 }),
      });
      return obj;
    }, {}))
    AbbrewEquipment.addDefenseSchema(schema);
    schema.naturalWeapons = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        id: new fields.StringField({ required: true, blank: true }),
        image: new fields.StringField({ required: true, blank: true }),
        sourceId: new fields.StringField({ required: true, blank: true })
      })
    );
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

    return schema;
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.speed) {
      const rawLabel = CONFIG.ABBREW.speeds[key].label;
      this.speed[key].label = game.i18n.localize(rawLabel) ?? rawLabel;
    }
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation
    const roll = this.roll;

    // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
    super.prepareDerivedData();
  }
}