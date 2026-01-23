import AbbrewSkill from "../data/skill.mjs";
import { getSafeJson } from "./utils.mjs";

// TODO: Cap concepts at visualisation
export function getAttackSkillWithActions(id, name, traits, actionCost, image, attackProfile, attackMode, handsSupplied, siblingSkillModifiers = [], actorSource, itemSource) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills[attackMode.toLowerCase()];
    let critical;
    if (attackMode === "ranged") {
        critical = Number.POSITIVE_INFINITY;
    } else if (attackMode === "aimedshot") {
        critical = attackProfile.critical;
    }
    else {
        critical = Math.min(11 - handsSupplied, attackProfile.critical);
    }

    const system = AbbrewSkill.schema.getInitialValue();
    system.traits.value = getSafeJson(traits, []);
    const attackTrait = CONFIG.ABBREW.traits.find(t => t.key === "attack");
    attackTrait.value = game.i18n.localize(attackTrait.value);
    const offenseTrait = CONFIG.ABBREW.traits.find(t => t.key === "offense");
    offenseTrait.value = game.i18n.localize(offenseTrait.value);
    system.traits.value.push(attackTrait);
    system.traits.value.push(offenseTrait);
    system.abbrewId = { uuid: id ?? skill.id };
    system.siblingSkillModifiers = siblingSkillModifiers;
    system.isActivatable = true;
    system.skillType = "basic";
    system.sources = { actor: actorSource, items: itemSource };
    system.action.activationType = "standalone";
    system.action.actionCost = actionCost;
    system.action.actionImage = image;
    system.action.attackProfile = { ...attackProfile, attackMode: attackMode, handsSupplied: handsSupplied, critical: critical, isEnabled: true, finisher: { cost: 0, wounds: [] } };

    return ({
        _id: id ?? skill.id,
        name: name,
        system: system
    });
}

export function getParrySkillWithActions(actionCost, siblingSkillModifiers = []) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills["parry"];

    const system = AbbrewSkill.schema.getInitialValue();
    system.abbrewId = { uuid: skill.id };
    system.siblingSkillModifiers = siblingSkillModifiers;
    system.isActivatable = true;
    system.skillType = "basic";
    system.action.activationType = "standalone";
    system.action.actionCost = Math.max(1, actionCost);
    system.action.actionImage = skill.image;
    const defenseTrait = CONFIG.ABBREW.traits.find(t => t.key === "defense");
    defenseTrait.value = game.i18n.localize(defenseTrait.value);
    system.traits.value = [defenseTrait]

    return ({
        _id: skill.id,
        name: skill.name,
        system: system
    });
}

// { id, name, image, attribute }
export function getFundamentalSkillWithActionCost(fundamental, actionCost, siblingSkillModifiers = []) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills[fundamental];

    const system = AbbrewSkill.schema.getInitialValue();
    system.abbrewId = { uuid: fundamental.id };
    system.siblingSkillModifiers = siblingSkillModifiers;
    system.isActivatable = true;
    system.skillType = "basic";
    system.action.activationType = "standalone";
    system.action.actionCost = actionCost;
    system.action.actionImage = fundamental.image;

    return ({
        _id: fundamental.id,
        name: fundamental.name,
        system: system
    });
}

export function getFundamentalAttributeSkill(fundamental, siblingSkillModifiers = []) {

    const system = AbbrewSkill.schema.getInitialValue();
    system.abbrewId = { uuid: fundamental.id };
    system.siblingSkillModifiers = siblingSkillModifiers;
    system.isActivatable = true;
    system.skillType = "basic";
    system.action.activationType = "standalone";
    system.action.actionCost = 0;
    system.action.actionImage = fundamental.image;
    system.action.skillCheck = [
        {
            operator: "add",
            type: "actor",
            path: `system.attributes.${fundamental.attribute}.value`,
            multiplier: 1,
            lateParse: false
        }
    ];

    return ({
        _id: fundamental.id,
        name: fundamental.name,
        system: system
    });
}
