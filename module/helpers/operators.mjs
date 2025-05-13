import { getSafeJson } from "./utils.mjs";

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
            return JSON.stringify([...getSafeJson(base, []), value]);
        case "split":
            return JSON.stringify(removeItem(getSafeJson(base, []), value));
        default:
            return base;
    }
}

function removeItem(base, value) {
    const index = base.findIndex(v => v.key === value.key);
    if (index > -1) { // only splice array when item is found
        base.splice(index, 1); // 2nd parameter means remove one item only
    }

    return base;
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