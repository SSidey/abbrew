import { ItemContextMixin } from '../helpers/context/item-context-mixin.mjs';
import { ItemTraitsMixin } from '../helpers/tags/item-traits-mixin.mjs';
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class AbbrewItemBaseSheet extends ItemTraitsMixin(ItemContextMixin(HandlebarsApplicationMixin(ItemSheetV2))) {

    // Whitelist for Description Traits
    TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.filter(t => ["item", "material"].includes(t.feature)).map(trait => ({
        ...trait,
        value: game.i18n.localize(trait.value)
    }))];

    // Create array of primary tab Ids for part contexts
    TAB_IDS = this.constructor.TABS.primary.tabs.map(t => t.id);

    /** @override */
    static TABS = {
        primary: {
            tabs: []
        }
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        form: {
            submitOnChange: true
        },
        classes: ['abbrew', 'sheet', 'item'],
        window: {
            contentClasses: ["standard-form"],
            icon: "fa-solid fa-toolbox"
        },
        position: {
            width: 550,
            height: 900
        },
        dragDrop: [],
        actions: {}
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.tabs = this._prepareTabs("primary");
        await this.prepareItemContext(context);

        return context;
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        if (this.TAB_IDS.includes(partId)) {
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

        this._activateTraits();
    }
}
