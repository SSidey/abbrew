export async function _onArchetypeDrop(event) {
    event.preventDefault();
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