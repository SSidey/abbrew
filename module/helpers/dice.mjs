export async function d10Roll({
    parts = [], data = {}, title,
    flavour, dialogOptions, messageData = {}, options = {},
    chatMessage = true, rollMode, flavor
}) {

    // TODO: Set up concept page, maybe under conditions?
    // TODO: Negate should be an int value so as not to be too strong.
    let dice = 1 + data.amplification;
    let weakness = 0 + data.weakness

    dice = '' + dice;
    weakness = '' + weakness;

    const fullParts = ['{' + dice + 'd10x>=' + data.criticalThreshold, ...parts];

    const formula = fullParts.join('+') + ' -' + weakness + 'd10, 0}kh';

    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");

    const rollOptions = foundry.utils.mergeObject(options, {
        flavor: flavor || title,
        defaultRollMode,
        rollMode
    });

    const roll = new CONFIG.Dice.AbbrewRoll(formula, data);

    const configured = await roll.configureDialog({ title: "Additional Modifiers" });

    await roll.evaluate({ async: true });

    messageData = {};
    messageData.flags = { data: data };

    await roll.toMessage(messageData);
}