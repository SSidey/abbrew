export class ChoiceSetPrompt extends Dialog {
    selection;
    choices;

    constructor(data = { promptTitle, choices }, options = {}) {
        options.buttons = {};
        data.buttons = {};
        super(data, options);
        this.choices = data.content.choices;
    }


    /** @override */
    get template() {
        return "systems/abbrew/templates/rules/choice-set-prompt.hbs";
    }

    /** @override */
    activateListeners($html) {
        const html = $html[0];

        html.querySelectorAll("a[data-choice], button[type=button]").forEach((element) => {
            element.addEventListener("click", (event) => {
                console.log('clicked');
                // Get the actual selection
                this.selection = event.currentTarget.dataset.id;
                this.close();
            });
        });
    }

    getData() {
        console.log("getData", this);
        // no super to Application
        const data = super.getData();

        data.header = this.data.header;
        data.footer = this.data.footer;

        data.choices = data.content.choices;
        data.promptTitle = data.content.promptTitle;

        console.log(data);

        return data;
    }

    /** Return early if there is only one choice */
    async resolveSelection() {
        // Exit early if there are no valid choices
        if (this.choices.length === 0) {
            await this.close({ force: true });
            return null;
        }

        const firstChoice = this.choices.at(0);
        if (firstChoice && this.choices.length === 1) {
            return (this.selection = firstChoice[0]);
        }

        this.render(true);
        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    /** @override */
    /** Close the dialog, applying the effect with configured target or warning the user that something went wrong. */
    async close({ force = false } = {}) {
        this.element.find("button, select").css({ pointerEvents: "none" });
        if (!this.selection) {
            if (force) {
                ui.notifications.warn(
                    game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoValidOptions", {
                        actor: this.actor.name,
                        item: this.item.name,
                    })
                );
            } else if (!this.allowNoSelection) {
                ui.notifications.warn(
                    game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoSelectionMade")
                );
            }
        }

        this.resolve?.(this.selection);
        await super.close({ force });
    }
}