import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";

export class AbbrewActiveEffect extends AbbrewRule {

    operator;
    value;
    requireEquippedItem;

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

    constructor(id, label, candidate, source, valid) {
        super(id, label, ABBREW.RuleTypes.ActiveEffect, source, valid);
        if (candidate && typeof candidate == "object") {
            candidate && Object.assign(this, candidate);
            return;
        }
        this.operator = "";
        this.value = "";
        this.requireEquippedItem = false;
    }

    static validate(candidate) {
        return super.validate(candidate) && candidate.hasOwnProperty('operator') && candidate.hasOwnProperty('value') && this.validOperators.includes(candidate.operator) && !!candidate.value;
    }

    static applyRule(rule, actorData) {
        let changes = {};
        let targetElement = rule.targetElement ? actorData.items.get(rule.targetElement) : actorData;
        let targetElementType = rule.targetElement ? "Item" : "Actor";
        let currentValue = getProperty(targetElement, rule.target)
        if (!currentValue) {
            return changes;
        }

        let targetType = getType(currentValue);
        let ruleValue = null;
        if (rule.value[0] == '$') {
            ruleValue = getProperty(actorData.items.get(rule.source.item), rule.value.substring(1, rule.value.length));
        } else if (rule.value[0] == '£') {
            ruleValue = getProperty(actorData, rule.value.substring(1, rule.value.length));
        } else {
            ruleValue = rule.value;
        }

        let delta = this._castDelta(ruleValue, targetType);

        let newValue = getProperty(targetElement, rule.target)
        switch (rule.operator) {
            case "override":
                newValue = delta;
                break;
            case "add":
                newValue = newValue += delta;
                break;
            case "minus":
                newValue = newValue -= delta;
                break;
            case "multiply":
                newValue = newValue * delta;
                break;
            case "divide":
                const divisor = delta !== 0 ? delta : 1;
                newValue = newValue / divisor;
                break;
            case "upgrade":
                newValue = newValue < delta ? delta : newValue;
                break;
            case "downgrade":
                newValue = newValue > delta ? delta : newValue;
                break;
            default:
                break;
        }

        if (currentValue != newValue) {
            const elementChanges = { [rule.target]: newValue, rules: [rule.id] };
            let sourceValue = currentValue;
            if (Object.keys(actorData.ruleOverrides).includes(rule.target)) {
                sourceValue = actorData.ruleOverrides[rule.target].sourceValue;
            }
            changes = { target: rule.target, value: newValue, sourceValue, targetElementType, targetElement: rule.targetElement };
            mergeObject(targetElement, elementChanges);
        }

        return changes;
    }

    static _castDelta(raw, type) {
        let delta;
        switch (type) {
            case "boolean":
                delta = Boolean(this._parseOrString(raw));
                break;
            case "number":
                delta = Number.fromString(raw);
                if (Number.isNaN(delta)) delta = 0;
                break;
            case "string":
                delta = String(raw);
                break;
            default:
                delta = this._parseOrString(raw);
        }
        return delta;
    }

    static _parseOrString(raw) {
        try {
            return JSON.parse(raw);
        } catch (err) {
            return raw;
        }
    }
}