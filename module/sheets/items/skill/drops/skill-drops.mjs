import { getObjectValueByStringPath, getSafeJson } from "../../../../helpers/utils.mjs";


export async function skillCollectionDrop(event) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const droppedData = event.dataTransfer.getData("text");
    const collection = event.currentTarget.dataset.collectionName;
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "skill") {
            const storedSkills = getObjectValueByStringPath(this.item, `system.skills.${collection}`);
            const updateSkills = [...storedSkills, { name: item.name, id: item.system.abbrewId.uuid, image: item.img, sourceId: item.uuid }];
            const updateKey = `system.skills.${collection}`
            const update = {};
            update[updateKey] = updateSkills;
            await this.item.update(update);
        }
    }
};

export async function skillTagifyDrop(event) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

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
        if (inputElement.dataset.dropType !== item.type) {
            return;
        }
        if (inputElement.dataset.dropSkillType && inputElement.dataset.dropSkillType !== item.system.skillType) {
            return;
        }
        const value = item.name;
        const path = inputElement.name;
        const inputValue = getSafeJson(getObjectValueByStringPath(this.item, path), []);
        if (path.split(".").some(segment => !isNaN(segment))) {
            const pathSegments = path.split(".");
            const pathindex = pathSegments.findIndex(s => !isNaN(s));
            const index = pathSegments.find(s => !isNaN(s));
            const subPath = pathSegments.splice(pathindex + 1).join(".");
            const basePath = pathSegments.splice(0, pathindex).join(".");
            const baseElements = getObjectValueByStringPath(this.item, basePath);
            const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
            baseElements[index][subPath] = JSON.stringify(updateValue);
            const update = {};
            update[basePath] = baseElements;
            await this.item.update(update);
            return;
        }
        const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
        const update = {};
        update[path] = JSON.stringify(updateValue);
        await this.item.update(update);
    }
}