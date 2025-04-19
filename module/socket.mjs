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
    }
}

async function executeAsGM(func, userId, data) {
    if (game.user !== game.users.activeGM) {
        return;
    }

    if (GMProxyFunctions.includes(func)) {
        await func(data);
    }
}

async function updateMessageForCheck(data) {
    const message = game.messages.get(data.messageId);
    await message.update({ "content": data.html, "flags.abbrew.messasgeData.templateData": data.templateData });
}

const GMProxyFunctions = [
    updateMessageForCheck
];

export { activateSocketListener, emitForAll, SocketMessage }