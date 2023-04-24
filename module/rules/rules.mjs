import { AbbrewRuleField, options } from "./rule-field.mjs";
import { AbbrewActiveEffect } from "./rules-data/active-effect.mjs";
import { AbbrewChoiceSet } from "./rules-data/choice-set.mjs";
import { ABBREW } from "../helpers/config.mjs";
import { AbbrewActor } from "../documents/actor.mjs";
import { AbbrewRule } from "./rules-data/abbrew-rule.mjs";
import { RuleSource } from "./rule-source.mjs";

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
            rules = [new AbbrewRuleField({ id, type: 0, label: "New Rule", content: options[0].template(), source: new RuleSource(item.uuid) }),
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

/**
 * Provide UUID for rule instances
 * @returns UUID
 */
function uuid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Prepare rules for the given actor from their items.
 * @param {AbbrewActor} actor 
 */
export async function prepareRules(actor) {
    const rules = actor.items._source.map(i => i.system.rules).flat(1);
    const validRules = [];
    const sourceTargets = [];
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (!rule.active) {
            continue;
        }
        if (sourceTargets[rule.source.uuid]) {
            rule.targetElement = sourceTargets[rule.source.uuid];
        }
        const parsedRule = JSON.parse(rule.content);
        let typedRule = {};
        let valid = false;
        switch (parsedRule.type) {
            case ABBREW.RuleTypes.ActiveEffect:
                console.log('Active Effect');
                valid = AbbrewActiveEffect.validate(parsedRule);
                typedRule = new AbbrewActiveEffect(rule.id, rule.label, parsedRule, rule.source, valid);
                typedRule.targetElement = rule.targetElement;
                const equipState = actor.items.get(typedRule.source.item).system.equipState;
                if ((typedRule.requireEquippedItem && (equipState.worn || equipState.wielded)) || (!typedRule.requireEquippedItem)) {
                    validRules.push(typedRule);
                }
                break;
            case ABBREW.RuleTypes.ChoiceSet:
                console.log('Choice Set');
                valid = AbbrewChoiceSet.validate(parsedRule);
                typedRule = new AbbrewChoiceSet(rule.id, rule.label, parsedRule, rule.source, valid);
                const choice = await AbbrewChoiceSet.getChoice(typedRule, actor);
                sourceTargets[rule.source.uuid] = choice;
                typedRule.targetElement = choice;
                typedRule.choice = choice;
                validRules.push(typedRule);
                break;
            default:
                break;
        }
    }

    await actor.update({ "system.rules": validRules });
}

/**
 * Apply a rule to a given actor.
 * @param {AbbrewRule} rule 
 * @param {AbbrewActor} actorData 
 * @returns changes element.
 */
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
