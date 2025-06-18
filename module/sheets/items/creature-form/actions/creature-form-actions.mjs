export async function deleteAnatomy(event, target) {
    const li = target.closest('.creature-form-anatomy');
    if (li.dataset.id || li.dataset.id === 0) {
        const anatomy = this.item.system.anatomy;
        anatomy.splice(li.dataset.id, 1);
        await this.item.update({ "system.anatomy": anatomy });
    }
}