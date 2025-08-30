import { getSafeJson, isASupersetOfB, onlyUnique } from "../../../../helpers/utils.mjs";

const { TextEditor } = foundry.applications.ux;

export async function _onArchetypeDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "archetype") {
        await Item.create(item, { parent: this.actor });
    }
}

export async function _onArchetypeSkillDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "skill") {
        const archetype = this.actor.items.find(i => i._id === event.target.closest(".archetype").dataset.itemId);
        const archetypeRequirements = Object.values(archetype.system.roleRequirements);
        const archetypePaths = archetypeRequirements.map(r => r.path.id).filter(id => id !== "");
        const validPaths = new Set(archetypePaths);
        const pathPromises = archetypePaths.map(p => game.packs.get("abbrew.paths").getDocument(p));
        const paths = await Promise.all(pathPromises);
        const validRoles = new Set(paths.flatMap(p => getSafeJson(p.system.roles, []).map(r => r.label)));
        const itemPath = new Set([item.system.path.value.id]);
        const itemRoles = new Set(item.system.path.value.id === "abbrewpuniversal" ? item.system.roles.parsed : []);
        if ((validPaths.intersection(itemPath).size > 0) || (validRoles.intersection(itemRoles).size > 0)) {
            const createdSkill = await Item.create(item, { parent: this.actor });
            const skillIds = archetype.system.skillIds;
            const update = [...skillIds, item.system.abbrewId.uuid];
            await archetype.update({ "system.skillIds": update });
        } else {
            // TODO: Stop the item from creating?
            ui.notifications.warn(`That skill isn't valid for the archetype ${archetype.name}`);
        }
    }
}

export async function _onArchetypePathDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "path") {
        const archetype = this.actor.items.find(i => i._id === event.target.closest(".archetype").dataset.itemId);
        const requirementId = event.target.closest(".archetype-path").dataset.id;
        const archetypeRequirements = Object.values(archetype.system.roleRequirements);
        const validRoles = new Set(archetypeRequirements[requirementId].parsedRoles.map(r => r.label));
        const restrictedRoles = new Set(archetypeRequirements[requirementId].parsedRestrictedRoles.map(r => r.label));
        const itemRoles = new Set(getSafeJson(item.system.roles, []).map(r => r.label));
        if ((validRoles.intersection(itemRoles).size > 0) && restrictedRoles.intersection(itemRoles).size === 0) {
            archetype.system.roleRequirements[requirementId].path.raw = JSON.stringify([{ value: item.name, id: item._id }]);
            const updateData = archetype.system.roleRequirements;
            await archetype.update({ "system.roleRequirements": updateData });
        } else {
            ui.notifications.warn(`That path isn't valid for the archetype ${archetype.name}`);
        }
    }
}

export async function _onContainerDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    let item = await fromUuid(data.uuid);
    if (event.currentTarget.dataset.itemId === item._id) {
        return;
    }

    if (["armour", "equipment", "weapon", "ammunition", "anatomy"].includes(item.type)) {
        const containerId = event.currentTarget.dataset.itemId;
        const container = this.actor.items.find(i => i._id === containerId);
        if (!container.system.storage.accessible && container.system.equipState !== "readied") {
            return;
        }

        if (!isASupersetOfB(item.system.traits.value.map(t => t.key), container.system.storage.traitFilter.value.map(t => t.key))) {
            return;
        }
        if (!this.actor.items.find(i => i._id === item._id)) {
            const createItem = structuredClone(item);
            createItem.system.equipState = "stowed";
            createItem.system.storeIn = containerId;
            item = await Item.create(createItem, { parent: this.actor });
        }

        const containerValueIncrease = getContainerValueIncrease(this.actor, container, item);
        if (container.system.storage.value + containerValueIncrease <= container.system.storage.max) {
            const storedItems = [...container.system.storage.storedItems, item._id].filter(onlyUnique);
            if (item.system.storeIn) {
                const oldContainerId = item.system.storeIn;
                const oldContainer = this.actor.items.find(i => i._id === oldContainerId);
                const oldContainerStoredItems = oldContainer.system.storage.storedItems.filter(i => i !== item._id);
                await oldContainer.update({ "system.storage.storedItems": oldContainerStoredItems });
            }

            const alreadyStoredIn = this.actor.items.filter(i => i.system.storage?.hasStorage && i.system.storage.storedItems.includes(item._id));
            if (alreadyStoredIn.length > 0) {
                const cleanPromises = alreadyStoredIn.map(async a => {
                    const newStoredItems = a.system.storage.storedItems.filter(s => s !== item._id);
                    await a.update({ "system.storage.storedItems": newStoredItems });
                });

                await Promise.all(cleanPromises);
            }
            await container.update({ "system.storage.storedItems": storedItems });
            await item.update({ "system.storeIn": containerId });
        }
    }
}

function getContainerValueIncrease(actor, container, item) {
    if (container.system.storage.hasStorage && container.system.storage.type === "count") {
        return item.system.quantity;
    }

    return getItemHeftIncrease(actor, item);
}

function getItemHeftIncrease(actor, item) {
    let heftIncrease = item.system.quantity * item.system.heft;
    if (item.system.storage.hasStorage) {
        const storedItems = actor.items.filter(i => item.system.storage.storedItems.includes(i._id));
        heftIncrease += storedItems.reduce((total, stored) => {
            total += getItemHeftIncrease(stored);
        }, 0);
    }

    return heftIncrease;
}

export async function handleActorBackgroundDrop(actor, background) {
    await actor.acceptSkillDeck(background);
    if (background.system.creatureForm.id) {
        const creatureForm = await fromUuid(background.system.creatureForm.sourceId);
        await actor.acceptCreatureForm(creatureForm);
    }
}

export async function handleActorWoundDrop(actor, item) {
    const wound = item.system.wound;
    await actor.acceptWound(wound.type, wound.value);
}

export async function handleActorSkillDeckDrop(actor, skillDeck) {
    await actor.acceptSkillDeck(skillDeck)
}

export async function handleActorCreatureFormDrop(actor, creatureform) {
    await actor.acceptCreatureForm(creatureform);
}

export async function handleActorItemDrop(actor, item) {
    await Item.create(item, { parent: actor })
}

export async function handleActorSkillDrop(actor, item) {
    await Item.create(item, { parent: actor })
}

async function handleActorInlineWoundDrop(wound, actor) {
    await actor.acceptWound(wound.type, parseInt(wound.value, 10));
};

export async function handleActorOnDrop(event, actor) {
    event.preventDefault();
    if (!actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (data.type === "Wound") {
        await handleActorInlineWoundDrop(data.wound, actor);
    }

    if (!(data?.type === "Item" && data?.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (item.actor && item.actor === actor) {
        if (item.system.storeIn) {
            const storage = actor.items.find(i => i._id === item.system.storeIn);
            const storedItems = storage.system.storage.storedItems.filter(i => i !== item._id);
            await storage.update({ "system.storage.storedItems": storedItems });
            await item.update({ "system.storeIn": "" })
        }

        return;
    }

    if (item) {
        switch (item.type) {
            case "ammunition":
            case "armour":
            case "equipment":
            case "weapon":
            case "anatomy":
                return await handleActorItemDrop(actor, item);
            case "skill":
                return await handleActorSkillDrop(actor, item);
            case "wound":
                return await handleActorWoundDrop(actor, item);
            case "background":
                return await handleActorBackgroundDrop(actor, item);
            case "skillDeck":
                return await handleActorSkillDeckDrop(actor, item);
            case "creatureForm":
                return await handleActorCreatureFormDrop(actor, item);
        }
    }
}