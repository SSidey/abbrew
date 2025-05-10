export function getAttackSkillWithActions(id, name, actionCost, image, attackProfile, attackMode, handsSupplied, siblingSkillModifiers = []) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills[attackMode];
    let critical;
    if (attackMode === "ranged") {
        critical = Number.POSITIVE_INFINITY;
    } else if (attackMode === "aimedshot") {
        critical = attackProfile.critical;
    }
    else {
        critical = 11 - handsSupplied
    }

    return ({
        _id: id ?? skill.id,
        name: name,
        system: {
            abbrewId: {
                uuid: id ?? skill.id
            },
            siblingSkillModifiers: siblingSkillModifiers,
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: [],
                grantedOnActivation: [],
                grantedOnAccept: [],
            },
            action: {
                activationType: "standalone",
                actionCost: actionCost,
                actionImage: image,
                asyncValues: [],
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
                attackProfile: { ...attackProfile, attackMode: attackMode, handsSupplied: handsSupplied, critical: critical, isEnabled: true, finisher: { cost: 0, wounds: [] } },
                skillCheck: [],
                skillRequest: {
                    isEnabled: false
                },
                modifiers: {
                    fortune: 0,
                    attackProfile: { damage: [] },
                    guard: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
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

export function getParrySkillWithActions(actionCost, siblingSkillModifiers = []) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills["parry"];

    return ({
        _id: skill.id,
        name: skill.name,
        system: {
            abbrewId: {
                uuid: skill.id
            },
            siblingSkillModifiers: siblingSkillModifiers,
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: [],
                grantedOnActivation: [],
                grantedOnAccept: []
            },
            action: {
                activationType: "standalone",
                actionCost: Math.max(1, actionCost),
                actionImage: skill.image,
                asyncValues: [],
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
                skillCheck: [],
                skillRequest: {
                    isEnabled: false
                },
                modifiers: {
                    fortune: 0,
                    attackProfile: { damage: [] },
                    guard: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
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

// { id, name, image, attribute }
export function getFundamentalSkillWithActionCost(fundamental, actionCost, siblingSkillModifiers = []) {
    const skill = CONFIG.ABBREW.fundamentalAttackSkills[fundamental];

    return ({
        _id: fundamental.id,
        name: fundamental.name,
        system: {
            abbrewId: {
                uuid: fundamental.id
            },
            siblingSkillModifiers: siblingSkillModifiers,
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: [],
                grantedOnActivation: [],
                grantedOnAccept: []
            },
            action: {
                activationType: "standalone",
                actionCost: actionCost,
                actionImage: fundamental.image,
                asyncValues: [],
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
                attackProfile: {
                    isEnabled: false,
                },
                skillCheck: [],
                skillRequest: {
                    isEnabled: false
                },
                modifiers: {
                    fortune: 0,
                    attackProfile: { damage: [] },
                    guard: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
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

export function getFundamentalAttributeSkill(fundamental, siblingSkillModifiers = []) {
    return ({
        _id: fundamental.id,
        name: fundamental.name,
        system: {
            abbrewId: {
                uuid: fundamental.id
            },
            siblingSkillModifiers: siblingSkillModifiers,
            isActivatable: true,
            skillTraits: [],
            skillType: "basic",
            attributeIncrease: "",
            attributeIncreaseLong: "",
            attributeRankIncrease: "",
            skills: {
                granted: [],
                paired: [],
                grantedOnActivation: [],
                grantedOnAccept: []
            },
            action: {
                activationType: "standalone",
                actionCost: 0,
                actionImage: fundamental.image,
                asyncValues: [],
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
                attackProfile: {
                    isEnabled: false,
                },
                skillCheck: [
                    {
                        operator: "add",
                        type: "actor",
                        path: `system.attributes.${fundamental.attribute}.value`,
                        multiplier: 1,
                        lateParse: false
                    }
                ],
                skillRequest: {
                    isEnabled: false
                },
                modifiers: {
                    fortune: 0,
                    attackProfile: { damage: [] },
                    guard: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    risk: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
                            operator: ""
                        }
                    },
                    wounds: {
                        self: [],
                        target: []
                    },
                    resolve: {
                        self: {
                            value: [],
                            operator: ""
                        },
                        target: {
                            value: [],
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