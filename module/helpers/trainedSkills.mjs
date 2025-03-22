export function getDefenderAdvantageGuardResult(skillTraining, attackCounterTraining, damage) {
    const trainingResult = skillTraining - attackCounterTraining;
    if (trainingResult > 0) {
        return 0;
    }

    return 0;
}

export function getDefenderAdvantageRiskResult(skillTraining, attackCounterTraining, damage, inflexibility) {
    const trainingResult = skillTraining - attackCounterTraining;
    if (trainingResult > 0) {
        return 0;
    }

    return Math.min(damage, inflexibility);
}

export function getAttackerAdvantageGuardResult(counterTraining, attackerSkillTraining, damage) {
    const trainingResult = attackerSkillTraining - counterTraining;
    if (trainingResult > 0) {
        return damage;
    }

    return damage;
}

export function getAttackerAdvantageRiskResult(counterTraining, attackerSkillTraining, damage, inflexibility) {
    const trainingResult = attackerSkillTraining - counterTraining;
    if (trainingResult > 0) {
        return 2 * Math.min(damage, inflexibility);
    }

    return Math.min(damage, inflexibility);
}