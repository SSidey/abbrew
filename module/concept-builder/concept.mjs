export class Concept {
    name;
    value;
    description;
    concepts;

    constructor(name, value, description, concepts = []) {
        this.name = name;
        this.value = value;
        this.description = description;
        this.concepts = concepts;
    }
}