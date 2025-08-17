export async function postNotificationToChat(actor, flavor, message) {

    const templateData = {
        message,
        actor
    };

    const speaker = ChatMessage.getSpeaker({ actor });
    const html = await foundry.applications.handlebars.renderTemplate("systems/abbrew/templates/chat/notification-card.hbs", templateData);

    ChatMessage.create({
        speaker,
        flavor,
        content: html
    });
}