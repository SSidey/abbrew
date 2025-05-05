import Tagify from "@yaireo/tagify";

export class AbbrewActiveEffectSheet extends ActiveEffectConfig {
    /** @override */
    get template() {
        const path = 'systems/abbrew/templates/effect';
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.hbs`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.hbs`.
        return `${path}/active-effect.hbs`;
    }

    /** @override */
    async getData() {
        const context = await super.getData();

        context.abbrewChanges = [];
        context.data.changes.forEach((c, i) => {
            const modifier = context.data.system.modifiers[i] ?? ({ parseMode: "" });
            context.abbrewChanges.push(({ ...c, ...modifier }));
        });

        context.config = CONFIG.ABBREW;

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        this._activateKeys(html);
    }

    _activateKeys(html) {
        const keys = html[0].querySelectorAll('input[name$=".key"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
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