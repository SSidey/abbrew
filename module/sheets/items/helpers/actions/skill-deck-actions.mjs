// Delete Skill Summary
export async function deleteSkillDeckSkill(event, target) {
    const li = target.closest('.skill-deck-skill');
    if (li.dataset.id || (li.dataset.id === 0)) {
        const skills = this.item.system.skills.granted;
        skills.splice(li.dataset.id, 1);
        await this.item.update({ "system.skills.granted": skills });
    }
};