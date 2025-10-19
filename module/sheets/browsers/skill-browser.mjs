import Tagify from "@yaireo/tagify";
// import { getSafeJson } from "../../helpers/utils.mjs";
import { DragDropMixin } from "../helpers/drag-drop-mixin.mjs";
import { SearchMixin } from "../helpers/search-mixin.mjs";
import { getSafeJson } from "../../helpers/utils.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SkillBrowser extends DragDropMixin(HandlebarsApplicationMixin(ApplicationV2)) {
    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: false
        },
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
            template: "systems/abbrew/templates/browser/skill-browser.hbs",
            scrollable: [".result-scroll"]
        }
    }

    constructor(validSkills, validRoles, pathId) {
        super();
        this.validSkills = validSkills;
        this.pathId = pathId;
        this.validRoles = validRoles
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.skills = Array.from(this.validSkills.values().map(v => {
            return ({
                name: v.name,
                img: v.img,
                id: v.id,
                description: game.i18n.localize(`ABBREW.Skills.${v.name.replace(/\s+/g, "").toLowerCase()}`) ?? "",
                rank: v.system.rank,
                traits: JSON.stringify(getSafeJson(v.system.traits.raw, []).map(t => t.key))
            })
        }))

        context.traits = CONFIG.ABBREW.traits;
        context.roles = CONFIG.ABBREW.roles;
        context.searchValues = {
            minRank: 1,
            maxRank: 1
        }

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
        this.bindSearchValues();
        this._activateTraits(context.traits);
        this._activateRoles(context.roles);
    }

    bindSearchValues() {
        const searchFilters = this.element.querySelectorAll('input.search-filter');
        searchFilters.forEach(sf => sf.addEventListener('change', this._onSearchFilter.bind(this)));
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
            enforceWhitelist: true
        };
        if (traits) {
            var taggedTraits = new Tagify(traits, settings);
        }
    }

    _activateRoles() {
        const roles = this.element.querySelector('input[name="roles"]');
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
            whitelist: [...Object.values(CONFIG.ABBREW.roles).filter(r => this.validRoles.includes(r.value)).map(role => ({
                label: role.value,
                value: game.i18n.localize(role.label),
                title: game.i18n.localize(role.description)
            }))],
            enforceWhitelist: true,
            onChange: this.onChange
        };
        if (roles) {
            var taggedRoles = new Tagify(roles, settings);
            roles.addEventListener('change', this._onSearchFilter.bind(this));
        }
    }

    static async renderSkillSheet(event, target) {
        const skillId = target.closest(".skill").dataset.id;
        const fullId = `Compendium.abbrew.playerskills.Item.${skillId}`;
        const skill = await fromUuid(fullId);
        await skill.sheet.render(true);
    }

    _onSearchFilter() {
        const traitsRaw = getSafeJson(this.element.querySelector("input[name=traits]").value, []);
        const traits = traitsRaw.length === 0 ? new Set() : new Set(traitsRaw.map(t => t.key));
        const rolesRaw = getSafeJson(this.element.querySelector("input[name=roles]").value, []);
        const roles = rolesRaw.length === 0 ? new Set() : new Set(rolesRaw.map(t => t.label));
        const minRankRaw = this.element.querySelector("input[name=min-rank]").value;
        const minRank = minRankRaw.length === 0 ? 1 : parseInt(minRankRaw);
        const maxRankRaw = this.element.querySelector("input[name=max-rank]").value;
        const maxRank = maxRankRaw.length === 0 ? 1 : parseInt(maxRankRaw);
        const pathFilter = this.element.querySelector("input[name=path]").checked;
        const filteredSkills = this.validSkills
            .filter(s => !pathFilter || s.system.path.value.id === this.pathId)
            .filter(s => new Set(s.system.roles.parsed).isSupersetOf(roles))
            .filter(s => new Set(s.system.traits.value.map(v => v.key)).isSupersetOf(traits))
            .filter(s => s.system.rank >= minRank)
            .filter(s => s.system.rank <= maxRank)
            .map(s => s._id);

        this.element.querySelectorAll("li.skill").forEach(a => {
            const dataset = a.dataset;
            const id = dataset.id;
            a.hidden = !filteredSkills.includes(id);
        })
    }
}