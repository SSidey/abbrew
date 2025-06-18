import Tagify from "@yaireo/tagify";

export const ArchetypeTagsMixin = superclass => class extends superclass {

    _activateArchetypeTags() {
        this._activateRoles();
        this._activateArchetypePaths();
    }

    _activateRoles() {
        // TODO: Add to collection as with resources input[name^="system.roleRequirements."].
        const roles = this.element.querySelectorAll('input[name$=".roles"]');
        const restrictedRoles = this.element.querySelectorAll('input[name$=".restrictedRoles"]');
        const allRoles = [...Object.values(CONFIG.ABBREW.roles).map(role => ({
            label: role.value,
            value: game.i18n.localize(role.label),
            title: game.i18n.localize(role.description)
        }))];
        const roleSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: false   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: true,             // <- Should duplicate tags be allowed or not
            whitelist: [],
        };
        if (roles) {
            var taggedRoles = [];
            roles.forEach(role => {
                const restrictedRoles = this.item.system.roleRequirements[role.dataset.requirementId].parsedRestrictedRoles.map(r => r.label);
                const whitelist = allRoles.filter(r => !restrictedRoles.includes(r.label));
                const settings = foundry.utils.deepClone(roleSettings);
                settings.whitelist = whitelist;
                var taggedRole = new Tagify(role, settings);
                taggedRoles.push(taggedRole);
            });
            restrictedRoles.forEach(role => {
                const currentRoles = this.item.system.roleRequirements[role.dataset.requirementId].parsedRoles.map(r => r.label);
                const whitelist = allRoles.filter(r => !currentRoles.includes(r.label));
                const settings = foundry.utils.deepClone(roleSettings);
                settings.whitelist = whitelist;
                var taggedRole = new Tagify(role, settings);
                taggedRoles.push(taggedRole);
            });
        }
    }

    _activateArchetypePaths() {
        const paths = this.element.querySelectorAll('input[name$="path.raw"]');
        const allPaths = CONFIG.ABBREW.paths.map(path => ({
            label: path.value,
            value: game.i18n.localize(path.label),
            roles: path.roles,
            title: game.i18n.localize(path.description),
            id: path.id
        }));
        const pathSettings = {
            dropdown: {
                maxItems: 20,               // <- mixumum allowed rendered suggestions
                classname: "tags-look",     // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,                 // <- show suggestions on focus
                closeOnSelect: false,       // <- do not hide the suggestions dropdown once an item has been selected
                includeSelectedTags: true   // <- Should the suggestions list Include already-selected tags (after filtering)
            },
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            // whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => game.i18n.localize(trait.name))]
            whitelist: [],
        };
        if (paths) {
            var taggedPaths = [];
            paths.forEach(path => {
                const archetype = this.item;
                const requirement = path.dataset.requirementId;
                const roles = new Set(archetype.system.roleRequirements[requirement].parsedRoles.map(r => r.label));
                const restrictedRoles = new Set(archetype.system.roleRequirements[requirement].parsedRestrictedRoles.map(r => r.label));
                const pathWhitelist = allPaths.filter(p => { const rolePaths = new Set(p.roles); return (rolePaths.intersection(roles).size === roles.size) && (restrictedRoles.intersection(rolePaths).size === 0) });
                const settings = foundry.utils.deepClone(pathSettings);
                settings.whitelist = pathWhitelist;
                const tagify = new Tagify(path, settings);
                taggedPaths.push(tagify);
            });
        }
    }
}