import { parsePathSync } from "../helpers/modifierBuilderFieldHelpers.mjs";
import { getSafeJson } from "../helpers/utils.mjs";

export default class AbbrewActiveEffect extends ActiveEffect {

    apply(actor, change) {
        console.log("Apply Here");
        let field;
        const changes = {};
        change.key = getSafeJson(change.key, [{ label: "" }])[0].label
        if (change.key.startsWith("system.")) {
            if (actor.system instanceof foundry.abstract.DataModel) {
                field = actor.system.schema.getField(change.key.slice(7));
            }
        } else field = actor.schema.getField(change.key);
        const modifier = change.effect.system.modifiers[change.index];
        const modifierPath = [modifier.parseMode, change.value].join(".");
        change.value = parsePathSync(modifierPath, actor, this.parent) * (modifier.numerator / modifier.denominator);
        if (field) changes[change.key] = this.constructor.applyField(actor, change, field);
        else this._applyLegacy(actor, change, changes);
        return changes;
    }

    static applyField(model, change, field) {
        field ??= model.schema.getField(change.key);
        const current = foundry.utils.getProperty(model, change.key);
        const update = field.applyChange(current, model, change);
        foundry.utils.setProperty(model, change.key, update);
        return update;
    }
}