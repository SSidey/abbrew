import Tagify from "@yaireo/tagify";

export const ItemTraitsMixin = superclass => class extends superclass {
    constructor(args) {
        super(args);
    }

    _activateTraits() {
        const traitFilter = this.element.querySelector('input[name="system.traits.raw"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: this.TRAITS_WHITELIST,
            enforceWhitelist: true
        };
        if (traitFilter) {
            var taggedTraitFilter = new Tagify(traitFilter, settings);
        }
    }
}