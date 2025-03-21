// Namespace Configuration Values
export const ABBREW = {};

ABBREW.durations = {
  instant: { label: "ABBREW.Durations.instant", value: 0 },
  second: { label: "ABBREW.Durations.second", value: 1 },
  turn: { label: "ABBREW.Durations.turn", value: 0.01 },
  round: { label: "ABBREW.Durations.round", value: 6 },
  minute: { label: "ABBREW.Durations.minute", value: 60 },
  hour: { label: "ABBREW.Durations.hour", value: 3600 },
  day: { label: "ABBREW.Durations.day", value: 86400 },
  permanent: { label: "ABBREW.Durations.permanent", value: -1 }
}

ABBREW.durationsLabels = {
  instant: "ABBREW.Durations.instant",
  second: "ABBREW.Durations.second",
  turn: "ABBREW.Durations.turn",
  round: "ABBREW.Durations.round",
  minute: "ABBREW.Durations.minute",
  hour: "ABBREW.Durations.hour",
  day: "ABBREW.Durations.day"
}

/**
 * The set of Attribute Scores used within the system.
 * @type {Object}
 */
ABBREW.attributes = {
  str: 'ABBREW.Attribute.Str.long',
  dex: 'ABBREW.Attribute.Dex.long',
  agi: 'ABBREW.Attribute.Agi.long',
  con: 'ABBREW.Attribute.Con.long',
  int: 'ABBREW.Attribute.Int.long',
  wit: 'ABBREW.Attribute.Wit.long',
  vis: 'ABBREW.Attribute.Vis.long',
  wil: 'ABBREW.Attribute.Wil.long',
};

ABBREW.attributeAbbreviations = {
  str: 'ABBREW.Attribute.Str.abbr',
  dex: 'ABBREW.Attribute.Dex.abbr',
  agi: 'ABBREW.Attribute.Agi.abbr',
  con: 'ABBREW.Attribute.Con.abbr',
  int: 'ABBREW.Attribute.Int.abbr',
  wis: 'ABBREW.Attribute.Wis.abbr',
  cha: 'ABBREW.Attribute.Cha.abbr',
  vis: 'ABBREW.Attribute.Vis.abbr',
  wil: 'ABBREW.Attribute.Wil.abbr',
};

ABBREW.HasRequirement = "ABBREW.HasRequirement";
ABBREW.SkillAttributeIncrease = "ABBREW.AttributeIncrease";
ABBREW.skillActivationType = "ABBREW.SkillActivationType";
ABBREW.skillActivationTypes = {
  standalone: 'ABBREW.SkillActivationTypes.standalone',
  synergy: 'ABBREW.SkillActivationTypes.synergy',
  stackRemoval: 'ABBREW.SkillActivationTypes.stackRemoval'
}
ABBREW.EquippedWeapon = "ABBREW.EquippedWeapon";
ABBREW.Damage = "ABBREW.Damage";
ABBREW.operator = "ABBREW.Operator"
ABBREW.operators = {
  equal: "ABBREW.Operators.equal",
  add: "ABBREW.Operators.add",
  minus: "ABBREW.Operators.minus",
}

ABBREW.Defense = {
  guard: 'ABBREW.Defense.guard'
}

ABBREW.armourPoints = {
  label: "ABBREW.ArmourPoints.label",
  points: {
    head: "ABBREW.ArmourPoints.Points.head",
    torso: "ABBREW.ArmourPoints.Points.torso",
    arm: "ABBREW.ArmourPoints.Points.arm",
    leg: "ABBREW.ArmourPoints.Points.leg",
    tail: "ABBREW.ArmourPoints.Points.tail",
    wing: "ABBREW.ArmourPoints.Points.wing"
  }
}

ABBREW.concepts = {
  physical: 'ABBREW.Concepts.physical',
  crushing: 'ABBREW.Resistances.crushing',
  piercing: 'ABBREW.Resistances.piercing',
  slashing: 'ABBREW.Resistances.slashing'
}

ABBREW.facing = {
  front: "ABBREW.Facing.front",
  left: "ABBREW.Facing.left",
  right: "ABBREW.Facing.right",
  back: "ABBREW.Facing.back",
}

ABBREW.attackTypes = {
  arc: "ABBREW.AttackTypes.arc",
  thrust: "ABBREW.AttackTypes.thrust",
  static: "ABBREW.AttackTypes.static"
}

ABBREW.equipState = {
  held1H: "ABBREW.EquipState.heldOne",
  held2H: "ABBREW.EquipState.heldTwo",
  worn: "ABBREW.EquipState.worn",
  stowed: "ABBREW.EquipState.stowed",
  dropped: "ABBREW.EquipState.dropped"
}

ABBREW.wornEquipState = {
  worn: "ABBREW.EquipState.worn",
  stowed: "ABBREW.EquipState.stowed",
  dropped: "ABBREW.EquipState.dropped"
}

ABBREW.skillTypes = {
  basic: "ABBREW.SkillTypes.basic",
  path: "ABBREW.SkillTypes.path",
  resource: "ABBREW.SkillTypes.resource",
  temporary: "ABBREW.SkillTypes.temporary",
  untyped: "ABBREW.SkillTypes.untyped",
  background: "ABBREW.SkillTypes.background"
}

ABBREW.actionCosts = {
  passive: "ABBREW.ActionCosts.passive",
  one: "ABBREW.ActionCosts.one",
  two: "ABBREW.ActionCosts.two",
  three: "ABBREW.ActionCosts.three",
  reaction: "ABBREW.ActionCosts.reaction",
  other: "ABBREW.ActionCosts.other"
}

ABBREW.wounds = {
  physical: {
    name: "ABBREW.Wounds.physical",
    lingeringWounds: [],
    concepts: ["physical"]
  },
  bleed: {
    name: "ABBREW.Wounds.bleed",
    lingeringWounds: ["vital"],
    concepts: ["life"]
  },
  vital: {
    name: "ABBREW.Wounds.vital",
    lingeringWounds: [],
    concepts: ["life"]
  },
  burning: {
    name: "ABBREW.Wounds.burning",
    lingeringWounds: ["burn"],
    concepts: ["fire"]
  },
  burn: {
    name: "ABBREW.Wounds.burn",
    lingeringWounds: [],
    concepts: ["fire"]
  },
  fatigue: {
    name: "ABBREW.Wounds.fatigue",
    lingeringWounds: ["exhaustion"],
    concepts: []
  },
  exhaustion: {
    name: "ABBREW.Wounds.exhaustion",
    lingeringWounds: [],
    concepts: []
  },
  dread: {
    name: "ABBREW.Wounds.dread",
    lingeringWounds: ["terror"],
    concepts: ["fear"]
  },
  terror: {
    name: "ABBREW.Wounds.terror",
    lingeringWounds: [],
    concepts: ["fear"]
  },
  enraged: {
    name: "ABBREW.Wounds.enraged",
    lingeringWounds: ["rage"],
    concepts: ["emotion"]
  },
  rage: {
    name: "ABBREW.Wounds.rage",
    lingeringWounds: [],
    concepts: ["emotion"]
  },
  instability: {
    name: "ABBREW.Wounds.instability",
    lingeringWounds: ["mutation"],
    concepts: ["mutation"]
  },
  mutation: {
    name: "ABBREW.Wounds.mutation",
    lingeringWounds: [],
    concepts: ["mutation"]
  },
  sin: {
    name: "ABBREW.Wounds.sin",
    lingeringWounds: ["corruption"],
    concepts: ["corruption"]
  },
  corruption: {
    name: "ABBREW.Wounds.corruption",
    lingeringWounds: [],
    concepts: ["corruption"]
  }
}

ABBREW.conditions = {
  dead: {
    name: "ABBREW.EFFECT.Condition.Dead.name",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "ABBREW.EFFECT.Condition.Dead.description",
    statuses: ['dead', 'defeated']
  },
  defeated: {
    name: "ABBREW.EFFECT.Condition.Defeated.name",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    description: "ABBREW.EFFECT.Condition.Defeated.description",
    statuses: ['defeated']
  },
  disoriented: {
    name: "ABBREW.EFFECT.Condition.disoriented.name",
    img: "systems/abbrew/assets/icons/statuses/disoriented.svg",
    description: "ABBREW.EFFECT.Condition.Disoriented.description",
    statuses: ['disoriented']
  },
  guardBreak: {
    name: "ABBREW.EFFECT.Condition.GuardBreak.name",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg",
    description: "ABBREW.EFFECT.Condition.GuardBreak.description",
    statuses: ['offGuard']
  },
  offGuard: {
    name: "ABBREW.EFFECT.Condition.OffGuard.name",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "ABBREW.EFFECT.Condition.OffGuard.description",
    statuses: ['offGuard']
  }
}

ABBREW.statusEffects = {
  dead: {
    name: "ABBREW.EFFECT.Status.dead",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "You have suffered fatal wounds, resulting in death.",
    order: 2,
    statuses: ['defeated']
  },
  defeated: {
    name: "ABBREW.EFFECT.Status.defeated",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    description: "You resolve buckles as you are unable to continue the fight.",
    special: "DEFEATED",
    order: 1
  },
  disoriented: {
    name: "ABBREW.EFFECT.Status.disoriented",
    img: "systems/abbrew/assets/icons/statuses/disoriented.svg",
    description: "You have been disoriented, you cannot restore guard nor parry while you have this condition."
  },
  guardBreak: {
    name: "ABBREW.EFFECT.Status.guardBreak",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg",
    description: "Your guard is broken, your foes can directly capitalise on your weakpoints. You can be targeted by finishers."
  },
  offGuard: {
    name: "ABBREW.EFFECT.Status.offGuard",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "Your are harried and your guard compromised, your foes can directly capitalise on your weakpoints. You can be targeted by finishers."
  }
}

ABBREW.equipTypes = {
  none: "ABBREW.EquipTypes.none",
  held: "ABBREW.EquipTypes.held",
  worn: "ABBREW.EquipTypes.worn"
}

ABBREW.hands = {
  none: {
    label: "ABBREW.Hands.none",
    states: []
  },
  oneHand: {
    label: "ABBREW.Hands.oneHand",
    states: ["held1H"]
  },
  versatile: {
    label: "ABBREW.Hands.versatile",
    states: ["held2H", "held1H"]
  },
  twoHand: {
    label: "ABBREW.Hands.twoHand",
    states: ["held2H"]
  }
}

const lingeringWoundImmunities = [
  { key: "bleedImmunity", value: "ABBREW.Traits.WoundImmunities.bleedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "bleed" },
  { key: "burningImmunity", value: "ABBREW.Traits.WoundImmunities.burningImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "burning" },
  { key: "fatigueImmunity", value: "ABBREW.Traits.WoundImmunities.fatigueImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "fatigue" },
  { key: "dreadImmunity", value: "ABBREW.Traits.WoundImmunities.dreadImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "dread" },
  { key: "enragedImmunity", value: "ABBREW.Traits.WoundImmunities.enragedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "enraged" },
  { key: "instabilityImmunity", value: "ABBREW.Traits.WoundImmunities.instabilityImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "instability" },
  { key: "sinImmunity", value: "ABBREW.Traits.WoundImmunities.sinImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "sin" }
]

const skillTriggers = [
  { key: "guardRestoreTrigger", value: "ABBREW.Traits.SkillTriggers.guardRestore", feature: "skillTrigger", subFeature: "guard", effect: "", data: "guardRestore" },
  { key: "attackTrigger", value: "ABBREW.Traits.SkillTriggers.attack", feature: "skillTrigger", subFeature: "attacks", effect: "", data: "attack" },
  { key: "overpowerTrigger", value: "ABBREW.Traits.SkillTriggers.overpower", feature: "skillTrigger", subFeature: "attacks", effect: "", data: "overpower" },
  { key: "feintTrigger", value: "ABBREW.Traits.SkillTriggers.feint", feature: "skillTrigger", subFeature: "attacks", effect: "", data: "feint" },
  { key: "finisherTrigger", value: "ABBREW.Traits.SkillTriggers.finisher", feature: "skillTrigger", subFeature: "attacks", effect: "", data: "finisher" },
]

const skillBlockers = [
  { key: "guardRestoreBlocker", value: "ABBREW.Traits.SkillBlockers.guardRestore", feature: "skillBlocker", subFeature: "guard", effect: "block", data: "guardRestore" },
  { key: "parryBlocker", value: "ABBREW.Traits.SkillBlockers.parry", feature: "skillBlocker", subFeature: "defensiveSkills", effect: "block", data: "parry" },
]

const skillEnablers = [
  { key: "overpowerEnable", value: "ABBREW.Traits.SkillEnablers.overpower", feature: "skillEnabler", subFeature: "offensiveSkills", effect: "enable", data: "overpower" }
]

const valueReplacers = [
  { key: "shieldTrainingReplacer", value: "ABBREW.Traits.ValueReplacers.shieldTraining", feature: "valueReplacer", subFeature: "system.action.modifiers.guard.self.value", effect: "replace", data: "actor.system.heldArmourGuard" },
]

ABBREW.traits = [
  ...lingeringWoundImmunities,
  ...skillTriggers,
  ...skillEnablers,
  ...skillBlockers,
  ...valueReplacers,
]

ABBREW.skillTriggers = skillTriggers;

ABBREW.attackModes = {
  "attack": "ABBREW.AttackModes.attack",
  "feint": "ABBREW.AttackModes.feint",
  "overpower": "ABBREW.AttackModes.overpower"
}

ABBREW.proxiedSkills = {
  "attack": "Attack",
  "parry": "Parry",
  "feint": "Feint",
  "overpower": "Overpower",
  "finisher": "Finisher"
}

ABBREW.modify = {
  "all": "Modify All",
  "one": "Modify One",
  "add": "Add",
  "skip": "Skip"
}