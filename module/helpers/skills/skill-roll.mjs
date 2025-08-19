export function getRollFormula(tier, critical, fortune) {
    // 1d10x10cs10
    const absoluteFortune = Math.abs(fortune);
    const diceCount = getDiceCount(tier, absoluteFortune);

    let fortuneModifier = "";
    if (fortune < 0) {
        fortuneModifier = `kl${tier}`;
    }
    else if (fortune > 0) {
        fortuneModifier = `kh${tier}`;
    }

    const explodesOn = critical;
    const successOn = critical;
    return `${diceCount}d10${fortuneModifier}x>=${explodesOn}cs>=${successOn}`;
}

export function getResultDice(result, bonusSuccesses = 0, lethal = 0, penetration = 0) {
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

    const decoratedDice = orderedDice.map(die => {
        let baseClasses = "roll die d10";
        if (die.success) {
            baseClasses = baseClasses.concat(' ', 'success');
        }

        if (die.discarded) {
            baseClasses = baseClasses.concat(' ', 'discarded');
        }

        if (die.exploded) {
            baseClasses = baseClasses.concat(' ', 'exploded');
        }

        return { result: die.result, classes: baseClasses };
    });

    for (let i = 0; i < bonusSuccesses; i++) {
        decoratedDice.push({
            "result": 10,
            "classes": "roll die success bonus"
        })
    }

    if (decoratedDice.some(d => d.classes.includes("success"))) {
        for (let i = 0; i < lethal; i++) {
            decoratedDice.push({
                "result": 10,
                "classes": "roll die success lethal"
            })
        }
    }

    for (let i = 0; i < penetration; i++) {
        decoratedDice.push({
            "result": 0,
            "classes": "roll die penetration"
        })
    }

    return decoratedDice;
}

export function getTotalSuccessesForResult(result, lethal = 0) {
    return result
        .map(r => (
            {
                success: r.classes.includes("success"),
                discarded: r.classes.includes("discarded")
            }
        )).reduce((total, r) => {
            if (r.success && !(r.discarded)) {
                total += 1;
            }
            return total;
        }, 0);
}

export function getDiceCount(tier, fortune) {
    return tier + fortune;
}