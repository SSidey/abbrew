export class EquipStateManager {
    static getValidEquipStates(equipType, equipState, handsRequired, storeIn) {
        const baseEquipStateObject = this.getBaseEquipStates(equipType, handsRequired);
        let validEquipStates = Object.entries(baseEquipStateObject).map(s => ({ value: s[0], label: CONFIG.ABBREW.equipStateChange[s[0]], cost: this.getEquipStateChangeCost(s) })).filter(e => e.value !== equipState);
        if (!storeIn || (storeIn && !storeIn.system.storage.accessible && storeIn.system.equipState !== "readied")) {
            validEquipStates = validEquipStates.filter(e => e.value !== "stowed");
        }

        switch (equipType) {
            case "held":
                return this.getHeldEquipStateChanges(equipState, validEquipStates, storeIn);
            case "worn":
                return this.getWornEquipStateChanges(equipState, validEquipStates, storeIn);
            case "innate":
                return this.getWornInnateStateChanges(equipState, validEquipStates, storeIn);
            case "":
                return this.getNoneInnateStateChanges(equipState, validEquipStates, storeIn);
        }

        const fullValidEquipStates = validEquipStates
        if (storeIn && !equipState !== "dropped" && !equipState !== "stowed") {
            return fullValidEquipStates;
        } else if (equipState === "dropped") {
            return fullValidEquipStates
        } else if (equipState === "stowed") {
            return fullValidEquipStates.filter(e => e.value !== "dropped");
        } else {
            return fullValidEquipStates;
        }
    }

    static getHeldEquipStateChanges(equipState, validEquipStates, storeIn) {
        if (!storeIn || equipState === "dropped") {
            return validEquipStates.filter(e => e.value !== "stowed")
        } else if (equipState === "stowed") {
            return validEquipStates.filter(e => e.value !== "dropped")
        }
        else {
            return validEquipStates;
        }
    }

    static getWornEquipStateChanges(equipState, validEquipStates, storeIn) {
        if (equipState === "worn") {
            return [{ value: "readied", label: "ABBREW.EquipStateChange.readied", cost: 2 }];
        }

        if (equipState === "dropped") {
            return [{ value: "readied", label: "ABBREW.EquipStateChange.pickup", cost: 1 }];
        }

        if (storeIn) {
            return validEquipStates;
        } else {
            return validEquipStates.filter(e => e.value !== "stowed");
        }
    }

    static getWornInnateStateChanges(equipState, validEquipStates, storeIn) {
        return validEquipStates;
    }

    static getNoneInnateStateChanges(equipState, validEquipStates, storeIn) {
        if (!storeIn || equipState === "dropped") {
            return [
                { value: "readied", label: "ABBREW.EquipStateChange.pickup", cost: 1 },
                ...validEquipStates.filter(e => e.value !== "stowed")
            ];
        } else if (equipState === "stowed") {
            return [
                { value: "readied", label: "ABBREW.EquipStateChange.pickup", cost: 1 },
                ...validEquipStates.filter(e => e.value !== "dropped")
            ];
        }
        else {
            return validEquipStates;
        }
    }

    static getBaseEquipStates(equipType, handsRequired) {
        const cleanedEquipType = equipType === "" ? "none" : equipType;
        const base = CONFIG.ABBREW.equipState[cleanedEquipType];

        switch (cleanedEquipType) {
            case "innate":
            case "worn":
            case "none":
                return base;
            case "held":
                const validHands = CONFIG.ABBREW.hands[handsRequired]?.filterStates ?? [];
                return Object.keys(base).filter(key => !validHands?.includes(key)).reduce((obj, key) => { obj[key] = base[key]; return obj }, {});
        }
    }

    static getEquipStateChangeCost(state, equipType) {
        if (state[0] === "dropped" || equipType === "innate") {
            return 0;
        } else if (state === "readied") {
            return 2;
        }
        else {
            return 1;
        }
    }
}