import * as detection from "./detection/_module.mjs";

export default class AbbrewSightConfig {

  static applyAbbrewSightConfig() {
    CONFIG.Canvas.detectionModes = {
      lightPerception: new detection.AbbrewDetectionModeLightPerception({
        id: "lightPerception",
        label: "DETECTION.LightPerception",
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT
      }),
      basicSight: new detection.AbbrewDetectionModeDarkvision({
        id: "basicSight",
        label: "DETECTION.BasicSight",
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT
      }),
      seeInvisibility: new detection.AbbrewDetectionModeInvisibility({
        id: "seeInvisibility",
        label: "DETECTION.SeeInvisibility",
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT
      }),
      senseInvisibility: new detection.AbbrewDetectionModeInvisibility({
        id: "senseInvisibility",
        label: "DETECTION.SenseInvisibility",
        walls: false,
        angle: false,
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.OTHER
      }),
      feelTremor: new detection.AbbrewDetectionModeTremor({
        id: "feelTremor",
        label: "DETECTION.FeelTremor",
        walls: false,
        angle: false,
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.MOVE
      }),
      seeAll: new detection.AbbrewDetectionModeAll({
        id: "seeAll",
        label: "DETECTION.SeeAll",
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT
      }),
      senseAll: new detection.AbbrewDetectionModeAll({
        id: "senseAll",
        label: "DETECTION.SenseAll",
        walls: false,
        angle: false,
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.OTHER
      }),
      hearing: new detection.AbbrewDetectionModeSoundPerception({
        id: "hearing",
        label: "DETECTION.hearing",
        walls: false,
        angle: false,
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SOUND
      }),
      none: new detection.AbbrewDetectionModeNone({
        id: "none",
        label: "DETECTION.none",
        walls: true,
        angle: false,
        type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.OTHER
      })
    }
  }
}