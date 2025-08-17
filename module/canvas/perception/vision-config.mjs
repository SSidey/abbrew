export default class AbbrewVisionModeConfig {
    static applyAbbrewVisionConfig() {
        foundry.utils.mergeObject(
            CONFIG.Canvas.visionModes,
            {
                basic: new foundry.canvas.perception.VisionMode({
                    id: "basic",
                    label: "VISION.ModeBasicVision",
                    vision: {
                        defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 },
                        preferred: true // Takes priority over other vision modes
                    },
                    vision: {
                        darkness: { adaptive: true }
                    }
                }),
                hearing: new foundry.canvas.perception.VisionMode({
                    id: "hearing",
                    label: "VISION.ModeHearing",
                    canvas: {
                        shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
                        uniforms: { contrast: 0, saturation: -0.8, exposure: -0.65 }
                    },
                    lighting: {
                        background: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                        illumination: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                        coloration: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                        darkness: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED }
                    },
                    vision: {
                        darkness: { adaptive: false },
                        defaults: { color: null, attenuation: 0, contrast: -0.5, saturation: -1, brightness: -1 }
                    }
                }, { animated: false }),
                none: new foundry.canvas.perception.VisionMode({
                    id: "none",
                    label: "VISION.ModeNone",
                    tokenConfig: false,
                    canvas: {
                        shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
                        uniforms: { contrast: -0.75, saturation: -1, exposure: -0.3 }
                    },
                    lighting: {
                        background: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                        illumination: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                        coloration: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED }
                    },
                    vision: {
                        darkness: { adaptive: false },
                        defaults: { color: null, attenuation: 0, contrast: -0.5, saturation: -1, brightness: -1 }
                    }
                })
            }
        ), { inplace: true }
    }
}