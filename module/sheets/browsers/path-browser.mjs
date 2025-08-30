import Tagify from "@yaireo/tagify";
import { getSafeJson } from "../../helpers/utils.mjs";
import { DragDropMixin } from "../helpers/drag-drop-mixin.mjs";
import { SearchMixin } from "../helpers/search-mixin.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PathBrowser extends SearchMixin(DragDropMixin(HandlebarsApplicationMixin(ApplicationV2))) {
    static DEFAULT_OPTIONS = {
        actions: {
            renderPathSheet: PathBrowser.renderPathSheet
        },
        position: {
            height: 1000,
            width: 1000
        },
        dragDrop: [
            { dragSelector: ".path", dropSelector: null },
        ]
    }

    static PARTS = {
        browser: {
            template: "systems/abbrew/templates/browser/path-browser.hbs"
        }
    }

    constructor(roles, restrictedRoles) {
        super();
        this.filterRoles = roles;
        this.restrictedRoles = restrictedRoles;
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        const pack = game.packs.get("abbrew.paths");
        const paths = await pack.getDocuments({ type: "path" });

        context.paths = Array.from(paths.values().map(v => {
            const roles = getSafeJson(v.system.roles).map(r => r.label);
            const jsonRoles = JSON.stringify(roles);
            return ({
                name: v.name,
                img: v.img,
                roles: roles,
                jsonRoles: jsonRoles,
                id: v.id,
                description: game.i18n.localize(`ABBREW.Paths.${v.name.replace(/\s+/g, "").toLowerCase()}`) ?? ""
            })
        })).filter(p => {
            const pathRoles = new Set(p.roles);
            return pathRoles.isSupersetOf(this.filterRoles) && pathRoles.intersection(this.restrictedRoles).size === 0
        });
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
            uuid: `Compendium.abbrew.paths.Item.${event.currentTarget.dataset.id}`
        };

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.bindDragDrops();
        this._activateRoles(context.roles);
        this.registerSearch('input[name="system.roles.raw"]', "[data-application-part=browser]");
    }

    _activateRoles(requiredRoles) {
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
            whitelist: [...Object.values(CONFIG.ABBREW.roles).filter(r => !this.filterRoles.has(r.value)).filter(r => !this.restrictedRoles.has(r.value)).map(role => ({
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

    onChange(e) {
        // outputs a String
        this.search.filter(null, e.target.value);
    }

    static async renderPathSheet(event, target) {
        const pathId = target.closest(".path").dataset.id;
        const fullId = `Compendium.abbrew.paths.Item.${pathId}`;
        const path = await fromUuid(fullId);
        await path.sheet.render(true);
    }

    _onSearchFilter(event, query, rgx, html) {
        const querySet = new Set(getSafeJson(query, []).map(q => q.label));
        html.querySelectorAll("li.path").forEach(a => {
            const dataset = a.dataset;
            const requiredRoles = new Set(getSafeJson(dataset.roles, []));
            a.hidden = (!requiredRoles.isSupersetOf(querySet))
        })
    }
}