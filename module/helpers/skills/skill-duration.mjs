

export async function trackSkillDuration(actor, skill) {
    const duration = getSkillDuration(skill);
    if (skill.system.action.activationType === "standalone") {
        return await trackStandaloneSkillDuration(actor, skill, duration);
    } else if (skill.system.action.activationType === "synergy") {
        return await trackSynergySkillDuration(actor, skill, duration);
    }

    return false;
}

async function trackStandaloneSkillDuration(actor, skill, duration) {
    if (duration && !(skill.system.action.duration.precision === "0")) {
        await createDurationActiveEffect(actor, skill, duration);
        return true;
    }

    return false;
}

async function trackSynergySkillDuration(actor, skill, duration) {
    if (duration) {
        await createDurationActiveEffect(actor, skill, duration);
        return true;
    }

    return false;
}

export async function addSkillToActiveSkills(actor, skill) {
    const skills = actor.system.activeSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.activeSkills": updateSkills });
}

export async function addSkillToQueuedSkills(actor, skill) {
    const skills = actor.system.queuedSkills;
    const updateSkills = [...skills, skill._id];
    await actor.update({ "system.queuedSkills": updateSkills });
}

function getSkillDuration(skill) {
    const precision = skill.system.action.duration.isConcentration ? "6" : skill.system.action.duration.precision;
    const duration = {};
    if (precision === "-1") {
        return duration;
    }

    if (precision === "0") {
        duration["turns"] = 1;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = 0.01;
        return duration;
    }

    const expiresOnStartOfTurn = skill.system.action.duration.isConcentration ? false : skill.system.action.duration.expireOnStartOfTurn;
    const value = Math.max(1, skill.system.action.duration.value);
    const roundOffset = 0.01
    duration["startTime"] = game.time.worldTime;

    if (precision === "6") {
        duration["rounds"] = value;
        if (!expiresOnStartOfTurn) {
            duration["turns"] = 1;
        }
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        duration["duration"] = expiresOnStartOfTurn ? value : value + roundOffset;
        return duration;
    }

    if (precision === "0.01") {
        duration["turns"] = expiresOnStartOfTurn ? value : value + 1;
        duration["startRound"] = game.combat?.round ?? 0;
        duration["startTurn"] = game.combat?.turn ?? 0;
        duration["type"] = "turns";
        const rawDuration = (value / 100).toFixed(2);
        duration["duration"] = expiresOnStartOfTurn ? rawDuration : rawDuration + roundOffset;
        return duration;
    }

    const seconds = precision * value;
    duration["duration"] = seconds;
    duration["seconds"] = seconds;
    duration["type"] = "seconds"
    return duration;
}

async function createDurationActiveEffect(actor, skill, duration) {
    const stacks = skill.system.action.uses.hasUses ? skill.system.action.uses.value : 1;
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
        flags: { abbrew: { skill: { stacks: stacks, type: skill.system.action.activationType, trackDuration: skill._id, expiresOn: skill.system.action.duration.expireOnStartOfTurn ? "start" : "end" } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
}