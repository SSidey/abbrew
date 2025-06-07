import Tagify from '@yaireo/tagify';
import {
    onManageActiveEffect,
    prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import { renderSheetForStoredItem } from '../../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewEnhancementSheet extends ItemSheet {
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
        context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
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

        // Roll handlers, click handlers, etc. would go here.

        // Active Effect management
        html.on('click', '.effect-control', (event) =>
            onManageActiveEffect(event, this.item)
        );

        html.find(".modification-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onModificationAction(t, t.dataset.action);
        });

        html.on('dragover', (event) => {
            event.preventDefault();
        });

        // Delete Skill Summary
        html.on('click', '.skill-delete', async (ev) => {
            const li = $(ev.currentTarget).parents('.skill-deck-skill');
            if (li.data('id') || li.data('id') === 0) {
                const skills = this.item.system.skills.granted;
                skills.splice(li.data('id'), 1);
                await this.item.update({ "system.skills.granted": skills });
            }
        });

        html.on('click', '.skill-deck-skill .skill-deck-summary .image-container, .skill-deck-skill .skill-deck-summary .name', async (event) => {
            await renderSheetForStoredItem(event, this.actor, "skill-deck-skill");
        });

        html.on('drop', async (event) => {
            if (!this.item.testUserPermission(game.user, 'OWNER')) {
                return;
            }

            const droppedData = event.originalEvent.dataTransfer.getData("text")
            const eventJson = JSON.parse(droppedData);
            if (eventJson && eventJson.type === "Item") {
                const item = await fromUuid(eventJson.uuid);
                if (item.type === "skill") {
                    const storedSkills = this.item.system.skills.granted;
                    const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
                    await this.item.update({ "system.skills.granted": updateSkills });
                } else if (item.type === "creatureForm") {
                    await this.item.update({ "system.creatureForm": { name: item.name, id: item._id, image: item.img, sourceId: item.uuid } });
                }
            }
        })

        this._activateTraitFilter(html);
    }

    _onModificationAction(target, action) {
        switch (action) {
            case 'add-modification':
                return this.addModification();
            case 'remove-modification':
                return this.removeModification(target);
                break;
        }
    }

    addModification() {
        const modifications = this.item.system.modifications;
        return this.item.update({ "system.modifications": [...modifications, {}] });
    }

    removeModification(target) {
        const id = target.closest("li").dataset.id;
        const modifications = foundry.utils.deepClone(this.item.system.modifications);
        modifications.splice(Number(id), 1);
        return this.item.update({ "system.modifications": modifications });
    }

    _activateTraitFilter(html) {
        const traitFilter = html[0].querySelector('input[name="system.traitFilter.raw"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.traits.filter(t => t.feature === "item").map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
        };
        if (traitFilter) {
            var taggedTraitFilter = new Tagify(traitFilter, settings);
        }
    }
}
