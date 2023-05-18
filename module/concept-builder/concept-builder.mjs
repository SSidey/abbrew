import { Concept } from "./concept.mjs";
import { createSpell } from "./spell-builder.mjs";

export class ConceptBuilder extends Dialog {
    concepts;
    activeConcept;
    conceptParents;
    savedConcepts;
    description;
    conceptValue;
    conceptComplexity;
    conceptEffects;

    constructor(data = { builderTitle }, options = {}) {
        options.width = 516;
        options.buttons = {};
        data.content.builderTitle = "Concept Builder";
        data.buttons = {};
        super(data, options);
        this.concepts = [];
        this.description = "";
        this.activeConcept = "";
        this.conceptValue = "";
        this.conceptComplexity = "";
        this.conceptEffects = "";
        this.conceptParents = [];
        this.savedConcepts = [];
    }


    /** @override */
    get template() {
        return "systems/abbrew/templates/concept-builder/builder.hbs";
    }

    /** @override */
    activateListeners($html) {
        const html = $html[0];

        html.querySelector(".concept-name").onchange = this.onConceptNameChange.bind(this);
        html.querySelector(".concept-value").onchange = this.onConceptValueChange.bind(this);
        html.querySelector(".concept-complexity").onchange = this.onConceptComplexityChange.bind(this);
        html.querySelector(".concept-effects-editor").onchange = this.onConceptEffectsChange.bind(this);

        document.querySelectorAll('li.item').forEach((li) => {
            li.ondragstart = this.onDragStart;
        });

        document.querySelectorAll('li[item]').forEach((li) => {
            li.ondragstart = this.onDragStart;
        });

        html.querySelector(".concept-name").ondragstart = this.ignoreDragStart.bind(this);
        html.querySelector(".concept-value").ondragstart = this.ignoreDragStart.bind(this);
        html.querySelector(".concept-complexity").ondragstart = this.ignoreDragStart.bind(this);
        html.querySelector(".concept-effects-editor").ondragstart = this.ignoreDragStart.bind(this);

        html.querySelector(".main-concept").ondragstart = this.onMainConceptDragStart.bind(this);
        html.querySelector(".main-concept").ondragover = this.onDragOver;
        html.querySelector(".main-concept").ondrop = this.onDrop.bind(this);

        html.querySelector(".saved-concepts").ondragstart = this.onSavedConceptDragStart.bind(this);
        html.querySelector(".saved-concepts").ondragover = this.onDragOver;
        html.querySelector(".saved-concepts").ondrop = this.onDropForSave.bind(this);

        html.querySelector(".builder-buttons").onclick = this.onButtonsClick.bind(this);
    }

    ignoreDragStart(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    onConceptNameChange(ev) {
        this.activeConcept = ev.target.value;
    }

    onConceptValueChange(ev) {
        this.conceptValue = ev.target.value;
    }

    onConceptComplexityChange(ev) {
        this.conceptComplexity = ev.target.value;
    }

    onConceptEffectsChange(ev) {
        this.conceptEffects = ev.target.value;
    }

    onButtonsClick(ev) {
        ev.preventDefault();
        if (ev.target && ev.target.classList[0] == "concept-builder-button") {
            if (ev.target.id == "clear") {
                this.reset();
            } else if (ev.target.id == "clearSaved") {
                this.savedConcepts = [];
            } else if (ev.target.id === "createConcept") {
                if (!this.activeConcept) {
                    return;
                }
                const itemData = {
                    name: this.activeConcept,
                    type: 'concept',
                    flags: { createdBy: game.users.current.name, createdById: game.users.current.id },
                    system: { description: this.description, value: this.conceptValue, effects: this.conceptEffects, complexity: +this.conceptComplexity, concepts: this.concepts }
                };
                delete itemData.system.type;
                const tokens = canvas.tokens.controlled.filter((token) => token.actor);
                let actor;
                if (tokens.length > 0) {
                    actor = tokens[0].actor;
                } else {
                    actor = game.actors.get("R1GFMOm51DVBezHq");
                }
                return actor.createEmbeddedDocuments("Item", [itemData]);
            } else if (ev.target.id === "createSpell") {
                createSpell(new Concept(this.activeConcept, this.conceptValue, this.description, this.conceptEffects, this.conceptComplexity, this.concepts));
            }
            this.render();
        }
    }

    onDragOver(ev) {
        ev.preventDefault();
    }

    onDrop(ev) {
        const dataString = ev.dataTransfer.getData("text");
        const abbrewDataString = ev.dataTransfer.getData("abbrew");
        const savedConceptString = ev.dataTransfer.getData("abbrew-savedConcept");

        if (savedConceptString) {
            const savedConceptData = JSON.parse(savedConceptString);
            this.handleConceptDrop(savedConceptData);
            this.render();
            return;
        }

        // TODO: Something odd happening when using from folder...
        // not just from folder
        // looks like they somehow get updated?
        let item;
        if (dataString && JSON.parse(dataString).uuid.split('.')[0] == "Actor") {
            const uuidSplit = JSON.parse(dataString).uuid.split('.');
            const actorId = uuidSplit[1];
            const itemId = uuidSplit[3];
            item = game.actors.get(actorId).items.get(itemId);
        }
        else if (dataString && JSON.parse(dataString).uuid.split('.')[0] == "Item") {
            const uuidSplit = JSON.parse(dataString).uuid.split('.');
            const itemId = uuidSplit[1];
            item = game.items.get(itemId);
        } else if (abbrewDataString) {
            const abbrewData = JSON.parse(abbrewDataString);
            const itemId = Object.keys(abbrewData).includes("documentId") ? abbrewData["documentId"] : abbrewData["itemId"];
            item = game.items.get(itemId)
        } else {
            return;
        }

        if (item && item.type == "concept") {
            this.handleConceptItemDrop(item);
            this.render();
        } else {
            this.handleItemDrop(item);
            this.render();
        }
    }

    // On save or create concept, sum the complexities and apply modifications to effects
    handleConceptDrop(concept) {
        if (this.activeConcept === "") {
            this.activeConcept = concept.name;
            this.conceptValue = concept.conceptValue;
            this.description = concept.description;
            this.conceptEffects = concept.effects;
            this.conceptComplexity = +concept.complexity;
            this.concepts = (concept.concepts);
        } else {
            this.concepts.push(new Concept(concept.name, concept.conceptValue, concept.description, concept.effects, +concept.complexity, concept.concepts));
        }
    }

    handleConceptItemDrop(conceptItem) {
        const safeConcept = deepClone(conceptItem)
        if (this.activeConcept === "") {
            this.activeConcept = safeConcept.name;
            this.conceptValue = safeConcept.system.value;
            this.description = safeConcept.system.description;
            this.conceptEffects = safeConcept.system.effects;
            this.conceptComplexity = +safeConcept.system.complexity;
            this.concepts = [...safeConcept.system.concepts];
        } else {
            this.concepts.push(new Concept(safeConcept.name, safeConcept.system.value, safeConcept.system.description, safeConcept.system.effects, +safeConcept.system.complexity, safeConcept.system.concepts));
        }
    }

    handleItemDrop(item) {
        const safeItem = deepClone(item)
        if (this.activeConcept === "") {
            this.activeConcept = safeItem.name;
            this.conceptValue = "";
            this.description = safeItem.system.description;
            this.conceptEffects = "";
            this.conceptComplexity = 0;
            this.concepts = [...safeItem.system.concepts];
        } else {
            const itemConcept = new Concept(safeItem.name, "", safeItem.system.description, "", 0, safeItem.system.concepts)
            this.concepts.push(itemConcept);
        }
    }

    onDropForSave(ev) {
        const conceptString = ev.dataTransfer.getData("abbrew-concept");
        const conceptData = JSON.parse(conceptString);
        if (conceptData.name) {
            this.savedConcepts.push(conceptData);
            this.reset();
            this.render();
        }
    }

    reset() {
        this.conceptEffects = "";
        this.conceptComplexity = "";
        this.activeConcept = "";
        this.conceptValue = "";
        this.description = ""
        this.concepts = [];
    }

    onDragStart(ev) {
        ev.dataTransfer.setData("abbrew", JSON.stringify(ev.target.dataset));
    }

    onMainConceptDragStart(ev) {
        ev.dataTransfer.setData("abbrew-concept", JSON.stringify({ name: this.activeConcept, conceptValue: this.conceptValue, description: this.description, concepts: this.concepts }));
    }

    onSavedConceptDragStart(ev) {
        if (ev.target && ev.target.classList[0] == "saved-concept") {
            const savedConcept = this.savedConcepts[ev.target.dataset.id]
            ev.dataTransfer.setData("abbrew-savedConcept", JSON.stringify(savedConcept));
        }
    }

    async getData() {
        // no super to Application
        const data = super.getData();

        data.header = this.data.header;
        data.footer = this.data.footer;

        data.activeConcept = this.activeConcept;
        data.description = this.description;
        data.conceptValue = this.conceptValue;
        data.concepts = this.concepts;
        data.savedConcepts = this.savedConcepts;
        data.builderTitle = this.data.content.builderTitle;
        data.conceptComplexity = this.conceptComplexity;
        data.conceptEffects = this.conceptEffects;

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