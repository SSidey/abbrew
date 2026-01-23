import { getTokenForActor } from "../utils.mjs";
import { handlePairedSkills } from "./skill-activation.mjs";
import { applySkillEffects } from "./skill-application.mjs";
import { renderChatMessage } from "./skill-chat.mjs";

export async function applySystemFundamentalSkill(actor, skill) {
    let skillResult = false;
    switch (skill.system.abbrewId.uuid) {
        case "abbrewRest000000":
            skillResult = await applyRest(actor)
            break;
        case "abbrewRecover000":
            skillResult = await applyRecover(actor)
            break;
        case "abbrewCastSpell0":
            await castSpell(actor);
            break;
    }

    if (skillResult) {
        const templateData = {
            user: game.user,
            skillCheck: { attempts: [] },
            actorSize: actor.system.meta.size.value,
            actorTier: actor.system.meta.tier,
            mainSummary: ({ name: skill.name, description: skill.system.description })
        };
        const data = { actorSize: actor.system.meta.size.value, actorTier: actor.system.meta.tier.value };
        await renderChatMessage(true, actor, skill, templateData, data);
        await handlePairedSkills(skill, actor);
    }
}

async function applyRest(actor) {
    if (game.combat && game.combat.active) {
        ui.notifications.warn("Can't Rest mid combat");
        return;
    }

    const skills = actor.items
        .filter(i => i.type === "skill");

    const skillsToRecharge = skills
        .filter(s => s.system.action.uses.period);

    const skillsToEmpty = skills
        .filter(s => s.system.resource.emptyPeriod);

    await actor.update({ "system.defense.resolve.value": actor.system.defense.resolve.max, "system.meta.tier.dice": actor.system.meta.tier.value });
    return await applyUseAndResourceRecharge(actor, skillsToRecharge, skillsToEmpty);
}

function isValidRecoverDuration(duration) {
    return ["recover", "hour", "combat", "minute", "turn", "round", "second", "instant"].includes(duration);
}

async function applyRecover(actor) {
    if (game.combat && game.combat.active) {
        ui.notifications.warn("Can't Recover mid combat");
        return;
    }

    const skills = actor.items
        .filter(i => i.type === "skill");

    const skillsToRecharge = skills
        .filter(s => s.system.action.uses.period && isValidRecoverDuration(s.system.action.uses.period));

    const skillsToEmpty = skills
        .filter(s => s.system.resource.emptyPeriod);

    return await applyUseAndResourceRecharge(actor, skillsToRecharge, skillsToEmpty);
}

async function applyUseAndResourceRecharge(actor, skillsToRecharge, skillsToEmpty) {
    if (skillsToEmpty.some(s => s.system.skillType === "resource")) {
        const resourceIds = skillsToEmpty.filter(s => s.system.skillType === "resource").map(s => s.system.abbrewId.uuid);
        const resourceValues = structuredClone(actor.system.resources.values);
        resourceValues.forEach(r => {
            if (resourceIds.includes(r.id)) {
                r.value = 0;
            }
        });

        await actor.update({ "system.resources.values": resourceValues });
    }

    if (skillsToRecharge.some(s => s.system.skillType === "resource")) {
        const resourceIds = skillsToRecharge.filter(s => s.system.skillType === "resource").map(s => s.system.abbrewId.uuid);
        const ownedResources = actor.system.resources.owned.reduce((resourceMax, res) => {
            resourceMax[res.id] = res.max;
            return resourceMax;
        }, {});

        const resourceValues = structuredClone(actor.system.resources.values);
        resourceValues.forEach(r => {
            if (resourceIds.includes(r.id)) {
                r.value = ownedResources[r.id];
            }
        });

        await actor.update({ "system.resources.values": resourceValues });
    }

    await actor.update({ "system.defense.guard.value": actor.system.defense.guard.max, "system.defense.risk.raw": 0 });

    const skillUsesToRecharge = skillsToRecharge.filter(s => s.system.type !== "resource");

    const updates = skillUsesToRecharge.map(s => ({ _id: s._id, "system.action.uses.value": s.system.action.uses.max }));
    await Item.implementation.updateDocuments(updates, { parent: actor });
    return true;
}

async function castSpell(actor) {
    const spellPhrase = actor.system.magic.spellComponents.length > 0 ? actor.system.spellPhrase : "Nothing Happened";
    const initialConcepts = structuredClone(actor.system.concepts.available);
    const modifiedConcepts = Object.keys(initialConcepts).reduce((concepts, key) => {
        if (key === "disarray") {
            concepts[key] = initialConcepts[key];
        }
        else if (initialConcepts[key].value > 0) {
            concepts[key] = { ...initialConcepts[key], value: 0 };
        }

        return concepts;
    }, {});

    const essentiaPending = actor.system.magic.essentia;
    const essentiaSkills = actor.items.filter(i => i.type === "skill").filter(s => essentiaPending.includes(s._id));
    const essentiaPromises = essentiaSkills.map(async s => await applySkillEffects(actor, s, [], false));
    await Promise.all(essentiaPromises);

    await actor.update({ "system.concepts.available": modifiedConcepts, "system.magic.spellComponents": [], "system.magic.essentia": [] });

    const skillsToRecharge = actor.items.filter(i => i.type === "skill").filter(s => s.system.abbrewId.uuid === "abbrewVisualise0");
    await applyUseAndResourceRecharge(actor, skillsToRecharge, []);
    const templateData = {
        actor: actor,
        user: game.user,
        skillCheck: { attempts: [] },
        actorSize: actor.system.meta.size.value,
        actorTier: actor.system.meta.tier,
        mainSummary: {
            name: "Spell Phrase",
            description: spellPhrase
        }
    };
    const data = {
        actor: actor, actorSize: actor.system.meta.size.value, actorTier: actor.system.meta.tier.value, traits: [], sources: { token: getTokenForActor(actor)?._id }
    };
    await renderChatMessage(true, actor, { name: "Spell Phrase", system: { skillType: "Fundamental" } }, templateData, data);

}