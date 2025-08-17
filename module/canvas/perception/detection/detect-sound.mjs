import * as shaders from "../shaders/_module.mjs"
import { AbbrewDetectionModeMixin } from "./detection-mode-mixin.mjs";

export default class AbbrewDetectionModeSoundPerception extends AbbrewDetectionModeMixin(foundry.canvas.perception.DetectionMode) {

    _canDetect(visionSource, target) {
        const src = visionSource.object.document;
        const tgt = target.document;
        // Not if the token is GM-hidden
        if (tgt.hidden) return false;

        if (src.hasStatusEffect("deaf") || tgt.hasStatusEffect("silent")) return false;
        return tgt.actor.system.senses.emitsSound;
    }

    static getDetectionFilter() {
        const filter = (this._detectionFilter ??= foundry.canvas.rendering.filters.OutlineOverlayFilter.create({
            wave: true,
            knockout: true,
        }));
        filter.thickness = 1;
        return filter;
    }

}