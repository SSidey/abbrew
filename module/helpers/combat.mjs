import { mergeModifierFields, parseModifierFieldValue } from "./modifierBuilderFieldHelpers.mjs";
import { applyOperator, getOrderForOperator } from "./operators.mjs";
import { handleSkillActivate } from "./skills/skill-activation.mjs";
import { applySkillEffects } from "./skills/skill-application.mjs";
import { checkAndExpire } from "./skills/skill-expiry.mjs";
import { handleSkillsGrantedByAura } from "./skills/skill-grants.mjs";

export async function handleCombatStart(actors) {
    for (const index in actors) {
        const actor = actors[index];
        await actor.update({ "system.actions": 5 });
    }
}

export async function handleCombatEnd(actors) {
    // TODO: Check here if async wonkiness
    actors.forEach(async a => {
        const actorSkills = a.items.filter(i => i.type === "skill");
        const combatDurationSkills = actorSkills.filter(s => s.system.action.isActive && s.system.action.duration.precision === "-2").map(s => s._id);
        const effects = a.effects.filter(e => e.flags.abbrew?.skill?.trackDuration && combatDurationSkills.includes(e.flags.abbrew.skill.trackDuration));
        effects.forEach(async e => await e.delete());
        const combatFrequencySkills = actorSkills.filter(s => (s.system.action.uses.hasUses) && ["combat", "turn", "round"].includes(s.system.action.uses.period));
        combatFrequencySkills.forEach(async s => {
            const update = s.system.action.uses.max;
            await s.update({ "system.action.uses.value": update });
        });
        await a.unsetFlag("abbrew", "combat.traits.last");
        await a.unsetFlag("abbrew", "combat.traits.current");
    });
}

export async function handleTurnChange(prior, current, priorActor, currentActor) {
    if (current.round < prior.round || (prior.round == current.round && current.turn < prior.turn)) {
        return;
    }
    if (priorActor) {
        await turnEnd(priorActor);
    }
    if (currentActor) {
        await turnStart(currentActor);
    }
}

export function mergeActorWounds(actor, incomingWounds) {
    const woundImmunities = getWoundImmunities(actor);
    const cleanedIncomingWounds = incomingWounds.filter(w => !woundImmunities.includes(w.type))
    return mergeActorWoundsWithOperator(actor, cleanedIncomingWounds, 'add');
}

export function mergeActorWoundsWithOperator(actor, incomingWounds, operator) {
    const wounds = actor.system.wounds;
    return mergeWoundsWithOperator(wounds, incomingWounds, operator);
}

export function mergeWoundsWithOperator(wounds, incomingWounds, operator) {
    const woundsResult = [...wounds, ...incomingWounds].reduce((result, { type, value }) => {
        const foundWound = result.find(w => w.type === type);
        if (foundWound) {
            foundWound.value = applyOperator((foundWound.value ?? 0), value, operator)
        } else {
            result.push({ type, value });
        }

        return result;
    }, []);
    return woundsResult.filter(v => v.value > 0);
}

export async function updateActorWounds(actor, updateWounds) {
    const woundImmunities = getWoundImmunities(actor);
    const woundsAfterImmunity = updateWounds.filter(w => !woundImmunities.includes(w.type));
    const immunedWounds = actor.system.wounds.filter(w => woundImmunities.includes(w.type));
    const fullWoundSet = [...immunedWounds, ...woundsAfterImmunity];
    await actor.update({ "system.wounds": fullWoundSet });
}

export function getWoundImmunities(actor) {
    return Object.keys(getWoundsWithOperator(actor, "immunity"));
}

export async function checkActorFatalWounds(actor) {
    const woundImmunities = getWoundImmunities(actor);
    const acuteWounds = CONFIG.ABBREW.acuteWounds;
    const activeFatalWounds = actor.system.wounds.filter(w => acuteWounds.includes(w.type)).filter(w => !woundImmunities.includes(w.type));
    const totalActiveFatalWounds = activeFatalWounds.reduce((result, wound) => result += wound.value, 0)
    if (totalActiveFatalWounds >= (2 * actor.system.defense.resolve.max)) {
        await setActorToDead(actor);
    }
}

export async function handleActorGuardConditions(actor) {
    if (actor.system.defense.guard.value <= 0) {
        await setActorToGuardBreak(actor);
        await setActorStaggered(actor);
    } else if (actor.effects.toObject().find(e => e.name === 'Guard Break')) {
        const id = actor.effects.toObject().find(e => e.name === 'Guard Break')._id;
        await actor.deleteEmbeddedDocuments('ActiveEffect', [id]);
    }
}

async function setActorStaggered(actor) {
    await createActorItemFromPack(actor, "abbrew.conditions", "abbrewCStaggered");
}

async function createActorItemFromPack(actor, packId, itemId) {
    const item = await getPackItem(packId, itemId);
    await Item.create(item, { parent: actor });
}

async function getPackItem(packId, itemId) {
    const pack = game.packs.get(packId);
    await pack.getIndex();
    return await pack.getDocument(itemId);
}

export async function handleActorWoundConditions(actor) {
    const woundImmunities = getWoundImmunities(actor);
    const updatedWoundTotal = actor.system.wounds.filter(w => !woundImmunities.includes(w.type)).reduce((total, wound) => total += wound.value, 0);
    if (actor.system.defense.resolve.value <= updatedWoundTotal) {
        await renderLostResolveCard(actor);
    }

    await checkActorFatalWounds(actor);
}

async function renderLostResolveCard(actor) {
    if (actor.statuses.has('defeated')) {
        return;
    }

    const templateData = {
        actor: actor
    };

    await setActorToDefeated(actor);

    const html = await renderTemplate("systems/abbrew/templates/chat/lost-resolve-card.hbs", templateData);

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    // const rollMode = game.settings.get('core', 'rollMode');
    ChatMessage.create({
        speaker: speaker,
        content: html
    });
}

async function setActorCondition(actor, conditionName) {
    const condition = CONFIG.ABBREW.conditions[conditionName];
    const statusSet = new Set(condition.statuses);

    if (actor.effects.find(e => e.flags.abbrew?.status?.id === conditionName)) {
        return;
    }

    const conditionEffectData = {
        _id: actor._id,
        name: game.i18n.localize(condition.name),
        img: condition.img,
        changes: [],
        disabled: false,
        duration: {},
        description: game.i18n.localize(condition.description),
        origin: actor._id,
        tint: '',
        transfer: false,
        statuses: statusSet,
        flags: { abbrew: { status: { id: conditionName } } }
    };

    await actor.createEmbeddedDocuments('ActiveEffect', [conditionEffectData]);
    console.log(`${actor.name} gained ${conditionName}`);
}

export async function handleTokenUpdate(document, changed, options, userId) {
    if (game.combat && game.combat.isActive) {
        if (!game.user.isActiveGM) {
            return;
        }

        if (changed.x || changed.y) {
            await foundry.canvas.animation.CanvasAnimation.getAnimation(document.object.animationName)?.promise;
            await handleThreat(document, { x: changed.x ?? document.x, y: changed.y ?? document.y, elevation: document.elevation }, getTokenCenter(changed.x ?? document.x, changed.y ?? document.y, document.elevation, document.getSize(), document.height));
        } else if (changed.elevation) {
            await handleThreat(document, { x: document.x, y: document.y, elevation: changed.elevation }, getTokenCenter(document.x, document.y, document.elevation ?? document.elevation, document.getSize(), document.height));
        }
    }
}

export function getTokenCenter(x, y, elevation, { width, height }, size) {
    return { x: x + (width / 2), y: y + (height / 2), elevation: elevation + (size / 2) };
}

export async function handleThreat(document, tokenPosition, tokenCenter) {
    let promises = [];
    const otherTokens = canvas.tokens.placeables.filter(t => t.id !== document.object.id);
    promises = [handlePositionBasedEffectsForDocument(document, tokenCenter, otherTokens)];

    const movedDocument = new AbbrewMovedToken(document.actor, document.id, tokenCenter, document.disposition, document.width, document._id);
    movedDocument.x = tokenPosition.x;
    movedDocument.y = tokenPosition.y;
    movedDocument.elevation = tokenPosition.elevation;

    const fullTokenSet = [...otherTokens, movedDocument];

    const otherPromises = filterForActiveTokensInCombat(otherTokens).flatMap(d => handlePositionBasedEffectsForDocument(d?.document ?? d, d.getCenterPoint(), filterOutDocument(fullTokenSet, d)));

    promises = [...promises, ...otherPromises];
    await Promise.all(promises);
}

async function handlePositionBasedEffectsForDocument(document, tokenCenter, otherTokens) {
    const otherActiveCombatTokens = filterForActiveTokensInCombat(otherTokens);
    const otherCombatTokens = filterForTokensInCombat(otherTokens);
    handleThreatForActor(document, tokenCenter, otherActiveCombatTokens);
    handleAdjacentAlliesForActor(document, tokenCenter, otherActiveCombatTokens);
    handleAurasForActor(document, tokenCenter, otherCombatTokens);
}

function filterForActiveTokensInCombat(tokens) {
    return tokens
        .filter(t =>
            game.combat.turns.filter(c => !c.isDefeated)
                .map(t => t.tokenId)
                .includes(t.document.id)
        )
}

function filterForTokensInCombat(tokens) {
    return tokens
        .filter(t =>
            game.combat.turns
                .map(t => t.tokenId)
                .includes(t.document.id)
        )
}

function filterOutDocument(tokens, filterOut) {
    return tokens.filter(t => (t.document.id) != (filterOut.document.id));
}

class AbbrewMovedToken {
    constructor(actor, documentId, tokenCenter, disposition, width, id) {
        this.tokenCenter = tokenCenter;
        this.document = {};
        this.document.id = documentId;
        this.document.disposition = disposition;
        this.document.width = width;
        this.actor = actor;
    }

    getCenterPoint() { return this.tokenCenter; }

}

async function handleThreatForActor(document, tokenCenter, otherTokens) {
    const enemyThreat = getHostileTokenCount(tokenCenter, document.height, document.disposition, otherTokens);
    if ((enemyThreat - document.actor.system.defense.threatened.threshold) * document.actor.system.defense.threatened.multiplier > 0) {
        setActorCondition(document.actor, 'threatened');
    } else {
        const id = document.actor.effects.toObject().find(e => e.name === 'Threatened')?._id;
        if (id) {
            await document.actor.deleteEmbeddedDocuments('ActiveEffect', [id]);
        }
    }
}

async function handleAdjacentAlliesForActor(document, tokenCenter, otherTokens) {
    const adjacentAllyCount = getAdjacentAllyCount(tokenCenter, document.height, document.disposition, document._id, otherTokens);
    await document.actor.update({ "system.defense.adjacentAllies": adjacentAllyCount });
}

function getAdjacentAllyCount(tokenCenter, tokenSize, tokenDisposition, tokenId, otherTokens) {
    return otherTokens
        .filter(t => t.document._id !== tokenId)
        .filter(t => tokenDisposition === t.document.disposition)
        .filter(t => getSpacesBetweenTokens(tokenCenter, tokenSize, t.getCenterPoint(), t.document.width) <= 1)
        .length;
}

async function handleAurasForActor(document, tokenCenter, otherTokens) {
    if (!document.actor.system.hasAuras) {
        return;
    }

    const fullTokenArray = [document.object, ...otherTokens];

    const auras = document.actor.items.filter(i => i.type === "skill").filter(s => s.system.aura.isAura);
    const aurasWithTargets = auras.map(a => ({ aura: a, targets: doesEmanationAffectToken(a, document, tokenCenter, otherTokens) }));
    const promises = [];
    for (const auraIndex in aurasWithTargets) {
        const thisAuraWithTargets = aurasWithTargets[auraIndex];
        const aura = thisAuraWithTargets.aura;
        const targets = thisAuraWithTargets.targets;
        const unaffectedTokens = fullTokenArray.filter(t => !targets.includes(t));
        for (const targetIndex in targets) {
            const actor = targets[targetIndex].actor;
            if (actor) {
                const unappliedSkills = aura.system.skills.aura.filter(as => !actor.items.filter(i => i.type === "skill").find(s => s.system.abbrewId.uuid === as.id && s.system.grantedBy.actor === document.actor._id))
                promises.push(handleSkillsGrantedByAura(unappliedSkills, actor, aura, document.actor, document));
            }
        }
        for (const unaffectedIndex in unaffectedTokens) {
            const actor = unaffectedTokens[unaffectedIndex].actor;
            if (actor) {
                const skills = actor.items.filter(i => i.type === "skill").filter(s => s.system.grantedBy.item === aura._id && s.system.grantedBy.actor === document.actor._id && s.system.grantedBy.token === document.object.id);
                if (skills.length > 0) {
                    skills.forEach(s => promises.push(checkAndExpire(actor, s)));
                }
            }
        }
    }

    await Promise.all(promises);
}

function doesEmanationAffectToken(aura, document, tokenCenter, otherTokens) {
    const auraAffects = aura.system.aura.affects;
    const auraSkillGrantedBy = aura.system.grantedBy.token;
    const auraGrantedBy = auraSkillGrantedBy.length > 0 ? auraSkillGrantedBy : document.id;
    const availableTargets = filterAuraTargets(auraAffects, auraGrantedBy, document, otherTokens);
    const targetsInEmanation = availableTargets.filter(t => isTokenAffectedByOwnAura(t, auraAffects, auraGrantedBy) || isTokenWithinEmanation(tokenCenter, document.height, t.getCenterPoint(), t.document.width, aura.system.aura.emanationSize))
    return targetsInEmanation;
}

function isTokenAffectedByOwnAura(token, auraAffects, auraGrantedBy) {
    if (![3, 4].includes(auraAffects)) {
        return false;
    }

    return token.id === auraGrantedBy;
}

function filterAuraTargets(auraAffects, auraGrantedBy, document, otherTokens) {
    const sourceDisposition = document.disposition
    switch (auraAffects) {
        case 0:
            return [];
        case 1:
            return otherTokens.filter(t => determineHostileDisposition(sourceDisposition, t.document.disposition));
        case 2:
            return otherTokens.filter(t => t.document.disposition === sourceDisposition);
        case 3:
            return [...otherTokens.filter(t => t.document.disposition === sourceDisposition), document.object];
        case 4:
            return [document.object, ...otherTokens];
        case 5:
            return [otherTokens.find(t => t.document._id === auraGrantedBy)];
        default:
            return [];
    }
}

function getHostileTokenCount(tokenCenter, tokenSize, tokenDisposition, otherTokens) {
    return otherTokens
        .filter(t => determineHostileDisposition(tokenDisposition, t.document.disposition))
        .filter(t => getSpacesBetweenTokens(tokenCenter, tokenSize, t.getCenterPoint(), t.document.width) <= Math.ceil(t.actor.system.threatReach))
        .length;
}

async function setActorToDefeated(actor) {
    setActorCondition(actor, 'defeated');
}

async function setActorToDead(actor) {
    setActorCondition(actor, 'dead');
}

async function setActorToGuardBreak(actor) {
    setActorCondition(actor, 'guardBreak');
}

async function setActorToOffGuard(actor) {
    setActorCondition(actor, 'offGuard');
}

async function turnEnd(actor) {
    // TODO: Conditions could modify this?
    await actor.unsetFlag("abbrew", "combat.damage.lastRoundReceived")
    await actor.unsetFlag("abbrew", "combat.traits.last");
    const currentFlaggedTraits = actor.flags.abbrew?.combat?.traits?.current ?? {};
    await actor.unsetFlag("abbrew", "combat.traits.current");
    if (Object.keys(currentFlaggedTraits).length > 0) {
        await actor.setFlag("abbrew", "combat.traits.last", currentFlaggedTraits);
    }
    await applyActiveSkills(actor, "end");
    await activateSkillsForTurnPhase(actor, "end");
    // TODO: Determine if we can remove this, time should handle it.
    // await handleSkillExpiry("end", actor);
    await checkForDistraction(actor);
    await actor.update({ "system.actions": actor.system.modifiers.actionRecovery });
}

async function checkForDistraction(actor) {
    const enemyDistraction = actor.statuses.has("threatened") ? 1 : 0;
    const distraction = enemyDistraction + actor.effects.filter(e => e.statuses.toObject().includes("distracted")).reduce((total, effect) => {
        const update = effect.flags?.abbrew?.skill?.stacks ?? 0;
        return total += update;
    }, 0);

    const distractionRisk = distraction * 10;
    const actorRisk = actor.system.defense.risk.raw;

    const updateRisk = Math.min(100, actorRisk + distractionRisk);

    await actor.update({ "system.defense.risk.raw": updateRisk });
}

function determineHostileDisposition(tokenDisposition, otherDisposition) {
    switch (tokenDisposition) {
        case 1:
        case 0:
            return otherDisposition === -1;
        case -1:
            return otherDisposition === 1;
        case -2:
            return false;
    }
}

function getSpacesBetweenTokens(origin, originSize, destination, destinationSize) {
    const grid = canvas.grid.size;
    const distance = spacesFromTokenToToken(origin, originSize, destination, destinationSize, distanceChebyshev, grid)
    return distance;
}

function isTokenWithinEmanation(origin, originSize, destination, destinationSize, emanationRadius) {
    const grid = canvas.grid.size;
    const inEmanation = isTargetWithinEmanation(origin, originSize, destination, destinationSize, distanceAlternating1_2, emanationRadius, grid);
    return inEmanation;
}

function distanceChebyshev(dxSteps, dySteps) {
    return Math.max(dxSteps, dySteps);
}

// 1–2 alternating diagonal distance between two integer step counts
function distanceAlternating1_2(dxSteps, dySteps) {
    const a = Math.max(dxSteps, dySteps);
    const b = Math.min(dxSteps, dySteps);
    return a + Math.floor(b / 2);
}

// Nearest *square center* on the source token to a given coordinate.
// Works for odd/even token sizes. All args in pixels.
function nearestSourceSquareCenterCoord(srcCenterCoord, srcSize, targetCoord, grid = canvas.grid.size) {
    // Offsets (in grid units) of the token’s square centers relative to token center:
    // {minOff, minOff+1, ..., maxOff}, where minOff = 0.5 - s/2
    const minOff = 0.5 - srcSize / 2;       // e.g., s=3 -> -1, s=2 -> -0.5
    const off = Math.round((targetCoord - srcCenterCoord) / grid - minOff) + minOff;
    const clampedOff = Math.max(minOff, Math.min(off, -minOff)); // clamp into range
    return srcCenterCoord + clampedOff * grid;
}

// Distance (in squares) from a token’s *space* (any of its squares) to a cell center,
// using the 1–2 alternating diagonal rule.
function spacesFromTokenToToken(sourceCenter, sourceSize, targetCenter, targetSize, distanceFunction, grid = canvas.grid.size) {
    const { dx, dy } = distanceBetweenNearestSquareWithTokens(sourceCenter, sourceSize, targetCenter, targetSize, grid);

    return distanceFunction(dx, dy);
}

function distanceBetweenNearestSquareWithTokens(sourceCenter, sourceSize, targetCenter, targetSize, grid = canvas.grid.size) {
    // Pick the source square-center that’s closest to the cell center on each axis
    const mx = nearestSourceSquareCenterCoord(sourceCenter.x, sourceSize, targetCenter.x, grid);
    const my = nearestSourceSquareCenterCoord(sourceCenter.y, sourceSize, targetCenter.y, grid);

    const nx = nearestSourceSquareCenterCoord(targetCenter.x, targetSize, sourceCenter.x, grid);
    const ny = nearestSourceSquareCenterCoord(targetCenter.y, targetSize, sourceCenter.y, grid);

    // Convert to integer step counts (centers are on-grid, so round)
    const dx = Math.round(Math.abs(nx - mx) / grid);
    const dy = Math.round(Math.abs(ny - my) / grid);

    return { dx, dy };
}

function isTargetWithinEmanation(sourceCenter, sourceSize, targetCenter, targetSize, distanceFunction, emanationRadius, grid = canvas.grid.size) {
    return spacesFromTokenToToken(sourceCenter, sourceSize, targetCenter, targetSize, distanceFunction, grid) <= emanationRadius;
}

async function turnStart(actor) {
    if (game.settings.get("abbrew", "announceTurnStart")) {
        ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: actor }) });
    }

    await handleSkillToRounds(actor);
    await applyActiveSkills(actor, "start");
    await activateSkillsForTurnPhase(actor, "start");
    // TODO: Determine if we can remove this, time should handle it.
    // await handleSkillExpiry("start", actor);
    await updateTurnStartWounds(actor);

    await rechargePerRoundSkills(actor);
}

async function handleSkillToRounds(actor) {
    const effects = actor.effects;
    effects.entries().forEach(async e => {
        const effect = e[1];
        const preparedDuration = effect._prepareDuration();
        if (preparedDuration.type === "seconds" && preparedDuration.remaining <= 60) {
            const duration = { ...effect.duration };
            const rounds = Math.floor(preparedDuration.remaining / 6);
            duration["rounds"] = rounds;
            duration["seconds"] = null;
            duration["duration"] = rounds;
            duration["type"] = "turns";
            duration["startTime"] = game.time.worldTime;
            duration["startRound"] = game.combat.current.round;
            const skills = actor.items.filter(i => i.type === "skill" && i._id === effect.flags?.abbrew?.skill?.trackDuration)
            if (skills.length > 0 && !skills[0].system.action.duration.expireOnStartOfTurn) {
                duration["turns"] = 1;
                duration["duration"] += 0.01;
            }

            await effect.update({ "duration": duration })
        }
    });
}

async function updateTurnStartWounds(actor) {
    const lingeringWoundTypes = foundry.utils.deepClone(CONFIG.ABBREW.lingeringWoundTypes);
    const woundToLingeringWounds = foundry.utils.deepClone(CONFIG.ABBREW.woundToLingeringWounds);
    const woundImmunities = getWoundImmunities(actor);
    const woundSuppressors = getWoundsWithSuppression(actor);
    const woundIntensifiers = getWoundsWithIntensify(actor);
    const activeLingeringWounds = actor.system.wounds.filter(w => lingeringWoundTypes.some(lw => w.type === lw)).filter(w => !woundImmunities.includes(w.type)).filter(w => w.value > 0);
    if (activeLingeringWounds.length > 0) {
        const appliedLingeringWounds = {};
        activeLingeringWounds.flatMap(lw => woundToLingeringWounds[lw.type].map(lwt => ({ type: lwt, value: Math.max(0, (lw.value - (woundSuppressors[lw.type] ?? 0) + (woundIntensifiers[lw.type] ?? 0))) }))).reduce((appliedLingeringWounds, wound) => {
            if (wound.type in appliedLingeringWounds) {
                appliedLingeringWounds[wound.type] += wound.value;
            } else {
                appliedLingeringWounds[wound.type] = wound.value;
            }

            return appliedLingeringWounds;
        }, appliedLingeringWounds);
        const acuteWoundUpdate = Object.entries(appliedLingeringWounds).map(alw => ({ type: alw[0], value: alw[1] }));
        const lingeringWoundUpdate = activeLingeringWounds.flatMap(lw => actor.system.wounds.filter(w => w.type === lw.type).map(w => ({ type: w.type, value: getLingeringWoundValueUpdate(actor, w.type) })));
        const fullWoundUpdate = [...acuteWoundUpdate, ...lingeringWoundUpdate];
        if (fullWoundUpdate.length > 0) {
            await updateActorWounds(actor, mergeActorWounds(actor, fullWoundUpdate));
        }
    }
}

function getWoundsWithOperator(actor, operator) {
    return actor.items.filter(i => i.type === "skill").filter(s => s.system.action.modifiers.wounds.self.some(w => w.operator === operator)).filter(s => s.system.action.activationType === "standalone").filter(s => !s.system.isActivatable || s.system.action.isActive).flatMap(s => s.system.action.modifiers.wounds.self.filter(w => w.operator === operator)).reduce((result, ws) => {
        if (ws.type in result) {
            result[ws.type].push({ operator: ws.operator, ...parseModifierFieldValue(ws.value, actor, ws), index: getOrderForOperator(ws.operator) });
        } else {
            result[ws.type] = [{ operator: ws.operator, ...parseModifierFieldValue(ws.value, actor, ws), index: getOrderForOperator(ws.operator) }];
        }

        return result;
    }, {});
}

function getWoundsWithSuppression(actor) {
    const wounds = getWoundsWithOperator(actor, "suppress");
    return fullyParseWoundModifiers(actor, wounds);
}

function getWoundsWithIntensify(actor) {
    const wounds = getWoundsWithOperator(actor, "intensify");
    return fullyParseWoundModifiers(actor, wounds);
}

function fullyParseWoundModifiers(actor, wounds) {
    Object.keys(wounds).forEach(key => {
        wounds[key] = wounds[key].reduce((result, wound) => {
            const [fullyParsed,] = mergeModifierFields([wound], actor);
            const fullWound = fullyParsed[0];
            result = result + fullWound.value.reduce((innerResult, field) => {
                const value = Math.floor(field.path * field.multiplier);
                innerResult = applyOperator(innerResult, value, field.operator, 0);
                return innerResult;
            }, 0);

            return result;
        }, 0);
    });
    return wounds;
}

async function applyActiveSkills(actor, turnPhase) {
    if (!(turnPhase && ["start", "end"].includes(turnPhase))) {
        return;
    }

    let activeSkills = [];
    if (turnPhase === "start") {
        activeSkills = [
            ...actor.system.activeSkills.flatMap(s => actor.items.filter(i => i._id === s)).filter(s => s.system.applyTurnStart),
            ...actor.items.filter(i => i.type === "skill").filter(s => s.system.action.activationType === "standalone" && !s.system.isActivatable && s.system.applyTurnStart)
        ];
    } else if (turnPhase === "end") {
        activeSkills = [
            ...actor.system.activeSkills.flatMap(s => actor.items.filter(i => i._id === s)).filter(s => s.system.applyTurnEnd),
            ...actor.items.filter(i => i.type === "skill").filter(s => s.system.action.activationType === "standalone" && !s.system.isActivatable && s.system.applyTurnEnd)
        ];
    }

    for (const index in activeSkills) {
        await applySkillEffects(actor, activeSkills[index]);
    }
}

async function activateSkillsForTurnPhase(actor, turnPhase) {
    if (!(turnPhase && ["start", "end"].includes(turnPhase))) {
        return;
    }

    let activeSkills = [];
    if (turnPhase === "start") {
        activeSkills = [
            ...actor.items.filter(i => i.type === "skill").filter(s => s.system.isActivatable && s.system.activateTurnStart)
        ];
    } else if (turnPhase === "end") {
        activeSkills = [
            ...actor.items.filter(i => i.type === "skill").filter(s => s.system.isActivatable && s.system.activateTurnEnd)
        ];
    }

    for (const index in activeSkills) {
        await handleSkillActivate(actor, activeSkills[index], false);
    }
}

async function rechargePerRoundSkills(actor) {
    const roundUseSkills = actor.items.filter(i => i.type === "skill" && !i.system.action.uses.asStacks && i.system.action.uses.hasUses && ["turn", "round"].includes(i.system.action.uses.period))
    for (const index in roundUseSkills) {
        await roundUseSkills[index].update({ "system.action.uses.value": roundUseSkills[index].system.action.uses.max });
    }
}

function getLingeringWoundValueUpdate(actor, woundType) {
    // To be merged with current stacks
    return -1 * actor.system.defense.recovery[woundType].value;
}