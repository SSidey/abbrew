/**
 * Handle clickable rolls.
 * @param {Event} event   The originating click event
 * @private
 */
export async function _onRoll(event, target) {
    event.preventDefault();
    const element = target;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
        if (dataset.rollType == 'item') {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            if (item) return item.roll();
        } else if (dataset.rollType === "resource") {
            const resource = this.actor.system.resources.owned.find(r => r.id === dataset.id);
            const resourceValue = this.actor.system.resources.values.find(r => r.id === dataset.id);
            if (resource) {
                let result = 0;
                const fields = foundry.applications.fields;
                const input = fields.createNumberInput({
                    name: resource.name,
                    value: 0,
                    min: 0,
                    max: resource.max,
                    required: true
                });

                const singleGroup = fields.createFormGroup({
                    input: input,
                    label: resource.name
                });

                const content = singleGroup.outerHTML;

                try {
                    result = await foundry.applications.api.DialogV2.prompt({
                        window: { title: "Restore Resource" },
                        content: content,
                        ok: {
                            label: "Submit",
                            callback: (event, button, dialog) => new FormDataExtended(button.form).object
                        },
                        rejectClose: true
                    })
                } catch (ex) {
                    console.log(ex);
                    console.log(`${this.actor.name} did not enter a value.`);
                    return;
                }

                const validatedResult = Math.min(resource.max, Math.max(0, Object.values(result)[0] + resourceValue.value));

                const resources = this.actor.system.resources.values;
                resources.find(r => r.id === dataset.id).value = validatedResult;
                await this.actor.update({ "system.resources.values": resources });
            }
        }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
        let label = dataset.label ? `[attribute] ${dataset.label}` : '';
        let roll = new Roll(dataset.roll, this.actor.getRollData());
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label,
            rollMode: game.settings.get('core', 'rollMode'),
        });
        return roll;
    }
}