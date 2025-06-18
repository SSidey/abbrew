export async function anatomyDrops(event, target) {
    if (!this.item.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const droppedData = event.dataTransfer.getData("text")
    const eventJson = JSON.parse(droppedData);
    if (eventJson && eventJson.type === "Item") {
        const item = await fromUuid(eventJson.uuid);
        if (item.type === "weapon") {
            const storedWeapons = this.item.system.naturalWeapons;
            const updateWeapons = [...storedWeapons, { name: item.name, id: item.id, image: item.img, sourceId: item.uuid }];
            await this.item.update({ "system.naturalWeapons": updateWeapons });
        } else if (item.type === "skill") {
            const storedSkills = this.item.system.skills.granted;
            const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
            await this.item.update({ "system.skills.granted": updateSkills });
        }
    }
}

// TODO: ????
// // TODO: Handle dropping skills onto the anatomy reveal field.
// // TODO: Instead of readonly, can we just if not gm disable input and remove dropdown? Also prevent drops like below?
// html.on('drop', 'tags.tagify', async (event) => {
//     if (!this.item.testUserPermission(game.user, 'OWNER')) {
//         return;
//     }

//     const target = event.target;
//     let inputElement = null;
//     if (Object.values(target.classList).includes("tagify__input")) {
//         inputElement = target.parentElement.nextElementSibling;
//     } else if (Object.values(target.classList).includes("tagify")) {
//         inputElement = target.nextElementSibling;
//     } else {
//         return;
//     }

//     if (inputElement.readOnly) {
//         return;
//     }

//     const droppedData = event.originalEvent.dataTransfer.getData("text")
//     const eventJson = JSON.parse(droppedData);
//     if (eventJson && eventJson.type === "Item") {
//         const item = await fromUuid(eventJson.uuid);
//         if (inputElement.dataset.droptype !== item.type) {
//             return;
//         }
//         const value = item.name;
//         const path = inputElement.name;
//         const inputValue = getSafeJson(getObjectValueByStringPath(this.item, path), []);
//         if (path.split(".").some(segment => !isNaN(segment))) {
//             const pathSegments = path.split(".");
//             const pathindex = pathSegments.findIndex(s => !isNaN(s));
//             const index = pathSegments.find(s => !isNaN(s));
//             const subPath = pathSegments.splice(pathindex + 1).join(".");
//             const basePath = pathSegments.splice(0, pathindex).join(".");
//             const baseElements = getObjectValueByStringPath(this.item, basePath);
//             const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
//             baseElements[index][subPath] = JSON.stringify(updateValue);
//             const update = {};
//             update[basePath] = baseElements;
//             await this.item.update(update);
//             return;
//         }
//         const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
//         const update = {};
//         update[path] = JSON.stringify(updateValue);
//         await this.item.update(update);
//     }
// })