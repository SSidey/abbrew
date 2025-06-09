import { getFundamentalAttributeSkill } from "../../../../helpers/fundamental-skills.mjs";
import { handleSkillActivate } from "../../../../helpers/skills/skill-activation.mjs";
import { manualSkillExpiry } from "../../../../helpers/skills/skill-expiry.mjs";
import { removeSkillStack } from "../../../../helpers/skills/skill-uses.mjs";

export async function _onDeleteSkill(event, target) {
    const li = target.closest('.skill');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.delete();
    li.slideUp(200, () => this.render(false));
}

export async function _onEditSkill(event, target) {
    const li = target.closest('.skill');
    const skill = this.actor.items.get(li.dataset.itemId);
    skill.sheet.render(true);
};

export async function _onSkillActivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);

    await handleSkillActivate(this.actor, skill);
}

export async function _onSkillDeactivate(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    const effect = this.actor.getEffectBySkillId(skill._id);
    if (effect) {
        await manualSkillExpiry(this.actor, skill, effect);
    }
}

export async function _onSkillStackRemove(event) {
    event.preventDefault();
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    if (skill) {
        await removeSkillStack(this.actor, skill);
    }
}

export async function _onSkillConcentrate(event) {
    event.preventDefault();
    const actionCost = event.target.closest("button").dataset.actionCost
    const target = event.target.closest('.skill');
    const id = target.dataset.itemId;
    const skill = this.actor.items.get(id);
    if (skill && game.combats.combats.length > 0) {
        const effect = skill.actor.effects.find(e => e.flags.abbrew.skill.trackDuration === skill._id);
        const updates = ({ duration: { rounds: 1, duration: 1, startTime: game.time.worldTime, startRound: game.combat.current.round } })
        await skill.actor.update({ "system.actions": skill.actor.system.actions - parseInt(actionCost) });
        await effect.update(updates);
    }
}

export async function _onAttributeSkill(event, target) {
    const element = target;
    const dataset = element.dataset;
    const fundamental = CONFIG.ABBREW.fundamentalAttributeSkillMap[dataset.attribute];
    const skill = getFundamentalAttributeSkill(fundamental)
    await handleSkillActivate(this.actor, skill);
}
