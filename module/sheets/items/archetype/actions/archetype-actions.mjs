export async function deletePath(event, target) {
    const requirementId = target.dataset.requirementId;
    const requirements = this.item.system.roleRequirements;
    requirements[requirementId].path.raw = "";
    await this.item.update({ "system.roleRequirements": requirements });

}