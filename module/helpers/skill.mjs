import { mergeWoundsWithOperator } from "./combat.mjs";
import { applyOperator } from "./operators.mjs";
import { getObjectValueByStringPath } from "../helpers/utils.mjs"

export async function activateSkill(actor, skill) {
    let updates = {};
    const duration = getSkillDuration(skill);
    if (duration) {
        await createDurationActiveEffect(actor, skill, duration);
    }
    if (skill.system.action.modifiers.guard.self.value) {
        const rawValue = skill.system.action.modifiers.guard.self.value;
        const value = isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
        const skilledGuard = applySkillsForGuard(value, actor);
        const guard = applyOperator(
            actor.system.defense.guard.value,
            skilledGuard,
            skill.system.action.modifiers.guard.self.operator
        );
        updates["system.defense.guard.value"] = guard;
    }
    if (skill.system.action.modifiers.wounds.self.length > 0) {
        let updateWounds = actor.system.wounds;
        skill.system.action.modifiers.wounds.self.filter(w => w.value && w.type && w.operator).forEach(w => updateWounds = mergeWoundsWithOperator(updateWounds, [{ type: w.type, value: w.value }], w.operator));
        updates["system.wounds"] = updateWounds;
    }

    await actor.update(updates);
}

function getSkillDuration(skill) {
    const precision = skill.system.action.duration.precision;
    if (precision === "0") {
        return null;
    }

    const duration = {};
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

export async function queueSynergySkill(actor, skill) {
    const duration = getSkillDuration(skill);
    if (duration) {
        await createDurationActiveEffect(actor, skill, duration);
    }
    const skills = actor.system.queuedSkills;
    const updateSkills = [...skills, skill._id];
    // TODO: Add standalones to 'activeSkills' check on turn start and apply  them again?
    // TODO: Add context menu check on activate and remove from queuedSkills if they are there.
    await actor.update({ "system.queuedSkills": updateSkills });
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
        flags: { abbrew: { skill: { trackDuration: skill._id } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
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
    if (getObjectValueByStringPath(entity, path)) {
        return getObjectValueByStringPath(entity, path);
    }
}

function applySkillsForGuard(value, actor) {
    let skilledValue = value;
    const skillFlags = actor.items.filter(i => i.type === 'skill').filter(i => i.system.skillFlags).flatMap(i => JSON.parse(i.system.skillFlags).map(ap => ap.value));
    if (skillFlags.includes("Shield Training")) {
        const heldArmour = actor.getActorHeldItems().filter(i => i.type === 'armour').reduce((result, a) => result += a.system.defense.guard, 0);
        skilledValue += heldArmour;
    }

    return skilledValue;
}