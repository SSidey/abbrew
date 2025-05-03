import Tagify from '@yaireo/tagify';
import {
    prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewArchetypeSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['abbrew', 'sheet', 'item'],
            width: 520,
            height: 480,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description',
                },
            ],
        });
    }

    /** @override */
    get template() {
        const path = 'systems/abbrew/templates/item';
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.hbs`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.hbs`.
        return `${path}/item-${this.item.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = this.item.getRollData();

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await TextEditor.enrichHTML(
            this.item.system.description,
            {
                // Whether to show secret blocks in the finished html
                secrets: this.document.isOwner,
                // Necessary in v11, can be removed in v12
                async: true,
                // Data to fill in for inline rolls
                rollData: this.item.getRollData(),
                // Relative UUID resolution
                relativeTo: this.item,
            }
        );

        // Prepare active effects for easier access
        context.effects = prepareActiveEffectCategories(this.item.effects);

        context.config = CONFIG.ABBREW;

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        html.on('dragover', (event) => {
            event.preventDefault();
        });

        this._activateRoles(html);
        this._activateArchetypePaths(html);
    }

    _activateRoles(html) {
        // TODO: Add to collection as with resources input[name^="system.roleRequirements."].
        const roles = html[0].querySelectorAll('input[name$=".roles"]');
        const restrictedRoles = html[0].querySelectorAll('input[name$=".restrictedRoles"]');
        const allRoles = [...Object.values(CONFIG.ABBREW.roles).map(role => ({
            label: role.value,
            value: game.i18n.localize(role.label),
            title: game.i18n.localize(role.description)
        }))];
        const roleSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [],
        };
        if (roles) {
            var taggedRoles = [];
            roles.forEach(role => {
                const restrictedRoles = this.item.system.roleRequirements[role.dataset.requirementId].parsedRestrictedRoles.map(r => r.label);
                const whitelist = allRoles.filter(r => !restrictedRoles.includes(r.label));
                const settings = foundry.utils.deepClone(roleSettings);
                settings.whitelist = whitelist;
                var taggedRole = new Tagify(role, settings);
                taggedRoles.push(taggedRole);
            });
            restrictedRoles.forEach(role => {
                const currentRoles = this.item.system.roleRequirements[role.dataset.requirementId].parsedRoles.map(r => r.label);
                const whitelist = allRoles.filter(r => !currentRoles.includes(r.label));
                const settings = foundry.utils.deepClone(roleSettings);
                settings.whitelist = whitelist;
                var taggedRole = new Tagify(role, settings);
                taggedRoles.push(taggedRole);
            });
        }
    }

    _activateArchetypePaths(html) {
        const paths = html[0].querySelectorAll('input[name$="path.raw"]');
        const allPaths = CONFIG.ABBREW.paths.map(path => ({
            label: path.value,
            value: game.i18n.localize(path.label),
            roles: path.roles,
            title: game.i18n.localize(path.description),
            id: path.id
        }));
        const pathSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            // whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => game.i18n.localize(trait.name))]
            whitelist: [],
        };
        if (paths) {
            var taggedPaths = [];
            paths.forEach(path => {
                const archetype = this.item;
                const requirement = path.dataset.requirementId;
                const roles = new Set(archetype.system.roleRequirements[requirement].parsedRoles.map(r => r.label));
                const restrictedRoles = new Set(archetype.system.roleRequirements[requirement].parsedRestrictedRoles.map(r => r.label));
                const pathWhitelist = allPaths.filter(p => { const rolePaths = new Set(p.roles); return (rolePaths.intersection(roles).size === roles.size) && (restrictedRoles.intersection(rolePaths).size === 0) });
                const settings = foundry.utils.deepClone(pathSettings);
                settings.whitelist = pathWhitelist;
                const tagify = new Tagify(path, settings);
                taggedPaths.push(tagify);
            });
        }
    }
}
