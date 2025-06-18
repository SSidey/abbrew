import { handleEnhancement, shouldHandleEnhancement } from "../../../../helpers/enhancements/enhancement-application.mjs";

export async function physicalItemDrops(event, target) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const droppedData = event.dataTransfer.getData("text")
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "skill") {
            const storedSkills = this.item.system.skills.granted;
            const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
            await this.item.update({ "system.skills.granted": updateSkills });
        } else if (shouldHandleEnhancement(this.item, item)) {
            await handleEnhancement(this.item, this.item.actor, item);
        };
    }
}