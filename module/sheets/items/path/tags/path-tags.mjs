import Tagify from "@yaireo/tagify";

export const PathTagsMixin = superclass => class extends superclass {
    activatePathTags() {
        this.activateRoles();
    }

    activateRoles() {
        const roles = this.element.querySelectorAll('input[name="system.roles"]');
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
            whitelist: allRoles,
            enforceWhitelist: true
        };
        if (roles) {
            var taggedRoles = [];
            roles.forEach(role => {
                var taggedRole = new Tagify(role, roleSettings);
                taggedRoles.push(taggedRole);
            });
        }
    }
}