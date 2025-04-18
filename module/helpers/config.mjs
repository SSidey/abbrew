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
  wit: 'ABBREW.Attribute.Wit.abbr',
  vis: 'ABBREW.Attribute.Vis.abbr',
  wil: 'ABBREW.Attribute.Wil.abbr',
};

ABBREW.HasRequirement = "ABBREW.HasRequirement";
ABBREW.SkillAttributeIncrease = "ABBREW.AttributeIncrease";
ABBREW.skillActivationType = "ABBREW.SkillActivationType";
ABBREW.skillActivationTypes = {
  standalone: 'ABBREW.SkillActivationTypes.standalone',
  synergy: 'ABBREW.SkillActivationTypes.synergy'
}
ABBREW.EquippedWeapon = "ABBREW.EquippedWeapon";
ABBREW.Damage = "ABBREW.Damage";
ABBREW.operator = "ABBREW.Operator"

ABBREW.simpleNumericOperators = {
  add: "+",
  minus: "-",
}

ABBREW.simpleOperators = {
  add: "ABBREW.Operators.add",
  minus: "ABBREW.Operators.minus",
}

ABBREW.operators = {
  equal: "ABBREW.Operators.equal",
  ...ABBREW.simpleOperators,
  upgrade: "ABBREW.Operators.upgrade",
  downgrade: "ABBREW.Operators.downgrade"
}

ABBREW.woundOperators = {
  ...ABBREW.operators,
  suppress: "ABBREW.Operators.suppress",
  intensify: "ABBREW.Operators.intensify"
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
  },
  suffering: {
    name: "ABBREW.Wounds.suffering",
    lingeringWounds: ["pain"],
    concepts: ["pain"]
  },
  pain: {
    name: "ABBREW.Wounds.pain",
    lingeringWounds: [],
    concepts: ["pain"]
  },
  torment: {
    name: "ABBREW.Wounds.torment",
    lingeringWounds: ["anguish"],
    concepts: ["mind"]
  },
  anguish: {
    name: "ABBREW.Wounds.anguish",
    lingeringWounds: [],
    concepts: ["mind"]
  },
}

ABBREW.acuteWounds = Object.entries(ABBREW.wounds).filter(w => w[1].lingeringWounds.length === 0).map(w => w[0]);

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

const acuteWoundImmunities = [
  { key: "physicalImmunity", value: "ABBREW.Traits.WoundImmunities.physicalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "physical" },
  { key: "vitalImmunity", value: "ABBREW.Traits.WoundImmunities.vitalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "vital" },
  { key: "burnImmunity", value: "ABBREW.Traits.WoundImmunities.burnImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "burn" },
  { key: "exhaustionImmunity", value: "ABBREW.Traits.WoundImmunities.exhaustionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "exhaustion" },
  { key: "terrorImmunity", value: "ABBREW.Traits.WoundImmunities.terrorImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "terror" },
  { key: "rageImmunity", value: "ABBREW.Traits.WoundImmunities.rageImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "rage" },
  { key: "mutationImmunity", value: "ABBREW.Traits.WoundImmunities.mutationImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "mutation" },
  { key: "corruptionImmunity", value: "ABBREW.Traits.WoundImmunities.corruptionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "corruption" }
]

const skillTraining = [
  { key: "attackBaseTraining", value: "ABBREW.Traits.SkillTraining.attackBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "attack" },
  { key: "finisherBaseTraining", value: "ABBREW.Traits.SkillTraining.finisherBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "finisher" },
  { key: "feintBaseTraining", value: "ABBREW.Traits.SkillTraining.feintBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "feint" },
  { key: "parryBaseTraining", value: "ABBREW.Traits.SkillTraining.parryBase", feature: "skillTraining", subFeature: "defensiveSkills", effect: "base", data: "parry" },
  { key: "overpowerBaseTraining", value: "ABBREW.Traits.SkillTraining.overpowerBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "overpower" },
  { key: "attackTraining", value: "ABBREW.Traits.SkillTraining.attack", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "attack" },
  { key: "finisherTraining", value: "ABBREW.Traits.SkillTraining.finisher", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "finisher" },
  { key: "overpowerTraining", value: "ABBREW.Traits.SkillTraining.overpower", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "overpower" },
  { key: "feintTraining", value: "ABBREW.Traits.SkillTraining.feint", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "feint" },
  { key: "parryTraining", value: "ABBREW.Traits.SkillTraining.parry", feature: "skillTraining", subFeature: "defensiveSkills", effect: "increase", data: "parry" },
  { key: "feintCounterTraining", value: "ABBREW.Traits.SkillTraining.feintCounter", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "feintCounter" },
  { key: "parryCounterTraining", value: "ABBREW.Traits.SkillTraining.parryCounter", feature: "skillTraining", subFeature: "defensiveSkills", effect: "increase", data: "parryCounter" }
]

ABBREW.traits = [
  ...acuteWoundImmunities,
  ...lingeringWoundImmunities,
  ...skillTraining,
]

ABBREW.attackModes = {
  "attack": "ABBREW.AttackModes.attack",
  "feint": "ABBREW.AttackModes.feint",
  "overpower": "ABBREW.AttackModes.overpower",
  "finisher": "ABBREW.AttackModes.finisher"
}

ABBREW.modify = {
  "skip": "Skip",
  "all": "Modify All",
  "one": "Modify One",
  "add": "Add"
}

ABBREW.fundamentalAttackSkills = {
  "attack": { id: "abbrewAttack0000", name: "Attack", image: "systems/abbrew/assets/icons/skills/attack.svg" },
  "parry": { id: "abbrewParry00000", name: "Parry", image: "systems/abbrew/assets/icons/skills/parry.svg" },
  "feint": { id: "abbrewFeint00000", name: "Feint", image: "systems/abbrew/assets/icons/skills/feint.svg" },
  "finisher": { id: "abbrewFinisher00", name: "Finisher", image: "systems/abbrew/assets/icons/skills/finisher.svg" },
  "overpower": { id: "abbrewOverpower0", name: "Parry", image: "systems/abbrew/assets/icons/skills/overpower.svg" },
}

ABBREW.fundamentalAttributeSkillIds = [
  "abbrewStrCheck00",
  "abbrewDexCheck00",
  "abbrewAgiCheck00",
  "abbrewConCheck00",
  "abbrewIntCheck00",
  "abbrewWitCheck00",
  "abbrewVisCheck00",
  "abbrewWilCheck00"
]

ABBREW.fundamentalAttributeSkillMap = {
  "str": { id: "abbrewStrCheck00", name: "Strength Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "str" },
  "dex": { id: "abbrewDexCheck00", name: "Dexterity Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "dex" },
  "agi": { id: "abbrewAgiCheck00", name: "Agility Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "agi" },
  "con": { id: "abbrewConCheck00", name: "Constitution Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "con" },
  "int": { id: "abbrewIntCheck00", name: "Intelligence Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "int" },
  "wit": { id: "abbrewWitCheck00", name: "Wisdom Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wit" },
  "vis": { id: "abbrewVisCheck00", name: "Visualisation Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "vis" },
  "wil": { id: "abbrewWilCheck00", name: "Will Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wil" },
}

ABBREW.fundamentalAttributeSkills = {
  "abbrewStrCheck00": { id: "abbrewStrCheck00", name: "Strength Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "str" },
  "abbrewDexCheck00": { id: "abbrewDexCheck00", name: "Dexterity Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "dex" },
  "abbrewAgiCheck00": { id: "abbrewAgiCheck00", name: "Agility Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "agi" },
  "abbrewConCheck00": { id: "abbrewConCheck00", name: "Constitution Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "con" },
  "abbrewIntCheck00": { id: "abbrewIntCheck00", name: "Intelligence Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "int" },
  "abbrewWitCheck00": { id: "abbrewWitCheck00", name: "Wisdom Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wit" },
  "abbrewVisCheck00": { id: "abbrewVisCheck00", name: "Visualisation Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "vis" },
  "abbrewWilCheck00": { id: "abbrewWilCheck00", name: "Will Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wil" },
}

ABBREW.fundamentalAttributeSkillSummaries = [
  { id: "abbrewStrCheck00", value: "Strength Check", sourceId: "Compendium.abbrew.skills.Item.abbrewStrCheck00" },
  { id: "abbrewDexCheck00", value: "Dexterity Check", sourceId: "Compendium.abbrew.skills.Item.abbrewDexCheck00" },
  { id: "abbrewAgiCheck00", value: "Agility Check", sourceId: "Compendium.abbrew.skills.Item.abbrewAgiCheck00" },
  { id: "abbrewConCheck00", value: "Constitution Check", sourceId: "Compendium.abbrew.skills.Item.abbrewConCheck00" },
  { id: "abbrewIntCheck00", value: "Intelligence Check", sourceId: "Compendium.abbrew.skills.Item.abbrewIntCheck00" },
  { id: "abbrewWitCheck00", value: "Wisdom Check", sourceId: "Compendium.abbrew.skills.Item.abbrewWitCheck00" },
  { id: "abbrewVisCheck00", value: "Visualisation Check", sourceId: "Compendium.abbrew.skills.Item.abbrewVisCheck00" },
  { id: "abbrewWilCheck00", value: "Will Check", sourceId: "Compendium.abbrew.skills.Item.abbrewWilCheck00" }
]

ABBREW.fundamentalAttackSkillSummaries = [
  { id: "abbrewAttack0000", value: "Attack", sourceId: "Compendium.abbrew.skills.Item.abbrewAttack0000" },
  { id: "abbrewParry00000", value: "Parry", sourceId: "Compendium.abbrew.skills.Item.abbrewParry00000" },
  { id: "abbrewFeint00000", value: "Feint", sourceId: "Compendium.abbrew.skills.Item.abbrewFeint00000" },
  { id: "abbrewFinisher00", value: "Finisher", sourceId: "Compendium.abbrew.skills.Item.abbrewFinisher00" },
  { id: "abbrewOverpower0", value: "Overpower", sourceId: "Compendium.abbrew.skills.Item.abbrewOverpower0" }
]

ABBREW.fundamentalSkillSummaries = [
  ...ABBREW.fundamentalAttackSkillSummaries,
  ...ABBREW.fundamentalAttributeSkillSummaries
]

ABBREW.modifierPrefixes = {
  "numeric": "ABBREW.ModifierPrefixes.numeric",
  "actor": "ABBREW.ModifierPrefixes.actor",
  "item": "ABBREW.ModifierPrefixes.item",
  "this": "ABBREW.ModifierPrefixes.this",
  "resource": "ABBREW.ModifierPrefixes.resource",
  "damagelastDealt": "ABBREW.ModifierPrefixes.damageLastDealt",
  "damagelastReceived": "ABBREW.ModifierPrefixes.damageLastReceived",
  "damageroundReceived": "ABBREW.ModifierPrefixes.damageRoundReceived",
}

ABBREW.checkTypes = {
  "successes": "ABBREW.CheckTypes.successes",
  "result": "ABBREW.CheckTypes.result"
}