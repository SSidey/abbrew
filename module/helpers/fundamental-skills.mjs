export function getAttackSkillWithActions(id, name, actionCost, image, attackProfile, attackMode, handsSupplied) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills[attackMode];
    return ({
        _id: id ?? skill.id,
        name: name,
        system: {
            abbrewId: {
                uuid: id ?? skill.id
            },
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: []
            },
            action: {
                activationType: "standalone",
                actionCost: actionCost,
                actionImage: image,
                duration: {
                    precision: "0",
                    value: 0
                },
                uses: {
                    hasUses: false,
                    value: 0,
                    max: 0,
                    period: ""
                },
                charges: {
                    hasCharges: false,
                    value: 0,
                    max: 0
                },
                isActive: false,
                attackProfile: { ...attackProfile, attackMode: attackMode, handsSupplied: handsSupplied, critical: 11 - handsSupplied, isEnabled: true, finisher: { cost: 0, wounds: [] } },
                modifiers: {
                    fortune: 0,
                    attackProfile: {},
                    damage: {
                        self: []
                    },
                    guard: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    resources: {
                        self: [],
                        target: []
                    },
                    conceepts: {
                        self: [],
                        target: []
                    }
                }
            }
        }
    });
}

export function getParrySkillWithActions(actionCost) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills["parry"];

    return ({
        _id: skill.id,
        name: skill.name,
        system: {
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: []
            },
            action: {
                activationType: "standalone",
                actionCost: Math.max(1, actionCost),
                actionImage: skill.image,
                duration: {
                    precision: "0",
                    value: 0
                },
                uses: {
                    hasUses: false,
                    value: 0,
                    max: 0,
                    period: ""
                },
                charges: {
                    hasCharges: false,
                    value: 0,
                    max: 0
                },
                isActive: false,
                attackProfile: {},
                modifiers: {
                    fortune: 0,
                    attackProfile: {},
                    damage: {
                        self: []
                    },
                    guard: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: 0,
                            operator: ""
                        },
                        target: {
                            value: 0,
                            operator: ""
                        }
                    },
                    resources: {
                        self: [],
                        target: []
                    },
                    conceepts: {
                        self: [],
                        target: []
                    }
                }
            }
        }
    });
}