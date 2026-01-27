export async function renderChatMessage(shouldRenderChatMessage, actor, skill, templateData, data, whisperSpellComponents) {
    // Initialize chat data.
    if (shouldRenderChatMessage) {
        const html = await foundry.applications.handlebars.renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);

        const speaker = ChatMessage.getSpeaker({ actor: actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const label = `[${skill.system.skillType}] ${skill.name}`;
        const whisper = (whisperSpellComponents && isSpellComponent(skill)) ? ChatMessage.getWhisperRecipients('GM') : [];

        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: label,
            content: html,
            whisper,
            flags: { data: data, abbrew: { messasgeData: { speaker: speaker, rollMode: rollMode, flavor: label, templateData: templateData } } }
        });
    }
}

export async function renderHiddenSkillCheck(actor, data, templateData, whisper) {
    const html = await foundry.applications.handlebars.renderTemplate("systems/abbrew/templates/chat/hidden-skill-check.hbs", templateData);
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${data.skillCheckRequest.skill.system.skillType}] ${data.skillCheckRequest.skill.name}`;
    const whisperRecipients = whisper ? ChatMessage.getWhisperRecipients('GM') : [];

    ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: html,
        whisper: whisperRecipients,
        flags: { data: data, abbrew: { messasgeData: { speaker: speaker, rollMode: rollMode, flavor: label, templateData: templateData } } }
    });
}

export function isSpellComponent(skill) {
    if (!skill.system.traits) {
        return false;
    }

    return skill.system.traits.value.some(v => v.key === "spellcomponent");
}

export function isSpellComponentEssentia(skill) {
    if (!skill.system.traits) {
        return false;
    }

    return skill.system.traits.value.some(v => v.key === "essentia");
}