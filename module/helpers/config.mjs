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
  combat: { label: "ABBREW.Durations.combat", value: -2 },
  permanent: { label: "ABBREW.Durations.permanent", value: -1 }
}

ABBREW.durationsLabels = {
  instant: "ABBREW.Durations.instant",
  second: "ABBREW.Durations.second",
  turn: "ABBREW.Durations.turn",
  round: "ABBREW.Durations.round",
  minute: "ABBREW.Durations.minute",
  hour: "ABBREW.Durations.hour",
  combat: "ABBREW.Durations.combat",
  day: "ABBREW.Durations.day"
}

ABBREW.size = {
  fine: { label: "ABBREW.size.fine", value: -4, dimension: 0.5 },
  diminutive: { label: "ABBREW.size.diminutive", value: -3, dimension: 0.5 },
  tiny: { label: "ABBREW.size.tiny", value: -2, dimension: 0.5 },
  small: { label: "ABBREW.size.small", value: -1, dimension: 0.5 },
  standard: { label: "ABBREW.size.standard", value: 0, dimension: 1 },
  large: { label: "ABBREW.size.large", value: 1, dimension: 2 },
  huge: { label: "ABBREW.size.huge", value: 2, dimension: 3 },
  gargantuan: { label: "ABBREW.size.gargantuan", value: 3, dimension: 4 },
  colossal: { label: "ABBREW.size.colossal", value: 4, dimension: 5 }
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
  decay: {
    name: "ABBREW.Wounds.decay",
    lingeringWounds: ["necrotic"],
    concepts: ["death"]
  },
  necrotic: {
    name: "ABBREW.Wounds.necrotic",
    lingeringWounds: [],
    concepts: ["death"]
  }
}

ABBREW.acuteWounds = Object.entries(ABBREW.wounds).filter(w => w[1].lingeringWounds.length === 0).map(w => w[0]);
ABBREW.lingeringWounds = Object.entries(ABBREW.wounds).filter(w => w[1].lingeringWounds.length > 0).map(w => w[0]);

ABBREW.conditions = {
  dead: {
    id: "abbrewCDead00000",
    name: "ABBREW.EFFECT.Condition.Dead.name",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "ABBREW.EFFECT.Condition.Dead.description",
    statuses: ['dead', 'defeated']
  },
  defeated: {
    id: "abbrewCDefeated0",
    name: "ABBREW.EFFECT.Condition.Defeated.name",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    description: "ABBREW.EFFECT.Condition.Defeated.description",
    statuses: ['defeated']
  },
  disoriented: {
    id: "abbrewCDisorient",
    name: "ABBREW.EFFECT.Condition.disoriented.name",
    img: "systems/abbrew/assets/icons/statuses/disoriented.svg",
    description: "ABBREW.EFFECT.Condition.Disoriented.description",
    statuses: ['disoriented']
  },
  guardBreak: {
    id: "abbrewCGuardBrea",
    name: "ABBREW.EFFECT.Condition.GuardBreak.name",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg",
    description: "ABBREW.EFFECT.Condition.GuardBreak.description",
    statuses: ['offGuard']
  },
  hidden: {
    id: "abbrewCHidden000",
    name: "ABBREW.EFFECT.Condition.Hidden.name",
    img: "systems/abbrew/assets/icons/statuses/hidden.svg",
    description: "ABBREW.EFFECT.Condition.Hidden.description",
    statuses: ['offGuard']
  },
  offGuard: {
    id: "abbrewCOffGuard0",
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
    polarity: "negative",
    order: 2,
    statuses: ['defeated']
  },
  defeated: {
    name: "ABBREW.EFFECT.Status.defeated",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    description: "You resolve buckles as you are unable to continue the fight.",
    polarity: "negative",
    special: "DEFEATED",
    order: 1
  },
  disoriented: {
    name: "ABBREW.EFFECT.Status.disoriented",
    img: "systems/abbrew/assets/icons/statuses/disoriented.svg",
    description: "You have been disoriented, you cannot restore guard nor parry while you have this condition.",
    polarity: "negative"
  },
  guardBreak: {
    name: "ABBREW.EFFECT.Status.guardBreak",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg",
    description: "Your guard is broken, your foes can directly capitalise on your weakpoints. You can be targeted by finishers.",
    polarity: "negative"
  },
  hidden: {
    name: "ABBREW.EFFECT.Status.hidden",
    img: "systems/abbrew/assets/icons/statuses/hidden.svg",
    description: "You are hidden from your foes and can not be targeted directly, treat any creature hidden from you as Off Guard; if you were previously detected (or your presence becomes known) they can attempt to locate you with a Scan Check.",
    polarity: "positive"
  },
  offGuard: {
    name: "ABBREW.EFFECT.Status.offGuard",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "Your are harried and your guard compromised, your foes can directly capitalise on your weakpoints. You can be targeted by finishers.",
    polarity: "negative"
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
  { key: "sinImmunity", value: "ABBREW.Traits.WoundImmunities.sinImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "sin" },
  { key: "decayImmunity", value: "ABBREW.Traits.WoundImmunities.decayImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "decay" }
]

const acuteWoundImmunities = [
  { key: "physicalImmunity", value: "ABBREW.Traits.WoundImmunities.physicalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "physical" },
  { key: "vitalImmunity", value: "ABBREW.Traits.WoundImmunities.vitalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "vital" },
  { key: "burnImmunity", value: "ABBREW.Traits.WoundImmunities.burnImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "burn" },
  { key: "exhaustionImmunity", value: "ABBREW.Traits.WoundImmunities.exhaustionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "exhaustion" },
  { key: "terrorImmunity", value: "ABBREW.Traits.WoundImmunities.terrorImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "terror" },
  { key: "rageImmunity", value: "ABBREW.Traits.WoundImmunities.rageImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "rage" },
  { key: "mutationImmunity", value: "ABBREW.Traits.WoundImmunities.mutationImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "mutation" },
  { key: "corruptionImmunity", value: "ABBREW.Traits.WoundImmunities.corruptionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "corruption" },
  { key: "necroticImmunity", value: "ABBREW.Traits.WoundImmunities.necroticImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "necrotic" }
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

const generalTraits = [
  { key: "detection", value: "ABBREW.Traits.General.detection", feature: "detection", subFeature: "", effect: "", data: "" },
  { key: "disease", value: "ABBREW.Traits.General.disease", feature: "type", subFeature: "", effect: "", data: "" },
  { key: "poison", value: "ABBREW.Traits.General.poison", feature: "type", subFeature: "", effect: "", data: "" },
  { key: "stance", value: "ABBREW.Traits.General.stance", feature: "combat", subFeature: "", effect: "", data: "" }
]

ABBREW.traits = [
  ...generalTraits,
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
  "wit": { id: "abbrewWitCheck00", name: "Wits Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wit" },
  "vis": { id: "abbrewVisCheck00", name: "Visualisation Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "vis" },
  "wil": { id: "abbrewWilCheck00", name: "Will Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wil" },
}

ABBREW.fundamentalAttributeSkills = {
  "abbrewStrCheck00": { id: "abbrewStrCheck00", name: "Strength Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "str" },
  "abbrewDexCheck00": { id: "abbrewDexCheck00", name: "Dexterity Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "dex" },
  "abbrewAgiCheck00": { id: "abbrewAgiCheck00", name: "Agility Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "agi" },
  "abbrewConCheck00": { id: "abbrewConCheck00", name: "Constitution Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "con" },
  "abbrewIntCheck00": { id: "abbrewIntCheck00", name: "Intelligence Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "int" },
  "abbrewWitCheck00": { id: "abbrewWitCheck00", name: "Wits Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wit" },
  "abbrewVisCheck00": { id: "abbrewVisCheck00", name: "Visualisation Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "vis" },
  "abbrewWilCheck00": { id: "abbrewWilCheck00", name: "Will Check", image: "systems/abbrew/assets/icons/skills/attribute.svg", attribute: "wil" },
}

ABBREW.fundamentalAttributeSkillSummaries = [
  { id: "abbrewStrCheck00", value: "Strength Check", sourceId: "Compendium.abbrew.skills.Item.abbrewStrCheck00" },
  { id: "abbrewDexCheck00", value: "Dexterity Check", sourceId: "Compendium.abbrew.skills.Item.abbrewDexCheck00" },
  { id: "abbrewAgiCheck00", value: "Agility Check", sourceId: "Compendium.abbrew.skills.Item.abbrewAgiCheck00" },
  { id: "abbrewConCheck00", value: "Constitution Check", sourceId: "Compendium.abbrew.skills.Item.abbrewConCheck00" },
  { id: "abbrewIntCheck00", value: "Intelligence Check", sourceId: "Compendium.abbrew.skills.Item.abbrewIntCheck00" },
  { id: "abbrewWitCheck00", value: "Wits Check", sourceId: "Compendium.abbrew.skills.Item.abbrewWitCheck00" },
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
  "wound": "ABBREW.ModifierPrefixes.wound",
  "condition": "ABBREW.ModifierPrefixes.condition",
  "statustype": "ABBREW.ModifierPrefixes.statusType",
  "resource": "ABBREW.ModifierPrefixes.resource",
  "damagelastDealt": "ABBREW.ModifierPrefixes.damageLastDealt",
  "damagelastReceived": "ABBREW.ModifierPrefixes.damageLastReceived",
  "damageroundReceived": "ABBREW.ModifierPrefixes.damageRoundReceived",
  "skillCount": "ABBREW.ModifierPrefixes.skillCount",
  "dialog": "ABBREW.ModifierPrefixes.dialog",
  "async": "ABBREW.ModifierPrefixes.async"
}

ABBREW.checkTypes = {
  "successes": "ABBREW.CheckTypes.successes",
  "result": "ABBREW.CheckTypes.result"
}

ABBREW.allDamage = { all: { label: "ABBREW.DamageTypes.all" } };

ABBREW.damageTypes = {
  untyped: { label: "ABBREW.DamageTypes.untyped" },
  crushing: { label: "ABBREW.DamageTypes.crushing", },
  piercing: { label: "ABBREW.DamageTypes.piercing", },
  slashing: { label: "ABBREW.DamageTypes.slashing", },
  life: { label: "ABBREW.DamageTypes.life", },
  death: { label: "ABBREW.DamageTypes.death", },
  fire: { label: "ABBREW.DamageTypes.fire", },
  cold: { label: "ABBREW.DamageTypes.cold", },
  electric: { label: "ABBREW.DamageTypes.electric", },
  acid: { label: "ABBREW.DamageTypes.acid", },
  poison: { label: "ABBREW.DamageTypes.poison", },
  dark: { label: "ABBREW.DamageTypes.dark", },
  light: { label: "ABBREW.DamageTypes.light", },
  pain: { label: "ABBREW.DamageTypes.pain", },
  emotion: { label: "ABBREW.DamageTypes.emotion", },
  psychic: { label: "ABBREW.DamageTypes.psychic" }
}

ABBREW.roles = {
  melee: { label: "ABBREW.Roles.Name.melee", value: "melee", description: "ABBREW.Roles.Description.melee" },
  ranged: { label: "ABBREW.Roles.Name.ranged", value: "ranged", description: "ABBREW.Roles.Description.ranged" },
  martial: { label: "ABBREW.Roles.Name.martial", value: "martial", description: "ABBREW.Roles.Description.martial" },
  magic: { label: "ABBREW.Roles.Name.magic", value: "magic", description: "ABBREW.Roles.Description.magic" },
  face: { label: "ABBREW.Roles.Name.face", value: "face", description: "ABBREW.Roles.Description.face" },
  crafter: { label: "ABBREW.Roles.Name.crafter", value: "crafter", description: "ABBREW.Roles.Description.crafter" },
  vanguard: { label: "ABBREW.Roles.Name.vanguard", value: "vanguard", description: "ABBREW.Roles.Description.vanguard" },
  protector: { label: "ABBREW.Roles.Name.protector", value: "protector", description: "ABBREW.Roles.Description.protector" },
  healer: { label: "ABBREW.Roles.Name.healer", value: "healer", description: "ABBREW.Roles.Description.healer" },
  honourbound: { label: "ABBREW.Roles.Name.honourbound", value: "honourbound", description: "ABBREW.Roles.Description.honourbound" },
  scoundrel: { label: "ABBREW.Roles.Name.scoundrel", value: "scoundrel", description: "ABBREW.Roles.Description.scoundrel" },
  acolyte: { label: "ABBREW.Roles.Name.acolyte", value: "acolyte", description: "ABBREW.Roles.Description.acolyte" },
  bound: { label: "ABBREW.Roles.Name.bound", value: "bound", description: "ABBREW.Roles.Description.bound" },
  director: { label: "ABBREW.Roles.Name.director", value: "director", description: "ABBREW.Roles.Description.director" },
  innerpower: { label: "ABBREW.Roles.Name.innerpower", value: "innerpower", description: "ABBREW.Roles.Description.innerpower" },
  implement: { label: "ABBREW.Roles.Name.implement", value: "implement", description: "ABBREW.Roles.Description.implement" },
  style: { label: "ABBREW.Roles.Name.style", value: "style", description: "ABBREW.Roles.Description.style" },
  durable: { label: "ABBREW.Roles.Name.durable", value: "durable", description: "ABBREW.Roles.Description.durable" },
  professional: { label: "ABBREW.Roles.Name.professional", value: "professional", description: "ABBREW.Roles.Description.professional" }
}

ABBREW.universalPath = { label: "ABBREW.Paths.Name.universal", id: "abbrewpuniversal", value: "universal", roles: [], description: "ABBREW.Paths.Description.universal" };

ABBREW.paths = [
  { label: "ABBREW.Paths.Name.fenceroflostbriarith", id: "abbrewpfelopb000", value: "fenceroflostbriarith", roles: ["melee", "martial", "vanguard"], description: "ABBREW.Paths.Description.fenceroflostbriarith" },
  { label: "ABBREW.Paths.Name.divineadherent", id: "abbrewpdivadh000", value: "divineadherent", roles: ["acolyte", "magic", "melee", "ranged"], description: "ABBREW.Paths.Description.divineadherent" },
  { label: "ABBREW.Paths.Name.poisoner", id: "abbrewppoisoner0", value: "poisoner", roles: ["professional", "scoundrel"], description: "ABBREW.Paths.Description.poisoner" },
  { label: "ABBREW.Paths.Name.shieldguardian", id: "abbrewpshieldgua", value: "shieldguardian", roles: ["martial", "melee", "protector", "durable"], description: "ABBREW.Paths.Description.shieldguardian" },
  { label: "ABBREW.Paths.Name.snake", id: "abbrewpsnake0000", value: "snake", roles: ["martial", "melee", "ranges", "scoundrel"], description: "ABBREW.Paths.Description.snake" },
]

ABBREW.activeEffectKeys = [
  { value: "system.defense.guard.max", label: "ABBREW.ActiveEffectKeys.guardMax" },
  { value: "system.defense.protection.all.reduction", label: "ABBREW.ActiveEffectKeys.allReduction" },
  { value: "system.defense.protection.all.weakness", label: "ABBREW.ActiveEffectKeys.allWeakness" },
  { value: "system.defense.protection.crushing.reduction", label: "ABBREW.ActiveEffectKeys.crushingReduction" },
  { value: "system.defense.protection.crushing.weakness", label: "ABBREW.ActiveEffectKeys.crushingWeakness" },
  { value: "system.defense.protection.piercing.reduction", label: "ABBREW.ActiveEffectKeys.piercingReduction" },
  { value: "system.defense.protection.piercing.weakness", label: "ABBREW.ActiveEffectKeys.piercingWeakness" },
  { value: "system.defense.protection.slashing.reduction", label: "ABBREW.ActiveEffectKeys.slashingReduction" },
  { value: "system.defense.protection.slashing.weakness", label: "ABBREW.ActiveEffectKeys.slashingWeakness" },
  { value: "system.modifiers.initiative", label: "ABBREW.ActiveEffectKeys.initiativeBonus" },
  { value: "system.movement.baseSpeed", label: "ABBREW.ActiveEffectKeys.baseSpeed" }
]