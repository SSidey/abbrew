export async function onWorldTimeUpdate(worldTime, td, options, userId) {
    if (game.user !== game.users?.activeGM) {
        return;
    }

    const expiredEffects = findExpiredEffects();
    await processExpiredEffects(expiredEffects);
}

export async function handleSkillExpiry() {
    const expiredEffects = findExpiredEffects();
    await processExpiredEffects(expiredEffects);
}

async function processExpiredEffects(expiredEffects) {
    let promises = [];
    expiredEffects.forEach((x) => promises.push(x.delete()));
    await Promise.all(promises);
}

function findExpiredEffects() {
    return Array.from(game.scenes?.active?.tokens ?? [])
        .flatMap((x) => {
            const actor = x.actor;
            if (actor == null) return [];
            return actor.appliedEffects;
        })
        .filter((x) => isExpired(x));
}

function isExpired(effect) {
    return (
        effect.isTemporary &&
        effect.duration.remaining != null &&
        effect.duration.remaining <= 0
    );
}