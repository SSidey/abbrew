export const ABBREW = {};

/**
 * The set of Ability Scores used within the sytem.
 * @type {Object}
 */
ABBREW.statistics = {
  "strength": "ABBREW.StatisticStrength",
  "dexterity": "ABBREW.StatisticDexterity",
  "constitution": "ABBREW.StatisticConstitution",
  "agility": "ABBREW.StatisticAgility",
  "intelligence": "ABBREW.StatisticIntelligence",
  "will": "ABBREW.StatisticWill",
  "wits": "ABBREW.StatisticWits",
  "visualisation": "ABBREW.StatisticVisualisation"
};

ABBREW.StatisticAbbreviations = {
  "str": "ABBREW.StatisticStrengthAbbreviation",
  "dex": "ABBREW.StatisticDexterityAbbreviation",
  "con": "ABBREW.StatisticConstitutionAbbreviation",
  "agi": "ABBREW.StatisticAgilityAbbreviation",
  "int": "ABBREW.StatisticIntelligenceAbbreviation",
  "wll": "ABBREW.StatisticWillAbbreviation",
  "wts": "ABBREW.StatisticWitsAbbreviation",
  "wis": "ABBREW.StatisticVisualisationAbbreviation"
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