import { getSafeJson } from "../../../../../helpers/utils.mjs";

export async function revealSkillDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const target = event.target;
    let inputElement = null;
    if (Object.values(target.classList).includes("tagify__input")) {
        inputElement = target.parentElement.nextElementSibling;
    } else if (Object.values(target.classList).includes("tagify")) {
        inputElement = target.nextElementSibling;
    } else {
        return;
    }

    if (inputElement.readOnly) {
        return;
    }

    const droppedData = event.dataTransfer.getData("text")
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type !== "skill" || item.system.action.skillCheck.length < 1) {
            return;
        }

        const value = item.name;
        const path = inputElement.name;
        const inputValue = this.item.system.revealed.revealSkills.raw;
        const updateValue = [...getSafeJson(inputValue, []), { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
        await this.item.update({ "system.revealed.revealSkills.raw": JSON.stringify(updateValue) });
    }
}