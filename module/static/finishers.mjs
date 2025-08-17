export const FINISHERS = {
    "untyped": {
        1: { "type": "physical", "wounds": [{ "type": "physical", "value": 1 }], "traits": ["physical"], "text": "Target is wounded" },
        2: { "type": "physical", "wounds": [{ "type": "physical", "value": 2 }], "traits": ["physical"], "text": "Target is wounded" },
        4: { "type": "physical", "wounds": [{ "type": "physical", "value": 3 }], "traits": ["physical"], "text": "Target is wounded" },
        8: { "type": "physical", "wounds": [{ "type": "physical", "value": 4 }], "traits": ["physical"], "text": "Target is wounded" }
    }, "crushing": {
        1: { "type": "crushing", "wounds": [{ "type": "physical", "value": 1 }], "traits": ["crushing"], "text": "Target is wounded" },
        2: { "type": "crushing", "wounds": [{ "type": "physical", "value": 2 }], "traits": ["crushing"], "text": "Target is wounded" },
        4: { "type": "crushing", "wounds": [{ "type": "physical", "value": 3 }], "traits": ["crushing", "break"], "text": "Target is wounded" },
        8: { "type": "crushing", "wounds": [{ "type": "physical", "value": 5 }], "traits": ["crushing", "break", "dismember", "destroy"], "text": "Target limb is broken" }
    },
    "piercing": {
        1: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 1 }], "traits": ["piercing"], "text": "Target bleeds lesser" },
        2: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 2 }], "traits": ["piercing"], "text": "Target bleeds moderate" },
        4: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 3 }], "traits": ["piercing", "break"], "text": "Target bleeds greater" },
        8: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 5 }], "traits": ["piercing", "break"], "text": "Target bleeds critically" }
    },
    "slashing": {
        1: { "type": "slashing", "wounds": [{ "type": "physical", "value": 1 }], "traits": ["slashing"], "text": "Target is cut" },
        2: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 1 }], "traits": ["slashing"], "text": "Target bleeds lesser" },
        4: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 2 }], "traits": ["slashing", "break"], "text": "Target bleeds moderate" },
        8: { "type": "slashing", "wounds": [{ "type": "physical", "value": 4 }], "traits": ["slashing", "dismember"], "text": "Target loses a limb" }
    },
    "fire": {
        1: { "type": "fire", "wounds": [{ "type": "burn", "value": 1 }], "traits": ["fire"], "text": "Target is burned" },
        2: { "type": "fire", "wounds": [{ "type": "burn", "value": 2 }], "traits": ["fire"], "text": "Target is burned" },
        4: { "type": "fire", "wounds": [{ "type": "burn", "value": 3 }], "traits": ["fire", "break"], "text": "Target is greatly burned" },
        8: { "type": "fire", "wounds": [{ "type": "burning", "value": 2 }, { "type": "burn", "value": 2 }], "traits": ["fire", "dismember", "destroy"], "text": "Target is burned and continues to smoulder" }
    }
}
