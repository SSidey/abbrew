import { parsePathSync } from "../modifierBuilderFieldHelpers.mjs";
import { applyOperatorUnbounded } from "../operators.mjs";

export function applyEnhancement(enhancement, actor, baseObject, isInverted) {
    enhancement.system.modifications.forEach(modification => {
        const value = parsePathSync(`${modification.type}.${modification.value}`, actor, enhancement);
        const base = foundry.utils.getProperty(baseObject, modification.path);
        const indices = getIndices(base, modification.filterPath, modification.filterValue)
            .map(i => ({ index: i, subIndices: getIndices(foundry.utils.getProperty(base[i], modification.subPath), modification.subPathFilter, modification.subPathFilterValue) }))
        const pathValues = buildPaths(indices, modification.path, modification.subPath, modification.field).map(p => p.join(".")).map(p => ({ path: p, value: applyOperatorUnbounded(foundry.utils.getProperty(baseObject, p), value, getEnhancementOperator(modification.operator, isInverted)) }));
        pathValues.forEach(p => {
            foundry.utils.setProperty(baseObject, p.path, p.value);
        });
    });
}

function getEnhancementOperator(operator, isInverted) {
    if (!isInverted) {
        return operator;
    }

    switch (operator) {
        case "add":
            return "minus";
        case "minus":
            return "add";
        case "merge":
            return "split";
        case "split":
            return "merge";
    }
}

function getIndices(values, filterPath, filterValue) {
    if (filterValue) {
        return values.reduce((result, value, i) => {
            if (filterPath) {
                if (foundry.utils.getProperty(value, filterPath) === filterValue) {
                    result.push(i);
                }
            } else if (filterValue === "*") {
                result.push(i);
            }

            return result;
        }, [])
    }
    return [];
}

function buildPaths(indices, basePath, subPath, field) {
    const paths = [];
    if (indices.length > 0) {
        indices.forEach(i => {
            if (i.subIndices.length > 0) {
                i.subIndices.forEach(si => {
                    const path = [];
                    path.push(basePath);
                    path.push(i.index);
                    if (subPath) {
                        path.push(subPath);
                    }
                    path.push(si);
                    if (field) {
                        path.push(field);
                    }
                    paths.push(path);
                })
            } else {
                const path = [];
                path.push(basePath);
                path.push(i.index);
                if (subPath) {
                    path.push(subPath);
                }
                if (field) {
                    path.push(field);
                }
                paths.push(path);
            }
        });
    } else {
        const path = [];
        path.push(basePath);
        if (subPath) {
            path.push(subPath);
        }
        if (field) {
            path.push(field);
        }
        paths.push(path);
    }

    return paths;
}