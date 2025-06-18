import Tagify from "@yaireo/tagify";

export const RevealableTagsMixin = superclass => class extends superclass {
    activateRevealSkillsFields() {
        const revealSkills = this.element.querySelector('input[name="system.revealed.revealSkills.raw"]');
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

        if (revealSkills) {
            var taggedRevealSkills = new Tagify(revealSkills, settings);
        }
    }
}