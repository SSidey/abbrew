import { AbbrewActiveEffect } from "./rules-data/active-effect.mjs";
import { AbbrewChoiceSet } from "./rules-data/choice-set.mjs";

export class AbbrewRuleField {
    id;
    type;
    active;
    label;
    content;
    source;
    options;
    targetElement;

    constructor({ id, type, label, content, source }) {
        this.id = id;
        this.type = type;
        this.active = true;
        this.label = label;
        this.content = content;
        this.source = source;
        this.options = options;
        this.targetElement = "";
    }
}

export const options = [
    new AbbrewActiveEffect(),
    new AbbrewChoiceSet()
]

