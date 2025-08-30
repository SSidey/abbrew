import Tagify from "@yaireo/tagify";
// import { getSafeJson } from "../../helpers/utils.mjs";
import { DragDropMixin } from "../helpers/drag-drop-mixin.mjs";
import { SearchMixin } from "../helpers/search-mixin.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SkillBrowser extends SearchMixin(DragDropMixin(HandlebarsApplicationMixin(ApplicationV2))) {
    static DEFAULT_OPTIONS = {
        actions: {
            renderSkillSheet: SkillBrowser.renderSkillSheet
        },
        position: {
            height: 1000,
            width: 1000
        },
        dragDrop: [
            { dragSelector: ".skill", dropSelector: null },
        ]
    }

    static PARTS = {
        browser: {
            template: "systems/abbrew/templates/browser/skill-browser.hbs"
        }
    }

    constructor(validSkills) {
        super();
        this.validSkills = validSkills;
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.skills = Array.from(this.validSkills.values().map(v => {
            return ({
                name: v.name,
                img: v.img,
                id: v.id,
                description: game.i18n.localize(`ABBREW.Skills.${v.name.replace(/\s+/g, "").toLowerCase()}`) ?? ""
            })
        }))

        context.traits = CONFIG.ABBREW.traits;

        return context;
    }

    _canDragStart(selector) {
        // game.user fetches the current user
        return true;
    };

    /**
     * Callback actions which occur at the beginning of a drag start workflow.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
    */
    async _onDragStart(event) {
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data you need
        let dragData = {
            type: "Item",
            uuid: `Compendium.abbrew.playerskills.Item.${event.currentTarget.dataset.id}`
        };

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.bindDragDrops();
        this._activateTraits(context.traits);
        // this.registerSearch('input[name="system.roles.raw"]', "[data-application-part=browser]");
    }

    _activateTraits() {
        const traits = this.element.querySelector('input[name="traits"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
            enforceWhitelist: true,
            onChange: this.onChange
        };
        if (traits) {
            var taggedTraits = new Tagify(traits, settings);
            traits.addEventListener('change', this.onChange.bind(this));
        }
    }

    onChange(e) {
        // outputs a String
        // this.search.filter(null, e.target.value);
    }

    static async renderSkillSheet(event, target) {
        const skillId = target.closest(".skill").dataset.id;
        const fullId = `Compendium.abbrew.playerskills.Item.${skillId}`;
        const skill = await fromUuid(fullId);
        await skill.sheet.render(true);
    }

    // _onSearchFilter(event, query, rgx, html) {
    //     const querySet = new Set(getSafeJson(query, []).map(q => q.label));
    //     html.querySelectorAll("li.skill").forEach(a => {
    //         const dataset = a.dataset;
    //         const requiredRoles = new Set(getSafeJson(dataset.jsonRoles, []));
    //         a.hidden = (!requiredRoles.isSupersetOf(querySet))
    //     })
    // }
}