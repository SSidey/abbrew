turnStart();

async function turnStart() {

    let actor = actor;
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });

    if (actor.system.canBleed) {
        let activeWounds = actor.system.wounds.active;
        console.log(activeWounds);

        let currentBlood = actor.system.blood.value;
        console.log(currentBlood);

        let newBlood = currentBlood - Math.min(0, activeWounds - actor.system.conditions.bleedPrevention);
        console.log(newBlood);

        if (currentBlood != newBlood) {
            await actor.update({ "system.blood.value": newBlood });
        }
        else {
            await actor.update(
                {
                    system: {
                        wounds: {
                            active: 0,
                            healing: actor.system.wounds.healing + activeWounds
                        },
                        conditions: {
                            gushingWounds: 0
                        }
                    }
                });
        }
    }

    let armour = actor.system.armour;
    let newArmour = armour.value;
    console.log('Armour: ', armour);

    if (armour.value < armour.max) {
        getOut: if (_actor.effects.find(e => e.label === "Regenerating")) {
            console.log('Check for regain Armour');
            // TODO: Replace with Exposed
            if (_actor.effects.find(e => e.label === "Weakened")) {
                console.log('Exposed so no armour regained');
                break getOut;
            }

            let armourMultiplier = 1;
            if (_actor.effects.find(e => e.label === "Cursed")) {
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