export const FINISHERS = {
    "bludgeoning": {
        1: { "type": "bludgeoning", "wounds": [{ "type": "general", "value": 1 }], "text": "Target is wounded" },
        2: { "type": "bludgeoning", "wounds": [{ "type": "general", "value": 2 }], "text": "Target is wounded" },
        4: { "type": "bludgeoning", "wounds": [{ "type": "general", "value": 3 }], "text": "Target is wounded" },
        8: { "type": "bludgeoning", "wounds": [{ "type": "general", "value": 5 }], "text": "Target limb is broken" }
    },
    "piercing": {
        1: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 1 }], "text": "Target bleeds lesser" },
        2: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 2 }], "text": "Target bleeds moderate" },
        4: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 3 }], "text": "Target bleeds greater" },
        8: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 5 }], "text": "Target bleeds critically" }
    },
    "slashing": {
        1: { "type": "slashing", "wounds": [{ "type": "general", "value": 1 }], "text": "Target is cut" },
        2: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 1 }], "text": "Target bleeds lesser" },
        4: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 2 }], "text": "Target bleeds moderate" },
        8: { "type": "slashing", "wounds": [{ "type": "general", "value": 4 }], "text": "Target loses a limb" }
    },
    "general": {
        1: { "type": "general", "wounds": [{ "type": "general", "value": 1 }], "text": "Target is wounded" },
        2: { "type": "general", "wounds": [{ "type": "general", "value": 2 }], "text": "Target is wounded" },
        4: { "type": "general", "wounds": [{ "type": "general", "value": 3 }], "text": "Target is wounded" },
        8: { "type": "general", "wounds": [{ "type": "general", "value": 4 }], "text": "Target is wounded" }
    }
}
