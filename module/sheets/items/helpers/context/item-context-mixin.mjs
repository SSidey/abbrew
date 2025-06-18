import { prepareActiveEffectCategories } from "../../../../helpers/effects.mjs";

export const ItemContextMixin = superclass => class extends superclass {
    constructor(args) {
        super(args);
    }

    async prepareItemContext(context) {
        // Use a safe clone of the item data for further operations.
        const itemData = this.item;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = this.item.getRollData();

        // Add the item's data to context.data for easier access, as well as flags.
        context.item = itemData;
        context.system = itemData.system;
        context.flags = itemData.flags;

        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.item.system.description,
            {
                secrets: this.document.isOwner,
                documents: true,
                links: true,
                embeds: true,
                rolls: true,
                rollData: this.item.getRollData()
            }
        );

        // Prepare active effects for easier access
        context.effects = prepareActiveEffectCategories(this.item.effects);

        context.config = CONFIG.ABBREW;
    }
}