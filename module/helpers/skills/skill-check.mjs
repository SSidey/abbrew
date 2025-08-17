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
        const skillRoll = new Roll(rollFormula, actor);
        const result = await skillRoll.evaluate();
        const resultDice = getResultDice(result);
        skillResult.dice = resultDice;
        skillResult.modifier = combinedSkillModifier;
        skillResult.fortune = fortune;
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

export async function makeSkillCheckRequest(actor, skill, modifierSkills, parentSkill, skillResult, templateData, data) {
    if (skill.system.action.skillRequest.isEnabled) {
        const skillRequest = skill.system.action.skillRequest;
        let requirements = {
            actorSource: actor._id,
            modifierIds: [],
            traits: getSafeJson(skill.system.traits.raw, []),
            checkType: skillRequest.checkType,
            isContested: skillRequest.isContested,
            successes: { total: 0, requiredValue: 0 },
            result: { requiredValue: 0 },
            contestedResult: { dice: [], modifier: 0 },
            outcomeGrants: {
                success: [...skill.system.skills.grantOnSuccess, ...modifierSkills.flatMap(s => s.system.skills.grantOnSuccess)],
                failure: [...skill.system.skills.grantOnFailure, ...modifierSkills.flatMap(s => s.system.skills.grantOnFailure)]
            }
        };
        const targetModifiers = getSafeJson(skillRequest.targetModifiers, []).map(m => m.id);
        requirements.modifierIds = targetModifiers;
        if (skillRequest.isContested) {
            const modifierIds = getSafeJson(skillRequest.requirements.modifiers, []).map(m => m.id);
            const skill = await getSkillById(actor, modifierIds);
            const deactivatedParent = parentSkill.toObject();
            deactivatedParent.system.action.skillRequest.isEnabled = false;
            skill.system.siblingSkillModifiers.push(deactivatedParent);
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

function mutateArrayForFortune(array) {
    return array.filter(r => !r.classes.split(" ").includes("discarded"));
}

export async function acceptSkillCheck(actor, requirements) {
    const skill = await getSkillById(actor, requirements.modifierIds);
    if (skill && skill.system.action.skillCheck) {
        const skillResult = await handleSkillActivate(actor, skill, false, requirements.traits.map(t => t.key));
        if (requirements.isContested) {
            if (requirements.checkType === "successes") {
                requirements.contestedResult.dice.sort((a, b) => b.result - a.result);
                const baseRequiredValues = mutateArrayForFortune(requirements.contestedResult.dice);
                const requiredNaturals = baseRequiredValues.filter(d => d.result === 10).length;
                const requiredValues = baseRequiredValues.filter(d => d.result !== 10).map(d => d.result + requirements.contestedResult.modifier).sort((a, b) => b - a);
                const baseResultValues = mutateArrayForFortune(skillResult.dice/* .slice(0, skillResult.baseDicePool) */, skillResult.fortune);
                const resultNaturals = baseResultValues.filter(d => d.result === 10).length;
                const resultValues = baseResultValues.filter(d => d.result !== 10).map(d => d.result + skillResult.modifier).sort((a, b) => b - a);
                const dicePoolDiff = requiredValues.length - resultValues.length;
                const diceToCheck = Math.min(requiredValues.length, resultValues.length);
                let requiredSuccesses = requiredNaturals;
                requiredSuccesses = getCritSuccesses(requirements.contestedResult.dice);
                let providedSuccesses = resultNaturals;
                providedSuccesses = getCritSuccesses(skillResult.dice);

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
                const filteredSkillResult = mutateArrayForFortune(skillResult.dice);
                const totalValue = Math.max(...filteredSkillResult.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue > requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult, contestedResult: requirements.contestedResult });
            }
        } else {
            if (requirements.checkType === "successes") {
                const filteredSkillResult = mutateArrayForFortune(skillResult.dice);
                const filteredNaturals = filteredSkillResult.filter(d => d.result === 10).length;
                const diceResults = filteredSkillResult.filter(d => d.result !== 10).map(d => d.result + skillResult.modifier).reduce((result, value) => {
                    if (value >= requirements.successes.requiredValue) {
                        result += 1;
                    }

                    result += filteredNaturals;
                    return result;
                }, 0);
                const critSuccesses = getCritSuccesses(skillResult.dice);
                const totalSuccesses = diceResults + critSuccesses;
                return ({ actor: actor, result: totalSuccesses >= requirements.successes.total, totalSuccesses: totalSuccesses, requiredSuccesses: requirements.successes.total, skillResult: skillResult });
            } else if (requirements.checkType === "result") {
                const requiredValue = requirements.result.requiredValue;
                const filteredSkillResult = mutateArrayForFortune(skillResult.dice);
                const totalValue = Math.max(...filteredSkillResult.map(d => d.result)) + skillResult.modifier;
                return ({ actor: actor, result: totalValue >= requiredValue, totalValue: totalValue, requiredValue: requiredValue, skillResult: skillResult });
            }
        }
    }
}

function getCritSuccesses(dice) {
    return dice.reduce((result, die) => {
        if (die.result === 10) {
            result += 1;
        }

        return result;
    }, 0);
}

async function getSkillById(actor, rawSkillIds) {
    const actorSkills = actor.items.filter(i => i.type === "skill");
    const fundamentalSkillIds = CONFIG.ABBREW.fundamentalAttributeSkillIds;
    const fundamentalSkills = CONFIG.ABBREW.fundamentalAttributeSkillSummaries;

    const fundamentalFilteredSkillsIds = rawSkillIds.filter(id => fundamentalSkillIds.includes(id));
    const actorFilteredSkillIds = rawSkillIds.filter(id => !fundamentalSkillIds.includes(id)).filter(id => actorSkills.find(s => s.system.abbrewId.uuid === id));
    const skillIds = [...actorFilteredSkillIds, ...fundamentalFilteredSkillsIds];

    let skill = null;
    if (actorFilteredSkillIds.length > 1 || (actorFilteredSkillIds.length === 0 && fundamentalFilteredSkillsIds.length > 1)) {
        const skillOptions = skillIds.reduce((skills, id) => {
            if (fundamentalFilteredSkillsIds.includes(id)) {
                const skillCandidate = fundamentalSkills.find(s => s.id === id);
                skills.push({ label: skillCandidate.value, value: id });
            } else {
                const skillCandidate = actorSkills.find(s => s.system.abbrewId.uuid === id);
                skills.push({ label: skillCandidate.name, value: id })
            }

            return skills;
        }, []);

        const fields = foundry.applications.fields;
        const selectInput = fields.createSelectInput({
            options: skillOptions,
            name: 'skillIds'
        })
        const selectGroup = fields.createFormGroup({
            input: selectInput,
            label: "Select a Skill"
        })

        const content = `${selectGroup.outerHTML}`

        try {
            const skillId = await foundry.applications.api.DialogV2.prompt({
                window: { title: "Attempt With Skill" },
                content: content,
                ok: {
                    label: "Select Skill",
                    callback: (event, button, dialog) => button.form.elements.skillIds.selectedOptions[0]?.value ?? button.form.elements.skillIds.options[0].value
                }
            });
            skill = getFirstApplicableSkill([skillId], actorSkills);
        } catch (ex) {
            console.log(`${actor.name} did not select a skill.`);
            skill = getFirstApplicableSkill(skillIds, actorSkills);
        }
    } else {
        skill = getFirstApplicableSkill(skillIds, actorSkills);
    }

    if (skill) {
        skill.system.isProxied = true;
    }

    return skill;
}

function getFirstApplicableSkill(skillIds, actorSkills) {
    const fundamentalSkillIds = CONFIG.ABBREW.fundamentalAttributeSkillIds;
    const fundamentalSkills = CONFIG.ABBREW.fundamentalAttributeSkills;

    return skillIds.reduce((result, id) => {
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
}