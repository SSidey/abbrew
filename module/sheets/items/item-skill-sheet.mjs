import {
    onManageActiveEffect,
    prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'
import { getObjectValueByStringPath, getSafeJson, renderSheetForStoredItem, renderSheetForTaggedData } from '../../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewSkillSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['abbrew', 'sheet', 'item'],
            width: 520,
            height: 480,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description',
                },
            ],
        });
    }

    /** @override */
    get template() {
        const path = 'systems/abbrew/templates/item';
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.hbs`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.hbs`.
        return `${path}/item-${this.item.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = this.item.getRollData();

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await TextEditor.enrichHTML(
            this.item.system.description,
            {
                // Whether to show secret blocks in the finished html
                secrets: this.document.isOwner,
                // Necessary in v11, can be removed in v12
                async: true,
                // Data to fill in for inline rolls
                rollData: this.item.getRollData(),
                // Relative UUID resolution
                relativeTo: this.item,
            }
        );

        // Prepare active effects for easier access
        context.effects = prepareActiveEffectCategories(this.item.effects);

        context.config = CONFIG.ABBREW;

        context.enrichedFinisherDescription = await TextEditor.enrichHTML(
            this.item.system.action.attackProfile.finisher.description,
            {
                // Whether to show secret blocks in the finished html
                secrets: this.document.isOwner,
                // Necessary in v11, can be removed in v12
                async: true,
                // Data to fill in for inline rolls
                rollData: this.item.getRollData(),
                // Relative UUID resolution
                relativeTo: this.item,
            }
        );

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Roll handlers, click handlers, etc. would go here.

        // Active Effect management
        html.on('click', '.effect-control', (event) =>
            onManageActiveEffect(event, this.item)
        );

        html.find(".skill-action-resource-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onSkillActionResourceRequirementAction(t, t.dataset.action);
        });

        html.find(".skill-action-modifier-wound-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onSkillActionModifierWoundAction(t, t.dataset.action);
        });

        html.find(".skill-action-modifier-damage-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onSkillActionModifierDamageAction(t, t.dataset.action);
        });

        html.find(".skill-action-modifier-resource-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onSkillActionModifierResourceAction(t, t.dataset.action);
        });

        html.find(".damage-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onDamageAction(t, t.dataset.action);
        });

        html.find(".attack-profile-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onAttackProfileAction(t, t.dataset.action);
        });

        html.find(".skill-configuration-section :input").prop("disabled", !this.item.system.configurable);

        html.on("click", ".tagify__tag div", async (event) => {
            await renderSheetForTaggedData(event, this.actor);
        })

        html.find(".modifier-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onModifierControlAction(t, t.dataset.action);
        });

        html.on('dragover', (event) => {
            event.preventDefault();
        });

        html.on('drop', 'ol.skill-deck-skills', async (event) => {
            if (!this.item.testUserPermission(game.user, 'OWNER')) {
                return;
            }

            const droppedData = event.originalEvent.dataTransfer.getData("text");
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
        });

        html.on('click', '.skill-deck-skill .skill-deck-summary .image-container, .skill-deck-skill .skill-deck-summary .name', async (event) => {
            await renderSheetForStoredItem(event, this.actor, "skill-deck-skill");
        });

        html.on('click', '.skill-delete', async (ev) => {
            const li = $(ev.currentTarget).parents('.skill-deck-skill');
            const ol = li.parents('.skill-deck-skills');
            if (li.data('id') || li.data('id') === 0) {
                const skills = getObjectValueByStringPath(this.item, `system.skills.${ol.data('collectionName')}`);
                skills.splice(li.data('id'), 1);
                const update = {};
                update[`system.skills.${ol.data('collectionName')}`] = skills;
                await this.item.update(update);
            }
        });

        html.on('drop', 'tags.tagify', async (event) => {
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

            const droppedData = event.originalEvent.dataTransfer.getData("text")
            const eventJson = JSON.parse(droppedData);
            if (eventJson && eventJson.type === "Item") {
                const item = await fromUuid(eventJson.uuid);
                if (inputElement.dataset.droptype !== item.type) {
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
        })

        this._activateSkillTraits(html);
        this._activateSkillModifiers(html);
        this._activateResourceDrop(html);
        this._activateSkillCheck(html);
        this._activateSkillCheckRequestFields(html);
    }

    _activateSkillTraits(html) {
        const skillTraits = html[0].querySelector('input[name="system.skillTraits"]');
        const skillTraitSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
        };
        if (skillTraits) {
            var taggedSkillTraits = new Tagify(skillTraits, skillTraitSettings);
        }
    }

    _activateSkillCheck(html) {
        const skillCheck = html[0].querySelector('input[name="system.action.skillCheck"]');
        const skillCheckSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.entries(CONFIG.ABBREW.attributes).map(e => ({ value: game.i18n.localize(e[1]), label: e[0] }))],
        };
        if (skillCheck) {
            var taggedSkillCheck = new Tagify(skillCheck, skillCheckSettings);
        }
    }


    _activateSkillCheckRequestFields(html) {
        const requirementModifiers = html[0].querySelector('input[name="system.action.skillRequest.requirements.modifiers"]');
        const targetModifiers = html[0].querySelector('input[name="system.action.skillRequest.targetModifiers"]');
        const settings = {
            whitelist: CONFIG.ABBREW.fundamentalAttributeSkillSummaries,
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            placeholder: "Drop or select an attribute skill"
        };

        if (requirementModifiers) {
            var taggedRequirementModifiers = new Tagify(requirementModifiers, settings);
        }
        if (targetModifiers) {
            var taggedTargetModifiers = new Tagify(targetModifiers, settings);
        }
    }


    _activateSkillModifiers(html) {
        const skillSynergy = html[0].querySelector('input[name="system.skillModifiers.synergy"]');
        const skillDiscord = html[0].querySelector('input[name="system.skillModifiers.discord"]');
        const settings = {
            whitelist: CONFIG.ABBREW.fundamentalSkillSummaries,
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            placeholder: "Drop or select a skill"
        };

        if (skillSynergy) {
            var taggedSkillSynergy = new Tagify(skillSynergy, settings);
        }
        if (skillDiscord) {
            var taggedSkillDiscord = new Tagify(skillDiscord, settings);
        }
    }

    _activateResourceDrop(html) {
        const resourceDrop = html[0].querySelectorAll('input.resource-drop');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            maxTags: 1,
        };
        if (resourceDrop) {
            var taggedResourceDrops = [];
            resourceDrop.forEach(drop => {
                var taggedResourceDrop = new Tagify(drop, settings);
                taggedResourceDrops.push(taggedResourceDrop);
            });
        }
    }

    _onModifierControlAction(target, action) {
        if (this.item.system.configurable) {
            switch (action) {
                case "add-modifier":
                    return this.addModifier(target);
                case "remove-modifier":
                    return this.removeModifier(target);
            }
        }
    }

    addModifier(target) {
        const dataset = target.closest("li").dataset;
        const parent = target.closest(".modifier-field-parent");
        if (parent) {
            const parentDataset = parent.dataset;
            const parentId = parentDataset.id;
            const parentPath = parentDataset.path;
            const parentField = foundry.utils.deepClone(getObjectValueByStringPath(this.item, parentPath));
            parentField[parentId].value = [...parentField[parentId].value, {}];
            const update = {};
            update[parentPath] = parentField;
            return this.item.update(update);
        } else {
            const path = dataset.path;
            const modifierBuilderField = foundry.utils.deepClone(getObjectValueByStringPath(this.item, path));
            const updatedField = [...modifierBuilderField, {}];
            const update = {};
            update[path] = updatedField;
            return this.item.update(update);
        }
    }

    removeModifier(target) {
        const dataset = target.closest("li").dataset;
        const parent = target.closest(".modifier-field-parent");
        const id = dataset.id;
        if (parent) {
            const parentDataset = parent.dataset;
            const parentId = parentDataset.id;
            const parentPath = parentDataset.path;
            const parentField = foundry.utils.deepClone(getObjectValueByStringPath(this.item, parentPath));
            parentField[parentId].value.splice(Number(id), 1);
            const update = {};
            update[parentPath] = parentField;
            return this.item.update(update);
        } else {
            const path = dataset.path;
            const modifierBuilderField = foundry.utils.deepClone(getObjectValueByStringPath(this.item, path));
            modifierBuilderField.splice(Number(id), 1);
            const update = {};
            update[path] = modifierBuilderField;
            return this.item.update(update);
        }

    }

    /**
      * Handle one of the add or remove wound reduction buttons.
      * @param {Element} target  Button or context menu entry that triggered this action.
      * @param {string} action   Action being triggered.
      * @returns {Promise|void}
      */
    _onSkillActionModifierWoundAction(target, action) {
        if (this.item.system.configurable) {
            switch (action) {
                case 'add-skill-action-modifier-wound-self':
                    return this.addSkillActionModifierWound(target, "self");
                case 'remove-skill-action-modifier-wound-self':
                    return this.removeSkillActionModifierWound(target, "self");
                case 'add-skill-action-modifier-wound-target':
                    return this.addSkillActionModifierWound(target, "target");
                case 'remove-skill-action-modifier-wound-target':
                    return this.removeSkillActionModifierWound(target, "target");
                case 'add-skill-action-attackProfile-wound-finisher-modifier':
                    return this.addSkillActionAtackProfileWound(target);
                case 'remove-skill-action-attackProfile-wound-finisher-modifier':
                    return this.removeSkillActionAtackProfileWound(target);
                case 'add-skill-action-modifier-attackProfile-wound-finisher-modifier':
                    return this.addSkillActionModifierAtackProfileWound(target);
                case 'remove-skill-action-modifier-attackProfile-wound-finisher-modifier':
                    return this.removeSkillActionModifierAtackProfileWound(target);
            }
        }
    }

    addSkillActionModifierWound(target, actionTarget) {
        let action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.wounds[actionTarget] = [...action.modifiers.wounds[actionTarget], {}];
        return this.item.update({ "system.action": action });

    }

    removeSkillActionModifierWound(target, actionTarget) {
        const id = target.closest("li").dataset.id;
        const action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.wounds[actionTarget].splice(Number(id), 1);
        return this.item.update({ "system.action": action });
    }

    addSkillActionAtackProfileWound() {
        let action = foundry.utils.deepClone(this.item.system.action);
        action.attackProfile.finisher.wounds = [...action.attackProfile.finisher.wounds, {}];
        return this.item.update({ "system.action": action });

    }

    removeSkillActionAtackProfileWound(target) {
        const id = target.closest("li").dataset.id;
        const action = foundry.utils.deepClone(this.item.system.action);
        action.attackProfile.finisher.wounds.splice(Number(id), 1);
        return this.item.update({ "system.action": action });
    }

    addSkillActionModifierAtackProfileWound() {
        let action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.attackProfile.finisher.wounds = [...action.modifiers.attackProfile.finisher.wounds, {}];
        return this.item.update({ "system.action": action });

    }

    removeSkillActionModifierAtackProfileWound(target) {
        const id = target.closest("li").dataset.id;
        const action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.attackProfile.finisher.wounds.splice(Number(id), 1);
        return this.item.update({ "system.action": action });
    }

    /**
      * Handle one of the add or remove wound reduction buttons.
      * @param {Element} target  Button or context menu entry that triggered this action.
      * @param {string} action   Action being triggered.
      * @returns {Promise|void}
      */
    _onSkillActionModifierResourceAction(target, action) {
        if (this.item.system.configurable) {
            switch (action) {
                case 'add-skill-action-modifier-resource-self':
                    return this.addSkillActionModifierResource(target, "self");
                case 'remove-skill-action-modifier-resource-self':
                    return this.removeSkillActionModifierResource(target, "self");
                case 'add-skill-action-modifier-resource-target':
                    return this.addSkillActionModifierResource(target, "target");
                case 'remove-skill-action-modifier-resource-target':
                    return this.removeSkillActionModifierResource(target, "target");
            }
        }
    }

    addSkillActionModifierResource(target, actionTarget) {
        let action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.resources[actionTarget] = [...action.modifiers.resources[actionTarget], {}];
        return this.item.update({ "system.action": action });

    }

    removeSkillActionModifierResource(target, actionTarget) {
        const id = target.closest("li").dataset.id;
        const action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.resources[actionTarget].splice(Number(id), 1);
        return this.item.update({ "system.action": action });
    }

    _onDamageAction(target, action) {
        switch (action) {
            case 'add-damage':
                return this.addDamage(target);
            case 'remove-damage':
                return this.removeDamage(target);
            case 'add-modifier-damage':
                return this.addModifierDamage(target);;
            case 'remove-modifier-damage':
                return this.removeModifierDamage(target);;
        }
    }

    addDamage(target) {
        const damage = this.item.system.action.attackProfile.damage;
        const update = [...damage, {}];
        return this.item.update({ "system.action.attackProfile.damage": update });
    }

    removeDamage(target) {
        const damageId = target.closest("li").dataset.id;
        const damage = this.item.system.action.attackProfile.damage;
        damage.splice(Number(damageId), 1);
        return this.item.update({ "system.action.attackProfile.damage": damage });
    }

    addModifierDamage(target) {
        const damage = this.item.system.action.modifiers.attackProfile.damage;
        const update = [...damage, {}];
        return this.item.update({ "system.action.modifiers.attackProfile.damage": update });
    }

    removeModifierDamage(target) {
        const damageId = target.closest("li").dataset.id;
        const damage = this.item.system.action.modifiers.attackProfile.damage;
        damage.splice(Number(damageId), 1);
        return this.item.update({ "system.action.modifiers.attackProfile.damage": damage });
    }

    tagify
}
