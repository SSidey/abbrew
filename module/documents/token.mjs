export default class AbbrewTokenDocument extends TokenDocument {
    _preCreate(data, options, user) {
        if (this.actor?.allowSynthetics === false && data.actorLink === false) {
            this._source.actorLink = true;
        }
        return super._preCreate(data, options, user);
    }

    _preUpdate(changed, options, user) {
        return super._preUpdate(changed, options, user);
    }

    _onUpdate(changed, options, user) {
        if (changed.detectionModes || changed.sight) {
            game.canvas.perception.update({
                initializeVisionModes: true,
                refreshVision: true,
                refreshLighting: true
            })
        }

        return super._onUpdate(changed, options, user);
    }

    prepareBaseData() {
        super.prepareBaseData();

        const actor = this.actor;
        if (!actor) return;

        if (actor.type === "character") {
            this.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        }

    }

    prepareDerivedData() {
        super.prepareDerivedData();
    }

    _inferMovementAction() {
        if (this.hasStatusEffect("prone")) {
            return "crawl";
        }

        return super._inferMovementAction();
    }
}