import { getObjectValueByStringPath } from "../../../../helpers/utils.mjs";


export async function skillCollectionDrop(event) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const droppedData = event.dataTransfer.getData("text");
    const collection = event.currentTarget.dataset.collectionName;
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "skill") {
            const storedSkills = getObjectValueByStringPath(this.item, `system.skills.${collection}`);
            const updateSkills = [...storedSkills, { name: item.name, id: item.system.abbrewId.uuid, image: item.img, sourceId: item.uuid }];
            const updateKey = `system.skills.${collection}`
            const update = {};
            update[updateKey] = updateSkills;
            await this.item.update(update);
        }
    }
};

export async function skillSummaryDrag(event) {
    const el = event.currentTarget;
    if ('link' in event.target.dataset) return;

    // Extract the data you need
    let dragData = {
        type: "Item",
        uuid: el.closest("li").dataset.sourceId
    };

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
}