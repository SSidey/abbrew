// export default class FundamentalSkills {

//     getFundamentalSkills() {

//     }

//     fundamentalSkillIds = {
//         "attack": { id: "abbrewAttack0000", image: "" },
//         "parry": { id: "abbrewParry00000", image: "" },
//         "feint": { id: "abbrewFeint00000", image: "" },
//         "finisher": { id: "abbrewFinisher00", image: "" }
//     }

//     getAttackSkillWithActions(id, name, actionCost, image, attackProfile, attackMode, handsSupplied) {
//         const skill = this.fundamentalSkillIds[attackMode];
//         return ({
//             _id: skill.id,
//             name: name,
//             system: {
//                 abbrewId: {
//                     uuid: id
//                 },
//                 isActivatable: true,
//                 skillTraits: [],
//                 skillType: "basic",
//                 attributeIncrease: "",
//                 attributeIncreaseLong: "",
//                 attributeRankIncrease: "",
//                 skills: {
//                     granted: [],
//                     paired: []
//                 },
//                 action: {
//                     activationType: "standalone",
//                     actionCost: actionCost,
//                     actionImage: image,
//                     duration: {
//                         precision: "0",
//                         value: 0
//                     },
//                     uses: {
//                         hasUses: false,
//                         value: 0,
//                         max: 0,
//                         period: ""
//                     },
//                     charges: {
//                         hasCharges: false,
//                         value: 0,
//                         max: 0
//                     },
//                     isActive: false,
//                     attackProfile: { ...attackProfile, attackMode: attackMode, handsSupplied: handsSupplied, critical: 11 - handsSupplied, isEnabled: true },
//                     modifiers: {
//                         fortune: 0,
//                         attackProfile: {},
//                         damage: {
//                             self: []
//                         },
//                         guard: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         risk: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         wounds: {
//                             self: [],
//                             target: []
//                         },
//                         resolve: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         resources: {
//                             self: [],
//                             target: []
//                         },
//                         conceepts: {
//                             self: [],
//                             target: []
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     getParrySkillWithActions(actor, actionCost) {
//         const skillLower = "parry";
//         const id = actor.system.proxiedSkills[skillLower];
//         const skill = this.fundamentalSkillIds[skillLower];

//         return ({
//             _id: skill.id,
//             name: "Parry",
//             system: {
//                 isActivatable: true,
//                 skillTraits: [],
//                 skillType: "basic",
//                 attributeIncrease: "",
//                 attributeIncreaseLong: "",
//                 attributeRankIncrease: "",
//                 skills: {
//                     granted: [],
//                     paired: []
//                 },
//                 action: {
//                     activationType: "standalone",
//                     actionCost: actionCost,
//                     actionImage: skill.image,
//                     duration: {
//                         precision: "0",
//                         value: 0
//                     },
//                     uses: {
//                         hasUses: false,
//                         value: 0,
//                         max: 0,
//                         period: ""
//                     },
//                     charges: {
//                         hasCharges: false,
//                         value: 0,
//                         max: 0
//                     },
//                     isActive: false,
//                     attackProfile: {},
//                     modifiers: {
//                         fortune: 0,
//                         attackProfile: {},
//                         damage: {
//                             self: []
//                         },
//                         guard: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         risk: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         wounds: {
//                             self: [],
//                             target: []
//                         },
//                         resolve: {
//                             self: {
//                                 value: 0,
//                                 operator: ""
//                             },
//                             target: {
//                                 value: 0,
//                                 operator: ""
//                             }
//                         },
//                         resources: {
//                             self: [],
//                             target: []
//                         },
//                         conceepts: {
//                             self: [],
//                             target: []
//                         }
//                     }
//                 }
//             }
//         });
//     }

// }