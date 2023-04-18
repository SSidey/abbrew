import { AbbrewActiveEffect } from "./rules-data/active-effect.mjs";
import { AbbrewChoiceSet } from "./rules-data/choice-set.mjs";

export class AbbrewRuleField {
    id;
    type;
    label;
    content;
    source;
    options;

    constructor({ id, type, label, content, source }) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.content = content;
        this.source = source;
        this.options = options;
    }
}

export const options = [
    new AbbrewActiveEffect(),
    new AbbrewChoiceSet()
]

