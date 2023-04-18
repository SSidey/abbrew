export const ABBREW = {};

/**
 * The set of Ability Scores used within the sytem.
 * @type {Object}
 */
ABBREW.abilities = {
  "strength": "ABBREW.AbilityStrength",
  "dexterity": "ABBREW.AbilityDexterity",
  "constitution": "ABBREW.AbilityConstitution",
  "agility": "ABBREW.AbilityAgility",
  "intelligence": "ABBREW.AbilityIntelligence",
  "will": "ABBREW.AbilityWill",
  "wits": "ABBREW.AbilityWits",
  "visualisation": "ABBREW.AbilityVisualisation"
};

ABBREW.abilityAbbreviations = {
  "str": "ABBREW.AbilityStrengthAbbreviation",
  "dex": "ABBREW.AbilityDexterityAbbreviation",
  "con": "ABBREW.AbilityConstitutionAbbreviation",
  "agi": "ABBREW.AbilityAgilityAbbreviation",
  "int": "ABBREW.AbilityIntelligenceAbbreviation",
  "wll": "ABBREW.AbilityWillAbbreviation",
  "wts": "ABBREW.AbilityWitsAbbreviation",
  "wis": "ABBREW.AbilityVisualisationAbbreviation"
};

ABBREW.ActionTypes = {
  "Damage": "damage"
};

ABBREW.Reach = {
  "natural": "ABBREW.ReachNatural",
  "short": "ABBREW.ReachShort",
  "standard": "ABBREW.ReachStandard",
  "long": "ABBREW.ReachLong"
}

ABBREW.DamageTypes = {
  "physical": "ABBREW.physical",
  "crushing": "ABBREW.crushing",
  "slashing": "ABBREW.slashing",
  "piercing": "ABBREW.piercing"
};

ABBREW.DamageProjection = {
  "arc": "ABBREW.Arc",
  "thrust": "ABBREW.Thrust"
}

ABBREW.UI = {
  "RuleElements": {
    "Prompt": {
      "NoValidOptions": "ABBREW.NoValidOptions",
      "NoSelectionMade": "ABBREW.NoSelectionMade"
    }
  }
}

ABBREW.RuleTypes = {
  "ActiveEffect": "ABBREW.ActiveEffect",
  "ChoiceSet": "ABBREW.ChoiceSet"
}