import { handleSkillActivate } from "../../../../helpers/skills/skill-activation.mjs";

export async function handleStep() {
    const skillId = CONFIG.ABBREW.skillIds.step;
    await handleSkill.call(this, skillId);
}

export async function handleMove() {
    const skillId = CONFIG.ABBREW.skillIds.move;
    await handleSkill.call(this, skillId);
}

async function handleSkill(skillId) {
    if (!this.actor.testUserPermission(game.user, 'OWNER')) {
        return;
    }
    const skill = this.actor.items.find(i => i.system.abbrewId.uuid === skillId);
    await handleSkillActivate(this.actor, skill);
}