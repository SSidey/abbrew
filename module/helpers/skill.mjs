import { mergeWoundsWithOperator } from "./combat.mjs";
import { applyOperator } from "./operators.mjs";

export async function activateSkill(actor, skill) {
    let updates = {};
    if (skill.action.modifiers.guard.self.value) {
        const guard = applyOperator(
            actor.system.defense.guard.value,
            skill.action.modifiers.guard.self.value,
            skill.action.modifiers.guard.self.operator
        );
        updates["system.defense.guard.value"] = guard;
    }
    if (skill.action.modifiers.wounds.self.length > 0) {
        let updateWounds = actor.system.wounds;
        skill.action.modifiers.wounds.self.filter(w => w.value && w.type && w.operator).forEach(w => updateWounds = mergeWoundsWithOperator(updateWounds, [{ type: w.type, value: w.value }], w.operator));
        updates["system.wounds"] = updateWounds;
    }

    await actor.update(updates);
}