/* -------------------------------------------- */
/*  IDs                                         */
/* -------------------------------------------- */

/**
 * Create an ID from the input truncating or padding the value to make it reach 16 characters.
 * @param {string} id
 * @returns {string}
 */
export function staticID(id) {
    if (id.length >= 16) return id.substring(0, 16);
    return id.padEnd(16, "0");
}

/* -------------------------------------------- */

export function doesNestedFieldExist(obj, props) {
    var splited = props.split('.');
    var temp = obj;
    for (var index in splited) {
        if (typeof temp[splited[index]] === 'undefined') return false;
        temp = temp[splited[index]]
    }
    return true
}

/* -------------------------------------------- */

export function arrayDifference(a, b) {
    return [...b.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) - 1),
        a.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map())
    )].reduce((acc, [v, count]) => acc.concat(Array(Math.abs(count)).fill(v)), []);
}

/* -------------------------------------------- */

export function getObjectValueByStringPath(entity, path) {
    if (!entity || !path) {
        return 0;
    }

    return path.split('.').reduce(function (o, k) {
        return o && o[k];
    }, entity);
}

/* -------------------------------------------- */

export function getNumericParts(value) {
    const parsed = parseInt(value.replace(/\D/g, ""));
    if (isNaN(parsed)) {
        return 0;
    }

    return parsed;
}

/* -------------------------------------------- */

export function getSafeJson(json, defaultValue) {
    if (!json || json === "") {
        return defaultValue;
    }

    return JSON.parse(json);
}

/* -------------------------------------------- */

export function intersection(a, b) {
    const setA = new Set(a);
    const foo = b.filter(value => setA.has(value));
    return foo;
}

/* -------------------------------------------- */

export async function renderSheetForTaggedData(event, actor) {
    const inspectionClass = "tagify__tag";
    const element = _checkThroughParentsForClass(event.target, inspectionClass, 2);
    const itemId = element.__tagifyTagData.id;
    const sourceId = element.__tagifyTagData.sourceId;
    if (itemId) {
        const item = actor?.items.find(i => i._id === itemId);
        if (item) {
            item.sheet.render(true);
            return;
        }
    }

    if (sourceId) {
        const source = await fromUuid(sourceId);
        source.sheet.render(true);
    }
}

export async function renderSheetForStoredItem(event, actor, inspectionClass) {
    const element = _checkThroughParentsForClass(event.target, inspectionClass, 3);
    const itemId = element.dataset.itemId;
    const sourceId = element.dataset.sourceId
    if (itemId && !sourceId) {
        const item = actor.items.find(i => i._id === itemId);
        if (item) {
            item.sheet.render(true);
        }
    } else if (sourceId) {
        const source = await fromUuid(sourceId);
        if (source) {
            source.sheet.render(true);
        } else {
            ui.notifications.warn("The item is not on your sheet, have you deleted it?");
        }
    }
}

function _checkThroughParentsForClass(element, inspectionClass, depth) {
    let returnElement = _elementClassListContainsClass(element, inspectionClass);
    if (!returnElement && depth > 0) {
        returnElement = _checkThroughParentsForClass(element.parentElement, inspectionClass, depth - 1);
    }

    if (returnElement) {
        return returnElement;
    }

    return null;
}

function _elementClassListContainsClass(element, inspectionClass) {
    return Object.values(element.classList).includes(inspectionClass) ? element : null;
}

export function compareModifierIndices(modifier1, modifier2) {
    if (modifier1.order < modifier2.order) {
        return -1;
    } else if (modifier1.order > modifier2.order) {
        return 1;
    }

    return 0;
}

export function filterKeys(raw, allowedKeys) {
    return Object.keys(raw)
        .filter(key => allowedKeys.includes(key))
        .reduce((obj, key) => {
            return {
                ...obj,
                [key]: raw[key]
            };
        }, {});
}

export function isATraitsSupersetOfBTraits(objA, objB) {
    return new Set(objA.system.traits.value.map(t => t.key)).isSupersetOf(new Set(objB.system.traits.value.map(t => t.key)));
}