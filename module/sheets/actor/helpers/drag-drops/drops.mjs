import { isASupersetOfB } from "../../../../helpers/utils.mjs";

const { TextEditor } = foundry.applications.ux;

export async function _onArchetypeDrop(event) {
    event.preventDefault();
    event.stopPropogation();

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
    event.stopPropogation();

    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (item.type === "skill") {
        const target = event.currentTarget;
        const archetype = this.actor.items.find(i => i._id === target.dataset.itemId);
        const archetypeRequirements = Object.values(archetype.system.roleRequirements);
        const archetypePaths = archetypeRequirements.map(r => r.path.id).filter(id => id !== "");
        const validPaths = new Set(archetypePaths);
        const validRoles = new Set(archetypePaths.flatMap(vp => CONFIG.ABBREW.paths.find(p => p.id === vp).roles));
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

export async function _onContainerDrop(event) {
    event.preventDefault();
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
    if (!(data.type === "Item" && data.uuid)) {
        return;
    }

    const item = await fromUuid(data.uuid);

    if (["armour", "equipment", "weapon", "ammunition"].includes(item.type)) {
        const containerId = event.currentTarget.dataset.itemId;
        const container = this.actor.items.find(i => i._id === containerId);
        if (!isASupersetOfB(item.system.traits.value.map(t => t.key), container.system.storage.traitFilter.value.map(t => t.key))) {
            return;
        }
        const containerValueIncrease = getContainerValueIncrease(container, item);
        if (container.system.storage.value + containerValueIncrease <= container.system.storage.max) {
            const storedItems = [...container.system.storage.storedItems, item._id];
            if (item.system.storeIn) {
                const oldContainerId = item.system.storeIn;
                const oldContainer = this.actor.items.find(i => i._id === oldContainerId);
                const oldContainerStoredItems = oldContainer.system.storage.storedItems.filter(i => i !== item._id);
                await oldContainer.update({ "system.storage.storedItems": oldContainerStoredItems });
            }
            await item.update({ "system.storeIn": containerId });
            await container.update({ "system.storage.storedItems": storedItems });
        }

        function getContainerValueIncrease(container, item) {
            let heftIncrease = item.system.quantity * item.system.heft;
            if (container.system.storage.hasStorage && container.system.storage.type === "heft") {
                heftIncrease += item.system.storage.value;
            }

            return heftIncrease;
        }
    }
}

export async function handleActorBackgroundDrop(actor, background) {
    await actor.acceptBackground(background);
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
    const skill = structuredClone(item);
    skill.system.sources.actor = actor._id;
    await Item.create(skill, { parent: actor })
}

export async function handleActorOnDrop(event, actor) {
    event.preventDefault();
    if (!actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }

    const data = TextEditor.getDragEventData(event);
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