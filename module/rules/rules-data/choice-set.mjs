import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";

export class AbbrewChoiceSet extends AbbrewRule {

    options;
    choice;

    set target(target) {
        this.target = target;
    }

    constructor(id, candidate, source, valid) {
        super(id, ABBREW.RuleTypes.ChoiceSet, source, valid);
        if (candidate && typeof candidate == "object") {
            candidate && Object.assign(this, candidate);
            return;
        }
        this.options = ["weapon", "armour", "consumable", "anatomy"];
        this.choice = "";
    }

    static validate(candidate) {
        return super.validate(candidate) && candidate.hasOwnProperty('options');
    }

    static async applyRule(rule, actorData) {
        if (rule.choice != "") {
            return {};
        }

        let choices = [];

        if (rule.options.includes("weapon")) {
            choices.push(getWeapons(actorData));
        }

        if (rule.options.includes("armour")) {
            choices.push(getItemArmour(actorData));
        }

        if (rule.options.includes("consumable")) {
            choices.push(getItemConsumable(actorData));
        }

        if (rule.options.includes("anatomy")) {
            choices.push(getItemAnatomy(actorData));
        }

        const data = { content: { promptTitle: "Hello", choices }, buttons: {} };
        const choice = await new ChoiceSetPrompt(data).resolveSelection();

        const parentItem = actorData.items.get(rule.owner);

        setProperty(parentItem, `system.rules[${rule.id}]`, choice);

        return {};
    }

    getItemWeapons(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isWeapon).map(i => ({ id: i._id, name: i.name }));
    }

    getItemArmour(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isArmour).map(i => ({ id: i._id, name: i.name }));
    }

    getItemConsumable(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isConsumable).map(i => ({ id: i._id, name: i.name }));
    }

    getItemAnatomy(actorData) {
        return actorData.itemTypes.anatomy.map(i => ({ id: i._id, name: i.name }));
    }
}