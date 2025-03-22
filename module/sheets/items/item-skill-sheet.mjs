import {
    onManageActiveEffect,
    prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'

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

        html.find(".damage-control").click(event => {
            const t = event.currentTarget;
            if (t.dataset.action) this._onDamageAction(t, t.dataset.action);
        });

        html.on('dragover', (event) => {
            event.preventDefault();
        });

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
            userInput: false,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
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
            userInput: true,             // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
            duplicates: false,             // <- Should duplicate tags be allowed or not
            whitelist: [...this.item?.actor?.items?.filter(i => i.type === "skill").map(s => ({ value: s.name, id: s._id })) ?? []],
        };
        if (skillSynergy) {
            var taggedSkillSynergy = new Tagify(skillSynergy, settings);
        }
        if (skillDiscord) {
            var taggedSkillDiscord = new Tagify(skillDiscord, settings);
        }
    }

    _onDamageAction(target, action) {
        switch (action) {
            case 'add-damage':
                return this.addDamage(target);
            case 'remove-damage':
                return this.removeDamage(target);
                break;
        }
    }

    addDamage(target) {
        const damage = this.item.system.action.modifiers.attackProfile.damage;
        const update = [...damage, {}];
        return this.item.update({ "system.action.modifiers.attackProfile.damage": update });
    }

    removeDamage(target) {
        const damageId = target.closest("li").dataset.id;
        const damage = this.item.system.action.modifiers.attackProfile.damage;
        damage.splice(Number(damageId), 1);
        return this.item.update({ "system.action.modifiers.attackProfile.damage": damage });
    }
}
