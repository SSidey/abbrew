export default class AbbrewToken extends (foundry.canvas?.placeables?.Token ?? Token) {

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    }

    _onClickLeft(event) {
        super._onClickLeft(event);
    }

    _onClickLeft2(event) {
        super._onClickLeft2(event);
    }

    _canView(user, event) {
        return true;
    }

    _onApplyStatusEffect(statusId, active) {
        super._onApplyStatusEffect(statusId, active);
        switch (statusId) {
            case CONFIG.specialStatusEffects.PRONE:
                this.setMovementAction();
                break;
        }
    }

    _onCreate(document, options, userId) {
        const actor = game.actors.get(document.actorId);
        if (actor && actor.items.filter(i => i.type === "skill").filter(s => s.system.senses.modifiesSenses).length === 0) {
            document.sight.visionMode = null;
        }
        super._onCreate(document, options, userId);
    }

    setMovementAction() {
        this.document.update({ "movementAction": this.document._inferMovementAction() });
    }

    render(renderer) {
        super.render(renderer);
        if (!this.mesh) return;

        const configuredTint = this.document.texture.tint ?? Color.fromString("#FFFFFF");
        if (this.mesh.tint !== 0 && this.detectionFilter instanceof foundry.canvas.rendering.filters.OutlineOverlayFilter) {
            this.mesh.tint = 0;
        } else if (
            this.mesh.tint === 0 &&
            configuredTint.toString() !== "#000000" &&
            !(this.detectionFilter instanceof foundry.canvas.rendering.filters.OutlineOverlayFilter)
        ) {
            this.mesh.tint = Number(configuredTint);
        }
    }
}