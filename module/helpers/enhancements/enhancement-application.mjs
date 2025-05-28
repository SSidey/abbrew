import { isEquipped } from "../item-physical.mjs";
import { parsePathSync } from "../modifierBuilderFieldHelpers.mjs";
import { applyOperatorUnbounded } from "../operators.mjs";
import { isASupersetOfB, removeItem, removeItemByKeyFunction } from "../utils.mjs";
import { trackEnhancementDuration } from "./ehancement-duration.mjs";

export function shouldHandleEnhancement(targetItem, enhancementItem) {
    if ((targetItem.system.availableEnhancements < enhancementItem.system.cost) && !(["material", "form"].includes(enhancementItem.system.enhancementType))) {
        ui.notifications.info("You need to improve the quality of your item before adding more enhancements.");
    }

    return enhancementItem.type === "enhancement" &&
        ((enhancementItem.system.targetType === targetItem.type) || (["ammunition", "armour", "weapon"].includes(targetItem.type) && enhancementItem.system.targetType === "physical")) &&
        ((targetItem.system.availableEnhancements >= enhancementItem.system.cost) || (["material", "form"].includes(enhancementItem.system.enhancementType))) &&
        isASupersetOfB(targetItem.system.traits.value.map(t => t.key), enhancementItem.system.traitFilter.value.map(t => t.key))
}

export async function handleEnhancement(targetItem, actor, enhancementItem) {
    if (!actor && enhancementItem.system.duration.precision !== "-1") {
        return;
    }

    let updateObject = structuredClone(targetItem);

    let enhancement;
    if (actor) {
        const enhancementTarget = ({ name: targetItem.name, id: targetItem._id, uuid: targetItem.uuid });
        const createEnhancements = structuredClone(enhancementItem);
        foundry.utils.setProperty(createEnhancements, "system.target", enhancementTarget);
        enhancement = await Item.create([createEnhancements], { parent: actor });
        await trackEnhancementDuration(actor, enhancement[0]);

        if (isEquipped(targetItem)) {
            let skillSummaries = enhancementItem.system.skills.granted;
            const skillPromises = skillSummaries.map(s => fromUuid(s.sourceId));
            const skills = structuredClone(await Promise.all(skillPromises));
            skills.forEach(s => s.system.grantedBy.item = targetItem._id);
            const createdSkills = await Item.create(skills, { parent: actor });

            await enhancement[0].update({ "system.grantedIds": createdSkills.map(s => s._id) });
        }
    } else {
        enhancement = [enhancementItem];
    }

    applyEnhancement(enhancement[0], actor, updateObject, false);

    const options = actor ? { parent: actor } : { pack: targetItem.pack };

    await Item.implementation.updateDocuments([{ _id: targetItem._id, ...updateObject }], options);
}

export function applyEnhancement(enhancement, actor, baseObject, isInverted) {
    enhancement.system.modifications.forEach(modification => {
        let value = parsePathSync(`${modification.type}.${modification.value}`, actor, enhancement, baseObject);
        if (!isNaN(value)) {
            value = value * (modification.numerator / modification.denominator)
        }
        const base = foundry.utils.getProperty(baseObject, modification.path);
        const indices = getIndices(base, modification.filterPath, modification.filterValue)
            .map(i => ({ index: i, subIndices: getIndices(foundry.utils.getProperty(base[i], modification.subPath), modification.subPathFilter, modification.subPathFilterValue) }))
        const pathValues = buildPaths(indices, modification.path, modification.subPath, modification.field).map(p => p.join(".")).map(p => ({ path: p, value: applyOperatorUnbounded(foundry.utils.getProperty(baseObject, p), value, getEnhancementOperator(modification.operator, isInverted)) }));
        pathValues.forEach(p => {
            foundry.utils.setProperty(baseObject, p.path, p.value);
        });
    });

    let updateGrantedSkills;
    if (!isInverted) {
        const grantedSkills = baseObject.system.skills.granted;
        updateGrantedSkills = [...grantedSkills, ...enhancement.system.skills.granted];
        foundry.utils.setProperty(baseObject, "system.skills.granted", updateGrantedSkills);
    } else {
        const enhancementSkills = enhancement.system.skills.granted;
        updateGrantedSkills = baseObject.system.skills.granted;
        enhancementSkills.forEach(e => {
            removeItem(updateGrantedSkills, e);
        });
    }

    foundry.utils.setProperty(baseObject, "system.skills.granted", updateGrantedSkills);


    const itemEnhancement = ({
        name: enhancement.name,
        enhancementType: enhancement.system.type,
        id: enhancement._id,
        image: enhancement.img,
        uuid: enhancement.uuid
    });
    let enhancements;

    if (!isInverted) {
        enhancements = [...baseObject.system.enhancements, itemEnhancement];
    } else {
        enhancements = removeItemByKeyFunction(baseObject.system.enhancements, itemEnhancement, getEnhancementKey);
    }

    foundry.utils.setProperty(baseObject, "system.enhancements", enhancements);

    delete baseObject.system.equipState;
}

function getEnhancementKey(enhancement) {
    return enhancement.id;
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