import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';
import { AbbrewItemBaseSheet } from '../generic/item-base-sheet.mjs';
import { activeEffectAction } from '../helpers/actions/effect-actions.mjs';
import { renderItemSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { modificationAction } from './actions/enhancement-modifier-actions.mjs';
import { enhancementSkillDrop } from './drops/enhancement-drops.mjs';
import { EnhancementTagsMixin } from './tags/enhancement-tags-mixin.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewEnhancementSheet extends DragDropMixin(EnhancementTagsMixin(AbbrewItemBaseSheet)) {

    static DEFAULT_OPTIONS = {
        actions: {
            renderItemSheet: renderItemSheet,
            effectControl: activeEffectAction,
            onModificationAction: modificationAction
        },
        dragDrop: [
            { dragSelector: null, dropSelector: "li.empty-drop-list-element", callbacks: { drop: enhancementSkillDrop } }
        ]
    }

    static PARTS = {
        header: {
            template: "systems/abbrew/templates/item/item/parts/item-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        description: {
            template: "systems/abbrew/templates/item/item/tabs/item-description.hbs",
            scrollable: [""]
        },
        attributes: {
            template: "systems/abbrew/templates/item/enhancement/tabs/enhancement-attributes.hbs",
            scrollable: [""]
        },
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", icon: "fa-solid fa-book" },
                { id: "attributes", icon: "fa-solid fa-hurricane" },
            ],
            initial: "description",
            labelPrefix: "SHEET.ITEM.TABS"
        }
    }


    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;

        this.activateEnhancementTags();
        this.bindDragDrops();
    }
}
