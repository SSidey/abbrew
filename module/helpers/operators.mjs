import { getSafeJson, removeItem } from "./utils.mjs";

export function applyOperator(base, value, operator, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
    const unboundedValue = applyOperatorUnbounded(base, value, operator);
    return Math.max(Math.min(unboundedValue, max), min);
}

export function applyOperatorUnbounded(base, value, operator) {
    switch (operator) {
        case "add":
            return base += value;
        case "equal":
            return value;
        case "minus":
            return base -= value;
        case "upgrade":
            return Math.max(base, value);
        case "downgrade":
            return Math.min(base, value);
        case "suppress":
            return 0;
        case "merge":
            return mergeValues(base, value);
        case "split":
            return splitValues(base, value);
        default:
            return base;
    }
}

function mergeValues(base, value) {
    if(base === undefined || base === null) {
        return base;
    }

    if (typeof base === "string") {
        return JSON.stringify([...getSafeJson(base, []), value]);
    }

    return [...base, value]
}

function splitValues(base, value) {
    if(base === undefined || base === null) {
        return base;
    }
    
    if (typeof base === "string") {
        return JSON.stringify(removeItem(getSafeJson(base, []), value));
    }

    return removeItem(base, value)
}

export function getOrderForOperator(operator) {
    switch (operator) {
        case "equal":
            return 0;
        case "downgrade":
            return 1;
        case "upgrade":
            return 2;
        case "add":
            return 3;
        case "minus":
            return 4;
        default:
            return -1;
    }
}