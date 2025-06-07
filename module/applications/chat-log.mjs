import { getParrySkillWithActions } from '../helpers/fundamental-skills.mjs';
import { emitForAll, SocketMessage } from '../socket.mjs';
import { acceptSkillCheck } from '../helpers/skills/skill-check.mjs';
import { getModifiedSkillActionCost } from "../helpers/skills/skill-activation.mjs";

export default class AbbrewChatLog extends (foundry.applications?.sidebar?.tabs?.ChatLog ?? ChatLog) {

    static DEFAULT_OPTIONS = {
        actions: {
            check: AbbrewChatLog._onChatCardAction,
            damage: AbbrewChatLog._onChatCardAction,
            accept: AbbrewChatLog._onChatCardAction,
            overpower: AbbrewChatLog._onChatCardAction,
            parry: AbbrewChatLog._onChatCardAction,
            finisher: AbbrewChatLog._onChatCardAction,
        }
    }

    static async _onChatCardAction(event, target) {
        // event.preventDefault();

        console.log('chat');

        // Extract card data
        const button = target;
        // TODO: Might want to do this for targeted effects?
        // button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        switch (action) {
            case 'check': await AbbrewChatLog._onAcceptCheckAction(message.rolls, message.flags.data, messageId); break;
            case 'accept': await AbbrewChatLog._onAcceptEffectAction(message.rolls, message.flags.data, action); break;
            case 'damage': await AbbrewChatLog._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
            case 'overpower': await AbbrewChatLog._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
            case 'parry': await AbbrewChatLog._onAcceptDamageAction(message.rolls, message.flags.data, action); break;
            case 'finisher': await AbbrewChatLog._onAcceptFinisherAction(message.rolls, message.flags.data, action, button.dataset.finisherType); break;
        }
    }

    static async _onAcceptCheckAction(rolls, data, messageId) {
        const message = game.messages.get(messageId);
        const tokens = canvas.tokens.controlled.filter((token) => token.actor);
        if (tokens.length === 0) {
            ui.notifications.info("Please select a token to accept the effect.");
            return;
        }

        const actor = tokens[0].actor;

        const result = await acceptSkillCheck(actor, data.skillCheckRequest);

        const parsedResult = ({ name: result.actor.name, result: result.result, totalValue: result.totalValue, requiredValue: result.requiredValue, totalSuccesses: result.totalSuccesses, requiredSuccesses: result.requiredSuccesses, skillResult: result.skillResult, contestedResult: result.contestedResult })

        let templateData = message.flags.abbrew.messasgeData.templateData;

        templateData.skillCheck = templateData.skillCheck ? templateData.skillCheck : ({ attempts: [] });
        templateData.skillCheck.attempts = [...templateData.skillCheck.attempts, parsedResult];
        templateData.skillCheck.checkType = data.skillCheckRequest.checkType;

        const html = await renderTemplate("systems/abbrew/templates/chat/skill-card.hbs", templateData);
        // await updateMessageForCheck(messageId, html, templateData);
        emitForAll("system.abbrew", new SocketMessage(game.user.id, "updateMessageForCheck", { messageId, html, templateData }));
    }

    static async _onAcceptEffectAction(rolls, data, action) {
        const tokens = canvas.tokens.controlled.filter((token) => token.actor);
        if (tokens.length === 0) {
            ui.notifications.info("Please select a token to accept the effect.");
            return;
        }

        const actor = tokens[0].actor;

        await actor.takeEffect(data, rolls, action);
    }

    static async _onAcceptDamageAction(rolls, data, action) {
        const tokens = canvas.tokens.controlled.filter((token) => token.actor);
        if (tokens.length === 0) {
            ui.notifications.info("Please select a token to accept the effect.");
            return;
        }

        const actor = tokens[0].actor;

        if (action === "parry" && actor.doesActorHaveSkillDiscord(getParrySkillWithActions(0))) {
            ui.notifications.info("You are prevented from parrying.");
            return;
        }

        if (action === "parry") {
            const actions = this.getActionCostForAccept(data, action);
            if (actions > 0 && !await actor.canActorUseActions(getModifiedSkillActionCost(actor, getParrySkillWithActions(actions)))) {
                return;
            }
        }

        await actor.takeAttack(data, action);
    }

    static getActionCostForAccept(data, action) {
        return action === "parry" ? data.actionCost : 0;
    }

    static async _onAcceptFinisherAction(rolls, data, action, finisherType) {
        const tokens = canvas.tokens.controlled.filter((token) => token.actor);
        if (tokens.length === 0) {
            return;
        }

        await tokens[0].actor.takeFinisher(rolls, data, finisherType);
    }

}
