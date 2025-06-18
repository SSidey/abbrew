import Tagify from "@yaireo/tagify";

export const ActiveEffectTagsMixin = superclass => class extends superclass {

    _activateKeys() {
        const keys = this.element.querySelectorAll('input[name$=".key"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: true,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: CONFIG.ABBREW.activeEffectKeys.map(k => ({ value: game.i18n.localize(k.label), label: k.value })),
            enforceWhitelist: true,
            maxTags: 1
        };
        if (keys) {
            var taggedKeys = [];
            keys.forEach(k => {
                taggedKeys.push(new Tagify(k, settings));
            })
        }
    }
}