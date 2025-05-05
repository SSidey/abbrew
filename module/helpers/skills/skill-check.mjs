import { getFundamentalAttributeSkill } from "../fundamental-skills.mjs";
import { parseModifierFieldValue, reduceParsedModifiers } from "../modifierBuilderFieldHelpers.mjs";
import { getObjectValueByStringPath, getSafeJson } from "../utils.mjs";
import { handleSkillActivate } from "./skill-activation.mjs";
import { getDiceCount, getResultDice, getRollFormula } from "./skill-roll.mjs";

export function getTierFromArray(array) {
    const arrayValue = Math.min(...array);
    return arrayValue === Number.POSITIVE_INFINITY ? 0 : arrayValue;
}

export async function makeSkillCheck(actor, skill, allSkills, fortune, templateData, data) {
    let skillResult = { dice: [], modifier: 0, baseDicePool: 0, result: true, isContested: false };
    if (skill.system.action.skillCheck.length > 0) {
        const combinedSkillModifier = allSkills
            .flatMap(s => parseModifierFieldValue(s.system.action.skillCheck, actor, s))
            .reduce((result, check) => {
                result = reduceParsedModifiers(check.value, result);
                return result;
            }, 0);

        const attributeTiers = allSkills.flatMap(s => s.system.action.skillCheck.filter(c => c.type === "actor" && c.path.includes("system.attributes") && c.path.includes("value")).map(a => getObjectValueByStringPath(actor, a.path.replace(".value", ".tier"))));

        const tier = getTierFromArray(attributeTiers);
        const critical = 10;
        const rollFormula = getRollFormula(tier, critical, fortune);
        const skillRoll = new Roll(rollFormula, skill.system.actor);
        const result = await skillRoll.evaluate();
        const resultDice = getResultDice(result);
        skillResult.dice = resultDice;
        skillResult.modifier = combinedSkillModifier;
        const baseDicePool = getDiceCount(tier, fortune);
        skillResult.baseDicePool = baseDicePool;
        skillResult.simpleResult = baseDicePool === 0 ? combinedSkillModifier : Math.max(...skillResult.dice.map(d => d.result).map(r => r + combinedSkillModifier));
        data.skillCheckResult = skillResult;
        templateData = {
            ...templateData,
            showSkillResult: true,
            skillResult: skillResult
        };
    }

    return [skillResult, templateData, data];
}

export async function makeSkillCheckRequest(actor, skill, modifierSkills, skillResult, templateData, data) {
    if (skill.system.action.skillRequest.isEnabled) {
        const skillRequest = skill.system.action.skillRequest;
        let requirements = { modifierIds: [], checkType: skillRequest.checkType, isContested: skillRequest.isContested, successes: { total: 0, requiredValue: 0 }, result: { requiredValue: 0 }, contestedResult: { dice: [], modifier: 0 } };
        const targetModifiers = getSafeJson(skillRequest.targetModifiers).map(m => m.id);
        requirements.modifierIds = targetModifiers;
        if (skillRequest.isContested) {
            const modifierIds = getSafeJson(skillRequest.requirements.modifiers, []).map(m => m.id);
            const skill = getSkillById(actor, modifierIds);
            skill.system.siblingSkillModifiers.push(...modifierSkills);

            if (skill) {
                const contestResult = await handleSkillActivate(actor, skill);
                requirements.contestedResult = contestResult;
                skillResult = contestResult;
                skillResult.isContested = true;
            }

        } else {
            requirements.isContested = false;
            if (skillRequest.checkType === "successes") {
                requirements.successes.total = skillRequest.requirements.successes;
                requirements.successes.requiredValue = skillRequest.requirements.result;
            } else if (skillRequest.checkType === "result") {
                requirements.result.requiredValue = skillRequest.requirements.result;
            }
        }

        if (skillRequest.selfCheck) {
            const selfResult = await acceptSkillCheck(actor, requirements);
            skillResult = selfResult.skillResult;
            skillResult.result = selfResult.result;
        } else {
            data.skillCheckRequest = requirements;
            templateData = {
                ...templateData,
                showSkillRequest: true
            };
        }

        data.skillCheckResult = skillResult;
        templateData = {
            ...templateData,
            showSkillResult: true,
            skillResult: skillResult
        };
    }

    return [skillResult, templateData, data];
}

export async function acceptSkillCheck(actor, requirements) {
    const skill = getSkillById(actor, requirements.modifierIds);
    if (skill && skill.system.action.skillCheck) {
        const skillResult = await handleSkillActivate(actor, skill);
        if (requirements.isContested) {
            if (requirements.checkType === "successes") {
                const requiredValues = requirements.contestedResult.dice.slice(0, requirements.contestedResult.baseDicePool).map(d => d.result + requirements.contestedResult.modifier).sort((a, b) => b - a);
                const resultValues = skillResult.dice.slice(0, skillResult.baseDicePool).map(d => d.result + requirements.contestedResult.modifier).sort((a, b) => b - a);
                const dicePoolDiff = requirements.contestedResult.dice.length - skillResult.dice.length;
                const diceToCheck = Math.min(requirements.contestedResult.baseDicePool, skillResult.baseDicePool);
                let requiredSuccesses = 0;
                let providedSuccesses = 0;
                if (dicePoolDiff > 0) {
                    requiredSuccesses += dicePoolDiff;
                } else if (dicePoolDiff < 0) {
                    providedSuccesses += Math.abs(dicePoolDiff);
                }

                for (let i = 0; i < diceToCheck; i++) {
                    if (requiredValues[i] >= resultValues[i]) {
                        requiredSuccesses += 1;
                    } else {
                        providedSuccesses += 1;
                    }
                }

                return ({ actor: actor, result: providedSuccesses > requiredSuccesses, totalSuccesses: providedSuccesses, requiredSuccesses: requiredSuccesses, skillResult: skillResult, contestedResult: requirements.contestedResult });
            } else if (requirements.checkType === "result") {
                const requiredValue = Math.max(...requirements.contestedResult.dice.map(d => d.result)) + requirements.contestedResult.modifier;
                const totalValue = Math.max(...skillResult.dice.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue > requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult, contestedResult: requirements.contestedResult });
            }
        } else {
            if (requirements.checkType === "successes") {
                const diceResults = skillResult.dice.map(d => d.result + skillResult.modifier).reduce((result, value) => {
                    if (value >= requirements.successes.requiredValue) {
                        result += 1;
                    }

                    return result;
                }, 0);
                const critSuccesses = skillResult.dice.reduce((result, die) => {
                    if (die.result === 10) {
                        result += 1;
                    }

                    return result;
                }, 0);
                const totalSuccesses = diceResults + critSuccesses;
                return ({ actor: actor, result: totalSuccesses >= requirements.successes.total, totalSuccesses: totalSuccesses, requiredSuccesses: requirements.successes.total, skillResult: skillResult });
            } else if (requirements.checkType === "result") {
                const requiredValue = requirements.result.requiredValue;
                const totalValue = Math.max(...skillResult.dice.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue >= requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult });
            }
        }
    }
}

function getSkillById(actor, skillIds) {
    const actorSkills = actor.items.filter(i => i.type === "skill");
    const fundamentalSkillIds = CONFIG.ABBREW.fundamentalAttributeSkillIds;
    const fundamentalSkills = CONFIG.ABBREW.fundamentalAttributeSkills;

    const skill = skillIds.reduce((result, id) => {
        if (!result) {
            if (fundamentalSkillIds.includes(id)) {
                const fundamental = fundamentalSkills[id];
                result = getFundamentalAttributeSkill(fundamental);
            } else {
                result = actorSkills.find(s => s.system.abbrewId.uuid === id);
            }
        }

        return result;
    }, null);

    skill.system.isProxied = true;

    return skill;
}