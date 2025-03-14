import { applyOperator } from "./operators.mjs";

export async function handleCombatStart(combatants) {
    for (const index in combatants) {
        const combatant = combatants[index];
        const actor = game.actors.get(combatant.actorId);
        await actor.update({ "system.actions": 5 });
    }
}

export async function handleTurnStart(prior, current, priorActor, currentActor) {
    if (current.round < prior.round || (prior.round == current.round && current.turn < prior.turn)) {
        return;
    }
    if (priorActor) {
        await turnEnd(priorActor);
    }
    await turnStart(currentActor);
}

export function mergeActorWounds(actor, incomingWounds) {
    // const wounds = actor.system.wounds;
    // const result = [...wounds, ...incomingWounds].reduce((a, { type, value }) => ({ ...a, [type]: a[type] ? { type, value: a[type].value + value } : { type, value } }), {});
    // return Object.values(result).filter(v => v.value > 0);
    return mergeActorWoundsWithOperator(actor, incomingWounds, 'add');
}

export function mergeActorWoundsWithOperator(actor, incomingWounds, operator) {
    const wounds = actor.system.wounds;
    // const result = [...wounds, ...incomingWounds].reduce((a, { type, value }) => ({ ...a, [type]: a[type] ? { type, value: applyOperator(a[type].value, value, operator) } : { type, value } }), {});
    // return Object.values(result).filter(v => v.value > 0);
    return mergeWoundsWithOperator(wounds, incomingWounds, operator);
}

export function mergeWoundsWithOperator(wounds, incomingWounds, operator) {
    const result = [...wounds, ...incomingWounds].reduce((a, { type, value }) => ({ ...a, [type]: a[type] ? { type, value: applyOperator(a[type].value, value, operator) } : { type, value } }), {});
    return Object.values(result).filter(v => v.value > 0);
}

export async function updateActorWounds(actor, updateWounds) {
    await actor.update({ "system.wounds": updateWounds });
}

export async function checkActorFatalWounds(actor) {
    if (actor.system.defense.fatalWounds) {
        const fatalWounds = JSON.parse(actor.system.defense.fatalWounds).map(w => w.value.toLowerCase());
        const activeFatalWounds = actor.system.wounds.filter(w => fatalWounds.includes(w.type));
        // PLAYTEST: This was the original, if you exceed your max resolve in a specific fatal wound, instead of sum of fatal wounds
        // const exceededFatalWounds = activeFatalWounds.filter(w => w.value >= actor.system.defense.resolve.max);
        // if (exceededFatalWounds && exceededFatalWounds.length > 0) {
        //     await setActorToDead(actor);
        // }
        const totalActiveFatalWounds = activeFatalWounds.reduce((result, wound) => result += wound.value, 0)
        if (totalActiveFatalWounds >= actor.system.defense.resolve.max) {
            await setActorToDead(actor);
        }
    }
}

export async function handleActorGuardConditions(actor) {
    if (actor.system.defense.guard.value <= 0) {
        await setActorToGuardBreak(actor);
    } else if (actor.effects.toObject().find(e => e.name === 'Guard Break')) {
        const id = actor.effects.toObject().find(e => e.name === 'Guard Break')._id;
        await actor.deleteEmbeddedDocuments('ActiveEffect', [id]);
    }
}

export async function handleActorWoundConditions(actor) {
    const updatedWoundTotal = actor.system.wounds.reduce((total, wound) => total += wound.value, 0);
    if (actor.system.defense.resolve.value <= updatedWoundTotal) {
        await renderLostResolveCard(actor);
    }

    await checkActorFatalWounds(actor);
}

async function renderLostResolveCard(actor) {
    if (actor.statuses.has('defeated')) {
        return;
    }

    const templateData = {
        actor: actor
    };

    await setActorToDefeated(actor);

    const html = await renderTemplate("systems/abbrew/templates/chat/lost-resolve-card.hbs", templateData);

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    // const rollMode = game.settings.get('core', 'rollMode');
    ChatMessage.create({
        speaker: speaker,
        content: html
    });
}

async function setActorCondition(actor, conditionName) {
    const condition = CONFIG.ABBREW.conditions[conditionName];
    const statusSet = new Set(condition.statuses);

    if (statusSet.difference(actor.statuses).size) {
        const conditionEffectData = {
            _id: actor._id,
            name: game.i18n.localize(condition.name),
            img: condition.img,
            changes: [],
            disabled: false,
            duration: {},
            description: game.i18n.localize(condition.description),
            origin: actor._id,
            tint: '',
            transfer: false,
            statuses: statusSet,
            flags: {}
        };

        await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
        console.log(`${actor.name} gained ${conditionName}`);
    }
}

async function setActorToDefeated(actor) {
    setActorCondition(actor, 'defeated');
}

async function setActorToDead(actor) {
    setActorCondition(actor, 'dead');
}

async function setActorToGuardBreak(actor) {
    setActorCondition(actor, 'guardBreak');
}

async function setActorToOffGuard(actor) {
    setActorCondition(actor, 'offGuard');
}

async function turnEnd(actor) {
    // TODO: Conditions could modify this?
    await actor.update({ "system.actions": 5 });
}

async function turnStart(actor) {
    if (game.settings.get("abbrew", "announceTurnStart")) {
        ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    }

    const lingeringWoundTypes = foundry.utils.deepClone(CONFIG.ABBREW.lingeringWoundTypes);
    const woundToLingeringWounds = foundry.utils.deepClone(CONFIG.ABBREW.woundToLingeringWounds);
    const lingeringWoundImmunities = actor.system.traitsData.filter(t => t.feature === "wound" && t.subFeature === "lingeringWound" && t.effect === "immunity").map(t => t.data);
    const activeLingeringWounds = actor.system.wounds.filter(w => lingeringWoundTypes.some(lw => w.type === lw)).filter(w => !lingeringWoundImmunities.includes(w.type));
    if (activeLingeringWounds.length > 0) {
        const appliedLingeringWounds = {};
        activeLingeringWounds.flatMap(lw => woundToLingeringWounds[lw.type].map(lwt => ({ type: lwt, value: lw.value }))).reduce((appliedLingeringWounds, wound) => {
            if (wound.type in appliedLingeringWounds) {
                appliedLingeringWounds[wound.type] += wound.value;
            } else {
                appliedLingeringWounds[wound.type] = wound.value;
            }

            return appliedLingeringWounds;
        }, appliedLingeringWounds);
        const acuteWounUpdate = Object.entries(appliedLingeringWounds).map(alw => ({ type: alw[0], value: alw[1] }));
        const lingeringWoundUpdate = activeLingeringWounds.flatMap(lw => actor.system.wounds.filter(w => w.type === lw.type).map(w => ({ type: w.type, value: getLingeringWoundValueUpdate(w.value) })));
        const fullWoundUpdate = [...acuteWounUpdate, ...lingeringWoundUpdate];
        if (fullWoundUpdate.length > 0) {
            await updateActorWounds(actor, mergeActorWounds(actor, fullWoundUpdate));
        }
    }
}

function getLingeringWoundValueUpdate(woundValue) {
    return woundValue > 1 ? -1 : 0;
}
