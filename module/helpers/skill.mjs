import { mergeWoundsWithOperator } from "./combat.mjs";
import { applyOperator } from "./operators.mjs";
import { getObjectValueByStringPath } from "../helpers/utils.mjs"

export async function activateSkill(actor, skill) {
    if (skill.system.action.activationType === "synergy") {
        await trackSkillDuration(actor, skill);
        await addSkillToQueuedSkills(actor, skill);
        await rechargeSkill(actor, skill);
        return;
    }

    if (skill.system.action.duration.precision !== "0" && skill.system.action.duration.value !== 0) {
        await trackSkillDuration(actor, skill);
        await addSkillToActiveSkills(actor, skill);
    }

    await applySkillEffects(actor, skill);
}

export async function applySkillEffects(actor, skill) {
    let updates = {};
    // Get all queued synergy skills
    const queuedSkills = actor.items.toObject().filter(i => actor.system.queuedSkills.includes(i._id));
    // Get all skill triggers on the main skill
    const skillTriggers = getSafeJson(skill.system.skillTraits, []).filter(t => t.feature === "skillTrigger").map(t => t.key);
    // Get all synergies that apply to the main skill
    const queuedSynergies = queuedSkills.filter(s => getSafeJson(s.system.skillTraits, []).filter(st => skillTriggers.indexOf(st)));
    // Get all passives
    const passiveSkills = actor.items.toObject().filter(i => i.system.activatable === false && i.system.skillTraits);
    // Get passives that have synergy with the main skill
    const passiveSynergies = passiveSkills.filter(s => getSafeJson(s.system.skillTraits, []).filter(st => skillTriggers.indexOf(st)));
    // Combine all relevant skills, filtering for those that are out of charges
    const allSkills = [skill, ...queuedSynergies, ...passiveSynergies].filter(s => !s.system.action.charges.hasCharges || (s.system.action.charges.value > 0));
    // Explicitly get any skills with charges for later use
    const chargedSkills = allSkills.filter(s => s.system.action.charges.hasCharges);

    const guardModifiers = allSkills.filter(s => s.system.action.modifiers.guard.self.operator).map(s => ({ value: getSkillValueForPath("system.action.modifiers.guard.self.value", s, s.system.action.modifiers.guard.self.value, actor), operator: s.system.action.modifiers.guard.self.operator }));
    if (guardModifiers) {
        const currentGuard = actor.system.defense.guard.value;
        const guardModifier = mergeModifiers(guardModifiers);
        updates["system.defense.guard.value"] = applyOperator(currentGuard, guardModifier, skill.system.action.modifiers.guard.self.operator);
    }

    // if (skill.system.action.modifiers.wounds.self.length > 0) {
    //     let updateWounds = actor.system.wounds;
    //     skill.system.action.modifiers.wounds.self.filter(w => w.value && w.type && w.operator).forEach(w => updateWounds = mergeWoundsWithOperator(updateWounds, [{ type: w.type, value: w.value }], w.operator));
    //     updates["system.wounds"] = updateWounds;
    // }

    await actor.update(updates);
    for (const index in chargedSkills) {
        const skill = chargedSkills[index];
        let currentCharges = skill.system.action.charges.value;
        const item = actor.items.find(i => i._id === skill._id);
        await item.update({ "system.action.charges.value": currentCharges -= 1 });
    }
}

function getSafeJson(json, defaultValue) {
    if (!json || json === "") {
        return defaultValue;
    }

    return JSON.parse(json);
}

function mergeModifiers(modifiers) {
    return modifiers.reduce((result, modifier) => applyOperator(result, modifier.value, modifier.operator), 0)
}

function getSkillValueForPath(path, skill, rawValue, actor) {
    const skillTraits = getSafeJson(skill.system.skillTraits, []);
    const valueReplacers = skillTraits.filter(st => st.feature === "valueReplacer" && st.subFeature === path && st.effect === "replace");
    if (valueReplacers?.length) {
        const valueReplacer = valueReplacers.shift();
        const value = parsePath(valueReplacer.data, actor)
        return value;
    }

    return isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
}

export async function trackSkillDuration(actor, skill) {
    const duration = getSkillDuration(skill);
    if (duration) {
        await createDurationActiveEffect(actor, skill, duration);
    }
}

async function addSkillToActiveSkills(actor, skill) {
    const skills = actor.system.activeSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.activeSkills": updateSkills });
}

async function addSkillToQueuedSkills(actor, skill) {
    const skills = actor.system.queuedSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.queuedSkills": updateSkills });
}

function getSkillDuration(skill) {
    const precision = skill.system.action.duration.precision;
    const duration = {};
    // Return 1 Turn Duration for Instants, remove on next standalone.
    if (precision === "0") {
        duration["turns"] = 1;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = 0.01;
        return duration;
    }

    const value = skill.system.action.duration.value;
    duration["startTime"] = game.time.worldTime;

    if (precision === "6") {
        duration["rounds"] = value;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "rounds";
        duration["duration"] = value;
        return duration;
    }

    if (precision === "0.01") {
        duration["turns"] = value;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = (value / 100).toFixed(2);
        return duration;
    }

    const seconds = precision * value;
    duration["duration"] = seconds;
    duration["seconds"] = seconds;
    duration["type"] = "seconds"
    return duration;
}

async function createDurationActiveEffect(actor, skill, duration) {
    const conditionEffectData = {
        _id: actor._id,
        name: game.i18n.localize(skill.name),
        img: skill.img,
        changes: [],
        disabled: false,
        duration: duration,
        description: game.i18n.localize(skill.description),
        origin: `Actor.${actor._id}`,
        tint: '',
        transfer: false,
        statuses: [],
        flags: { abbrew: { skill: { type: skill.system.action.activationType, trackDuration: skill._id } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
}

async function rechargeSkill(actor, skill) {
    const item = actor.items.filter(i => i._id === skill._id).pop();
    if (skill.system.action.charges.hasCharges) {
        const maxCharges = skill.system.action.charges.max;
        await item.update({ "system.action.charges.value": maxCharges });
    }
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function parsePath(rawValue, actor) {
    const entityType = rawValue.split('.').slice(0, 1).shift();
    const entity = (function () {
        switch (entityType) {
            case 'actor':
                return actor;
            case 'item':
                const id = rawValue.split('.').slice(1, 2).shift();
                return id ? actor.items.filter(i => i._id === id).shift() : actor;
        }
    })();
    const path = (function () {
        switch (entityType) {
            case 'actor':
                return rawValue.split('.').slice(1).join('.');
            case 'item':
                return rawValue.split('.').slice(2).join('.');
        }
    })();
    if (getObjectValueByStringPath(entity, path) != null) {
        return getObjectValueByStringPath(entity, path);
    }
}