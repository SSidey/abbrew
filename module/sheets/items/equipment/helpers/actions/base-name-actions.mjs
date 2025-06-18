const { DialogV2 } = foundry.applications.api;

export async function resetNameAction() {
    const result = await DialogV2.confirm({
        window: { title: CONFIG.RegionBehavior.typeLabels.teleportToken },
        content: `<p>Reset Name to Base?</p>`
    });

    if (result) {
        await this.item.update({ "system.name.parts": [], "name": this.item.system.name.base });
    }
}