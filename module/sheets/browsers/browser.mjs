import Tagify from "@yaireo/tagify";
import { getSafeJson } from "../../helpers/utils.mjs";
import { DragDropMixin } from "../helpers/drag-drop-mixin.mjs";
import { SearchMixin } from "../helpers/search-mixin.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class Browser extends SearchMixin(DragDropMixin(HandlebarsApplicationMixin(ApplicationV2))) {
    static DEFAULT_OPTIONS = {
        actions: {
            renderArchetypeSheet: Browser.renderArchetypeSheet
        },
        position: {
            height: 1000,
            width: 1000
        },
        dragDrop: [
            { dragSelector: ".archetype", dropSelector: null },
        ]
    }

    static PARTS = {
        browser: {
            template: "systems/abbrew/templates/browser/browser.hbs"
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        const pack = game.packs.get("abbrew.archetypes");
        await pack.getDocuments({ type: "archetype" });
        const archetypes = structuredClone(game.packs.get("abbrew.archetypes"));

        archetypes.entries().forEach(([key, a]) => {
            const { required, restricted } = Object.values(a.system.roleRequirements).reduce((fullRoles, requirement) => {
                fullRoles.required.push(...getSafeJson(requirement.roles, []).map(r => r.label));
                fullRoles.restricted.push(...getSafeJson(requirement.restrictedRoles, []).map(r => r.label));

                return fullRoles;
            }, { required: [], restricted: [] });

            const parsedRequirements = JSON.stringify(required);
            const parsedRestrictions = JSON.stringify(restricted);

            a.roles = { required: parsedRequirements, restricted: parsedRestrictions };
            a.id = key;
        });

        const archetypePromises = Array.from(archetypes.values().map(v => ({
            name: v.name,
            img: v.img,
            roles: v.roles,
            id: v.id,
            description: game.i18n.localize(`ABBREW.Archetypes.${v.name.replace(/\s+/g, "").toLowerCase()}`) ?? ""
        })));
        context.archetypes = await Promise.all(archetypePromises);
        context.roles = CONFIG.ABBREW.roles;

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
            uuid: `Compendium.abbrew.archetypes.Item.${event.currentTarget.dataset.id}`
        };

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.bindDragDrops();
        this._activateRoles();
        this.registerSearch('input[name="system.roles.raw"]', "[data-application-part=browser]");
    }

    _activateRoles() {
        const roles = this.element.querySelector('input[name="system.roles.raw"]');
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
            whitelist: [...Object.values(CONFIG.ABBREW.roles).map(role => ({
                label: role.value,
                value: game.i18n.localize(role.label),
                title: game.i18n.localize(role.description)
            }))],
            enforceWhitelist: true,
            onChange: this.onChange
        };
        if (roles) {
            var taggedRoles = new Tagify(roles, settings);
            roles.addEventListener('change', this.onChange.bind(this));
        }
    }

    static async renderArchetypeSheet(event, target) {
        const archetypeId = target.closest(".archetype").dataset.id;
        const fullId = `Compendium.abbrew.archetypes.Item.${archetypeId}`;
        const archetype = await fromUuid(fullId);
        await archetype.sheet.render(true);
    }

    onChange(e) {
        // outputs a String
        this.search.filter(null, e.target.value);
    }

    _onSearchFilter(event, query, rgx, html) {
        const querySet = new Set(getSafeJson(query, []).map(q => q.label));
        html.querySelectorAll("li.archetype").forEach(a => {
            const dataset = a.dataset;
            const requiredRoles = new Set(getSafeJson(dataset.requiredRoles, []));
            const restrictedRoles = new Set(getSafeJson(dataset.restrictedRoles, []));
            a.hidden = (!requiredRoles.isSupersetOf(querySet) || restrictedRoles.intersection(querySet).size > 0)
        })
    }
}