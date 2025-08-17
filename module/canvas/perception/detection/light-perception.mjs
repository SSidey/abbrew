import { AbbrewDetectionModeMixin } from "./detection-mode-mixin.mjs";

export default class AbbrewDetectionModeLightPerception extends AbbrewDetectionModeMixin(foundry.canvas.perception.DetectionModeLightPerception) {
    _canDetect(visionSource, target) {
        const src = visionSource.object.document;
        if (!src.actor.system.senses.detectionModes.some(d => d.id === CONFIG.Canvas.detectionModes.lightPerception.id && d.enabled === true)) {
            return false;
        }

        return super._canDetect(visionSource, target);
    }
}