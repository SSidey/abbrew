import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";

export class AbbrewActiveEffect extends AbbrewRule {

    operator;
    value;

    constructor(candidate) {
        super(ABBREW.RuleTypes.ActiveEffect);
        if (candidate) {
            candidate && Object.assign(this, candidate);
            return;
        }
        this.operator = "";
        this.value = "";
    }

    static validate(candidate) {
        return super.validate(candidate) && candidate.hasOwnProperty('operator') && candidate.hasOwnProperty('value');
    }

    static applyRule(rule, actorData) {
        let currentValue = getProperty(actorData, rule.target)
        let newValue = getProperty(actorData, rule.target)
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
            default:
                break;
        }

        let changes = {};

        if (currentValue != newValue) {
            changes[rule.target] = newValue;
            mergeObject(actorData, changes);
        }

        return changes;
    }
}