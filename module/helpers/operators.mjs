export function applyOperator(base, value, operator) {
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