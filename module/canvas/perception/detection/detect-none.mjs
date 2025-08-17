import { AbbrewDetectionModeMixin } from "./detection-mode-mixin.mjs";

export default class AbbrewDetectionModeNone extends AbbrewDetectionModeMixin(foundry.canvas.perception.DetectionMode) {

    /** @override */
    _canDetect(visionSource, target) {
        return false;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _testPoint(visionSource, mode, target, test) {
        return false;
    }
}
