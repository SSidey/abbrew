import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";

export class AbbrewActiveEffect extends AbbrewRule {

    operator;
    value;

    static validOperators =
        [
            "override",
            "add",
            "minus",
            "multiply",
            "divide",
            "upgrade",
            "downgrade"
        ]

    constructor(id, candidate, source, valid) {
        super(id, ABBREW.RuleTypes.ActiveEffect, source, valid);
        if (candidate && typeof candidate == "object") {
            candidate && Object.assign(this, candidate);
            return;
        }
        this.operator = "";
        this.value = "";
    }

    static validate(candidate) {
        return super.validate(candidate) && candidate.hasOwnProperty('operator') && candidate.hasOwnProperty('value') && this.validOperators.includes(candidate.operator) && !!candidate.value;
    }

    static applyRule(rule, actorData) {
        let changes = {};
        let targetElement = rule.targetElement ? actorData.items.get(rule.targetElement) : actorData;
        let targetType = rule.targetElement ? "Item" : "Actor";
        let currentValue = getProperty(targetElement, rule.target)
        if (!currentValue) {
            return changes;
        }

        // TODO:
        // 1. Get Type here so that we can do string concats
        let newValue = getProperty(targetElement, rule.target)
        switch (rule.operator) {
            case "override":
                newValue = +rule.value;
                break;
            case "add":
                newValue = newValue += +rule.value;
                break;
            case "minus":
                newValue = newValue -= +rule.value;
                break;
            case "multiply":
                newValue = newValue * +rule.value;
                break;
            case "divide":
                const divisor = +rule.value !== 0 ? +rule.value : 1;
                newValue = newValue / divisor;
                break;
            case "upgrade":
                newValue = newValue < rule.value ? rule.value : newValue;
                break;
            case "downgrade":
                newValue = newValue > rule.value ? rule.value : newValue;
                break;
            default:
                break;
        }

        if (currentValue != newValue) {
            // culprit?
            const elementChanges = { [rule.target]: newValue, rules: [rule.id] };
            changes = { target: rule.target, value: newValue, sourceValue: currentValue, targetType, targetElement: rule.targetElement };
            mergeObject(targetElement, elementChanges);
        }

        return changes;
    }
}