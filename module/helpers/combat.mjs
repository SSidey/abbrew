import { applyOperator } from "./operators.mjs";

export async function handleTurnStart(combat, updateData, updateOptions) {
    if (updateData.round < combat.round || (updateData.round == combat.round && updateData.turn < combat.turn)) {
        return;
    }
    let nextActor = combat.current.combatantId ? combat.nextCombatant.actor : combat.turns[0].actor;
    await turnStart(nextActor);
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
    if(actor.system.defense.guard.value <= 0) {
        await setActorToOffGuard(actor);
    }
}

export async function handleActorWoundConditions(actor) {
    const updatedWoundTotal = actor.system.wounds.reduce((total, wound) => total += wound.value, 0);
    if (actor.system.defense.resolve.value <= updatedWoundTotal) {
        await renderLostResolveCard(actor);
    }

    await checkActorFatalWounds(actor);
}

export async function renderLostResolveCard(actor) {
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
    }
}

async function setActorToDefeated(actor) {
    setActorCondition(actor, 'defeated');
    // if (actor.statuses.has('defeated')) {
    //     return;
    // }

    // const defeatedEffectData = {
    //     _id: actor._id,
    //     name: "Defeated",
    //     img: CONFIG.statusEffects.find(s => s.id === 'defeated').img,
    //     changes: [],
    //     disabled: false,
    //     duration: {},
    //     description: "You resolve buckles as you are unable to continue the fight.",
    //     origin: actor._id,
    //     tint: '',
    //     transfer: false,
    //     statuses: new Set(['defeated']),
    //     flags: {}
    // };

    // await actor.createEmbeddedDocuments('ActiveEffect', [defeatedEffectData]);
}

async function setActorToDead(actor) {
    setActorCondition(actor, 'dead');
    // if (actor.statuses.has('dead')) {
    //     return;
    // }

    // const defeatedEffectData = {
    //     _id: actor._id,
    //     name: "Dead",
    //     img: CONFIG.statusEffects.find(s => s.id === 'dead').img,
    //     changes: [],
    //     disabled: false,
    //     duration: {},
    //     description: "You have suffered fatal wounds, resulting in death.",
    //     origin: actor._id,
    //     tint: '',
    //     transfer: false,
    //     statuses: new Set(['dead']),
    //     flags: {}
    // };

    // await actor.createEmbeddedDocuments('ActiveEffect', [defeatedEffectData]);
}

export async function setActorToOffGuard(actor) {
    setActorCondition(actor, 'offGuard');
    // if (actor.statuses.has('offGuard')) {
    //     return;
    // }

    // const offGuardEffectData = {
    //     _id: actor._id,
    //     name: "Off Guard",
    //     img: CONFIG.statusEffects.find(s => s.id === 'offGuard').img,
    //     changes: [],
    //     disabled: false,
    //     duration: {},
    //     description: "Your guard is broken or otherwise compromised, your foes can directly capitalise on your weakpoints. You can be targeted by finishers",
    //     origin: actor._id,
    //     tint: '',
    //     transfer: false,
    //     statuses: new Set(['offGuard']),
    //     flags: {}
    // };

    // await actor.createEmbeddedDocuments('ActiveEffect', [offGuardEffectData]);

}

async function turnStart(actor) {
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    if (actor.system.defense.canBleed) {
        const filteredWounds = actor.system.wounds.filter(wound => wound.type === 'bleed');
        const bleedingWounds = filteredWounds.length > 0 ? filteredWounds[0].value : 0;
        if (bleedingWounds > 0) {
            const bleedModifier = bleedingWounds > 1 ? -1 : 0;
            const vitalWounds = [{ type: 'vital', value: bleedingWounds }, { type: 'bleed', value: bleedModifier }];
            await updateActorWounds(actor, mergeActorWounds(actor, vitalWounds));
        }
    }
}
