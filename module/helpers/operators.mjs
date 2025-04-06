export function applyOperator(base, value, operator, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
    const unboundedValue = applyOperatorUnbounded(base, value, operator);
    return Math.max(Math.min(unboundedValue, max), min);
}

function applyOperatorUnbounded(base, value, operator) {
    switch (operator) {
        case 'add':
            return base += value;
        case 'equal':
            return value;
        case 'minus':
            return base -= value;
        default:
            return base;
    }
}