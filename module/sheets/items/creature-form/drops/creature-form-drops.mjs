export async function creatureFormDrops(event, target) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const droppedData = event.dataTransfer.getData("text")
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "anatomy") {
            const storedAnatomy = this.item.system.anatomy;
            const newAnatomy = [...storedAnatomy, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
            await this.item.update({ "system.anatomy": newAnatomy });
        }
    }
}