import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { compareModifierIndices, getObjectValueByStringPath } from "./utils.mjs";

// [{ operator: String, type: String, path: String, multiplier: Number, lateParse: Boolean }], actor
// [{ operator: String, type: String, path: String, multiplier: Number, lateParse: Boolean }, ...]
export function parseModifierFieldValue(modifierFieldValue, actor, source) {
    const values = modifierFieldValue.filter(f => f.path !== "" && f.path != null && f.path !== undefined);
    const parsedValues = [];
    let fullyParsed = true;

    values.forEach(v => {
        if (v.lateParse) {
            parsedValues.push({ ...v, lateParse: false });
            fullyParsed = false;
            return;
        }

        const fullPath = [v.type, v.path].join(".");
        let parsedValue = 0;
        if (v.type === "numeric") {
            parsedValue = parseInt(v.path) ?? 0;
        } else {
            parsedValue = parsePath(fullPath, actor, source) ?? 0;
        }

        if (!isNaN(parsedValue)) {
            parsedValue = Math.floor(parsedValue * v.multiplier);
            parsedValue = { ...v, type: "numeric", path: parsedValue, multiplier: 1 };
            parsedValues.push(parsedValue);
        }
    });

    return ({ value: parsedValues, fullyParsed: fullyParsed });
}

export function mergeModifierFields(modifierFields, actor) {
    const parsedSkills = modifierFields.filter(m => m.operator).map(m => {
        const operator = m.operator;
        return ({ ...parseModifierFieldValue(m.value, actor, m), operator: operator, index: getOrderForOperator(operator) });
    }).sort(compareModifierIndices);

    const fullyParsed = parsedSkills.filter(s => s.fullyParsed);
    const toParse = parsedSkills.filter(s => !s.fullyParsed);

    return [fullyParsed, toParse];
}

export function applyFullyParsedModifiers(parsedModifiers, actor, updatePath) {
    const update = {};
    if (parsedModifiers && parsedModifiers.length > 0) {
        const startingValue = getObjectValueByStringPath(actor, updatePath) ?? 0;
        update[updatePath] = parsedModifiers.reduce((result, modifier) => {
            const modifierValue = reduceParsedModifiers(modifier.value, 0);
            result = applyOperator(result, modifierValue, modifier.operator);
            return result;
        }, startingValue);
    }

    return update;
}

export function reduceParsedModifiers(parsedValues, startingValue = 0) {
    return parsedValues.reduce((result, value) => {
        result = applyOperator(result, value.path, value.operator);
        return result;
    }, startingValue);
}

// TODO: Add html changed hook and preparse the value, setting to 0 if not correct syntax?
// TODO: Add format for status tracker? 
/* 
    Expects either a number value which will be returned early, or:
    actor.<pathToValue e.g. system.defense.guard.value>
    item.<pathToValue e.g. system.isActivatable>
    resource.<resourceId e.g. this is the abbrewId.uuid>
    damage.<"lastDealt"/"lastReceived"/"roundReceived", damageType e.g. all damage "all" / specific "slashing">
 */
function parsePath(rawValue, actor, source) {
    if (typeof rawValue != "string") {
        return rawValue;
    }

    if (!isNaN(rawValue)) {
        return parseFloat(rawValue);
    }

    if (rawValue === "") {
        return 0;
    }

    const entityType = rawValue.split('.').slice(0, 1).shift();

    switch (entityType) {
        case 'resource':
            return getResourceValue(actor, rawValue.split('.').slice(1).shift());
        case 'damage':
            return getLastDamageValue(actor, rawValue.split('.').slice(1, 2).shift(), rawValue.split('.').slice(2).shift());
    }

    const entity = (function () {
        switch (entityType) {
            case 'this':
                return source;
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();

    const path = (function () {
        switch (entityType) {
            case 'this':
            case 'actor':
                return rawValue.split('.').slice(1).join('.');
            case 'item':
                return rawValue.split('.').slice(2).join('.');
        }
    })();
    if (getObjectValueByStringPath(entity, path) != null) {
        return getObjectValueByStringPath(entity, path);
    }
}

function getResourceValue(actor, id) {
    return actor.system.resources.values.find(r => r.id === id)?.value ?? 0;
}

function getLastDamageValue(actor, instance, damageType) {
    if (!["lastDealt", "lastReceived", "roundReceived"].includes(instance)) {
        return 0;
    }
    const damage = actor.flags.abbrew.combat.damage[instance];
    if (!damage) {
        return 0;
    }

    if (damageType === "all") {
        return damage.map(d => d.value).reduce((partial, value) => partial += value, 0);
    }

    if (damage.some(d => d.damageType === damageType)) {
        return damage.find(d => d.damageType === damageType).value;
    }

    return 0;
}