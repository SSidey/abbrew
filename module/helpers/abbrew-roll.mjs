export default class AbbrewRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        if (!this.options.configured) {
            this._configureModifiers();
        }
    }

    static async fromRoll(roll) {
        const newRoll = new this(roll.formula, roll.data, roll.options);
        await newRoll.evaluate({async: true});
        return newRoll;
    }

    get validD10Roll() {
        return (this.terms[0].rolls[0].terms[0] instanceof Die) && (this.terms[0].rolls[0].terms[0].faces === 10);
    }

    static EVALUATION_TEMPLATE = "systems/abbrew/templates/chat/roll-dialog.hbs";

    static CHAT_TEMPLATE = "systems/abbrew/templates/chat/damage-roll.hbs";

    async render(flavor, template, isPrivate) {
        template = this.CHAT_TEMPLATE;

        return super.render(flavor, template, isPrivate);
    }

    /** @inheritdoc */
    async toMessage(messageData = {}, options = {}) {

        // return early for invalid roll formula
        if (!this.validD10Roll) {
            return;
        }

        // Evaluate the roll now so we have the results available to determine whether reliable talent came into play
        if (!this._evaluated) await this.evaluate({ async: true });

        // Add appropriate advantage mode message flavor and dnd5e roll flags
        // messageData.flavor = messageData.flavor || this.options.flavor;
        // if (this.hasAdvantage) messageData.flavor += ` (${game.i18n.localize("DND5E.Advantage")})`;
        // else if (this.hasDisadvantage) messageData.flavor += ` (${game.i18n.localize("DND5E.Disadvantage")})`;

        // Add reliable talent to the d20-term flavor text if it applied
        // if (this.validD20Roll && this.options.reliableTalent) {
        //     const d20 = this.dice[0];
        //     const isRT = d20.results.every(r => !r.active || (r.result < 10));
        //     const label = `(${game.i18n.localize("DND5E.FlagsReliableTalent")})`;
        //     if (isRT) d20.options.flavor = d20.options.flavor ? `${d20.options.flavor} (${label})` : label;
        // }

        // Record the preferred rollMode
        options.rollMode = options.rollMode ?? this.options.rollMode;
        // messageData.flags = { data: { foo: "bar", baz: "fuck" } };
        return super.toMessage(messageData, options);
    }

    async configureDialog({ title, template } = {}, options = {}) {

        // Render the Dialog inner HTML
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
            formula: `d10!`
        });

        let defaultButton = "normal";
        // switch ( defaultAction ) {
        //   case D20Roll.ADV_MODE.ADVANTAGE: defaultButton = "advantage"; break;
        //   case D20Roll.ADV_MODE.DISADVANTAGE: defaultButton = "disadvantage"; break;
        // }

        // Create the Dialog window and await submission of the form
        return new Promise(resolve => {
            new Dialog({
                title,
                content,
                buttons: {
                    advantage: {
                        label: "1"/* game.i18n.localize("DND5E.Advantage") */,
                        callback: html => resolve(this._onDialogSubmit(html/* , D20Roll.ADV_MODE.ADVANTAGE */))
                    },
                    normal: {
                        label: "2"/* game.i18n.localize("DND5E.Normal") */,
                        callback: html => resolve(this._onDialogSubmit(html/* , D20Roll.ADV_MODE.NORMAL */))
                    },
                    disadvantage: {
                        label: "3"/* game.i18n.localize("DND5E.Disadvantage") */,
                        callback: html => resolve(this._onDialogSubmit(html/* , D20Roll.ADV_MODE.DISADVANTAGE */))
                    }
                },
                default: defaultButton,
                close: () => resolve(null)
            }, options).render(true);
        });
    }

    // async RollAbbrew(element, dataset, actor) {

    //   // Handle item rolls.
    //   if (dataset.rollType) {
    //     if (dataset.rollType == 'item') {
    //       const itemId = element.closest('.item').dataset.itemId;
    //       const item = actor.items.get(itemId);
    //       if (item) {
    //         return await ChatAbbrew(actor, item);
    //         //   let label = item.name;
    //         //   let roll = new Roll("d10! + " + item.system.formula, actor.getRollData());
    //         //   roll.toMessage({
    //         //     speaker: ChatMessage.getSpeaker({ actor: actor }),
    //         //     flavor: label,
    //         //     rollMode: game.settings.get('core', 'rollMode'),
    //         //   });
    //         //   Hooks.callAll('abbrew.ability', label);
    //         //   return roll;
    //       }
    //     }
    //   }

    //   // Handle rolls that supply the formula directly.
    //   if (dataset.ability) {
    //     let label = dataset.label ? `[ability] ${dataset.label}` : '';
    //     let roll = new Roll("d10 + " + dataset.ability, actor.getRollData());
    //     roll.toMessage({
    //       speaker: ChatMessage.getSpeaker({ actor: actor }),
    //       flavor: label,
    //       rollMode: game.settings.get('core', 'rollMode'),
    //     });
    //     Hooks.callAll('abbrew.ability', label);
    //     return roll;
    //   }
    // }

    _onDialogSubmit(html, advantageMode) {
        const form = html[0].querySelector("form");

        // // Append a situational bonus term
        // if (form.bonus.value) {
        //   const bonus = new Roll(form.bonus.value, this.data);
        //   if (!(bonus.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({ operator: "+" }));
        //   this.terms = this.terms.concat(bonus.terms);
        // }

        if (form.weakOrStrong.value) {
            const weakOrStrong = form.weakOrStrong.value;
            if (weakOrStrong < 0) {
                this.options.weak = true;
                this.options.weakValue = Math.abs(weakOrStrong)
            }
            else if (weakOrStrong > 0) {
                this.options.strong = true;
                this.options.strongValue = Math.abs(weakOrStrong)
            }
        }

        // // Customize the modifier
        // if (form.ability?.value) {
        //   const abl = this.data.statistics[form.ability.value];
        //   this.terms = this.terms.flatMap(t => {
        //     if (t.term === "@mod") return new NumericTerm({ number: abl.mod });
        //     if (t.term === "@abilityCheckBonus") {
        //       const bonus = abl.bonuses?.check;
        //       if (bonus) return new Roll(bonus, this.data).terms;
        //       return new NumericTerm({ number: 0 });
        //     }
        //     return t;
        //   });
        //   this.options.flavor += ` (${CONFIG.DND5E.statistics[form.ability.value]})`;
        // }

        // Apply advantage or disadvantage
        // this.options.advantageMode = advantageMode;
        // this.options.rollMode = form.rollMode.value;
        this._configureModifiers();
        return this;

        // let roll = new Roll("d10", {});
        // roll.toMessage({
        //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //     flavor: "label",
        //     rollMode: game.settings.get('core', 'rollMode'),
        // });
        // return roll;
    }

    _configureModifiers() {
        const d10 = this.terms[0].rolls[0];

        if (this.options.weak) {
            d10.terms[4].number += this.options.weakValue;
        }

        if (this.options.strong) {
            d10.terms[0].number += this.options.strongValue;
        }

        // d10.number = 3;

        this._formula = this.constructor.getFormula(this.terms);

        this.options.configured = true;
    }
}