import { applyFullyParsedComplexModifiers, applyFullyParsedModifiers, mergeComplexModifierFields, mergeLateComplexModifiers, mergeModifierFields } from "../modifierBuilderFieldHelpers.mjs";
import { getSafeJson } from "../utils.mjs";


export async function handleEarlySelfModifiers(actor, allSkills) {
    let updates = {};

    const [guardSelfUpdate, lateGuardSelfUpdate] = mergeGuardSelfModifiers(allSkills, actor);
    const [riskSelfUpdate, lateRiskSelfUpdate] = mergeRiskSelfModifiers(allSkills, actor);
    const [resolveSelfUpdate, lateResolveSelfUpdate] = mergeResolveSelfModifiers(allSkills, actor);
    const mergedSelfWounds = mergeWoundSelfModifiers(allSkills, actor);
    const mergedSelfResources = mergeResourceSelfModifiers(allSkills, actor);
    updates = {
        ...updates,
        ...applyFullyParsedModifiers(guardSelfUpdate, actor, "system.defense.guard.value"),
        ...applyFullyParsedModifiers(riskSelfUpdate, actor, "system.defense.risk.raw"),
        ...applyFullyParsedModifiers(resolveSelfUpdate, actor, "system.defense.resolve.value"),
        ...applyFullyParsedComplexModifiers(mergedSelfWounds, actor, "system.wounds", "type"),
        ...applyFullyParsedComplexModifiers(mergedSelfResources, actor, "system.resources.values", "id")
    };

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

    const showAcceptButton = Object.keys(targetUpdates).length > 0 || targetWounds.length > 0 || targetResources.length > 0;

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
    const modifierFields = allSkills.map(s => s.system.action.modifiers.guard[target]);
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

function mergeWoundSelfModifiers(allSkills, actor) {
    const modifierFields = allSkills.map(s => s.system.action.modifiers.wounds.self).filter(s => s.length > 0);
    return mergeComplexModifierFields(modifierFields, actor, getApplicableWounds);
}

function mergeResourceSelfModifiers(allSkills, actor) {
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
        .filter(w => !["suppress", "intensify"].includes(w.operator));
}

function noopFilter(fields) {
    return fields;
}

// [{ value: Number, operator: String }, ...], value: Number
export function mergeModifiers(modifiers, value) {
    const sortedModifiers = modifiers.map(m => ({ ...m, order: getOrderForOperator(m.operator) })).sort(compareModifierIndices);
    return sortedModifiers.reduce((result, modifier) => applyOperator(result, modifier.value, modifier.operator), value)
}