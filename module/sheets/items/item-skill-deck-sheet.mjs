import {
    onManageActiveEffect,
    prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import { renderSheetForStoredItem } from '../../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewSkillDeckSheet extends ItemSheet {
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

        // Roll handlers, click handlers, etc. would go here.

        // Active Effect management
        html.on('click', '.effect-control', (event) =>
            onManageActiveEffect(event, this.item)
        );

        html.on('dragover', (event) => {
            event.preventDefault();
        });

        // Delete Skill Summary
        html.on('click', '.skill-delete', async (ev) => {
            const li = $(ev.currentTarget).parents('.skill-deck-skill');
            if (li.data('id') || li.data('id') === 0) {
                const skills = this.item.system.skills;
                skills.splice(li.data('id'), 1);
                await this.item.update({ "system.skills": skills });
            }
        });

        // Delete Creature Form
        html.on('click', '.creature-form-delete', async (ev) => {
            await this.item.update({ "system.creatureForm": { name: "", id: "", image: "" } });
        });

        html.on('click', '.skill-deck-skill .skill-deck-summary .image-container, .skill-deck-skill .skill-deck-summary .name', async (event) => {
            await renderSheetForStoredItem(event, this.actor);
        });

        html.on('drop', async (event) => {
            if (!this.item.testUserPermission(game.user, 'OWNER')) {
                return;
            }

            const droppedData = event.originalEvent.dataTransfer.getData("text")
            const eventJson = JSON.parse(droppedData);
            if (eventJson && eventJson.type === "Item") {
                const item = fromUuidSync(eventJson.uuid);
                if (item.type === "skill") {
                    const storedSkills = this.item.system.skills;
                    const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
                    await this.item.update({ "system.skills": updateSkills });
                } else if (item.type === "creatureForm") {
                    await this.item.update({ "system.creatureForm": { name: item.name, id: item._id, image: item.img, sourceId: item.uuid } });
                }
            }
        })
    }
}
