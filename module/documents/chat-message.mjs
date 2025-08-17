export default class AbbrewChatMessage extends ChatMessage {
    getRollData() {
        if (this.speakerActor) {
            return { actor: this.speakerActor.getRollData() };
        }

        return {};
    }
}