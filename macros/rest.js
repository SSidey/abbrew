rest();

async function rest() {
    let actor = token.actor;
    let currentBlood = actor.system.blood.value;
    console.log("currentBlood: ", currentBlood);
    let healingFactor = actor.system.healing.factor;
    console.log("healingFactor: ", healingFactor);
    let healingBonus = actor.system.healing.bonus;
    console.log("healingBonus: ", healingBonus);
    let healingBase = actor.system.statistics.constitution.value;
    console.log("healingBase: ", healingBase);
    let restHealing = (healingBase * healingFactor) + healingBonus;
    console.log("restHealing: ", restHealing);
    let newBlood = Math.min(currentBlood + restHealing, actor.system.blood.max);
    console.log("newBlood: ", newBlood);
    await actor.update({"system.blood.value": newBlood});
}