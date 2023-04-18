import { AbbrewRuleField, options } from "./rule-field.mjs";
import { AbbrewActiveEffect } from "./rules-data/active-effect.mjs";
import { AbbrewChoiceSet } from "./rules-data/choice-set.mjs";
import { ABBREW } from "../helpers/config.mjs";

/**
 * Manage Rule instances through the Item Sheet via rule control buttons.
 * @param {MouseEvent} event      The left-click event on the rule control
 * @param {Item} item      The owning document which manages this rule
 */
export async function onManageRule(event, item) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const ruleId = li.dataset.ruleId;
    let rules = foundry.utils.deepClone(item.system.rules);
    switch (a.dataset.action) {
        case "create":
            const id = uuid();
            rules = [new AbbrewRuleField({ id, type: 0, label: "New Rule", content: options[0].template(), origin: item.uuid }),
            ...rules,];
            break;
        case "delete":
            rules = rules.filter(r => r.id != ruleId);
            break;
    }

    return await item.update({
        "system.rules": rules
    });
}

function uuid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function prepareRules(actor) {
    // const rules = documents[0].system.rules;
    const rules = actor.items._source.map(i => i.system.rules).flat(1);
    const validRules = [];
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const parsedRule = JSON.parse(rule.content);
        switch (parsedRule.type) {
            case ABBREW.RuleTypes.ActiveEffect:
                console.log('Active Effect');
                if (AbbrewActiveEffect.validate(parsedRule)) {
                    const typedRule = new AbbrewActiveEffect(parsedRule);
                    validRules.push(typedRule);
                }
                break;
            case ABBREW.RuleTypes.ChoiceSet:
                console.log('Choice Set');
                if (AbbrewChoiceSet.validate(parsedRule)) {
                    const typedRule = new AbbrewChoiceSet(parsedRule);
                    validRules.push(typedRule);
                }
                break;
            default:
                break;
        }
    }

    // TODO:
    // 1. Need to get uuid down to the rule
    // 2. merge and replace ids 
    let currentRules = getProperty(actor, "system.rules");
    const mergedRules = mergeObject(currentRules, validRules);
    await actor.update({ "system.rules": mergedRules });
}

export function applyRule(rule, actorData) {
    let changes = {};
    switch (rule.type) {
        case ABBREW.RuleTypes.ActiveEffect:
            changes = AbbrewActiveEffect.applyRule(rule, actorData);
            break;
        case ABBREW.RuleTypes.ChoiceSet:
            changes = AbbrewChoiceSet.applyRule(rule, actorData);
            break;
        default:
            break;
    }

    return changes;
}
