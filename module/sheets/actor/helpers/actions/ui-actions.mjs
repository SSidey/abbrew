export async function _onToggleSkillHeader(event, target) {
    event.preventDefault();
    const skillSection = target.nextElementSibling;
    if (skillSection.children.length === 0 || skillSection.style.display === "grid" || skillSection.style.display === '') {
        this.skillSectionDisplay[target.dataset.skillSection] = "none"
        skillSection.style.display = "none";
    } else {
        this.skillSectionDisplay[target.dataset.skillSection] = "grid"
        skillSection.style.display = "grid";
    }
}