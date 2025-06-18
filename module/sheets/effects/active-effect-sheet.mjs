import { ActiveEffectTagsMixin } from "./tags/active-effect-tags.mjs";

const { ActiveEffectConfig } = foundry.applications.sheets;

export class AbbrewActiveEffectSheet extends ActiveEffectTagsMixin(ActiveEffectConfig) {

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['abbrew', 'sheet'],
        position: {
            width: 800
        }
    }

    /** @override */
    static PARTS = {
        header: { template: "templates/sheets/active-effect/header.hbs" },
        tabs: { template: "templates/generic/tab-navigation.hbs" },
        details: { template: "templates/sheets/active-effect/details.hbs", scrollable: [""] },
        duration: { template: "templates/sheets/active-effect/duration.hbs" },
        changes: { template: "systems/abbrew/templates/effect/parts/changes.hbs", scrollable: ["ol[data-changes]"] },
        footer: { template: "templates/generic/form-footer.hbs" }
    };

    /** @override */
    static TABS = {
        sheet: {
            tabs: [
                { id: "details", icon: "fa-solid fa-book" },
                { id: "duration", icon: "fa-solid fa-clock" },
                { id: "changes", icon: "fa-solid fa-gears" }
            ],
            initial: "details",
            labelPrefix: "EFFECT.TABS"
        }
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.abbrewChanges = [];
        context.source.changes.forEach((c, i) => {
            const modifier = context.document.system.modifiers[i] ?? ({ parseMode: "" });
            context.abbrewChanges.push(({ ...c, ...modifier }));
        });

        context.system = this.document.system;

        context.config = CONFIG.ABBREW;

        return context;
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        this._activateKeys();
    }
}