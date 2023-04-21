import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";
import { ChoiceSetPrompt } from "../choice-set-prompt.mjs";

export class AbbrewChoiceSet extends AbbrewRule {

    options;
    choice;

    set target(target) {
        this.target = target;
    }

    constructor(id, label, candidate, source, valid) {
        super(id, label, ABBREW.RuleTypes.ChoiceSet, source, valid);
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
        return {};
    }

    static async getChoice(rule, actorData) {
        if (rule.choice) {
            return rule.choice;
        }

        let choices = [];

        if (rule.options.includes("weapon")) {
            choices = mergeObject(choices, this.getItemWeapons(actorData));
        }

        if (rule.options.includes("armour")) {
            choices = mergeObject(choices, this.getItemArmour(actorData));
        }

        if (rule.options.includes("consumable")) {
            choices = mergeObject(choices, this.getItemConsumable(actorData));
        }

        if (rule.options.includes("anatomy")) {
            choices = mergeObject(choices, this.getItemAnatomy(actorData));
        }

        const data = { content: { promptTitle: "Hello", choices }, buttons: {} };
        const choice = await new ChoiceSetPrompt(data).resolveSelection();

        let parentItemId = rule.source.item;
        if (!rule.source.actor) {
            parentItemId = actorData.items.map(i => i.system.rules).flat(1).filter(i => i.id == rule.id)[0].source.item;
        }
        const parentItem = actorData.items.get(parentItemId);
        // const duplicateItem = deepClone(parentItem);
        for (let i = 0; i < parentItem.system.rules.length; i++) {
            parentItem.system.rules[i].targetElement = choice;
            if (parentItem.system.rules[i].id == rule.id) {
                parentItem.system.rules[i].choice = choice;
                const ruleContent = parentItem.system.rules[i].content;
                let parsedContent = JSON.parse(ruleContent);
                parsedContent.choice = choice;
                parentItem.system.rules[i].content = JSON.stringify(parsedContent);
            }
        }
        parentItem.update({ system: { rules: parentItem.system.rules } });
        return choice;
    }

    static getItemWeapons(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isWeapon).map(i => ({ id: i._id, name: i.name }));
    }

    static getItemArmour(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isArmour).map(i => ({ id: i._id, name: i.name }));
    }

    static getItemConsumable(actorData) {
        return actorData.itemTypes.item.filter(i => i.system.isConsumable).map(i => ({ id: i._id, name: i.name }));
    }

    static getItemAnatomy(actorData) {
        return actorData.itemTypes.anatomy.map(i => ({ id: i._id, name: i.name }));
    }
}