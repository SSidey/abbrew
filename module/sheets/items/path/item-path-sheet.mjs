import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';
import { AbbrewItemSheet } from '../generic/item-sheet.mjs';
import { renderItemSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { deleteSkill } from './actions/path-actions.mjs';
import { skillCollectionDrop, skillSummaryDrag } from './drops/path-drops.mjs';
import { PathTagsMixin } from './tags/path-tags.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewPathSheet extends DragDropMixin(PathTagsMixin(AbbrewItemSheet)) {

    static DEFAULT_OPTIONS = {
        dragDrop: [
            { dragSelector: null, dropSelector: "ol.skill-deck-skills", callbacks: { drop: skillCollectionDrop } },
            { dragSelector: ".skill-deck-summary", dropSelector: null, callbacks: { dragStart: skillSummaryDrag } },
        ],
        actions: {
            deleteSkill: deleteSkill,
            renderItemSheet: renderItemSheet
        }
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
            template: "systems/abbrew/templates/item/path/tabs/path-description.hbs",
            scrollable: [""]
        },
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;

        this.activatePathTags();
        this.bindDragDrops();
    }
}
