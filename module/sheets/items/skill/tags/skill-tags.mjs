import Tagify from "@yaireo/tagify";

export const SkillTagsMixin = superclass => class extends superclass {
    activateSkillTags() {
        this._activateSkillInnateConcepts();
        this._activateSkillCheck();
        this._activateSynergyTraitFilter();
        this._activateSkillCheckRequestFields();
        this._activateSkillModifiers();
        this._activateResourceDrop();
        this._activateRoles();
        this._activatePath();
        this._activateProtectionModificationDamageTypes();
        this._activateProtectionModificationTypes();
        this._activateProtectionModificationTriggers();
        this._activateThreatenedDisableByTags();
        this._activateRequiredActiveSkillsTags();
        this._activateActivateWithTags();
    }

    _activateSkillInnateConcepts() {
        const innateConcepts = this.element.querySelector('input[name="system.innateConcepts.raw"]');
        const innateConceptsSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.innateConcepts.map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
            enforceWhitelist: true
        };
        if (innateConcepts) {
            var taggedInnateConcepts = new Tagify(innateConcepts, innateConceptsSettings);
        }
    }

    _activateSkillCheck() {
        const skillCheck = this.element.querySelector('input[name="system.action.skillCheck"]');
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

    _activateSynergyTraitFilter() {
        const traitFilter = this.element.querySelector('input[name="system.skillModifiers.synergyTraitFilter.raw"]');
        const skillCheckSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.traits.map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
            enforceWhitelist: true
        };
        if (traitFilter) {
            var taggedTraitFilter = new Tagify(traitFilter, skillCheckSettings);
        }
    }


    _activateSkillCheckRequestFields() {
        const requirementModifiers = this.element.querySelector('input[name="system.action.skillRequest.requirements.modifiers"]');
        const targetModifiers = this.element.querySelector('input[name="system.action.skillRequest.targetModifiers"]');
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


    _activateSkillModifiers() {
        const skillSynergy = this.element.querySelector('input[name="system.skillModifiers.synergy"]');
        const skillDiscord = this.element.querySelector('input[name="system.skillModifiers.discord"]');
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

    _activateResourceDrop() {
        const resourceDrop = this.element.querySelectorAll('input.resource-drop');
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

    _activateRoles() {
        const roles = this.element.querySelector('input[name="system.roles.raw"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.values(CONFIG.ABBREW.roles).map(role => ({
                label: role.value,
                value: game.i18n.localize(role.label),
                title: game.i18n.localize(role.description)
            }))],
        };
        if (roles) {
            var taggedRoles = new Tagify(roles, settings);
        }
    }

    _activatePath() {
        const path = this.element.querySelector('input[name="system.path.raw"]');
        const packIndex = game.packs.get("abbrew.paths").index;
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
            whitelist: [
                CONFIG.ABBREW.universalPath,
                ...packIndex.contents
            ].map(path => ({
                label: path._id,
                value: game.i18n.localize(path.name),
                id: path._id
            }))
        };
        if (path) {
            var taggedPath = new Tagify(path, settings);
        }
    }

    _activateProtectionModificationDamageTypes() {
        const modifications = this.element.querySelectorAll('div.damage-tagged input[name^="system.action.modifiers.protection"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: true,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.traits.filter(t => t.feature === "skill" && t.subFeature === "identifiers").map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            })), { "key": "all", "value": "All", "feature": "skill", "subFeature": "identifiers", "effect": "", "data": "", "exclude": [] }],
            enforceWhitelist: true
        };
        if (modifications) {
            var taggedModifications = [];
            modifications.forEach(modification => {
                var taggedModification = new Tagify(modification, settings);
                taggedModifications.push(taggedModification);
            });
        }
    }

    _activateProtectionModificationTypes() {
        const modifications = this.element.querySelectorAll('div.protection-type-tagged input[name^="system.action.modifiers.protection"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: true,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.entries(CONFIG.ABBREW.protectionTypes).map(e => ({ label: e[0], value: game.i18n.localize(e[1].label) }))],
            enforceWhitelist: true
        };
        if (modifications) {
            var taggedModifications = [];
            modifications.forEach(modification => {
                var taggedModification = new Tagify(modification, settings);
                taggedModifications.push(taggedModification);
            });
        }
    }

    _activateProtectionModificationTriggers() {
        const modifications = this.element.querySelectorAll('div.modification-trigger-tagged input[name^="system.action.modifiers.protection"]');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: true,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...CONFIG.ABBREW.traits.map(trait => ({
                ...trait,
                value: game.i18n.localize(trait.value)
            }))],
            enforceWhitelist: true
        };
        if (modifications) {
            var taggedModifications = [];
            modifications.forEach(modification => {
                var taggedModification = new Tagify(modification, settings);
                taggedModifications.push(taggedModification);
            });
        }
    }

    _activateRequiredActiveSkillsTags() {
        const tags = this.element.querySelector('.form-group.required-active-skills > div.form-fields > input');
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
            whitelist: [],
            enforceWhitelist: false
        };
        if (tags) {
            var taggedTags = new Tagify(tags, settings);
        }
    }

    _activateActivateWithTags() {
        const tags = this.element.querySelector('.form-group.activate-with > div.form-fields > input');
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
            whitelist: [],
            enforceWhitelist: false
        };
        if (tags) {
            var taggedTags = new Tagify(tags, settings);
        }
    }

    _activateThreatenedDisableByTags() {
        const disabledBy = this.element.querySelector('.form-group.threatened-disabled-by > div.form-fields > input');
        const settings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...Object.entries(CONFIG.ABBREW.statusEffects).map(([key, effect]) => ({
                label: key,
                value: game.i18n.localize(effect.name)
            }))],
            enforceWhitelist: true
        };
        if (disabledBy) {
            var taggedDisabledBy = new Tagify(disabledBy, settings);
        }
    }
}