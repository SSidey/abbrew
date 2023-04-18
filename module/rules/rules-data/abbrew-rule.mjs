export class AbbrewRule {
    type;
    priority;
    predicate;
    target;

    get _type() {
        return this.type;
    }

    constructor(type) {
        this.type = type;
        this.priority = 100;
        this.predicate = "";
        this.target = "";
    }

    template() { return JSON.stringify(this); };

    static applyRule(rule, actorData) { return {}; }

    static validate(candidate) {
        return candidate.hasOwnProperty('type') && candidate.hasOwnProperty('priority') && candidate.hasOwnProperty('predicate') && candidate.hasOwnProperty('target');
    }
}

