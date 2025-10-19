import { mergeActorWounds, updateActorWounds } from "../combat.mjs";
import { applyFullyParsedComplexModifiers, applyFullyParsedModifiers, mergeComplexModifierFields, mergeLateComplexModifiers, mergeModifierFields, parsePathSync } from "../modifierBuilderFieldHelpers.mjs";
import { applyOperator, getOrderForOperator } from "../operators.mjs";
import { getSafeJson } from "../utils.mjs";


export async function handleEarlySelfModifiers(actor, allSkills) {
    let updates = {};

    const [guardSelfUpdate, lateGuardSelfUpdate] = mergeGuardSelfModifiers(allSkills, actor);
    const [riskSelfUpdate, lateRiskSelfUpdate] = mergeRiskSelfModifiers(allSkills, actor);
    const [resolveSelfUpdate, lateResolveSelfUpdate] = mergeResolveSelfModifiers(allSkills, actor);
    const mergedSelfWounds = mergeWoundSelfModifiers(allSkills, actor);
    const mergedSelfResources = mergeResourceSelfModifiers(allSkills, actor);
    // TODO: Something is up here, no idea what the fuck changed
    const mergedConceptCosts = mergeConceptCosts(allSkills, actor);
    const mergedTierDiceChange = mergeTierDiceChange(allSkills, actor);
    updates = {
        ...updates,
        ...applyFullyParsedModifiers(guardSelfUpdate, actor, "system.defense.guard.value"),
        ...applyFullyParsedModifiers(riskSelfUpdate, actor, "system.defense.risk.raw"),
        ...applyFullyParsedModifiers(resolveSelfUpdate, actor, "system.defense.resolve.value"),
        ...applyFullyParsedModifiers(mergedTierDiceChange, actor, "system.meta.tier.dice"),
        ...applyConceptCosts(mergedConceptCosts, actor)
    };

    const woundUpdate = applyFullyParsedComplexModifiers(mergedSelfWounds, actor, "system.wounds", "type");
    if (woundUpdate["system.wounds"]?.length > 0) {
        const actorWounds = structuredClone(actor.system.wounds);
        actorWounds.forEach(r => {
            if (!woundUpdate["system.wounds"].some(u => u.type === r.type)) {
                woundUpdate["system.wounds"].push(r);
            }
        });
    }

    const resourceUpdate = applyFullyParsedComplexModifiers(mergedSelfResources, actor, "system.resources.values", "id");
    if (resourceUpdate["system.resources.values"]?.length > 0) {
        const actorResources = structuredClone(actor.system.resources.values);
        actorResources.forEach(r => {
            if (!resourceUpdate["system.resources.values"].some(u => u.id === r.id)) {
                resourceUpdate["system.resources.values"].push(r);
            }
        });
    }

    updates = {
        ...updates,
        ...resourceUpdate,
        ...woundUpdate
    };

    // TODO: Add restored on X to resources / a restore button or something.
    // TODO: Just filter synergies if not enough resource to use? Remove resource cost check aside from for standalone part.
    // At getModifierSkills, get all parsed resource costs per skill, iterate through the collection, removing from synergies if cost not met
    await actor.update(updates);

    return {
        simpleLateUpdates: [
            { path: "system.defense.guard.value", update: lateGuardSelfUpdate },
            { path: "system.defense.risk.raw", update: lateRiskSelfUpdate },
            { path: "system.defense.resolve.value", update: lateResolveSelfUpdate },
        ],
        complexLateUpdates: [
            { path: "system.wounds", key: "type", update: mergedSelfWounds.filter(m => m.lateModifiers.length > 0) },
            { path: "system.resources.values", key: "id", update: mergedSelfWounds.filter(m => m.lateModifiers.length > 0) }
        ]
    }
}

function applyConceptCosts(conceptCosts, actor) {
    const initialConcepts = structuredClone(actor.system.concepts.available);
    const modifiedConcepts = Object.keys(initialConcepts).reduce((concepts, key) => {
        if (conceptCosts[key]) {
            concepts[key] = { ...initialConcepts[key], value: initialConcepts[key].value + (conceptCosts[key] ?? 0) };
        }
        return concepts;
    }, {});

    return { "system.concepts.available": modifiedConcepts };
}

export async function handleLateSelfModifiers(actor, lateModifiers) {
    let updates = {};

    lateModifiers.simpleLateUpdates.forEach(u => {
        if (u.length > 0) {
            const [parsedLateUpdate, /* Ignore Late Parse Values, Should be [] */] = mergeSelfLateModifiers(u.update, actor);

            updates = {
                ...updates,
                ...parsedLateUpdate
            };
        }
    });


    lateModifiers.complexLateUpdates.forEach(u => {
        const parsedLateUpdate = mergeLateComplexModifiers(u.update, u.path, u.key);

        updates = {
            ...updates,
            ...parsedLateUpdate
        };
    });

    await actor.update(updates);
}

export async function handleTargetUpdates(actor, allSkills, templateData, data) {
    const skillsGrantedOnAccept = mergeSkillsGrantedOnAccept(allSkills);
    let targetUpdates = [];
    const [guardTargetUpdate, lateGuardTargetUpdate] = mergeGuardTargetModifiers(allSkills, actor);
    const [riskTargetUpdate, lateRiskTargetUpdate] = mergeRiskTargetModifiers(allSkills, actor);
    const [resolveTargetUpdate, lateResolveTargetUpdate] = mergeResolveTargetModifiers(allSkills, actor);
    if (guardTargetUpdate.length > 0 || lateGuardTargetUpdate.length > 0) {
        targetUpdates.push({ path: "system.defense.guard.value", update: guardTargetUpdate, lateModifiers: lateGuardTargetUpdate });
    }
    if (riskTargetUpdate.length > 0 || lateRiskTargetUpdate.length > 0) {
        targetUpdates.push({ path: "system.defense.risk.raw", update: riskTargetUpdate, lateModifiers: lateRiskTargetUpdate });
    }
    if (resolveTargetUpdate.length > 0 || lateResolveTargetUpdate.length > 0) {
        targetUpdates.push({ path: "system.defense.resolve.value", update: resolveTargetUpdate, lateModifiers: lateResolveTargetUpdate });
    }
    const targetWounds = mergeWoundTargetModifiers(allSkills, actor);
    const targetResources = mergeResourceTargetModifiers(allSkills, actor);

    const showAcceptButton = templateData.showAcceptButton || Object.keys(targetUpdates).length > 0 || targetWounds.length > 0 || targetResources.length > 0 || skillsGrantedOnAccept.length > 0;

    templateData = {
        ...templateData,
        showAcceptButton: showAcceptButton
    }

    data = {
        ...data,
        targetUpdates: targetUpdates,
        targetWounds: targetWounds,
        targetResources: targetResources,
        skillsGrantedOnAccept: skillsGrantedOnAccept,
    };

    return [templateData, data];
}

function mergeSkillsGrantedOnAccept(allSkills) {
    return allSkills.filter(s => s.system.skills.grantedOnAccept.length > 0).flatMap(s => s.system.skills.grantedOnAccept);
}

function mergeGuardSelfModifiers(allSkills, actor) {
    const target = "self";
    return mergeGuardModifiers(allSkills, actor, target);
}

function mergeSelfLateModifiers(modifiers, actor) {
    const target = "self";
    return mergeModifierFields(modifiers, actor, target);
}

function mergeGuardTargetModifiers(allSkills, actor) {
    const target = "target";
    return mergeGuardModifiers(allSkills, actor, target);
}

function mergeGuardModifiers(allSkills, actor, target) {
    const modifierFields = allSkills.map(s => ({ ...s.system.action.modifiers.guard[target], source: s }));
    return mergeModifierFields(modifierFields, actor);
}

function mergeRiskSelfModifiers(allSkills, actor) {
    const target = "self";
    return mergeRiskModifiers(allSkills, actor, target);
}

function mergeRiskTargetModifiers(allSkills, actor) {
    const target = "target";
    return mergeRiskModifiers(allSkills, actor, target);
}

function mergeRiskModifiers(allSkills, actor, target) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.risk[target]);
    return mergeModifierFields(modifierFields, actor);
}

function mergeResolveSelfModifiers(allSkills, actor) {
    const target = "self";
    return mergeResolveModifiers(allSkills, actor, target);
}

function mergeResolveTargetModifiers(allSkills, actor) {
    const target = "target";
    return mergeResolveModifiers(allSkills, actor, target);
}

function mergeResolveModifiers(allSkills, actor, target) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.resolve[target]);
    return mergeModifierFields(modifierFields, actor);
}

export function mergeTierDiceChange(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.tierDiceChange);
    const [tierDiceUpdate, _] = mergeModifierFields(modifierFields, actor);
    return tierDiceUpdate;
}

function mergeWoundSelfModifiers(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.wounds.self).filter(s => s.length > 0);
    return mergeComplexModifierFields(modifierFields, actor, getApplicableWounds);
}

export function mergeResourceSelfModifiers(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.resources.self).filter(s => s.length > 0);
    modifierFields.forEach(f => f.forEach(a => {
        a.type = getSafeJson(a.summary, [{ id: "" }])[0].id;
    }));
    return mergeComplexModifierFields(modifierFields, actor, noopFilter);
}

function mergeWoundTargetModifiers(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.wounds.target).filter(s => s.length > 0);
    return mergeComplexModifierFields(modifierFields, actor, getApplicableWounds);
}

function mergeResourceTargetModifiers(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.resources.target).filter(s => s.length > 0);
    modifierFields.forEach(f => f.forEach(a => {
        a.type = getSafeJson(a.summary, [{ id: "" }])[0].id;
    }));
    return mergeComplexModifierFields(modifierFields, actor, noopFilter);
}

function getApplicableWounds(woundFields) {
    return woundFields
        .filter(w => !["suppress", "intensify", "immunity"].includes(w.operator));
}

function noopFilter(fields) {
    return fields;
}

// [{ value: Number, operator: String }, ...], value: Number
export function mergeModifiers(modifiers, value) {
    const sortedModifiers = modifiers.map(m => ({ ...m, order: getOrderForOperator(m.operator) })).sort(compareModifierIndices);
    return sortedModifiers.reduce((result, modifier) => applyOperator(result, modifier.value, modifier.operator), value)
}

export function mergeConceptCosts(allSkills, actor) {
    return allSkills.reduce((conceptCosts, skill) => {
        if (Object.values(skill.system.action.modifiers.concepts).some(c => c.value)) {
            Object.keys(CONFIG.ABBREW.concepts).forEach(key => {
                const concept = skill.system.action.modifiers.concepts[key];
                if (concept.value) {
                    const skillCost = parsePathSync(`${concept.type}.${concept.value}`, actor, null, null);
                    if (key in conceptCosts) {
                        conceptCosts[key] = applyOperator(conceptCosts[key], skillCost, concept.operator);
                    } else {
                        conceptCosts[key] = applyOperator(0, skillCost, concept.operator);
                    }
                }
            })
        }

        return conceptCosts;
    }, {})
}

export function filterSynergiesWithInsufficientResources(skill, modifierSkills, actor) {
    const allSkills = [skill, ...modifierSkills];
    const modifierGroups = allSkills.map(s => ({ skill: s, costs: s.system.action.modifiers.resources.self })).filter(s => s.costs.length > 0);
    const freeSkills = allSkills.map(s => ({ skill: s, costs: s.system.action.modifiers.resources.self })).filter(s => s.costs.length === 0);
    modifierGroups.forEach(g => {
        g.costs.forEach(
            f => f.type = getSafeJson(f.summary, [{ id: "" }])[0].id
        )
    });
    const applicableSynergies = modifierGroups.reduce((applicableSkills, group) => {
        const groupedModifiers = group.costs.filter(m => m.type && m.value != null && m.operator)
            .reduce((result, modifier) => {
                if (modifier.type in result) {
                    result[modifier.type].push({ ...modifier, index: getOrderForOperator(modifier.operator) })
                    result[modifier.type].sort(compareModifierIndices);
                } else {
                    result[modifier.type] = [{ ...modifier, index: getOrderForOperator(modifier.operator) }]
                }

                return result;
            }, {});

        const parsedModifiers = Object.entries(groupedModifiers)
            .map(([k, v], i) => {
                const [update, lateModifiers] = mergeModifierFields(v, actor);
                return ({ type: k, update: update, lateModifiers: lateModifiers });
            });

        applicableSkills.totalCosts = parsedModifiers.reduce((totalCosts, parsedModifier) => {
            if (totalCosts.find(c => c.type === parsedModifier.type)) {
                const currentCost = totalCosts.find(c => c.type === parsedModifier.type);
                currentCost.update = [...currentCost.update, ...parsedModifier.update];
            } else {
                totalCosts.push(parsedModifier);
            }

            return totalCosts;
        }, applicableSkills.totalCosts);

        const resourceUpdate = applyFullyParsedComplexModifiers(applicableSkills.totalCosts, actor, "system.resources.values", "id");

        if (!Object.values(resourceUpdate["system.resources.values"]).some(v => v.value < 0)) {
            applicableSkills.skills.push(group.skill);
        }

        return applicableSkills;

    }, { skills: [], totalCosts: [] });

    return [...freeSkills.map(s => s.skill).filter(s => s._id !== skill._id), ...applicableSynergies.skills.filter(s => s._id !== skill._id)];
}