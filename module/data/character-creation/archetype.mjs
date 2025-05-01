import { getSafeJson } from "../../helpers/utils.mjs";
import AbbrewItemBase from "../item-base.mjs";

export default class AbbrewArchetype extends AbbrewItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.roleRequirements = new fields.SchemaField(Array.from({ length: 5 }, (_, i) => i + 1).reduce((obj, requirement) => {
            obj[requirement] = new fields.SchemaField({
                isActive: new fields.BooleanField({ required: true, initial: false }),
                roles: new fields.StringField({ required: true, blank: true }),
                parsedRoles: new fields.ArrayField(
                    new fields.SchemaField({
                        label: new fields.StringField({ required: true, blank: true }),
                        value: new fields.StringField({ required: true, blank: true }),
                        description: new fields.StringField({ required: true, blank: true })
                    })
                ),
                restrictedRoles: new fields.StringField({ required: true, blank: true }),
                parsedRestrictedRoles: new fields.ArrayField(
                    new fields.SchemaField({
                        label: new fields.StringField({ required: true, blank: true }),
                        value: new fields.StringField({ required: true, blank: true }),
                        description: new fields.StringField({ required: true, blank: true })
                    })
                ),
                isMajor: new fields.BooleanField({ required: true, initial: false, nullable: false }),
                path: new fields.SchemaField({
                    raw: new fields.StringField({ required: true, blank: true }),
                    name: new fields.StringField({ required: true, blank: true }),
                    id: new fields.StringField({ required: true, blank: true })
                })
            });
            return obj;
        }, {}));

        schema.skillIds = new fields.ArrayField(
            new fields.StringField({ required: true, blank: true })
        );

        return schema;
    }

    // Pre Active Effects
    prepareBaseData() {
        Object.values(this.roleRequirements).forEach(requirement => {
            requirement.parsedRoles = getSafeJson(requirement.roles, []);
            requirement.parsedRestrictedRoles = getSafeJson(requirement.restrictedRoles, []);
            const path = getSafeJson(requirement.path.raw, [{ name: "", id: "" }])[0];
            requirement.path.name = path.value;
            requirement.path.id = path.id;
        });
    }

    // Post Active Effects
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}