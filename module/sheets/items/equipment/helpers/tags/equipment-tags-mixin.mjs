import Tagify from "@yaireo/tagify";

export const EquipmentTagsMixin = superclass => class extends superclass {
    activateAllEquipmentTraits() {
        const element = this.element;
        this._activateEquipPoints(element);
        this._activateAnatomyParts(element);
        this._activateStorageTraitFilter(element);
    }

    _activateEquipPoints(element) {
        const equipPoints = element.querySelectorAll(`input[name^="system.equipPoints."]`);
        const equipPointsSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.values(CONFIG.ABBREW.equipPoints.points).map(key => game.i18n.localize(key))]
        };
        if (equipPoints) {
            var taggedEquipPoints = [];
            equipPoints.forEach(e => {
                taggedEquipPoints.push(new Tagify(e, equipPointsSettings));
            })
        }
    }

    _activateAnatomyParts(element) {
        const anatomyParts = element.querySelector('input[name="system.parts"]');
        const anatomyPartsSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.values(CONFIG.ABBREW.equipPoints.points).map(key => game.i18n.localize(key))]
        };
        if (anatomyParts) {
            var taggedAnatomyParts = new Tagify(anatomyParts, anatomyPartsSettings);
        }
    }

    _activateStorageTraitFilter(element) {
        const traitFilter = element.querySelector('input[name="system.storage.traitFilter.raw"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.traits.filter(t => t.feature === "item").map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
        };
        if (traitFilter) {
            var taggedTraitFilter = new Tagify(traitFilter, settings);
        }
    }
}