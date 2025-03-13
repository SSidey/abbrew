import { applyOperator } from "./operators.mjs";

export async function handleTurnStart(prior, current, actor) {
    if (current.round < prior.round || (prior.round == current.round && current.turn < prior.turn)) {
        return;
    }
    await turnStart(actor);
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

async function turnStart(actor) {
    if (game.settings.get("abbrew", "announceTurnStart")) {
        ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    }

    if (actor.system.traitsData) {
        // TODO: Add to CONFIG.ABBREW in abbrew.mjs for easier pull
        // TODO: Sort this shit out:
        // Need to get the applied wound types, again could store in config
        // Need to get the value of the parent wound
        // Do the update
        const lingeringWoundTypes = Object.entries(CONFIG.ABBREW.wounds).filter(w => w[1].lingeringWounds.length > 0);
        const activeLingeringdWounds = lingeringWoundTypes.filter(w => actor.system.wounds.some(aw => aw.type === w[0]));
        const appliedLingeringWounds = activeLingeringdWounds.
        const bleedingWounds = filteredWounds.length > 0 ? filteredWounds[0].value : 0;
        if (bleedingWounds > 0) {
            const bleedModifier = bleedingWounds > 1 ? -1 : 0;
            const vitalWounds = [{ type: 'vital', value: bleedingWounds }, { type: 'bleed', value: bleedModifier }];
            await updateActorWounds(actor, mergeActorWounds(actor, vitalWounds));
        }
    }
}
