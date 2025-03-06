import { mergeWoundsWithOperator } from "./combat.mjs";
import { applyOperator } from "./operators.mjs";
import { getObjectValueByStringPath } from "../helpers/utils.mjs"

export async function activateSkill(actor, skill) {
    let updates = {};
    if (skill.action.modifiers.guard.self.value) {
        const rawValue = skill.action.modifiers.guard.self.value;
        const value = isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
        const skilledGuard = applySkillsForGuard(value, actor);
        const guard = applyOperator(
            actor.system.defense.guard.value,
            skilledGuard,
            skill.action.modifiers.guard.self.operator
        );
        updates["system.defense.guard.value"] = guard;
    }
    if (skill.action.modifiers.wounds.self.length > 0) {
        let updateWounds = actor.system.wounds;
        skill.action.modifiers.wounds.self.filter(w => w.value && w.type && w.operator).forEach(w => updateWounds = mergeWoundsWithOperator(updateWounds, [{ type: w.type, value: w.value }], w.operator));
        updates["system.wounds"] = updateWounds;
    }

    await actor.update(updates);
}



function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function parsePath(rawValue, actor) {
    const entityType = rawValue.split('.').slice(0, 1).shift();
    const entity = (function () {
        switch (entityType) {
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();
    const path = (function () {
        switch (entityType) {
            case 'actor':
                return rawValue.split('.').slice(1).join('.');
            case 'item':
                return rawValue.split('.').slice(2).join('.');
        }
    })();
    if (getObjectValueByStringPath(entity, path)) {
        return getObjectValueByStringPath(entity, path);
    }
}

function applySkillsForGuard(value, actor) {
    let skilledValue = value;
    const skillFlags = actor.items.filter(i => i.type === 'skill').filter(i => i.system.skillFlags).flatMap(i => JSON.parse(i.system.skillFlags).map(ap => ap.value));
    if (skillFlags.includes("Shield Training")) {
        const heldArmour = actor.getActorHeldItems().filter(i => i.type === 'armour').reduce((result, a) => result += a.system.defense.guard, 0);
        skilledValue += heldArmour;
    }

    return skilledValue;
}