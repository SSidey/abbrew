import { Concept } from "./concept.mjs";

export class ConceptBuilder extends Dialog {
    concepts;

    constructor(data = { builderTitle }, options = {}) {
        options.buttons = {};
        data.buttons = {};
        super(data, options);
        this.concepts = [];
    }


    /** @override */
    get template() {
        return "systems/abbrew/templates/concept-builder/builder.hbs";
    }

    /** @override */
    activateListeners($html) {
        const html = $html[0];

        html.querySelectorAll("a[data-choice], button[type=button]").forEach((element) => {
            element.addEventListener("click", (event) => {
                console.log('clicked');
                // Get the actual selection
                this.selection = event.currentTarget.dataset.id;
                this.close();
            });
        });


        document.querySelectorAll('li.item').forEach((li) => {
            li.ondragstart = this.onDragStart;
        });
        document.querySelectorAll('li[item]').forEach((li) => {
            li.ondragstart = this.onDragStart;
        });

        html.querySelector(".main-concept").ondragover = this.onDragOver;
        html.querySelector(".main-concept").ondrop = this.onDrop.bind(this);
    }

    onDragOver(ev) {
        ev.preventDefault();
    }

    onDrop(ev) {
        const dataString = ev.dataTransfer.getData("text");
        const abbrewDataString = ev.dataTransfer.getData("abbrew");
        console.log(dataString);
        console.log(abbrewDataString);
        let item;
        if(dataString && JSON.parse(dataString).uuid.split('.')[0] == "Actor") {
            const uuidSplit = JSON.parse(dataString).uuid.split('.');
            const actorId = uuidSplit[1];
            const itemId = uuidSplit[3];
            item = game.actors.get(actorId).items.get(itemId);
        }
        else if(dataString && JSON.parse(dataString).uuid.split('.')[0] == "Item") {
            const uuidSplit = JSON.parse(dataString).uuid.split('.');
            const itemId = uuidSplit[1];
            item = game.items.get(itemId);
        } else {
            const abbrewData = JSON.parse(abbrewDataString);
            const itemId = Object.keys(abbrewData).includes("documentId") ? abbrewData["documentId"] : abbrewData["itemId"];
            item = game.items.get(itemId)
        }
        console.log(item);
        if(item && item.type == "concept") {
            this.concepts.push(new Concept(item.name, item.system.concepts))
            this.render();
        }
    }

    onDragStart(ev) {
        ev.dataTransfer.setData("abbrew", JSON.stringify(ev.target.dataset));
    }

    getData() {
        console.log("getData", this);
        // no super to Application
        const data = super.getData();

        data.header = this.data.header;
        data.footer = this.data.footer;

        data.concepts = this.concepts;
        data.builderTitle = data.content.builderTitle;

        console.log(data);

        return data;
    }

    renderBuilder() {
        this.render(true);
    }

    /** @override */
    /** Close the dialog, applying the effect with configured target or warning the user that something went wrong. */
    async close({ force = false } = {}) {
        await super.close({ force });
    }
}