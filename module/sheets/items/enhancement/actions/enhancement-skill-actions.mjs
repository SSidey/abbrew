
export async function deleteEnhancementSkill(event, target) {
    const li = event.closest('.skill-deck-skill');
    if (li.dataset.id || li.dataset.id === 0) {
        const skills = this.item.system.skills.granted;
        skills.splice(li.dataset.id, 1);
        await this.item.update({ "system.skills.granted": skills });
    }
}