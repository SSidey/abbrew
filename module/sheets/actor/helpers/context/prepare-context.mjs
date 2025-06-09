import { prepareActiveEffectCategories } from "../../../../helpers/effects.mjs";
import { filterKeys } from "../../../../helpers/utils.mjs";

export const ActorContextMixin = superclass => class extends superclass {
    constructor(args) {
        super(args);
    }

    async prepareActorContext(context) {
        // Use a safe clone of the actor data for further operations.
        const actorData = context.document;
        context.actor = actorData;
        context.items = actorData.items;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Prepare character data and items.
        if (actorData.type == 'character') {
            this._prepareItems(context);
            this._prepareDefenses(actorData, context);
            this._prepareCharacterData(actorData, context);
        }

        // Prepare NPC data and items.
        if (actorData.type == 'npc') {
            this._prepareItems(context);
            this._prepareDefenses(actorData, context);
            this._prepareCharacterData(actorData, context);
        }

        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.actor.system.biography,
            {
                // Whether to show secret blocks in the finished html
                secrets: this.document.isOwner,
                // Necessary in v11, can be removed in v12
                async: true,
                // Data to fill in for inline rolls
                rollData: this.actor.getRollData(),
                // Relative UUID resolution
                relativeTo: this.actor,
            }
        );

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(
            // A generator that returns all effects stored on the actor
            // as well as any items
            this.actor.allApplicableEffects()
        );

        context.config = CONFIG.ABBREW;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterData(actorData, context) {
        const resources = actorData.system.resources.owned.map(r => ({ id: r.id, name: r.name, value: actorData.system.resources.values.find(v => v.id === r.id)?.value ?? 0, max: r.max }));
        context.resources = resources;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.    
        const gear = [];
        const ammunition = [];
        // TODO: Exception when blank
        const ammunitionChoices = this.actor.items.filter(i => i.type === "ammunition").filter(i => i.system.storeIn && isContainerAccessible(this.actor.items.find(c => c._id === i.system.storeIn))).map(a => ({ label: a.name, type: a.system.type, value: a._id }));
        const features = [];
        const skills = { background: [], basic: [], path: [], resource: [], temporary: [], untyped: [], archetype: [], tier: [] };
        const spells = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: [],
        };
        const anatomy = [];
        const equipment = [];
        const armour = [];
        const wornArmour = [];
        const weapons = [];
        const equippedWeapons = [];
        const archetypes = [];
        const archetypeSkills = [];
        const favouriteSkills = [];
        const activeSkills = [];
        const enhancements = [];
        const storage = [];
        const playerRevealed = { anatomy: [], armour: [], weapons: [], traits: [] }

        for (let i of context.items) {
            i.img = i.img || Item.DEFAULT_ICON;

            if (i.type === 'archetype') {
                archetypes.push(i);
                archetypeSkills[i._id] = context.items.filter(j => i.system.skillIds.includes(j.system.abbrewId.uuid));
            }

            if (["armour", "equipment"].includes(i.type) && i.system.storage.hasStorage) {
                const accessible = isContainerAccessible(i);
                storage.push({ container: i, contents: context.items.filter(ci => i.system.storage.storedItems.includes(ci._id)), isAccessible: accessible });
            }

            if (i.system.isFavourited) {
                favouriteSkills.push(i);
            }

            if (i.type === "skill" && i.system.action.isActive) {
                activeSkills.push(i);
            }
        }

        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || Item.DEFAULT_ICON;
            if (i.system.storeIn) {
                if (i.type === 'weapon') {
                    if (['held1H', 'held2H', 'active'].includes(i.system.equipState)) {
                        equippedWeapons.push(i);
                        if (i.system.revealed.isRevealed) {
                            playerRevealed.weapons.push(i);
                        }
                    }
                }
                continue;
            }

            // Append to equipment.
            if (i.type === 'item') {
                equipment.push(i);
            }
            if (i.type === 'ammunition') {
                ammunition.push(i);
                ammunitionChoices.push({ name: i.name, type: i.system.type, id: i._id });
            }
            // Append to features.
            else if (i.type === 'feature') {
                features.push(i);
            }
            else if (i.type === 'equipment') {
                equipment.push(i);
            }
            // Append to skills.
            else if (i.type === 'skill') {
                switch (i.system.skillType) {
                    case 'background':
                        skills.background.push(i);
                        break;
                    case 'basic':
                        skills.basic.push(i);
                        break;
                    case 'path':
                        skills.path.push(i);
                        // archetypeSkills[i.archetypeId].push(i);
                        break;
                    case 'resource':
                        skills.resource.push(i)
                        break;
                    case 'temporary':
                        skills.temporary.push(i)
                        break;
                    default:
                        skills.untyped.push(i);
                }
            }
            else if (i.type === "anatomy") {
                if (i.system.isDismembered) {
                    equipment.push(i);
                } else {
                    anatomy.push(i);
                    if (i.system.revealed.isRevealed) {
                        playerRevealed.anatomy.push(
                            {
                                item: i,
                                grantedWeapons: context.items.filter(i => i.type === "weapon").filter(w => w.system.revealed.isRevealed && w.system.grantedBy === i._id),
                                grantedSkills: context.items.filter(i => i.type === "skill").filter(w => w.system.revealed.isRevealed && w.system.grantedBy.item === i._id)
                            }
                        );
                    }
                }
            }
            else if (i.type === 'armour') {
                armour.push(i);
                if (['held1H', 'held2H', 'worn'].includes(i.system.equipState)) {
                    wornArmour.push(i);
                    if (i.system.revealed.isRevealed) {
                        playerRevealed.armour.push(i);
                    }
                }
            }
            else if (i.type === 'weapon') {
                weapons.push(i);
                if (['held1H', 'held2H', 'active'].includes(i.system.equipState)) {
                    equippedWeapons.push(i);
                    if (i.system.revealed.isRevealed) {
                        playerRevealed.weapons.push(i);
                    }
                }
            }
            else if (i.type === "enhancement") {
                enhancements.push(i);
            }
            else if (i.type === 'spell') {
                if (i.system.spellLevel != undefined) {
                    spells[i.system.spellLevel].push(i);
                }
            }
        }

        // Assign and return
        context.gear = gear;
        context.features = features;
        context.ammunition = ammunition;
        context.ammunitionChoices = ammunitionChoices;
        context.spells = spells;
        const sections = this.getSkillSectionDisplays(CONFIG.ABBREW.skillTypes, skills);
        sections.favourites = favouriteSkills.length > 0 ? "grid" : "none";
        sections.active = activeSkills.length > 0 ? "grid" : "none";
        sections.archetypes = Object.keys(archetypeSkills).length > 0 ? "grid" : "none";
        sections.enhancements = enhancements.length > 0 ? "grid" : "none";
        const allSkillSections = this.updateObjectValueByKey(sections, this.skillSectionDisplay);
        context.allSkillSections = allSkillSections;
        context.skillSections = filterKeys(allSkillSections, ["background", "basic", "path", "resource", "temporary", "untyped"]);
        context.skills = skills;
        context.anatomy = anatomy;
        context.armour = armour;
        context.wornArmour = wornArmour;
        context.weapons = weapons;
        context.equippedWeapons = equippedWeapons;
        context.archetypes = archetypes;
        context.archetypeSkills = archetypeSkills;
        context.favouriteSkills = favouriteSkills;
        context.activeSkills = activeSkills;
        context.enhancements = enhancements;
        context.equipment = equipment;
        context.storage = storage;
        context.playerRevealed = playerRevealed;
    }

    isContainerAccessible(container) {
        return (container.system.storage.accessible && container.system.equipState === "worn") || container.system.equipState === "readied"
    }

    _prepareDefenses(actorData, context) {
        const activeProtection = Object.keys(actorData.system.defense.protection).reduce((result, key) => {
            const protection = actorData.system.defense.protection[key];
            if (protection.reduction !== 0 || protection.amplification !== 0 || protection.resistance !== 0 || protection.immunity !== 0 || protection.weakness !== 0) {
                result.push(protection);
            }

            return result;
        }, []);

        context.activeProtection = activeProtection;
    }

    /* -------------------------------------------- */

    getSkillSectionDisplays(skillTypes, skills) {
        return Object.fromEntries(this.getSkillSectionKeys(skillTypes).map(s => { return { "type": s, "display": skills[s].length > 0 ? 'grid' : 'none' } }).map(x => [x.type, x.display]));
    }

    /* -------------------------------------------- */

    updateObjectValueByKey(obj1, obj2) {
        var destination = Object.assign({}, obj1);
        Object.keys(obj2).forEach(k => {
            if (k in destination && k in obj2) {
                destination[k] = obj2[k];
            }
        });
        return destination;
    }

    /* -------------------------------------------- */

    getSkillSectionKeys(skillTypes) {
        return Object.keys(skillTypes);
    }
}