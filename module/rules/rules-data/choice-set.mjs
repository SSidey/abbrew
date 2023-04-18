import { AbbrewRule } from "./abbrew-rule.mjs";
import { ABBREW } from "../../helpers/config.mjs";

export class AbbrewChoiceSet extends AbbrewRule {

    options;

    set target(target) {
        this.target = target;
    }

    constructor(candidate) {
        super(ABBREW.RuleTypes.ChoiceSet);
        if (candidate) {
            candidate && Object.assign(this, candidate);
            return;
        }
        this.options = "";
    }

    static validate(candidate) {
        return super.validate(candidate) && candidate.hasOwnProperty('options');
    }

    static applyRule(rule, actorData) { return actorData; }
}