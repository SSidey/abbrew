export class Concept {
    name;
    value;
    description;
    concepts;
    effects;
    complexity;

    constructor(name, value, description, effects, complexity, concepts = []) {
        this.name = name;
        this.value = value;
        this.description = description;
        this.effects = effects;
        this.complexity = complexity;
        this.concepts = concepts;
    }
}