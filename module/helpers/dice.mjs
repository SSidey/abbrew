export async function d10Roll({
    parts = [], data = {}, event,
    strong, weak, critical = 10, fumble = 1, targetValue,
    fastForward, chooseModifier = false, template, title, dialogOptions,
    chatMessage = true, messageData = {}, rollMode, flavor
}) {
    const formula = '{1d10x>=10 + @mod - 0d10, 0}kh';

    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");

    const roll = new CONFIG.Dice.AbbrewRoll(formula, data, {
        flavor: flavor || title,
        defaultRollMode,
        rollMode,
        critical,
        fumble
    });

    const configured = await roll.configureDialog({ title: "Additional Modifiers" });

    await roll.evaluate({ async: true });

    await roll.toMessage();
}