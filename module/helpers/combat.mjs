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
        const exceededFatalWounds = activeFatalWounds.filter(w => w.value > actor.system.defense.resolve.max);
        if (exceededFatalWounds && exceededFatalWounds.length > 0) {
            await setActorToDead(actor);
        }
    }
}

export async function renderLostResolveCard(actor) {
    if (!actor.statuses.has('defeated')) {
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
}

async function setActorToDefeated(actor) {
    const defeatedEffectData = {
        _id: actor._id,
        name: "Defeated",
        img: actor.img,
        changes: [],
        disabled: false,
        duration: {},
        description: "You resolve buckles as you are unable to continue the fight.",
        origin: actor._id,
        tint: '',
        transfer: false,
        statuses: new Set(['defeated']),
        flags: {}
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [defeatedEffectData]);
}

async function setActorToDead(actor) {
    const defeatedEffectData = {
        _id: actor._id,
        name: "Dead",
        img: actor.img,
        changes: [],
        disabled: false,
        duration: {},
        description: "You have suffered fatal wounds, resulting in death.",
        origin: actor._id,
        tint: '',
        transfer: false,
        statuses: new Set(['dead'/* , 'defeated' */]),
        flags: {}
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [defeatedEffectData]);
}

async function turnStart(actor) {
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    const previousWoundTotal = actor.system.wounds.reduce((total, wound) => total += wound.value, 0);

    if (actor.system.defense.canBleed) {
        const filteredWounds = actor.system.wounds.filter(wound => wound.type === 'bleed');
        const bleedingWounds = filteredWounds.length > 0 ? filteredWounds[0].value : 0;
        if (bleedingWounds > 0) {
            const bleedModifier = bleedingWounds > 1 ? -1 : 0;
            const vitalWounds = [{ type: 'vital', value: bleedingWounds }, { type: 'bleed', value: bleedModifier }];
            await updateActorWounds(actor, mergeActorWounds(actor, vitalWounds));
        }
    }

    const updatedWoundTotal = actor.system.wounds.reduce((total, wound) => total += wound.value, 0);
    if (previousWoundTotal < actor.system.defense.resolve.value && actor.system.defense.resolve.value <= updatedWoundTotal) {
        await renderLostResolveCard(actor);
    }
    await checkActorFatalWounds(actor);
}
