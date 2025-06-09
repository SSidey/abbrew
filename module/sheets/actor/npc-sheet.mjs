import { AbbrewCharacterSheet } from "./character-sheet.mjs";

/**
 * Extend the basic ActorSheet
 * @extends {ActorSheetV2}
 */
export class AbbrewNPCSheet extends AbbrewCharacterSheet {
    constructor(options = {}) {
        super(options);
    }

    /** @override */
    static PARTS = {
        header: {
            template: "systems/abbrew/templates/actor/npc-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        overview: {
            template: "systems/abbrew/templates/actor/tabs/actor-overview.hbs",
            scrollable: [""]
        },
        defenses: {
            template: "systems/abbrew/templates/actor/tabs/actor-defenses.hbs",
            scrollable: [""]
        },
        skills: {
            template: "systems/abbrew/templates/actor/tabs/actor-skills.hbs",
            scrollable: [""]
        },
        items: {
            template: "systems/abbrew/templates/actor/tabs/actor-items.hbs",
            scrollable: [""]
        },
        description: {
            template: "systems/abbrew/templates/actor/tabs/actor-description.hbs",
            scrollable: [""]
        },
        effects: {
            template: "systems/abbrew/templates/actor/tabs/actor-effects.hbs",
            scrollable: [""]
        },
        visible: {
            template: "systems/abbrew/templates/actor/tabs/actor-visible.hbs",
            scrollable: [""]
        }
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "overview", icon: "fa-solid fa-square-poll-vertical" },
                { id: "defenses", icon: "fa-solid fa-shield-halved" },
                { id: "skills", icon: "fa-solid fa-hurricane" },
                { id: "items", icon: "fa-solid fa-suitcase" },
                { id: "description", icon: "fa-solid fa-book" },
                { id: "effects", icon: "fa-solid fa-wand-magic-sparkles" },
                { id: "visible", icon: "fa-solid fa-eye-low-vision" }
            ],
            initial: "overview",
            labelPrefix: "SHEET.ACTOR.TABS"
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.tabs = this._prepareTabs("primary");
        if (!game.user.isActiveGM) {
            context.tabs = {
                "visible": {
                    "group": "primary",
                    "id": "visible",
                    "active": true,
                    "icon": "fa-solid fa-eye-low-vision",
                    "cssClass": "active",
                    "label": "SHEET.ACTOR.TABS.visible"
                }
            }
        }

        return context;
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case "overview":
            case "defenses":
            case "skills":
            case "items":
            case "biography":
            case "effects":
            case "visible":
                const actorData = context.document;
                context.actor = actorData;
                context.items = actorData.items;
        }

        if (partId in context.tabs) {
            context.tab = context.tabs[partId];
        }

        return context;
    }

    /** @override */
    _configureRenderOptions(options) {
        super._configureRenderOptions(options);

        options.parts = ["header", "tabs"]
        if (game.user.isGM) {
            options.parts.push("overview", "defenses", "skills", "items", "description", "effects");
        }
        options.parts.push('visible')
    }

    _canRender(_options) {
        switch (this.document.type) {
            case "npc":
                return true;
            case 'character':
            default:
                return super._canRender(_options);
        }
    }
}