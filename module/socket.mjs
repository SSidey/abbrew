let socket;

Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerSystem("abbrew");
    socket.register("updateMessageForCheck", _updateMessageForCheck);
});

export async function updateMessageForCheck(messageId, html, templateData) {
    await socket.executeAsGM("updateMessageForCheck", messageId, html, templateData);
}

async function _updateMessageForCheck(messageId, html, templateData) {
    const message = game.messages.get(messageId);
    await message.update({ "content": html, "flags.abbrew.messasgeData.templateData": templateData });
}