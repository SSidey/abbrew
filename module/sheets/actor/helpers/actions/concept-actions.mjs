export async function changeConceptValue(event) {
    if (game.combat && game.combat.isActive) {
        return;
    }

    const concept = event.target.closest(".concept").dataset.conceptType;
    const updateValue = this.actor.system.concepts.available[concept].value - 1;
    const update = { system: { concepts: { available: {} } } };
    update.system.concepts.available[concept] = { value: updateValue };
    await this.actor.update(update);
}