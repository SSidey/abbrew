// Delete Creature Form Summary
export async function deleteCreatureForm(event, target) {
    await this.item.update({ "system.creatureForm": { name: "", id: "", image: "" } });
};