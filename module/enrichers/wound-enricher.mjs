export default class WoundEnricher {
    static registerEnricher() {
        CONFIG.TextEditor.enrichers.push({
            pattern: /@[Ww]ound\["([^\]]*)", ([0-9]*)\]/g,
            enricher: (match, options) => {
                const woundType = game.i18n.localize(`ABBREW.Wounds.${match[1].toLowerCase()}`);
                const label = `${woundType} ${match[2]}`;

                const icon = document.createElement("i");
                icon.classList.add("fa-solid", "fa-droplet");

                const htmlLabel = document.createElement("span");
                htmlLabel.classList.add("label")
                htmlLabel.innerHTML = label;

                const anchor = document.createElement("a");
                anchor.classList.add("inline-item");
                anchor.dataset.action = "show-wound";
                anchor.dataset.woundType = match[1];
                anchor.dataset.woundValue = match[2];
                anchor.draggable = true;
                anchor.appendChild(icon);
                anchor.appendChild(htmlLabel)

                return anchor;
            }
        })
    }
};