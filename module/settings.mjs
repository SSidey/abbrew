export function registerSystemSettings() {
    game.settings.register("abbrew", "announceTurnStart", {
        name: "SETTINGS.AnnounceTurnStart.Name",
        hint: "SETTINGS.AnnounceTurnStart.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
}