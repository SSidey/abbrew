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
    await handleSkillGrants(data.skillsGrantedOnAccept, actor, source);
}

export async function handleSkillsGrantedOnCheck(skills, actor, source, skillUpdates) {
    await handleSkillGrants(skills, actor, source, true, skillUpdates);
}

async function handleSkillGrants(skillIds, actor, source, isSourceActor = false, skillUpdates = {}) {
    if (skillIds.length > 0) {
        const skills = await getSkillsById(skillIds);
        return await handleGrantedSkills(skills, actor, source, isSourceActor, skillUpdates);
    }
}

async function getSkillsById(skillIds) {
    const skillsPromises = skillIds.map(s => fromUuid(s.sourceId));
    return await Promise.all(skillsPromises);
}

export async function handleGrantedSkills(skills, actor, source, isSourceActor = false, skillUpdates = {}) {
    const createSkills = skills.map(s => s.toObject());
    createSkills.forEach(s => {
        s.system.grantedBy.actor = isSourceActor ? source?._id : actor?._id;
        s.system.grantedBy.item = source?._id;
        foundry.utils.mergeObject(s, skillUpdates, { inplace: true, recursive: true })
    });

    return await Item.implementation.createDocuments(createSkills, { parent: actor })
}