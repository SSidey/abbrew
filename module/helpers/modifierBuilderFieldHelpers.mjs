import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { compareModifierIndices, getObjectValueByStringPath, getSafeJson } from "./utils.mjs";
const { FormDataExtended } = foundry.applications.ux;

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
            parsedValue = parsePathSync(fullPath, actor, source) ?? 0;
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

export function applyFullyParsedModifiers(parsedModifiers, actor, updatePath, key = null, keyValue = null) {
    const update = key && keyValue ? [] : {};
    if (parsedModifiers && parsedModifiers.length > 0) {
        const startingValue = getStartingValue(actor, updatePath, key, keyValue);
        const updateValue = parsedModifiers.reduce((result, modifier) => {
            const modifierValue = reduceParsedModifiers(modifier.value, 0);
            result = applyOperator(result, modifierValue, modifier.operator);
            return result;


        }, startingValue);

        update[updatePath] = getUpdatePayload(updateValue, key, keyValue, update);
    }

    return update;
}

export function mergeComplexModifierFields(modifierFields, actor, typeSpecificFiltering) {
    const groupedModifiers = modifierFields
        .filter(m => m.length > 0)
        .flatMap(m => typeSpecificFiltering(m.filter(v => v.type && v.value != null && v.operator)))
        .reduce((result, modifier) => {
            if (modifier.type in result) {
                result[modifier.type].push({ ...modifier, index: getOrderForOperator(modifier.operator) })
                result[modifier.type].sort(compareModifierIndices);
            } else {
                result[modifier.type] = [{ ...modifier, index: getOrderForOperator(modifier.operator) }]
            }

            return result;
        }, {});

    const parsedModifiers = Object.entries(groupedModifiers)
        .map(([k, v], i) => {
            const [update, lateModifiers] = mergeModifierFields(v, actor);
            return ({ type: k, update: update, lateModifiers: lateModifiers });
        });

    return parsedModifiers;
}

export function applyFullyParsedComplexModifiers(parsedComplexFields, actor, updatePath, key) {
    const update = {};
    update[updatePath] = [];
    parsedComplexFields.forEach(f => {
        const value = applyFullyParsedModifiers(f.update, actor, updatePath, key, f.type)[updatePath];
        if (value) {
            update[updatePath].push(value);
        }
    });

    return update[updatePath].length > 0 ? update : {};
}

export function getStartingValue(actor, updatePath, key, keyValue) {
    let startingValue;
    if (key && keyValue) {
        startingValue = getObjectValueByStringPath(actor, updatePath).find(v => v[key] === keyValue)?.value ?? 0;
    } else {
        startingValue = getObjectValueByStringPath(actor, updatePath) ?? 0;
    }

    return startingValue;
}

function getUpdatePayload(updateValue, key, keyValue) {
    if (key) {
        const update = {};
        update[key] = keyValue;
        update["value"] = updateValue;
        return update;
    } else {
        return updateValue;
    }
}

export function reduceParsedModifiers(parsedValues, startingValue = 0) {
    return parsedValues.reduce((result, value) => {
        result = applyOperator(result, value.path, value.operator);
        return result;
    }, startingValue);
}

/* 
    Expects either a number value which will be returned early, or:
    actor.<pathToValue e.g. system.defense.guard.value>
    item.<pathToValue e.g. system.isActivatable>
    resource.<resourceId e.g. this is the abbrewId.uuid>
    damage.<"lastDealt"/"lastReceived"/"roundReceived", damageType e.g. all damage "all" / specific "slashing">
    wound.<"sin"/"corruption">
    conditionType.<positive/negative>
    condition.<"offguard">
    skillCount.<AbbrewId.uuid>
 */
export function parsePathSync(rawValue, actor, source, target) {
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
    const secondPart = rawValue.split('.').slice(1).shift();

    switch (entityType) {
        case 'string':
            return secondPart;
        case 'trait':
            return getTrait(secondPart);
        case 'name':
            return getNamePart(secondPart)
        case 'json':
            return getObjectFromJson(secondPart);
        case 'numeric':
            return parseFloat(secondPart) ?? 0;
        case 'skillCount':
            return getSkillCount(actor, secondPart);
        case 'condition':
            return getConditionValue(actor, secondPart);
        case 'statustype':
            return getStatusTypeValue(actor, secondPart);
        case 'wound':
            return getWoundValue(actor, secondPart);
        case 'resource':
            return getResourceValue(actor, secondPart);
        case 'damage':
            return getLastDamageValue(actor, rawValue.split('.').slice(1, 2).shift(), rawValue.split('.').slice(2).shift());
    }

    const entity = (function () {
        switch (entityType) {
            case 'this':
                return source;
            case 'target':
                return target;
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
            case 'target':
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

function getObjectFromJson(value) {
    return getSafeJson(value, {});
}

function getTrait(value) {
    const traits = CONFIG.ABBREW.traits.filter(t => t.key === value);
    return traits.map(t => ({ ...t, value: game.i18n.localize(t.value) ?? t.value }))[0];
}

function getNamePart(value) {
    const nameParts = CONFIG.ABBREW.nameParts.filter(t => t.key === value);
    return nameParts.map(n => ({ ...n, part: game.i18n.localize(n.part) ?? n.part }))[0];
}

function getResourceValue(actor, id) {
    return actor.system.resources.values.find(r => r.id === id)?.value ?? 0;
}

function getWoundValue(actor, woundType) {
    return actor.system.wounds.find(w => w.type === woundType)?.value ?? 0;
}

function getSkillCount(actor, id) {
    return actor.items.filter(i => i.type === "skill").filter(s => s.system.abbrewId.uuid === id).length;
}

function getConditionValue(actor, conditionName) {
    const name = conditionName.toLowerCase();
    const id = CONFIG.ABBREW.conditions[name].id;
    const skill = actor.items.filter(i => i.type === "skill").find(s => s.system.abbrewId.uuid === id);
    const stacks = skill ? skill.system.action.uses.value : 0;
    return stacks;
}

function getStatusTypeValue(actor, conditionType) {
    const type = conditionType.toLowerCase();
    const value = actor.statuses.toObject().map(s => CONFIG.ABBREW.statusEffects[s].polarity).filter(p => p === type).length;
    return value;
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

// TODO: Why players see ?? on cards
// TODO: Why is initiative privated
// TODO: Hooks for combat turns are applying multiple times
// TODO: Hooks firing multiple times, reee
export async function getDialogValue(actor, asyncValues) {
    let result = 0;

    const fields = foundry.applications.fields;
    const ranges = {};
    const content = asyncValues.map(a => {
        if (a.type === "single") {
            const minMultiplier = a.minOperator === "add" ? 1 : -1;
            const maxMultiplier = a.maxOperator === "add" ? 1 : -1;
            const minimum = a.min ? minMultiplier * parsePathSync(`${a.minType}.${a.min}`, actor, null, null) : Number.NEGATIVE_INFINITY;
            const maximum = a.max ? maxMultiplier * parsePathSync(`${a.maxType}.${a.max}`, actor, null, null) : Number.POSITIVE_INFINITY;

            ranges[a.name] = { min: minimum, max: maximum };

            const singleInput = fields.createNumberInput({
                name: a.name,
                value: 0,
                min: minimum,
                max: maximum,
                required: true,
            });

            const singleGroup = fields.createFormGroup({
                input: singleInput,
                label: a.title
            });

            return singleGroup.outerHTML;
        }
    }).join(" ");

    try {
        result = await foundry.applications.api.DialogV2.prompt({
            window: { title: "Enter Skill Values" },
            content: content,
            ok: {
                label: "Submit",
                callback: (event, button, dialog) => new FormDataExtended(button.form).object
            },
            rejectClose: true
        });
    } catch (ex) {
        console.log(ex);
        console.log(`${actor.name} did not enter a value.`);
        return;
    }

    const validatedResult = Object.keys(result).reduce((validated, key) => {
        validated[key] = Math.min(ranges[key].max, Math.max(ranges[key].min, result[key]));
        return validated;
    }, {})

    return validatedResult;
}

export function mergeLateComplexModifiers(modifiers, actor, path, key) {
    if (!modifiers || modifiers.length === 0) {
        return;
    }

    let updates = {};
    let updateValues = [];

    modifiers.forEach(w => {
        const parsedUpdates = w.update;
        const lateModifiers = w.lateModifiers;
        const [lateUpdates,] = mergeModifierFields(lateModifiers, actor);
        const fullUpdates = [...parsedUpdates, ...lateUpdates].sort(compareModifierIndices);
        const updateValue = applyFullyParsedModifiers(fullUpdates, actor, path, key, w.type);

        updateValues = [...updateValues, updateValue[path]];
    });

    const fieldValue = getObjectValueByStringPath(actor, path);

    let fullValue = [...updateValues, ...fieldValue].reduce((result, value) => {
        if (!result.find(r => r[key] === value[key])) {
            result.push(value);
        }

        return result;
    }, []);

    updates[path] = fullValue;
    return updates;
}