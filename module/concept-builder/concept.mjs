export class Concept {
    name;
    description;
    concepts;

    constructor(name, description, concepts = []) {
        this.name = name;
        this.description = description;
        this.concepts = concepts;
    }
}