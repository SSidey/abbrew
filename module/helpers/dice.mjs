export async function d10Roll({
    parts = [], data = {}, title,
    flavour, dialogOptions, messageData = {}, options = {},
    chatMessage = true, rollMode, flavor
}) {

    const fullParts = ['{1d10x>=10 ', ...parts];

    const formula = fullParts.join('+') + ' - 0d10, 0}kh';

    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");

    const rollOptions = foundry.utils.mergeObject(options, {
        flavor: flavor || title,
        defaultRollMode,
        rollMode
    });

    const roll = new CONFIG.Dice.AbbrewRoll(formula, data,);

    const configured = await roll.configureDialog({ title: "Additional Modifiers" });

    await roll.evaluate({ async: true });

    messageData = {};
    messageData.flags = { data: data };

    await roll.toMessage(messageData);
}