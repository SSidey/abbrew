export async function handleTurnStart(combat, updateData, updateOptions) {    
  if(updateData.round < combat.round || (updateData.round == combat.round && updateData.turn < combat.turn )) {
    return;
  }    
  let nextActor = combat.nextCombatant.actor;    
  await turnStart(nextActor);
}

async function turnStart(actor) {    
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });

    if (actor.system.canBleed) {
        let activeWounds = actor.system.wounds.active;
        console.log(activeWounds);

        let currentBlood = actor.system.blood.value;
        console.log(currentBlood);

        let newBlood = currentBlood - activeWounds;
        console.log(newBlood);

        await actor.update({ "system.blood.value": newBlood });
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