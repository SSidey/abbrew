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

ABBREW.durationSteps = {
  0: { label: "ABBREW.Durations.instant", value: 0, valueSteps: [0] },
  1: { label: "ABBREW.Durations.second", value: 1, valueSteps: [1] },
  2: { label: "ABBREW.Durations.turn", value: 0.01, valueSteps: [1] },
  3: { label: "ABBREW.Durations.round", value: 6, valueSteps: Array.from({ length: 9 }, (_, i) => i + 1) },
  4: { label: "ABBREW.Durations.minute", value: 60, valueSteps: [1, 10, 30, 60] },
  5: { label: "ABBREW.Durations.combat", value: -2, valueSteps: [1] },
  6: { label: "ABBREW.Durations.hour", value: 3600, valuesSteps: Array.from({ length: 24 }, (_, i) => i + 1) },
  7: { label: "ABBREW.Durations.day", value: 86400, valueSteps: [1] },
  8: { label: "ABBREW.Durations.permanent", value: -1, valueSteps: [0] }
}

ABBREW.durationsLabels = {
  instant: "ABBREW.Durations.instant",
  second: "ABBREW.Durations.second",
  turn: "ABBREW.Durations.turn",
  round: "ABBREW.Durations.round",
  minute: "ABBREW.Durations.minute",
  hour: "ABBREW.Durations.hour",
  combat: "ABBREW.Durations.combat",
  day: "ABBREW.Durations.day",
  recover: "ABBREW.Durations.recover",
  rest: "ABBREW.Durations.rest",
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
  intensify: "ABBREW.Operators.intensify",
  immunity: "ABBREW.Operators.immunity"
}

ABBREW.enhancementOperators = {
  ...ABBREW.simpleOperators,
  merge: "ABBREW.Operators.merge",
  split: "ABBREW.Operators.split"
}

ABBREW.Defense = {
  guard: 'ABBREW.Defense.guard'
}

ABBREW.equipPoints = {
  label: "ABBREW.EquipPoints.label",
  points: {
    head: "ABBREW.EquipPoints.Points.head",
    torso: "ABBREW.EquipPoints.Points.torso",
    arm: "ABBREW.EquipPoints.Points.arm",
    leg: "ABBREW.EquipPoints.Points.leg",
    tail: "ABBREW.EquipPoints.Points.tail",
    wing: "ABBREW.EquipPoints.Points.wing",
    attachment: "ABBREW.EquipPoints.Points.attachment"
  }
}

ABBREW.concepts = {
  esoteric: "ABBREW.Concepts.esoteric",
  physical: "ABBREW.Concepts.physical",
  crushing: "ABBREW.Concepts.crushing",
  piercing: "ABBREW.Concepts.piercing",
  slashing: "ABBREW.Concepts.slashing",
  fire: "ABBREW.Concepts.fire",
  cold: "ABBREW.Concepts.cold",
  water: "ABBREW.Concepts.water",
  earth: "ABBREW.Concepts.earth",
  air: "ABBREW.Concepts.air",
  electricity: "ABBREW.Concepts.electricity",
  poison: "ABBREW.Concepts.poison",
  flesh: "ABBREW.Concepts.flesh",
  blood: "ABBREW.Concepts.blood",
  metal: "ABBREW.Concepts.metal",
  light: "ABBREW.Concepts.light",
  dark: "ABBREW.Concepts.dark",
  life: "ABBREW.Concepts.life",
  death: "ABBREW.Concepts.death",
  war: "ABBREW.Concepts.war",
  famine: "ABBREW.Concepts.famine",
  pestilence: "ABBREW.Concepts.pestilence",
  conquest: "ABBREW.Concepts.conquest",
  rage: "ABBREW.Concepts.rage",
  fear: "ABBREW.Concepts.fear"
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
  static: "ABBREW.AttackTypes.static",
  thrown: "ABBREW.AttackTypes.thrown",
  ranged: "ABBREW.AttackTypes.ranged"
}

ABBREW.reloadTypes = {
  reload: "ABBREW.ReloadType.reload",
  draw: "ABBREW.ReloadType.draw"
}

ABBREW.ammunitionTypes = {
  shot: "ABBREW.AmmunitionType.shot",
  arrow: "ABBREW.AmmunitionType.arrow",
  bolt: "ABBREW.AmmunitionType.bolt",
  bullet: "ABBREW.AmmunitionType.bullet",
  cell: "ABBREW.AmmunitionType.cell"
}

ABBREW.equipState = {
  held: {
    held1H: "ABBREW.EquipState.heldOne",
    held2H: "ABBREW.EquipState.heldTwo",
    stowed: "ABBREW.EquipState.stowed",
    dropped: "ABBREW.EquipState.dropped"
  },
  worn: {
    worn: "ABBREW.EquipState.worn",
    stowed: "ABBREW.EquipState.stowed",
    dropped: "ABBREW.EquipState.dropped"
  },
  innate: {
    active: "ABBREW.EquipState.active",
    inactive: "ABBREW.EquipState.inactive"
  },
  none: {
    stowed: "ABBREW.EquipState.stowed",
    dropped: "ABBREW.EquipState.dropped"
  }
}

ABBREW.equipStateChange = {
  held1H: "ABBREW.EquipStateChange.heldOne",
  held2H: "ABBREW.EquipStateChange.heldTwo",
  worn: "ABBREW.EquipStateChange.worn",
  stowed: "ABBREW.EquipStateChange.stowed",
  dropped: "ABBREW.EquipStateChange.dropped",
  active: "ABBREW.EquipStateChange.active",
  inactive: "ABBREW.EquipStateChange.inactive",
  readied: "ABBREW.EquipStateChange.readied"
}

ABBREW.skillTypes = {
  basic: "ABBREW.SkillTypes.basic",
  path: "ABBREW.SkillTypes.path",
  archetype: "ABBREW.SkillTypes.archetype",
  resource: "ABBREW.SkillTypes.resource",
  temporary: "ABBREW.SkillTypes.temporary",
  untyped: "ABBREW.SkillTypes.untyped",
  background: "ABBREW.SkillTypes.background",
  tier: "ABBREW.SkillTypes.tier",
  grantModifier: "ABBREW.SkillTypes.grantModifier",
  item: "ABBREW.SkillTypes.item"
}

ABBREW.actionCosts = {
  passive: "ABBREW.ActionCosts.passive",
  one: "ABBREW.ActionCosts.one",
  two: "ABBREW.ActionCosts.two",
  three: "ABBREW.ActionCosts.three",
  reaction: "ABBREW.ActionCosts.reaction",
  other: "ABBREW.ActionCosts.other"
}

ABBREW.reach = {
  0: "ABBREW.Reach.none",
  1: "ABBREW.Reach.close",
  1: "ABBREW.Reach.short",
  2: "ABBREW.Reach.standard",
  3: "ABBREW.Reach.long"
}

ABBREW.skillAffects = {
  0: "ABBREW.SkillAffects.none",
  1: "ABBREW.SkillAffects.enemies",
  2: "ABBREW.SkillAffects.alliesExclusive",
  3: "ABBREW.SkillAffects.alliesInclusive",
  4: "ABBREW.SkillAffects.all",
  5: "ABBREW.SkillAffects.source"
}

ABBREW.emanationDimension = {
  0: "ABBREW.EmanationDimension.grid",
  1: "ABBREW.EmanationDimension.spaces",
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
  },
  hunger: {
    name: "ABBREW.Wounds.hunger",
    lingeringWounds: ["starvation"],
    concepts: ["famine"]
  },
  starvation: {
    name: "ABBREW.Wounds.starvation",
    lingeringWounds: [],
    concepts: ["famine"]
  }
}

ABBREW.acuteWounds = Object.entries(ABBREW.wounds).filter(w => w[1].lingeringWounds.length === 0).map(w => w[0]);
ABBREW.lingeringWounds = Object.entries(ABBREW.wounds).filter(w => w[1].lingeringWounds.length > 0).map(w => w[0]);

ABBREW.conditions = {
  blind: {
    id: "abbrewCBlind0000",
    name: "ABBREW.EFFECT.Condition.Blind.name",
    img: "systems/abbrew/assets/icons/statuses/blind.svg",
    description: "ABBREW.EFFECT.Condition.Blind.description",
    statuses: ['blind']
  },
  dead: {
    id: "abbrewCDead00000",
    name: "ABBREW.EFFECT.Condition.Dead.name",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "ABBREW.EFFECT.Condition.Dead.description",
    statuses: ['dead', 'defeated', 'prone', 'blind', 'deaf', 'mute']
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
    name: "ABBREW.EFFECT.Condition.Disoriented.name",
    img: "systems/abbrew/assets/icons/statuses/disoriented.svg",
    description: "ABBREW.EFFECT.Condition.Disoriented.description",
    statuses: ['disoriented']
  },
  distracted: {
    id: "abbrewCDistracte",
    name: "ABBREW.EFFECT.Condition.Distracted.name",
    img: "systems/abbrew/assets/icons/statuses/distracted.svg",
    description: "ABBREW.EFFECT.Condition.Distracted.description",
    statuses: ['distracted']
  },
  grabbed: {
    id: "abbrewCGrabbed00",
    name: "ABBREW.EFFECT.Condition.Grabbed.name",
    img: "systems/abbrew/assets/icons/statuses/grabbed.svg",
    description: "ABBREW.EFFECT.Condition.Grabbed.description",
    statuses: ['offGuard']
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
    statuses: ['hidden']
  },
  immobilised: {
    id: "abbrewCImmobilis",
    name: "ABBREW.EFFECT.Condition.Immobilised.name",
    img: "systems/abbrew/assets/icons/statuses/immobilised.svg",
    description: "ABBREW.EFFECT.Condition.Immobilised.description",
    statuses: ['immobilised']
  },
  offGuard: {
    id: "abbrewCOffGuard0",
    name: "ABBREW.EFFECT.Condition.OffGuard.name",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "ABBREW.EFFECT.Condition.OffGuard.description",
    statuses: ['offGuard']
  },
  prone: {
    id: "abbrewCProne0000",
    name: "ABBREW.EFFECT.Condition.Prone.name",
    img: "systems/abbrew/assets/icons/statuses/prone.svg",
    description: "ABBREW.EFFECT.Condition.Prone.description",
    statuses: ['offGuard']
  },
  staggered: {
    id: "abbrewCStaggered",
    name: "ABBREW.EFFECT.Condition.Staggered.name",
    img: "systems/abbrew/assets/icons/statuses/staggered.svg",
    description: "ABBREW.EFFECT.Condition.Staggered.description",
    statuses: ['staggered']
  },
  threatened: {
    id: "abbrewCThreatene",
    name: "ABBREW.EFFECT.Condition.Threatened.name",
    img: "systems/abbrew/assets/icons/statuses/threatened.svg",
    description: "ABBREW.EFFECT.Condition.Threatened.description",
    statuses: ['threatened']
  },
  unconscious: {
    id: "abbrewCUnconscio",
    name: "ABBREW.EFFECT.Condition.Unconscious.name",
    img: "systems/abbrew/assets/icons/statuses/unconscious.svg",
    description: "ABBREW.EFFECT.Condition.Unconscious.description",
    statuses: ['offGuard', 'prone', 'blind']
  }
}

ABBREW.statusEffects = {
  blind: {
    name: "ABBREW.EFFECT.Status.blind",
    img: "systems/abbrew/assets/icons/statuses/blind.svg",
    description: "You are blinded. If sight is your only primary sense, everything is unobserved to you. You can not use a skill that relies on a target. Your movement is halved.",
    polarity: "negative",
    special: "BLIND",
    order: 2,
  },
  dead: {
    name: "ABBREW.EFFECT.Status.dead",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "You have suffered fatal wounds, resulting in death.",
    polarity: "negative",
    order: 2,
    statuses: ['defeated']
  },
  deaf: {
    name: "ABBREW.EFFECT.Status.deaf",
    img: "systems/abbrew/assets/icons/statuses/deaf.svg",
    description: "Your hearing has been damaged.",
    polarity: "negative",
    order: 2,
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
    description: "You have been disoriented, leaving you unable to use the restore guard, parry and dodge skills.",
    polarity: "negative"
  },
  distracted: {
    name: "ABBREW.EFFECT.Status.distracted",
    img: "systems/abbrew/assets/icons/statuses/distracted.svg",
    description: "You have been distracted, at the end of each of your turns while you have this condition, your risk increases by 10 per stack.",
    olarity: "negative"
  },
  grabbed: {
    name: "ABBREW.EFFECT.Status.grabbed",
    img: "systems/abbrew/assets/icons/statuses/grabbed.svg",
    description: "You have been grabbed, you are Off Guard and Immobilised.",
    polarity: "negative",
    statuses: ['offGuard', 'immobilised']
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
  immobilised: {
    name: "ABBREW.EFFECT.Status.immobilised",
    img: "systems/abbrew/assets/icons/statuses/immobilised.svg",
    description: "You are immobilised, your movement speeds (aside from teleportation) are set to 0. If you are restrained by an effect, any other effect that attempts to move you must succeed against the restraining effect.",
    polarity: "negative"
  },
  mute: {
    name: "ABBREW.EFFECT.Status.mute",
    img: "systems/abbrew/assets/icons/statuses/mute.svg",
    description: "You are unable to produce verabal sounds, you are incapable of using any skills with the verbal trait",
    polarity: "negative"
  },
  offGuard: {
    name: "ABBREW.EFFECT.Status.offGuard",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "Your are harried and your guard compromised, your foes can directly capitalise on your weakpoints. You can be targeted by finishers.",
    polarity: "negative"
  },
  prone: {
    name: "ABBREW.EFFECT.Status.prone",
    img: "systems/abbrew/assets/icons/statuses/prone.svg",
    description: "Your are lying flat, face down. Your movement is halved. You are off guard.",
    polarity: "neutral",
    statuses: ['offGuard'],
    special: "PRONE"
  },
  silent: {
    name: "ABBREW.EFFECT.Status.silent",
    img: "systems/abbrew/assets/icons/statuses/silent.svg",
    description: "You cannot be detected by sound.",
    hud: false,
    polarity: "neutral",
  },
  staggered: {
    name: "ABBREW.EFFECT.Status.staggered",
    img: "systems/abbrew/assets/icons/statuses/staggered.svg",
    description: "You are momentarily staggered, leaving you unable to use the restore guard, parry and dodge skills.",
    polarity: "negative",
  },
  threatened: {
    name: "ABBREW.EFFECT.Status.threatened",
    img: "systems/abbrew/assets/icons/statuses/threatened.svg",
    description: "You are threatened by more enemies than you can keep track of. At the end of each of your turns your risk will increase by 10.",
    polarity: "negative",
  },
  unconscious: {
    name: "ABBREW.EFFECT.Status.unconscious",
    img: "systems/abbrew/assets/icons/statuses/unconscious.svg",
    description: "You are unconscious, prone and blinded.",
    polarity: "neutral",
    statuses: ['prone', 'blind']
  }
}

ABBREW.equipTypes = {
  none: "ABBREW.EquipTypes.none",
  held: "ABBREW.EquipTypes.held",
  worn: "ABBREW.EquipTypes.worn",
  innate: "ABBREW.EquipTypes.innate"
}

ABBREW.hands = {
  none: {
    label: "ABBREW.Hands.none",
    filterStates: ["held2H", "held1H"]
  },
  oneHand: {
    label: "ABBREW.Hands.oneHand",
    filterStates: ["held2H"]
  },
  versatile: {
    label: "ABBREW.Hands.versatile",
    filterStates: []
  },
  twoHand: {
    label: "ABBREW.Hands.twoHand",
    filterStates: ["held1H"]
  }
}

ABBREW.enhancementTargetTypes = {
  "weapon": "ABBREW.EnhancementTargetTypes.weapon",
  "armour": "ABBREW.EnhancementTargetTypes.armour",
  "equipment": "ABBREW.EnhancementTargetTypes.equipment",
  "ammunition": "ABBREW.EnhancementTargetTypes.ammunition",
  "physical": "ABBREW.EnhancementTargetTypes.physical",
  "skill": "ABBREW.EnhancementTargetTypes.skill",
  "amp": "ABBREW.EnhancementTargetTypes.amp",
}

ABBREW.enhancementTypes = {
  form: "ABBREW.EnhancementTypes.form",
  material: "ABBREW.EnhancementTypes.material"
}

ABBREW.storageTypes = {
  count: "ABBREW.StorageTypes.count",
  heft: "ABBREW.StorageTypes.heft"
}

ABBREW.affixTypes = {
  "pre": -1,
  "suf": 1
}

ABBREW.adjectiveTypes = {
  "opinion": { order: 1, examples: "amazing, fantastic, brilliant, wonderful, horrible, awful, terrible" },
  "size": { order: 2, examples: "small, big, huge, massive, tall, short, enormous, tiny, large" },
  "physicalQuality": { order: 3, examples: "thick, thin, smooth, blunt, sharp, rought, soft, hard, squishy, solid" },
  "age": { order: 4, examples: "young, old, ancient, mature, teenage, immature, modern" },
  "shape": { order: 5, examples: "square, round, circular, rectangular, oblong, cylindrical, right-angled" },
  "colour": { order: 6, examples: "black, white, blue, red, greeen, yellow, pink, orange, purple" },
  "origin": { order: 7, examples: "English, American etc." },
  "material": { order: 8, examples: "wooden, plastic, metal, cotton, silk, synthetic, gold, leather, glass" },
  "purpose": { order: 9, examples: "cooking, cleaning, scrubbing, polishing, sewing, washing" }
}

ABBREW.nameParts = [
  { key: "barbed", part: "ABBREW.NameParts.barbed", affix: -1, order: 3 },
  { key: "heavy", part: "ABBREW.NameParts.heavy", affix: -1, order: 3 },
  { key: "padded", part: "ABBREW.NameParts.padded", affix: -1, order: 8 },
  { key: "bone", part: "ABBREW.NameParts.bone", affix: -1, order: 8 },
  { key: "cloth", part: "ABBREW.NameParts.cloth", affix: -1, order: 8 },
  { key: "glass", part: "ABBREW.NameParts.glass", affix: -1, order: 8 },
  { key: "hide", part: "ABBREW.NameParts.hide", affix: -1, order: 8 },
  { key: "iron", part: "ABBREW.NameParts.iron", affix: -1, order: 8 },
  { key: "leather", part: "ABBREW.NameParts.leather", affix: -1, order: 8 },
  { key: "oak", part: "ABBREW.NameParts.oak", affix: -1, order: 8 },
  { key: "silver", part: "ABBREW.NameParts.silver", affix: -1, order: 8 },
  { key: "mithril", part: "ABBREW.NameParts.mithril", affix: -1, order: 8 },
  { key: "steel", part: "ABBREW.NameParts.steel", affix: -1, order: 8 },
  { key: "yew", part: "ABBREW.NameParts.yew", affix: -1, order: 8 },
  { key: "chain", part: "ABBREW.NameParts.chain", affix: -1, order: 9 },
  { key: "jack", part: "ABBREW.NameParts.jack", affix: -1, order: 9 },
  { key: "lamellar", part: "ABBREW.NameParts.lamellar", affix: -1, order: 9 },
  { key: "laminar", part: "ABBREW.NameParts.laminar", affix: -1, order: 9 },
  { key: "plate", part: "ABBREW.NameParts.plate", affix: -1, order: 9 },
  { key: "splint", part: "ABBREW.NameParts.splint", affix: -1, order: 9 },
  { key: "fireinfused", part: "ABBREW.NameParts.fireinfused", affix: -1, order: 9 },
  { key: "ofhealing", part: "ABBREW.NameParts.ofhealing", affix: 1, order: 9 },
]

// TODO: Do we even consider these?
const lingeringWoundImmunities = [
  { key: "bleedImmunity", value: "ABBREW.Traits.WoundImmunities.bleedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "bleed", exclude: [] },
  { key: "burningImmunity", value: "ABBREW.Traits.WoundImmunities.burningImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "burning", exclude: [] },
  { key: "fatigueImmunity", value: "ABBREW.Traits.WoundImmunities.fatigueImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "fatigue", exclude: [] },
  { key: "dreadImmunity", value: "ABBREW.Traits.WoundImmunities.dreadImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "dread", exclude: [] },
  { key: "enragedImmunity", value: "ABBREW.Traits.WoundImmunities.enragedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "enraged", exclude: [] },
  { key: "instabilityImmunity", value: "ABBREW.Traits.WoundImmunities.instabilityImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "instability", exclude: [] },
  { key: "sinImmunity", value: "ABBREW.Traits.WoundImmunities.sinImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "sin", exclude: [] },
  { key: "decayImmunity", value: "ABBREW.Traits.WoundImmunities.decayImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "decay", exclude: [] }
]

// TODO: Do we even consider these?
const acuteWoundImmunities = [
  { key: "physicalImmunity", value: "ABBREW.Traits.WoundImmunities.physicalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "physical", exclude: [] },
  { key: "vitalImmunity", value: "ABBREW.Traits.WoundImmunities.vitalImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "vital", exclude: [] },
  { key: "burnImmunity", value: "ABBREW.Traits.WoundImmunities.burnImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "burn", exclude: [] },
  { key: "exhaustionImmunity", value: "ABBREW.Traits.WoundImmunities.exhaustionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "exhaustion", exclude: [] },
  { key: "terrorImmunity", value: "ABBREW.Traits.WoundImmunities.terrorImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "terror", exclude: [] },
  { key: "rageImmunity", value: "ABBREW.Traits.WoundImmunities.rageImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "rage", exclude: [] },
  { key: "mutationImmunity", value: "ABBREW.Traits.WoundImmunities.mutationImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "mutation", exclude: [] },
  { key: "corruptionImmunity", value: "ABBREW.Traits.WoundImmunities.corruptionImmunity", feature: "wound", subFeature: "acute", effect: "immunity", data: "corruption", exclude: [] },
  { key: "necroticImmunity", value: "ABBREW.Traits.WoundImmunities.necroticImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "necrotic", exclude: [] }
]

const skillTraining = [
  { key: "attackBaseTraining", value: "ABBREW.Traits.SkillTraining.attackBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "attack", exclude: [] },
  { key: "finisherBaseTraining", value: "ABBREW.Traits.SkillTraining.finisherBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "finisher", exclude: [] },
  { key: "feintBaseTraining", value: "ABBREW.Traits.SkillTraining.feintBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "feint", exclude: [] },
  { key: "parryBaseTraining", value: "ABBREW.Traits.SkillTraining.parryBase", feature: "skillTraining", subFeature: "defensiveSkills", effect: "base", data: "parry", exclude: [] },
  { key: "overpowerBaseTraining", value: "ABBREW.Traits.SkillTraining.overpowerBase", feature: "skillTraining", subFeature: "offensiveSkills", effect: "base", data: "overpower", exclude: [] },
  { key: "attackTraining", value: "ABBREW.Traits.SkillTraining.attack", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "attack", exclude: [] },
  { key: "finisherTraining", value: "ABBREW.Traits.SkillTraining.finisher", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "finisher", exclude: [] },
  { key: "overpowerTraining", value: "ABBREW.Traits.SkillTraining.overpower", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "overpower", exclude: [] },
  { key: "feintTraining", value: "ABBREW.Traits.SkillTraining.feint", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "feint", exclude: [] },
  { key: "parryTraining", value: "ABBREW.Traits.SkillTraining.parry", feature: "skillTraining", subFeature: "defensiveSkills", effect: "increase", data: "parry", exclude: [] },
  { key: "feintCounterTraining", value: "ABBREW.Traits.SkillTraining.feintCounter", feature: "skillTraining", subFeature: "offensiveSkills", effect: "increase", data: "feintCounter", exclude: [] },
  { key: "parryCounterTraining", value: "ABBREW.Traits.SkillTraining.parryCounter", feature: "skillTraining", subFeature: "defensiveSkills", effect: "increase", data: "parryCounter", exclude: [] },
]

const generalTraits = [
  { key: "detection", value: "ABBREW.Traits.General.detection", feature: "detection", subFeature: "", effect: "", data: "", exclude: [] },
  { key: "disease", value: "ABBREW.Traits.General.disease", feature: "type", subFeature: "", effect: "", data: "", exclude: [] },
  { key: "poison", value: "ABBREW.Traits.General.poison", feature: "type", subFeature: "", effect: "", data: "", exclude: [] },
  { key: "stance", value: "ABBREW.Traits.General.stance", feature: "combat", subFeature: "", effect: "", data: "", exclude: [] }
]

const itemTraits = [
  { key: "armour", value: "ABBREW.Traits.Item.armour", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "weapon", value: "ABBREW.Traits.Item.weapon", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "head", value: "ABBREW.Traits.Item.head", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "torso", value: "ABBREW.Traits.Item.torso", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "arm", value: "ABBREW.Traits.Item.arm", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "leg", value: "ABBREW.Traits.Item.leg", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "shield", value: "ABBREW.Traits.Item.shield", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "melee", value: "ABBREW.Traits.Item.melee", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "ranged", value: "ABBREW.Traits.Item.ranged", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "reload", value: "ABBREW.Traits.Item.reload", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["draw"] },
  { key: "draw", value: "ABBREW.Traits.Item.draw", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["reload"] },
  { key: "close", value: "ABBREW.Traits.Item.close", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["short", "standard", "long"] },
  { key: "short", value: "ABBREW.Traits.Item.short", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["close", "standard", "long"] },
  { key: "standard", value: "ABBREW.Traits.Item.standard", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["close", "short", "long"] },
  { key: "long", value: "ABBREW.Traits.Item.long", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["standard", "long"] },
  { key: "heavy", value: "ABBREW.Traits.Item.heavy", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["agile"] },
  { key: "agile", value: "ABBREW.Traits.Item.agile", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: ["heavy"] },
  { key: "vial", value: "ABBREW.Traits.Item.vial", feature: "item", subFeature: "form", effect: "", data: "", exclude: [] },
  { key: "consumable", value: "ABBREW.Traits.Item.consumable", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "ammunition", value: "ABBREW.Traits.Item.ammunition", feature: "item", subFeature: "identifiers", effect: "", data: "", exclude: [] },
]

const skillTraits = [
  { key: "initiate", value: "ABBREW.Traits.Skill.initiate", feature: "skill", subFeature: "progression", effect: "", data: "", exclude: [] },
  { key: "specialisation", value: "ABBREW.Traits.Skill.specialisation", feature: "skill", subFeature: "progression", effect: "", data: "", exclude: [] },
  { key: "mastery", value: "ABBREW.Traits.Skill.mastery", feature: "skill", subFeature: "progression", effect: "", data: "", exclude: [] },
  { key: "disease", value: "ABBREW.Traits.Skill.disease", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "poison", value: "ABBREW.Traits.Skill.poison", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "untyped", value: "ABBREW.Traits.Skill.untyped", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "crushing", value: "ABBREW.Traits.Skill.crushing", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "piercing", value: "ABBREW.Traits.Skill.piercing", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "slashing", value: "ABBREW.Traits.Skill.slashing", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "life", value: "ABBREW.Traits.Skill.life", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "death", value: "ABBREW.Traits.Skill.death", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "fire", value: "ABBREW.Traits.Skill.fire", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "heat", value: "ABBREW.Traits.Skill.heat", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "cold", value: "ABBREW.Traits.Skill.cold", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "electric", value: "ABBREW.Traits.Skill.electric", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "acid", value: "ABBREW.Traits.Skill.acid", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "dark", value: "ABBREW.Traits.Skill.dark", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "light", value: "ABBREW.Traits.Skill.light", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "pain", value: "ABBREW.Traits.Skill.pain", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "emotion", value: "ABBREW.Traits.Skill.emotion", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "psychic", value: "ABBREW.Traits.Skill.psychic", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "risky", value: "ABBREW.Traits.Skill.risky", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "concentrate", value: "ABBREW.Traits.Skill.concentrate", feature: "skill", subFeature: "activation", effect: "", data: "", exclude: [] },
  { key: "primarySense", value: "ABBREW.Traits.Skill.primarySense", feature: "skill", subFeature: "senses", effect: "", data: "", exclude: [] },
  { key: "secondarySense", value: "ABBREW.Traits.Skill.secondarySense", feature: "skill", subFeature: "senses", effect: "", data: "", exclude: [] },
  { key: "tertiarySense", value: "ABBREW.Traits.Skill.tertiarySense", feature: "skill", subFeature: "senses", effect: "", data: "", exclude: [] },
  { key: "verbal", value: "ABBREW.Traits.Skill.verbal", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "visual", value: "ABBREW.Traits.Skill.visual", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "auditory", value: "ABBREW.Traits.Skill.auditory", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "fortune", value: "ABBREW.Traits.Skill.fortune", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "misfortune", value: "ABBREW.Traits.Skill.misfortune", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "offense", value: "ABBREW.Traits.Skill.offense", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "defense", value: "ABBREW.Traits.Skill.defense", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "fear", value: "ABBREW.Traits.Skill.fear", feature: "skill", subFeature: "identifiers", effect: "", data: "", exclude: [] },
]

const materialTraits = [
  { key: "metal", value: "ABBREW.Traits.Material.metal", feature: "material", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "wood", value: "ABBREW.Traits.Material.wood", feature: "material", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "iron", value: "ABBREW.Traits.Material.iron", feature: "material", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "silver", value: "ABBREW.Traits.Material.silver", feature: "material", subFeature: "identifiers", effect: "", data: "", exclude: [] }
]

const spellTraits = [
  { key: "spellcomponent", value: "ABBREW.Traits.Spell.spellcomponent", feature: "spell", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "concept", value: "ABBREW.Traits.Spell.concept", feature: "spell", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "spellform", value: "ABBREW.Traits.Spell.spellform", feature: "spell", subFeature: "identifiers", effect: "", data: "", exclude: [] },
  { key: "spellamp", value: "ABBREW.Traits.Spell.spellamp", feature: "spell", subFeature: "identifiers", effect: "", data: "", exclude: [] }
]

ABBREW.innateConcepts = [
  { key: "flesh", value: "ABBREW.Traits.InnateConcepts.flesh", feature: "innateConcepts", subFeature: "material", effect: "", data: "", exclude: [] },
  { key: "blood", value: "ABBREW.Traits.InnateConcepts.blood", feature: "innateConcepts", subFeature: "vital", effect: "", data: "", exclude: [] },
  { key: "mind", value: "ABBREW.Traits.InnateConcepts.mind", feature: "innateConcepts", subFeature: "control", effect: "", data: "", exclude: [] },
  { key: "soul", value: "ABBREW.Traits.InnateConcepts.soul", feature: "innateConcepts", subFeature: "control", effect: "", data: "", exclude: [] },
  { key: "life", value: "ABBREW.Traits.InnateConcepts.life", feature: "innateConcepts", subFeature: "aligned", effect: "", data: "", exclude: [] },
  { key: "death", value: "ABBREW.Traits.InnateConcepts.death", feature: "innateConcepts", subFeature: "aligned", effect: "", data: "", exclude: [] },
  { key: "humanoid", value: "ABBREW.Traits.InnateConcepts.humanoid", feature: "innateConcepts", subFeature: "form", effect: "", data: "", exclude: [] },
  { key: "aberration", value: "ABBREW.Traits.InnateConcepts.aberration", feature: "innateConcepts", subFeature: "form", effect: "", data: "", exclude: [] },
  { key: "human", value: "ABBREW.Traits.InnateConcepts.human", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "dwarf", value: "ABBREW.Traits.InnateConcepts.dwarf", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "elf", value: "ABBREW.Traits.InnateConcepts.elf", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "gnome", value: "ABBREW.Traits.InnateConcepts.gnome", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "goblin", value: "ABBREW.Traits.InnateConcepts.goblin", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "orc", value: "ABBREW.Traits.InnateConcepts.orc", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "lizardfolk", value: "ABBREW.Traits.InnateConcepts.lizardfolk", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
  { key: "serpentfolk", value: "ABBREW.Traits.InnateConcepts.serpentfolk", feature: "innateConcepts", subFeature: "species", effect: "", data: "", exclude: [] },
]

ABBREW.traits = [
  ...generalTraits,
  ...acuteWoundImmunities,
  ...lingeringWoundImmunities,
  ...skillTraining,
  ...itemTraits,
  ...materialTraits,
  ...skillTraits,
  ...spellTraits,
  ...ABBREW.innateConcepts
]

ABBREW.attackModes = {
  "attack": "ABBREW.AttackModes.attack",
  "feint": "ABBREW.AttackModes.feint",
  "overpower": "ABBREW.AttackModes.overpower",
  "finisher": "ABBREW.AttackModes.finisher",
  "spell": "ABBREW.AttackModes.spell"
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
  "ranged": { id: "abbrewRangedAtt0", name: "Ranged Attack", image: "systems/abbrew/assets/icons/skills/ranged-attack.svg" },
  "aimedshot": { id: "abbrewAimedShot0", name: "Aimed Shot", image: "systems/abbrew/assets/icons/skills/aimed-shot.svg" },
  "thrown": { id: "abbrewThrown0000", name: "Thrown", image: "systems/abbrew/assets/icons/skills/thrown.svg" },
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
  { id: "abbrewOverpower0", value: "Overpower", sourceId: "Compendium.abbrew.skills.Item.abbrewOverpower0" },
  { id: "abbrewRangedAtt0", value: "Ranged Attack", sourceId: "Compendium.abbrew.skills.Item.abbrewRangedAtt0" },
  { id: "abbrewAimedShot0", value: "Aimed Shot", sourceId: "Compendium.abbrew.skills.Item.abbrewAimedShot0" },
  { id: "abbrewThrown0000", value: "Thrown", sourceId: "Compendium.abbrew.skills.Item.abbrewThrown0000" },
]

ABBREW.fundamentalSkillSummaries = [
  ...ABBREW.fundamentalAttackSkillSummaries,
  ...ABBREW.fundamentalAttributeSkillSummaries
]

ABBREW.fundamentalSystemSkillIds = [
  "abbrewRest000000",
  "abbrewRecover000",
]


ABBREW.fundamentalSystemSkills = {
  "abbrewRest000000": { id: "abbrewRest000000", name: "Rest", image: "systems/abbrew/assets/icons/skills/rest.svg" },
  "abbrewRecover000": { id: "abbrewRecover000", name: "Recover", image: "systems/abbrew/assets/icons/skills/recover.svg" },
}

ABBREW.modifierPrefixes = {
  "numeric": "ABBREW.ModifierPrefixes.numeric",
  "actor": "ABBREW.ModifierPrefixes.actor",
  "item": "ABBREW.ModifierPrefixes.item",
  "this": "ABBREW.ModifierPrefixes.this",
  "target": "ABBREW.ModifierPrefixes.target",
  "itemSource": "ABBREW.ModifierPrefixes.itemSource",
  "wound": "ABBREW.ModifierPrefixes.wound",
  "condition": "ABBREW.ModifierPrefixes.condition",
  "statustype": "ABBREW.ModifierPrefixes.statusType",
  "resource": "ABBREW.ModifierPrefixes.resource",
  "damagelastDealt": "ABBREW.ModifierPrefixes.damageLastDealt",
  "damagelastReceived": "ABBREW.ModifierPrefixes.damageLastReceived",
  "damageroundReceived": "ABBREW.ModifierPrefixes.damageRoundReceived",
  "skillCount": "ABBREW.ModifierPrefixes.skillCount",
  "async": "ABBREW.ModifierPrefixes.async",
  "string": "ABBREW.ModifierPrefixes.string",
  "trait": "ABBREW.ModifierPrefixes.trait",
  "json": "ABBREW.ModifierPrefixes.json",
  "name": "ABBREW.ModifierPrefixes.name"
}

ABBREW.checkTypes = {
  "successes": "ABBREW.CheckTypes.successes",
  "result": "ABBREW.CheckTypes.result"
}

ABBREW.asyncValueTypes = {
  "single": "ABBREW.AsyncValueTypes.singleValue",
  "choice": "ABBREW.AsyncValueTypes.choice"
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

ABBREW.protectionTypes = {
  reduction: { label: "ABBREW.Reduction" },
  amplification: { label: "ABBREW.Amplification" },
  resistance: { label: "ABBREW.Resistance" },
  immunity: { label: "ABBREW.Immunity" },
  weakness: { label: "ABBREW.Weakness" }
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
  professional: { label: "ABBREW.Roles.Name.professional", value: "professional", description: "ABBREW.Roles.Description.professional" },
  scout: { label: "ABBREW.Roles.Name.scout", value: "scout", description: "ABBREW.Roles.Description.scout" },
}

ABBREW.universalPath = { name: "ABBREW.Paths.universal.name", _id: "abbrewpuniversal", value: "universal", roles: [], description: "ABBREW.Paths.universal.description" };

ABBREW.skillTraining = [
  "attack",
  "overpower",
  "parry",
  "feint",
  "finisher",
  "parryCounter",
  "feintCounter",
]

ABBREW.activeEffectKeys = [
  { value: "system.defense.guard.maxMod", label: "ABBREW.ActiveEffectKeys.guardMax" },
  { value: "system.defense.guard.maxMult", label: "ABBREW.ActiveEffectKeys.guardMaxMult" },
  { value: "system.defense.protection.all.reduction", label: "ABBREW.ActiveEffectKeys.protectionTypes.all.reduction" },
  { value: "system.defense.protection.all.weakness", label: "ABBREW.ActiveEffectKeys.protectionTypes.all.weakness" },
  { value: "system.defense.protection.all.resistance", label: "ABBREW.ActiveEffectKeys.protectionTypes.all.resistance" },
  { value: "system.defense.protection.all.amplification", label: "ABBREW.ActiveEffectKeys.protectionTypes.all.amplification" },
  { value: "system.defense.protection.all.immunity", label: "ABBREW.ActiveEffectKeys.protectionTypes.all.immunity" },
  ...Object.keys(ABBREW.damageTypes).flatMap(k => [
    { value: `system.defense.protection.${k}.reduction`, label: `ABBREW.ActiveEffectKeys.protectionTypes.${k}.reduction` },
    { value: `system.defense.protection.${k}.weakness`, label: `ABBREW.ActiveEffectKeys.protectionTypes.${k}.weakness` },
    { value: `system.defense.protection.${k}.resistance`, label: `ABBREW.ActiveEffectKeys.protectionTypes.${k}.resistance` },
    { value: `system.defense.protection.${k}.amplification`, label: `ABBREW.ActiveEffectKeys.protectionTypes.${k}.amplification` },
    { value: `system.defense.protection.${k}.immunity`, label: `ABBREW.ActiveEffectKeys.protectionTypes.${k}.immunity` },
  ]),
  { value: "system.modifiers.initiative", label: "ABBREW.ActiveEffectKeys.initiativeBonus" },
  { value: "system.movement.baseSpeed", label: "ABBREW.ActiveEffectKeys.baseSpeed" },
  { value: "system.movement.speed.land.value", label: "ABBREW.ActiveEffectKeys.landSpeed" },
  { value: "system.movement.speed.burrow.value", label: "ABBREW.ActiveEffectKeys.burrowSpeed" },
  { value: "system.movement.speed.swim.value", label: "ABBREW.ActiveEffectKeys.swimSpeed" },
  { value: "system.movement.speed.climb.value", label: "ABBREW.ActiveEffectKeys.climbSpeed" },
  { value: "system.movement.speed.fly.value", label: "ABBREW.ActiveEffectKeys.flySpeed" },
  { value: "system.movement.speed.teleport.value", label: "ABBREW.ActiveEffectKeys.teleportSpeed" },
  ...ABBREW.skillTraining.flatMap(k => [
    { value: `system.skillTraining.${k}.value`, label: `ABBREW.ActiveEffectKeys.skillTraining.${k}` },
  ]),
  ...Object.keys(ABBREW.attributes).flatMap(k => [
    { value: `system.attributes.${k}.value`, label: ABBREW.attributes[k] },
  ]),
  { value: "system.defense.threatened.threshold", label: "ABBREW.Threatened.threatenedThreshold" },
  { value: "system.defense.threatened.multiplier", label: "ABBREW.Threatened.threatenedMultiplier" },
  { value: "system.defense.resolve.maxMod", label: "ABBREW.Defense.Resolve.max" },
  { value: "system.defense.resolve.maxMult", label: "ABBREW.Defense.Resolve.maxMult" },
  { value: "system.defense.adjacentAllies", label: "ABBREW.ActiveEffectKeys.adjacentAllies" }
]

ABBREW.speeds = {
  land: { label: "ABBREW.Speeds.land" },
  burrow: { label: "ABBREW.Speeds.burrow", },
  swim: { label: "ABBREW.Speeds.swim", },
  climb: { label: "ABBREW.Speeds.climb", },
  fly: { label: "ABBREW.Speeds.fly", },
  teleport: { label: "ABBREW.Speeds.teleport", }
}

ABBREW.visionModes = CONFIG.Canvas.visionModes;
ABBREW.detectionModes = CONFIG.Canvas.detectionModes;