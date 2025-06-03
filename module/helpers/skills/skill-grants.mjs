export async function handleSkillsGrantedOnAccept(data, actor, source) {
    data.skillsGrantedOnAccept.forEach(async s => {
        const skill = await fromUuid(s.sourceId);
        if (skill) {
            skill.system.skillModifiers.grantedBy.actor = actor?._id;
            skill.system.skillModifiers.grantedBy.item = source?._id;
            await Item.create(skill, { parent: actor });
        }
    });
}

export async function handleGrantOnUse(skill, actor, source) {
    if (skill.system.skills.grantedOnActivation.length > 0) {
        skill.system.skills.grantedOnActivation.forEach(async s => {
            const grantedSkill = await fromUuid(s.sourceId);
            if (grantedSkill) {
                skill.system.skillModifiers.grantedBy.actor = actor?._id;
                skill.system.skillModifiers.grantedBy.item = source?._id;
                await Item.create(grantedSkill, { parent: actor });
            }
        });
    }
}

export async function handleGrantedSkills(skills, actor, source) {
    const createSkills = structuredClone(skills);
    createSkills.forEach(s => {
        s.system.grantedBy.actor = actor?._id;
        s.system.grantedBy.item = source?._id;
    });

    await Item.implementation.createDocuments(createSkills, { parent: actor })
} 