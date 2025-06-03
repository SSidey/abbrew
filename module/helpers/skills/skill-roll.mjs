export function getRollFormula(tier, critical, fortune) {
    // 1d10x10cs10
    const diceCount = getDiceCount(tier, fortune);
    const explodesOn = critical;
    const successOn = critical;
    return `${diceCount}d10x>=${explodesOn}cs>=${successOn}`;
}

export function getResultDice(result) {
    const groupedDice = result.dice[0].results.reduce((result, die) => {
        if (result.base.length === 0) {
            result.base.push(die);
            return result;
        }

        if (result.base[result.base.length - 1].exploded && (result.stack.length === 0 || result.stack[result.stack.length - 1].exploded)) {
            result.stack.push(die);
        } else {
            result.base.push(die);
            result.explosions.push(...result.stack);
            result.stack = [];
        }

        return result;
    }, { base: [], stack: [], explosions: [] });

    const orderedDice = [...groupedDice.base, ...groupedDice.explosions, ...groupedDice.stack];

    return orderedDice.map(die => {
        let baseClasses = "roll die d10";
        if (die.success) {
            baseClasses = baseClasses.concat(' ', 'success')
        }

        if (die.exploded) {
            baseClasses = baseClasses.concat(' ', 'exploded');
        }

        return { result: die.result, classes: baseClasses };
    });
}

export function getTotalSuccessesForResult(result, lethal = 0) {
    const totalSuccesses = result.dice[0].results.reduce((total, r) => {
        if (r.success) {
            total += 1;
        }
        return total;
    }, 0);

    return totalSuccesses > 0 ? totalSuccesses + lethal : totalSuccesses;
}

export function getDiceCount(tier, fortune) {
    return tier + fortune;
}