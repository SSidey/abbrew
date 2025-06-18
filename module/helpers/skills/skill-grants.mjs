export async function handleSkillsGrantedOnAccept(data, actor, source) {
    const skillPromises = data.skillsGrantedOnAccept.map(async s => {
        const skill = structuredClone(await fromUuid(s.sourceId));
        if (skill) {
            skill.system.grantedBy.actor = data.sources.actor;
            skill.system.grantedBy.item = data.sources.items.length > 0 ? data.sources.items[0] : null;
            await Item.create(skill, { parent: actor });
        }
    });

    await Promise.all(skillPromises);
}

export async function handleGrantOnUse(skill, actor, source) {
    if (skill.system.skills.grantedOnActivation.length > 0) {
        skill.system.skills.grantedOnActivation.forEach(async s => {
            const grantedSkill = await fromUuid(s.sourceId);
            if (grantedSkill) {
                skill.system.grantedBy.actor = actor?._id;
                skill.system.grantedBy.item = source?._id;
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

export async function handleGrantOnExpiry(skill, actor, source) {
    if (skill.system.skills.grantedOnExpiry.length > 0) {
        skill.system.skills.grantedOnExpiry.forEach(async s => {
            const grantedSkill = await fromUuid(s.sourceId);
            if (grantedSkill) {
                skill.system.grantedBy.actor = actor?._id;
                skill.system.grantedBy.item = source?._id;
                await Item.create(grantedSkill, { parent: actor });
            }
        });
    }
}