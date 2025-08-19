import AbbrewSkill from "../../data/skill.mjs";

export async function handleSkillGrantOnCreation(data, actor, source) {
    return await handleSkillGrants(data.system.skills.granted, actor, source);
}

export async function handleSkillGrantOnActivation(skill, actor, source) {
    await handleSkillGrants(skill.system.skills.grantedOnActivation, actor, source)
}

export async function handleSkillGrantOnExpiry(skill, actor, source) {
    await handleSkillGrants(skill.system.skills.grantedOnExpiry, actor, source);
}

export async function handleSkillsGrantedOnAccept(data, actor, source) {
    const token = { _id: data.sources.token };
    await handleSkillGrants(data.skillsGrantedOnAccept, actor, source, actor, token);
}

export async function handleSkillsGrantedOnCheck(skills, actor, source, sourceActor, sourceToken, skillUpdates) {
    await handleSkillGrants(skills, actor, source, sourceActor, sourceToken, skillUpdates);
}

export async function handleSkillsGrantedByAura(skills, actor, source, sourceActor, sourceToken) {
    await handleSkillGrants(skills, actor, source, sourceActor, sourceToken);
}

async function handleSkillGrants(skillIds, actor, source, sourceActor = null, sourceToken = null, skillUpdates = {}) {
    if (skillIds.length > 0) {
        const skills = await getSkillsById(skillIds);
        return await handleGrantedSkills(skills, actor, source, sourceActor, sourceToken, skillUpdates);
    }
}

async function getSkillsById(skillIds) {
    const skillsPromises = skillIds.map(s => fromUuid(s.sourceId));
    return await Promise.all(skillsPromises);
}

export async function handleGrantedSkills(skills, actor, source, sourceActor = null, sourceToken = null, skillUpdates = {}) {
    const createSkills = skills.map(s => s.toObject());
    createSkills.forEach(s => {
        let thisSourceActor = sourceActor;
        if (source instanceof AbbrewSkill && source.system.grantedBy.transferActor) {
            thisSourceActor = { _id: source.system.grantedBy.actor } ?? sourceActor;
        }

        s.system.grantedBy.actor = thisSourceActor ? thisSourceActor?._id : actor?._id;
        s.system.grantedBy.item = source?._id;
        s.system.grantedBy.token = sourceToken?._id;
        foundry.utils.mergeObject(s, skillUpdates, { inplace: true, recursive: true })
    });

    return await Item.implementation.createDocuments(createSkills.filter(s => (s.system.grantedBy.selfGrantOnly && s.system.grantedBy.actor === actor._id) || !s.system.grantedBy.selfGrantOnly), { parent: actor })
}