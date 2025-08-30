import { getObjectValueByStringPath } from "../../../../helpers/utils.mjs";

export async function deleteSkill(event, target) {
    const li = target.closest('.skill-deck-skill');
    const ol = li.closest('.skill-deck-skills');
    if (li.dataset.id || li.dataset.id === 0) {
        const skills = getObjectValueByStringPath(this.item, `system.skills.${ol.dataset.collectionName}`);
        skills.splice(li.dataset.id, 1);
        const update = {};
        update[`system.skills.${ol.dataset.collectionName}`] = skills;
        await this.item.update(update);
    }
}