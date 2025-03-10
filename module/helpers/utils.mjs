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
    return path.split('.').reduce(function (o, k) {
        return o && o[k];
    }, entity);
}

export function getNumericParts(value) {
    return parseInt(value.replace(/\D/g, "")) ?? 0
}
