import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { applySkillEffects, parseModifierFieldValue } from "./skill.mjs";
import { handleSkillExpiry } from "./time.mjs";
import { compareModifierIndices, getSafeJson } from "./utils.mjs";

export async function handleCombatStart(actors) {
    for (const index in actors) {
        const actor = actors[index];
        await actor.update({ "system.actions": 5 });
    }
}

export async function handleTurnChange(prior, current, priorActor, currentActor) {
    if (current.round < prior.round || (prior.round == current.round && current.turn < prior.turn)) {
        return;
    }
    if (priorActor) {
        await turnEnd(priorActor);
    }
    await turnStart(currentActor);
}

export function mergeActorWounds(actor, incomingWounds) {
    return mergeActorWoundsWithOperator(actor, incomingWounds, 'add');
}

export function mergeActorWoundsWithOperator(actor, incomingWounds, operator) {
    const wounds = actor.system.wounds;
    return mergeWoundsWithOperator(wounds, incomingWounds, operator);
}

export function mergeWoundsWithOperator(wounds, incomingWounds, operator) {
    const result = [...wounds, ...incomingWounds].reduce((a, { type, value }) => ({ ...a, [type]: a[type] ? { type, value: applyOperator(a[type].value, value, operator) } : { type, value } }), {});
    return Object.values(result).filter(v => v.value > 0);
}

export async function updateActorWounds(actor, updateWounds) {
    const woundImmunities = getWoundImmunities(actor);
    const woundsAfterImmunity = updateWounds.filter(w => !woundImmunities.includes(w.type));
    await actor.update({ "system.wounds": woundsAfterImmunity });
}

function getWoundImmunities(actor) {
    const woundImmunities = actor.items.filter(i => i.type === "skill" && getSafeJson(i.system.skillTraits, false)).map(s => JSON.parse(s.system.skillTraits)).filter(s => s.some(st => st.feature === "wound" && st.effect === "immunity")).flatMap(s => s.data);
    return woundImmunities ? woundImmunities : [];
}

export async function checkActorFatalWounds(actor) {
    const woundImmunities = getWoundImmunities(actor);
    const acuteWounds = CONFIG.ABBREW.acuteWounds;
    const activeFatalWounds = actor.system.wounds.filter(w => acuteWounds.includes(w.type)).filter(w => !woundImmunities.includes(w.type));
    const totalActiveFatalWounds = activeFatalWounds.reduce((result, wound) => result += wound.value, 0)
    if (totalActiveFatalWounds >= actor.system.defense.resolve.max) {
        await setActorToDead(actor);
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
    const woundImmunities = getWoundImmunities(actor);
    const updatedWoundTotal = actor.system.wounds.filter(w => !woundImmunities.includes(w.type)).reduce((total, wound) => total += wound.value, 0);
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
    await actor.unsetFlag("abbrew", "combat.damage.lastRoundReceived")
    await applyActiveSkills(actor, "end");
    await handleSkillExpiry("end", actor);
    await actor.update({ "system.actions": 5 });
}

async function turnStart(actor) {
    if (game.settings.get("abbrew", "announceTurnStart")) {
        ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    }

    await handleSkillToRounds(actor);
    await applyActiveSkills(actor, "start");
    await handleSkillExpiry("start", actor);
    await updateTurnStartWounds(actor);

    await rechargePerRoundSkills(actor);
}

async function handleSkillToRounds(actor) {
    const effects = actor.effects;
    effects.entries().forEach(async e => {
        const effect = e[1];
        const preparedDuration = effect._prepareDuration();
        if (preparedDuration.type === "seconds" && preparedDuration.remaining <= 60) {
            const duration = { ...effect.duration };
            const rounds = Math.floor(preparedDuration.remaining / 6);
            duration["rounds"] = rounds;
            duration["seconds"] = null;
            duration["duration"] = rounds
            // duration["startRound"] = game.combat?.round ?? 0;
            // duration["startTurn"] = game.combat?.turn ?? 0;
            duration["type"] = "turns";
            duration["startTime"] = game.time.worldTime;
            duration["startRound"] = game.combat.current.round;
            const skills = actor.items.filter(i => i.type === "skill" && i._id === effect.flags?.abbrew?.skill?.trackDuration)
            if (skills.length > 0 && !skills[0].system.action.duration.expireOnStartOfTurn) {
                duration["turns"] = 1;
                duration["duration"] += 0.01;
            }
            // duration["duration"] = value;
            await effect.update({ "duration": duration })
        }
    });
}

async function updateTurnStartWounds(actor) {
    const lingeringWoundTypes = foundry.utils.deepClone(CONFIG.ABBREW.lingeringWoundTypes);
    const woundToLingeringWounds = foundry.utils.deepClone(CONFIG.ABBREW.woundToLingeringWounds);
    const woundImmunities = getWoundImmunities(actor);
    const woundSuppressors = getWoundsWithSuppression(actor);
    const woundIntensifiers = getWoundsWithIntensify(actor);
    const activeLingeringWounds = actor.system.wounds.filter(w => lingeringWoundTypes.some(lw => w.type === lw)).filter(w => !woundImmunities.includes(w.type)).filter(w => w.value > 0);
    if (activeLingeringWounds.length > 0) {
        const appliedLingeringWounds = {};
        activeLingeringWounds.flatMap(lw => woundToLingeringWounds[lw.type].map(lwt => ({ type: lwt, value: Math.max(0, (lw.value - (woundSuppressors[lw.type] ?? 0) + (woundIntensifiers[lw.type] ?? 0))) }))).reduce((appliedLingeringWounds, wound) => {
            if (wound.type in appliedLingeringWounds) {
                appliedLingeringWounds[wound.type] += wound.value;
            } else {
                appliedLingeringWounds[wound.type] = wound.value;
            }

            return appliedLingeringWounds;
        }, appliedLingeringWounds);
        const acuteWoundUpdate = Object.entries(appliedLingeringWounds).map(alw => ({ type: alw[0], value: alw[1] }));
        const lingeringWoundUpdate = activeLingeringWounds.flatMap(lw => actor.system.wounds.filter(w => w.type === lw.type).map(w => ({ type: w.type, value: getLingeringWoundValueUpdate(actor, w.type) })));
        const fullWoundUpdate = [...acuteWoundUpdate, ...lingeringWoundUpdate];
        if (fullWoundUpdate.length > 0) {
            await updateActorWounds(actor, mergeActorWounds(actor, fullWoundUpdate));
        }
    }
}

function getWoundsWithOperator(actor, operator) {
    return actor.items.filter(i => i.type === "skill").filter(s => s.system.action.modifiers.wounds.self.some(w => w.operator === operator)).filter(s => !s.system.isActivatable || (actor.system.activeSkills.includes(s._id))).flatMap(s => s.system.action.modifiers.wounds.self.filter(w => w.operator === operator)).reduce((result, ws) => {
        if (ws.type in result) {
            result[ws.type].push({ operator: ws.operator, value: parseModifierFieldValue(ws.value, actor, ws), index: getOrderForOperator(ws.operator) });
        } else {
            result[ws.type] = [{ operator: ws.operator, value: parseModifierFieldValue(ws.value, actor, ws), index: getOrderForOperator(ws.operator) }];
        }

        return result;
    }, {});
}

function getWoundsWithSuppression(actor) {
    const wounds = getWoundsWithOperator(actor, "suppress");
    Object.keys(wounds).forEach(key => {
        wounds[key] = wounds[key].reduce((result, wound) => {
            result = result + wound.value[0].path;

            return result;
        }, 0);
    });
    return wounds;
}

function getWoundsWithIntensify(actor) {
    const wounds = getWoundsWithOperator(actor, "intensify");
    Object.keys(wounds).forEach(key => {
        wounds[key] = wounds[key].reduce((result, wound) => {
            result = result + wound.value[0].path;

            return result;
        }, 0);
    });
    return wounds;
}

async function applyActiveSkills(actor, turnPhase) {
    if (!(turnPhase && ["start", "end"].includes(turnPhase))) {
        return;
    }

    let activeSkills = [];
    if (turnPhase === "start") {
        activeSkills = actor.system.activeSkills.flatMap(s => actor.items.filter(i => i._id === s)).filter(s => s.system.applyTurnStart);
    } else if (turnPhase === "end") {
        activeSkills = actor.system.activeSkills.flatMap(s => actor.items.filter(i => i._id === s)).filter(s => s.system.applyTurnEnd);
    }

    for (const index in activeSkills) {
        await applySkillEffects(actor, activeSkills[index]);
    }
}

async function rechargePerRoundSkills(actor) {
    const roundUseSkills = actor.items.filter(i => i.type === "skill" && !i.system.action.uses.asStacks && i.system.action.uses.hasUses && ["turn", "round"].includes(i.system.action.uses.period))
    for (const index in roundUseSkills) {
        await roundUseSkills[index].update({ "system.action.uses.value": roundUseSkills[index].system.action.uses.max });
    }
}

function getLingeringWoundValueUpdate(actor, woundType) {
    // To be merged with current stacks
    return -1 * actor.system.defense.recovery[woundType].value;
}