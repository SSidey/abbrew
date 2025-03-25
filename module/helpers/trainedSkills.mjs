export function getDefenderAdvantageGuardResult(skillTraining, attackCounterTraining, damage) {
    const trainingResult = skillTraining - attackCounterTraining;
    if (trainingResult > 0) {
        return 0;
    }

    return 0;
}

export function getDefenderAdvantageRiskResult(skillTraining, attackCounterTraining, damage, inflexibility, guard) {
    const trainingResult = skillTraining - attackCounterTraining;
    if (trainingResult > 0) {
        return 0;
    }

    return guard > 0 ? Math.min(damage, inflexibility) : damage;
}

export function getAttackerAdvantageGuardResult(counterTraining, attackerSkillTraining, damage) {
    const trainingResult = attackerSkillTraining - counterTraining;
    if (trainingResult > 0) {
        return damage;
    }

    return damage;
}

export function getAttackerAdvantageRiskResult(counterTraining, attackerSkillTraining, damage, inflexibility, guard) {
    const trainingResult = attackerSkillTraining - counterTraining;
    if (trainingResult > 0) {
        return guard > 0 ? 2 * Math.min(damage, inflexibility) : 2 * damage;
    }

    return guard > 0 ? Math.min(damage, inflexibility) : damage;
}