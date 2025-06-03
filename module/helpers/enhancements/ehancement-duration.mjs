export async function trackEnhancementDuration(actor, enhancement) {
    const duration = getenhancementDuration(enhancement)
    await createDurationActiveEffect(actor, enhancement, duration);
}

function getenhancementDuration(enhancement) {
    const precision = enhancement.system.duration.precision;
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

    const expiresOnStartOfTurn = enhancement.system.duration.expireOnStartOfTurn;
    const value = Math.max(1, enhancement.system.duration.value);
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

async function createDurationActiveEffect(actor, enhancement, duration) {
    const conditionEffectData = {
        _id: actor._id,
        name: game.i18n.localize(enhancement.name),
        img: enhancement.img,
        changes: [],
        disabled: false,
        duration: duration,
        description: game.i18n.localize(enhancement.description),
        origin: `Actor.${actor._id}`,
        tint: '',
        transfer: false,
        statuses: [],
        flags: { abbrew: { enhancement: { type: "enhancement", trackDuration: enhancement._id, expiresOn: enhancement.system.duration.expireOnStartOfTurn ? "start" : "end" } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
}