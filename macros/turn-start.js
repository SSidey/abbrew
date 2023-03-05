turnStart();

async function turnStart() {

    let actor = token.actor;
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });

    if (actor.system.canBleed) {
        let activeWounds = token.actor.system.wounds.active;
        console.log(activeWounds);

        let currentBlood = token.actor.system.blood.value;
        console.log(currentBlood);

        let newBlood = currentBlood - activeWounds;
        console.log(newBlood);

        await actor.update({ "system.blood.value": newBlood });
    }

    let armour = token.actor.system.armour;
    let newArmour = armour.value;
    console.log('Armour: ', armour);

    if (armour.value < armour.max) {
        getOut: if (_token.actor.effects.find(e => e.label === "Regenerating")) {
            console.log('Check for regain Armour');
            // TODO: Replace with Exposed
            if (_token.actor.effects.find(e => e.label === "Weakened")) {
                console.log('Exposed so no armour regained');
                break getOut;
            }

            let armourMultiplier = 1;
            if (_token.actor.effects.find(e => e.label === "Cursed")) {
                armourMultiplier = 0.5;
            }

            console.log('Regain Armour');
            missingArmour = armour.max - armour.value;
            console.log('Missing Armour: ', missingArmour);

            newArmour = armour.value + Math.max(Math.floor((missingArmour * armourMultiplier) / 2), 1);
            console.log('newArmour', newArmour);

        }
    } else {
        newArmour = armour.max;
    }

    await actor.update({ "system.armour.value": newArmour });
}