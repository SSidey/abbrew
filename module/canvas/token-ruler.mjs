export default class AbbrewTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {

    /**
   * Helper function called in `init` hook
   * @internal
   */
    static applyAbbrewMovementConfig() {
        CONFIG.Token.movement.defaultAction = "land";
        // Adjusting `Blink (Teleport)` to just be Teleport and maintain its use elsewhere
        const teleport = { ...CONFIG.Token.movement.actions.blink, label: "TOKEN.MOVEMENT.ACTIONS.teleport.label", canSelect: (token) => (!(token instanceof TokenDocument) || !(token.hasStatusEffect("prone") || token.hasStatusEffect("blind"))) && this.tokenHasMovementType(token, "teleport") };
        const land = { ...CONFIG.Token.movement.actions.walk, label: "TOKEN.MOVEMENT.ACTIONS.land.label", canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"), getCostFunction: (token, _options) => cost => cost * this.getTokenCostMultiplier(token), }
        // Optional chaining on canSelect until https://github.com/foundryvtt/foundryvtt/issues/12603 is resolved
        foundry.utils.mergeObject(CONFIG.Token.movement.actions, {
            "-=blink": null,
            "-=walk": null,
            teleport,
            /** @type {TokenMovementActionConfig} */
            burrow: {
                canSelect: (token) => (!(token instanceof TokenDocument) || !token.hasStatusEffect("prone")) && this.tokenHasMovementType(token, "burrow"),
                getCostFunction: (token, _options) => {
                    if (this.tokenHasMovementType(token, "burrow")) return cost => cost * this.getTokenCostMultiplier(token);
                    else return cost => cost * 3 * this.getTokenCostMultiplier(token);
                },
            },
            /** @type {TokenMovementActionConfig} */
            climb: {
                canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
                getCostFunction: (token, _options) => {
                    if (this.tokenHasMovementType(token, "climb")) return cost => cost * this.getTokenCostMultiplier(token);
                    else return cost => cost * 4 * this.getTokenCostMultiplier(token);
                },
            },
            /** @type {TokenMovementActionConfig} */
            crawl: {
                canSelect: (token) => (token instanceof TokenDocument) && token.hasStatusEffect("prone"),
                getCostFunction: (token, _options) => {
                    return (cost, from, to) => {
                        return cost * this.getTokenCostMultiplier(token)
                    }
                }
            },
            /** @type {TokenMovementActionConfig} */
            fly: {
                canSelect: (token) => (!(token instanceof TokenDocument) || !token.hasStatusEffect("prone")) && this.tokenHasMovementType(token, "fly"),
                getCostFunction: (token, _options) => {
                    return (cost, from, to) => {
                        let verticalModifier = 0;
                        if (to.k - from.k > 0) {
                            verticalModifier = to.k - from.k;
                        }

                        return cost + (2 * verticalModifier) * this.getTokenCostMultiplier(token);
                    };
                },
            },
            /** @type {TokenMovementActionConfig} */
            jump: {
                canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
                // default for jump is cost * 2
                getCostFunction: (token, _options) => cost => cost * this.getTokenCostMultiplier(token),
            },
            /** @type {TokenMovementActionConfig} */
            swim: {
                canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
                getCostFunction: (token, _options) => {
                    if (this.tokenHasMovementType(token, "swim")) return cost => cost * this.getTokenCostMultiplier(token);
                    else return cost => cost * 4 * this.getTokenCostMultiplier(token);
                },
            },
            /** @type {TokenMovementActionConfig} */
            land
        }, { performDeletions: true });
    }

    static tokenHasMovementType(token, action) {
        if (token.actor) {
            return token.actor.system.movement.speed[action].enabled;
        }

        return false;
    }

    static getTokenCostMultiplier(token) {
        let multiplier = 1;
        if (token.actor.statuses.has(CONFIG.specialStatusEffects.BLIND)) {
            multiplier *= 2;
        }

        if (token.actor.statuses.has(CONFIG.specialStatusEffects.PRONE)) {
            multiplier *= 2;
        }

        return multiplier;
    }

    /* -------------------------------------------------- */

    /**
     * @inheritdoc
     * @param {DeepReadonly<TokenRulerWaypoint>} waypoint
     */
    _getSegmentStyle(waypoint) {
        const style = super._getSegmentStyle(waypoint);
        this.#speedValueStyle(style, waypoint);
        return style;
    }

    /* -------------------------------------------------- */

    /**
     * @inheritdoc
     * @param {DeepReadonly<Omit<TokenRulerWaypoint, "index"|"center"|"size"|"ray">>} waypoint
     * @param {DeepReadonly<foundry.grid.types.GridOffset3D>} offset
     */
    _getGridHighlightStyle(waypoint, offset) {
        const style = super._getGridHighlightStyle(waypoint, offset);
        this.#speedValueStyle(style, waypoint);
        return style;
    }

    /* -------------------------------------------------- */

    /**
     * Adjusts the grid or segment style based on the token's movement characteristics
     * @param {{ color?: PIXI.ColorSource }} style        - The calculated style properties from the parent class
     * @param {DeepReadonly<TokenRulerWaypoint>} waypoint - The waypoint being adjusted
     * @protected
     */
    #speedValueStyle(style, waypoint) {
        // color order
        const colors = [0x33BC4E, 0xF1D836, 0xE72124];

        if (!this.token.document.actor) {
            return;
        }

        if (waypoint.actionConfig.teleport) {
            // Teleports on creatures without a teleport speed are ignored for distance calculations
            // It's possible we should be also subtracting them for mixed paths
            if (!this.token.document.movementTypes.has("teleport")) return style;
            const value = foundry.utils.getProperty(this, "token.document.actor.system.movement.speed.teleport.value") ?? 0;
            // Teleport yes/no are evaluated per segment
            const index = waypoint.cost > value ? 2 : 0;
            style.color = colors[index];
        }
        else {
            const action = ["jump", "crawl"].includes(waypoint.action) ? "land" : waypoint.action;
            const value = this.token.document.actor.system.movement.speed[action].value ?? Infinity;
            if (value === 0) {
                style.color = colors[2];
            } else {
                // Total cost, up to 1x is green, up to 2x is yellow, over that is red
                const index = Math.clamp(Math.floor((waypoint.measurement.cost - 1) / value), 0, 2);
                style.color = colors[index];
            }
        }
    }
}