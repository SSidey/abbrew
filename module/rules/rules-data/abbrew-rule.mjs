export class AbbrewRule {
    id;
    label;
    type;
    priority;
    predicate;
    // The property to modify e.g. system.statistics.strength.value
    target;
    source;
    valid;

    get _type() {
        return this.type;
    }

    constructor(id, label, type, source, valid) {
        this.type = type;
        this.priority = 100;
        this.id = id;
        this.label = label;
        this.valid = valid;
        this.source = source;
        this.predicate = "";
        this.target = "";
    }

    template() { return JSON.stringify(this); };

    static applyRule(rule, actorData) { return {}; }

    static validate(candidate) {
        return candidate.hasOwnProperty('type') && candidate.hasOwnProperty('priority') && candidate.hasOwnProperty('predicate') && candidate.hasOwnProperty('target');
    }
}

