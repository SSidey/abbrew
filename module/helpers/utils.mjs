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