export async function renderChatMessage(shouldRenderChatMessage, actor, skill, templateData, data) {
    // Initialize chat data.
    if (shouldRenderChatMessage) {
        const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

        const speaker = ChatMessage.getSpeaker({ actor: actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const label = `[${skill.system.skillType}] ${skill.name}`;

        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: label,
            content: html,
            flags: { data: data, abbrew: { messasgeData: { speaker: speaker, rollMode: rollMode, flavor: label, templateData: templateData } } }
        });
    }
}