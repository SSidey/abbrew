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
    actor.update({ "system.wounds": updateWounds});
}

async function turnStart(actor) {
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });

    if (actor.system.defense.canBleed) {
        const filteredWounds = actor.system.wounds.filter(wound => wound.type === 'bleed');
        const bleedingWounds = filteredWounds.length > 0 ? filteredWounds[0].value : 0;
        if (bleedingWounds > 0) {
            const vitalWounds = [{ type: 'vital', value: bleedingWounds }];
            await updateActorWounds(actor, mergeActorWounds(actor, vitalWounds));
        }
    }
}