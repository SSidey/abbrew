export async function backgroundDrops(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const droppedData = event.dataTransfer.getData("text")
    const eventJson = JSON.parse(droppedData);
    const item = await fromUuid(eventJson.uuid);
    if (item.type === "creatureForm") {
        await this.item.update({ "system.creatureForm": { name: item.name, id: item._id, image: item.img, sourceId: item.uuid } });
    }
}