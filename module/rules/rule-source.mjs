export class RuleSource {
    actor;
    item;
    uuid;

    constructor(uuid) {
        this.uuid = uuid;
        this.actor = "";
        this.item = "";
        const parts = uuid.split('.');
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] == "Actor") {
                this.actor = parts[i + 1]
            }
            if (parts[i] == "Item") {
                this.item = parts[i + 1];
            }
        }
    }
}