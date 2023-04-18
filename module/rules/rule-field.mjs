import { AbbrewActiveEffect } from "./rules-data/active-effect.mjs";
import { AbbrewChoiceSet } from "./rules-data/choice-set.mjs";

export class AbbrewRuleField {
    id;
    type;
    label;
    content;
    origin;
    options;

    constructor({ id, type, label, content, origin }) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.content = content;
        this.origin = origin;
        this.options = options;
    }
}

export const options = [
    new AbbrewActiveEffect(),
    new AbbrewChoiceSet()
]

