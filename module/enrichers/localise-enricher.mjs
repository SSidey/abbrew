export default class LocaliseEnricher {
    static registerEnricher() {
        CONFIG.TextEditor.enrichers.push({
            pattern: /@L\[([^\]]*)\]/g,
            enricher: (match, options) => game.i18n.localize(match[1])
        });
    }
}