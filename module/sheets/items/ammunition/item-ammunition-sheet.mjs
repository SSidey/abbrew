import { activeEffectAction } from '../helpers/actions/effect-actions.mjs';
import { _onDamageAction } from '../helpers/actions/damage-control-actions.mjs';
import { enhancementDelete } from '../helpers/actions/enhancement-actions.mjs';
import { deleteSkillDeckSkill } from '../helpers/actions/skill-deck-actions.mjs';
import { physicalItemDrops } from '../helpers/drops/physical-item-drops.mjs';
import { renderItemSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { AbbrewItemBaseSheet } from '../generic/item-base-sheet.mjs';
import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewAmmunitionSheet extends DragDropMixin(AbbrewItemBaseSheet) {

    static DEFAULT_OPTIONS = {
        dragDrop: [
            { dragSelector: null, dropSelector: null, callbacks: { drop: physicalItemDrops } },
        ],
        actions: {
            effectControl: activeEffectAction,
            damageControl: _onDamageAction,
            enhancementDelete: enhancementDelete,
            skillDelete: deleteSkillDeckSkill,
            renderItemSheet: renderItemSheet
        }
    }

    static PARTS = {
        header: {
            template: "systems/abbrew/templates/item/physical/parts/item-physical-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        description: {
            template: "systems/abbrew/templates/item/physical/tabs/item-physical-description.hbs",
            scrollable: [""]
        },
        attributes: {
            template: "systems/abbrew/templates/item/ammunition/tabs/ammunition-attributes.hbs",
            scrollable: [""]
        },
        skills: {
            template: "systems/abbrew/templates/item/physical/tabs/item-physical-skills.hbs",
            scrollable: [""]

        }
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", icon: "fa-solid fa-book" },
                { id: "attributes", icon: "fa-solid fa-square-poll-vertical" },
                { id: "skills", icon: "fa-solid fa-hurricane" }
            ],
            initial: "description",
            labelPrefix: "SHEET.ITEM.TABS"
        }
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case "description":
            case "attributes":
            case "skills":
                const itemData = context.document;
                context.item = itemData;
                context.actor = itemData.actor;
        }

        if (partId in context.tabs) {
            context.tab = context.tabs[partId];
        }

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;

        this.bindDragDrops();
    }
}
