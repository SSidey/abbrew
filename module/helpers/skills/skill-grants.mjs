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

// export async function handleSkillsGrantedOnAccept(data, actor, source) {
//     const allSkillsPromises = data.skillsGrantedOnAccept.map(async s => {
//         return structuredClone(await fromUuid(s.sourceId));
//     });

//     const allSkills = await Promise.all(allSkillsPromises);
//     const grantSkills = allSkills.filter(s => s.system.skillType !== "grantModifier");
//     const grantModifiers = allSkills.filter(s => s.system.skillType === "grantModifier");

//     const skillPromises = grantSkills.map(async skill => {
//         skill.system.grantedBy.actor = data.sources.actor;
//         skill.system.grantedBy.item = data.sources.items.length > 0 ? data.sources.items[0] : null;
//         applyGrantModifiers(skill, grantModifiers);
//         await Item.create(skill, { parent: actor });
//     });

//     await Promise.all(skillPromises);
// }

// function applyGrantModifiers(skill, grantModifiers) {
//     const totalModifier = grantModifiers.reduce((result, modifier) => {
//         result.intervalSteps += modifier.system.action.modifiers.duration.intervalSteps;
//         result.valueSteps += modifier.system.action.modifiers.duration.valueSteps;
//     }, { intervalSteps: 0, valueSteps: 0 });

//     const durationSteps = CONFIG.ABBREW.durationSteps;
//     const currentSteps = Object.entries(durationSteps).filter(s => s[1].value === skill.system.action.duration.precision).map(s => s[0]);
//     const currentStep = currentSteps.length > 0 ? currentSteps[0] : 0;

//     const updateStep = currentStep + totalModifier.intervalSteps;
//     const updateInterval = CONFIG.ABBREW.durationSteps[updateStep].value;

//     const currentValue = skill.system.duration.value;
//     const queryValue = currentValue + totalModifier.valueSteps;
// }

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