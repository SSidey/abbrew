export const ABBREW = {};

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
  synergy: 'ABBREW.SkillActivationTypes.synergy'
}
ABBREW.EquippedWeapon = "ABBREW.EquippedWeapon";
ABBREW.Damage = "ABBREW.Damage";
ABBREW.operator = "ABBREW.Operator"
ABBREW.operators = {
  equal: "ABBREW.Operators.equal",
  add: "ABBREW.Operators.add",  
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
  held: "ABBREW.EquipState.held",
  worn: "ABBREW.EquipState.worn",
  stowed: "ABBREW.EquipState.stowed",
  dropped: "ABBREW.EquipState.dropped"
}

ABBREW.skillTypes = {
  background: "ABBREW.SkillTypes.background",
  basic: "ABBREW.SkillTypes.basic",
  path: "ABBREW.SkillTypes.path",
  resource: "ABBREW.SkillTypes.resource",
  temporary: "ABBREW.SkillTypes.temporary",
  untyped: "ABBREW.SkillTypes.untyped"
}

ABBREW.activationTypes = {
  passive: "ABBREW.ActivationTypes.passive",
  active: "ABBREW.ActivationTypes.actve"
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
  general: "ABBREW.Wounds.general",
  bleed: "ABBREW.Wounds.bleed",
  vital: "ABBREW.Wounds.vital",
  fatigue: "ABBREW.Wounds.fatigue",
  terror: "ABBREW.Wounds.terror"
}