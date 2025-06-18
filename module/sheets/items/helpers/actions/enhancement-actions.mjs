import { applyEnhancement } from "../../../../helpers/enhancements/enhancement-application.mjs";

// Delete Enhancement
export async function enhancementDelete(event, target) {
    const li = target.closest('.skill-deck-skill');
    if (li.dataset.id || (li.dataset.id === 0)) {
        const enhancements = this.item.system.enhancements;
        const enhancement = enhancements[li.dataset.id];
        enhancements.splice(li.dataset.id, 1);
        await this.item.update({ "system.enhancements": enhancements });
        if (enhancement.id && this.item.actor && this.item.actor.items.find(i => i.id === enhancement.id)) {
            await this.item.actor.deleteEmbeddedDocuments("Item", [enhancement.id]);
        } else if (enhancement.uuid) {
            let updateObject = structuredClone(this.item);
            const sourceEnhancement = await fromUuid(enhancement.uuid);
            applyEnhancement(sourceEnhancement, null, updateObject, true);
            const options = this.item.actor ? { parent: this.item.actor } : { pack: this.item.pack };
            await Item.implementation.updateDocuments([{ _id: this.item._id, ...updateObject }], options);
        }
    }
}