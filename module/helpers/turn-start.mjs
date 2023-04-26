export async function handleTurnStart(combat, updateData, updateOptions) {
    if (updateData.round < combat.round || (updateData.round == combat.round && updateData.turn < combat.turn)) {
        return;
    }
    let nextActor = combat.current.combatantId ? combat.nextCombatant.actor : combat.turns[0].actor;
    await turnStart(nextActor);
}

async function turnStart(actor) {
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });

    if (actor.system.canBleed) {
        let activeWounds = actor.system.wounds.active;
        console.log(activeWounds);

        let currentBlood = actor.system.blood.value;
        console.log(currentBlood);

        let bleedPrevention = actor.system.conditions.bleedPrevention;
        if (bleedPrevention > 0) {
            bleedPrevention = bleedPrevention < activeWounds ? bleedPrevention : activeWounds;
            let healingWounds = actor.system.wounds.healing + bleedPrevention;
            await actor.update({ "system.wounds.healing": healingWounds });
        }

        activeWounds = activeWounds - bleedPrevention;
        await actor.update({ system: { wounds: { active: activeWounds } } });

        let gushingWounds = 0;
        if (activeWounds === 0) {
            await actor.update({ "system.conditions.gushingWounds": 0 });
        }

        if (actor.system.conditions.gushingWounds > 0) {
            gushingWounds = actor.system.conditions.gushingWounds * 5;
        }

        let newBlood = Math.max(currentBlood - (activeWounds + gushingWounds), 0);
        console.log(newBlood);

        if (newBlood != currentBlood) {
            await actor.update({ "system.blood.value": newBlood });
        }

        if (newBlood <= actor.system.blood.nausea) {
            await actor.update({ "system.conditions.nausea": 1 });
        } else {
            await actor.update({ "system.conditions.nausea": 0 });
        }

        if (newBlood <= actor.system.blood.unconscious) {
            await actor.update({ "system.conditions.unconscious": 1 });
        } else {
            await actor.update({ "system.conditions.unconscious": 0 });
        }
    }

    let armour = actor.system.armour;
    let newArmour = armour.value;
    console.log('Armour: ', armour);

    if (armour.value < armour.max) {
        getOut: if (actor.effects.find(e => e.label === "Regenerating")) {
            console.log('Check for regain Armour');
            // TODO: Replace with Exposed
            if (actor.effects.find(e => e.label === "Weakened")) {
                console.log('Exposed so no armour regained');
                break getOut;
            }

            let armourMultiplier = 1;
            // TODO: Was to be from sundered. just reduce max for that.
            if (actor.effects.find(e => e.label === "Cursed")) {
                armourMultiplier = 0.5;
            }

            console.log('Regain Armour');
            let missingArmour = armour.max - armour.value;
            console.log('Missing Armour: ', missingArmour);

            newArmour = armour.value + Math.max(Math.floor((missingArmour * armourMultiplier) / 2), 1);
            console.log('newArmour', newArmour);

        }
    } else {
        newArmour = armour.max;
    }

    await actor.update({ "system.armour.value": newArmour });
}