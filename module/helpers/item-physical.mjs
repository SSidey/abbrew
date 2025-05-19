export function isEquipped(item) {
    const equipType = item.system.equipType;
    const equipState = item.system.equipState;
    switch (equipType) {
        case "held":
            return equipState.startsWith('held');
        case "innate":
            return equipState === "active";
        case "worn":
            return equipState === "worn";
        default:
            return false;
    }
}