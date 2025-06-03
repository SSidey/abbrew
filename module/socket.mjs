import { handleTurnChange } from "./helpers/combat.mjs";

class SocketMessage {
    // String, String, Object
    constructor(userId, request, data) {
        this.userId = userId;
        this.request = request;
        this.data = data;
    }
}

async function emitForAll(eventName, message) {
    game.socket.emit(eventName, message);
    await handleMessage(message);
}


function activateSocketListener() {
    game.socket.on("system.abbrew", handleMessage)
}

async function handleMessage(message) {
    const request = message.request;
    switch (request) {
        case "updateMessageForCheck":
            await executeAsGM(updateMessageForCheck, message.userId, message.data);
            break;
        case "handleCombatTurnChange":
            await executeAsGM(handleCombatTurnChange, message.userId, message.data);
        case "handleCombatTime":
            await executeAsGM(handleCombatTime, message.userId, message.data);
    }
}

const GMProxyFunctions = [
    updateMessageForCheck,
    handleCombatTurnChange,
    handleCombatTime
];

async function updateMessageForCheck(data) {
    const message = game.messages.get(data.messageId);
    await message.update({ "content": data.html, "flags.abbrew.messasgeData.templateData": data.templateData });
}

async function handleCombatTurnChange(data) {
    const prior = data.prior;
    const current = data.current;
    await handleTurnChange(prior, current, canvas.tokens.get(prior.tokenId)?.actor, canvas.tokens.get(current.tokenId).actor);
}

async function executeAsGM(func, userId, data) {
    // TODO isActiveGM doesn't seem available but would be preferable: game.user !== game.users.isActiveGM 
    if (!game.user.isGM) {
        return;
    }

    if (GMProxyFunctions.includes(func)) {
        await func(data);
    }
}

async function handleCombatTime(data) {
    game.time.advance(CONFIG.ABBREW.durations.round.value);
}

export { activateSocketListener, emitForAll, SocketMessage }