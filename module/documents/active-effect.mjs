import { getTokenCenter, handleThreat } from "../helpers/combat.mjs";
import { parsePathSync } from "../helpers/modifierBuilderFieldHelpers.mjs";
import { getSafeJson } from "../helpers/utils.mjs";
import AbbrewActor from "./actor.mjs";

export default class AbbrewActiveEffect extends ActiveEffect {

    async _preCreate(data, options, userId) {
        if (data.flags?.abbrew?.skill?.trackDuration && this.parent.effects.find(e => e.flags?.abbrew?.skill?.trackDuration === data.flags.abbrew.skill.trackDuration)) {
            return false;
        }

        super._preCreate(data, options, userId);
    }

    async _preDelete(options, userId) {

        super._preDelete(options, userId);
    }

    async _preUpdate(changed, options, userId) {

        super._preUpdate(changed, options, userId);
    }

    shouldRetainBlind() {
        return this.parent.items.filter(i => i.type === "skill").filter(s => s.system.senses.modifiesSenses).length === 0
    }

    apply(actor, change) {
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
        change.value = parsePathSync(modifierPath, actor, this.parent) * ((modifier.numerator ?? 1) / (modifier.denominator ?? 1));
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

