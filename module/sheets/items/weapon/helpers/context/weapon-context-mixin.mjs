export const WeaponContextMixin = superclass => class extends superclass {
    async prepareWeaponContext(context) {
        let ammunitionChoices = [];
        if (this.actor) {
            ammunitionChoices = this.actor.items.filter(i => i.type === "ammunition").map(a => ({ label: a.name, type: a.system.type, value: a._id }));
        }

        context.ammunitionChoices = ammunitionChoices;
    }
}