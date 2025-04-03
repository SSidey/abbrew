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
                    const updateSkills = [...storedSkills, { name: item.name, id: item._id, image: item.img, sourceId: item.uuid }];
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
                const updateValue = [...inputValue, { value: value, id: item.system.abbrewId.uuid, sourceId: eventJson.uuid }];
                const update = {};
                update[path] = JSON.stringify(updateValue);
                await this.item.update(update);
            }
        })

        this._activateSkillTraits(html);
        this._activateSkillModifiers(html);
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


    _activateSkillModifiers(html) {
        const skillSynergy = html[0].querySelector('input[name="system.skillModifiers.synergy"]');
        const skillDiscord = html[0].querySelector('input[name="system.skillModifiers.discord"]');
        // TODO: Could add the baseline skills here to make sure they exist
        // const proxiedSkills = Object.entries(this.item?.actor?.system.proxiedSkills).filter(ps => ps[1]).map(ps => ({ value: CONFIG.ABBREW.proxiedSkills[ps[0]], id: ps[1] }));
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
        };
        if (skillSynergy) {
            var taggedSkillSynergy = new Tagify(skillSynergy, settings);
        }
        if (skillDiscord) {
            var taggedSkillDiscord = new Tagify(skillDiscord, settings);
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
                case 'add-skill-action-modifier-wound':
                    return this.addSkillActionModifierWound(target);
                case 'remove-skill-action-modifier-wound':
                    return this.removeSkillActionModifierWound(target);
            }
        }
    }

    addSkillActionModifierWound(target) {
        let action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.wounds.self = [...action.modifiers.wounds.self, {}];
        return this.item.update({ "system.action": action });

    }

    removeSkillActionModifierWound(target) {
        const id = target.closest("li").dataset.id;
        const action = foundry.utils.deepClone(this.item.system.action);
        action.modifiers.wounds.self.splice(Number(id), 1);
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

    removeremoveModifierDamageDamage(target) {
        const damageId = target.closest("li").dataset.id;
        const damage = this.item.system.action.modifiers.attackProfile.damage;
        damage.splice(Number(damageId), 1);
        return this.item.update({ "system.action.modifiers.attackProfile.damage": damage });
    }

    tagify
}
