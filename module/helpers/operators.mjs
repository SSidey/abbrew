export function applyOperator(base, value, operator, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
    const unboundedValue = applyOperatorUnbounded(base, value, operator);
    return Math.max(Math.min(unboundedValue, max), min);
}

function applyOperatorUnbounded(base, value, operator) {
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
        default:
            return base;
    }
}

export function getOrderForOperator(operator) {
    switch (operator) {
        case "equal":
            return 0;
        case "add":
            return 1;
        case "minus":
            return 2;
        default:
            return -1;
    }
}