var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
async function d10Roll({
  parts = [],
  data = {},
  title,
  flavour,
  dialogOptions,
  messageData = {},
  options: options2 = {},
  chatMessage = true,
  rollMode,
  flavor
}) {
  let dice = 1 + data.amplification;
  let weakness = 0 + data.weakness;
  dice = "" + dice;
  weakness = "" + weakness;
  const fullParts = ["{" + dice + "d10x>=" + data.criticalThreshold, ...parts];
  const formula = fullParts.join("+") + " -" + weakness + "d10, 0}kh";
  const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
  foundry.utils.mergeObject(options2, {
    flavor: flavor || title,
    defaultRollMode,
    rollMode
  });
  const roll = new CONFIG.Dice.AbbrewRoll(formula, data);
  await roll.configureDialog({ title: "Additional Modifiers" });
  await roll.evaluate({ async: true });
  messageData = {};
  messageData.flags = { data };
  await roll.toMessage(messageData);
}
class AbbrewAttackProfile {
  constructor(id, abilityModifier, damageBase, isWeapon, weapon, isMagic, magic) {
    __publicField(this, "id", "");
    __publicField(this, "abilityModifier", "");
    __publicField(this, "damageBase", 0);
    __publicField(this, "isWeapon", false);
    __publicField(this, "weapon", {});
    __publicField(this, "isMagic", false);
    __publicField(this, "magic", {});
    this.id = id;
    this.abilityModifier = abilityModifier;
    this.damageBase = damageBase;
    this.isWeapon = isWeapon;
    this.weapon = weapon;
    this.isMagic = isMagic;
    this.magic = magic;
  }
}
async function useAttack(attack, attackProfile, actor) {
  let title = `${attack.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
  const rollData = getRollData(actor, attack, attackProfile);
  rollData.mod = 10;
  const rollConfig = {
    parts: [attackProfile.abilityModifier, "@attackProfile.damageBase"],
    data: rollData,
    title,
    flavour: title,
    dialogOptions: {
      width: 400,
      top: null,
      left: window.innerWidth - 710
    },
    messageData: {
      "flags.abbrew.roll": { type: "attack", attack: attack.id, attackProfile: attackProfile.id },
      speaker: ChatMessage.getSpeaker({ actor })
    },
    options: {
      "damageType": attackProfile.damageType
    }
  };
  const roll = await d10Roll(rollConfig);
  return roll;
}
function getRollData(actor, attack, attackProfile) {
  if (!actor)
    return null;
  const rollData = actor.getRollData();
  rollData.attack = foundry.utils.deepClone(attack);
  rollData.attackProfile = foundry.utils.deepClone(attackProfile);
  rollData.criticalThreshold = getCriticalThreshold(actor, attackProfile);
  rollData.amplification = getAmplification(actor, attackProfile);
  rollData.weakness = getWeakness(actor, attackProfile);
  return rollData;
}
function getCriticalThreshold(actor, attackProfile) {
  const weaponThreshold = attackProfile.weapon.criticalThreshold;
  const damageType = attackProfile.weapon.damageType;
  const globalThreshold = actor.system.concepts["attack"].criticalThreshold;
  let damageTypeThreshold = 10;
  if (actor.system.concepts[damageType]) {
    damageTypeThreshold = actor.system.concepts[damageType].criticalThreshold;
  }
  const calculatedThreshold = Math.min(weaponThreshold, globalThreshold, damageTypeThreshold);
  return Math.max(calculatedThreshold, 5);
}
function getAmplification(actor, attackProfile) {
  const damageType = attackProfile.weapon.damageType;
  return actor.system.concepts[damageType] ? actor.system.concepts[damageType].amplification : 0;
}
function getWeakness(actor, attackProfile) {
  const damageType = attackProfile.weapon.damageType;
  return actor.system.concepts[damageType] ? actor.system.concepts[damageType].weakness : 0;
}
class AbbrewRule {
  constructor(id, label, type, source, valid) {
    __publicField(this, "id");
    __publicField(this, "label");
    __publicField(this, "type");
    __publicField(this, "priority");
    __publicField(this, "predicate");
    // The property to modify e.g. system.statistics.strength.value
    __publicField(this, "target");
    __publicField(this, "source");
    __publicField(this, "valid");
    this.type = type;
    this.priority = 100;
    this.id = id;
    this.label = label;
    this.valid = valid;
    this.source = source;
    this.predicate = "";
    this.target = "";
  }
  get _type() {
    return this.type;
  }
  template() {
    return JSON.stringify(this);
  }
  static applyRule(rule, actorData) {
    return {};
  }
  static validate(candidate) {
    return candidate.hasOwnProperty("type") && candidate.hasOwnProperty("priority") && candidate.hasOwnProperty("predicate") && candidate.hasOwnProperty("target");
  }
}
const ABBREW = {};
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
};
ABBREW.DamageTypes = {
  "physical": "ABBREW.physical",
  "crushing": "ABBREW.crushing",
  "slashing": "ABBREW.slashing",
  "piercing": "ABBREW.piercing"
};
ABBREW.DamageProjection = {
  "arc": "ABBREW.Arc",
  "thrust": "ABBREW.Thrust"
};
ABBREW.UI = {
  "RuleElements": {
    "Prompt": {
      "NoValidOptions": "ABBREW.NoValidOptions",
      "NoSelectionMade": "ABBREW.NoSelectionMade"
    }
  }
};
ABBREW.RuleTypes = {
  "ActiveEffect": "ABBREW.ActiveEffect",
  "ChoiceSet": "ABBREW.ChoiceSet"
};
class AbbrewActiveEffect extends AbbrewRule {
  constructor(id, label, candidate, source, valid) {
    super(id, label, ABBREW.RuleTypes.ActiveEffect, source, valid);
    __publicField(this, "operator");
    __publicField(this, "value");
    __publicField(this, "requireEquippedItem");
    if (candidate && typeof candidate == "object") {
      candidate && Object.assign(this, candidate);
      return;
    }
    this.operator = "";
    this.value = "";
    this.requireEquippedItem = false;
  }
  static validate(candidate) {
    return super.validate(candidate) && candidate.hasOwnProperty("operator") && candidate.hasOwnProperty("value") && this.validOperators.includes(candidate.operator) && !!candidate.value;
  }
  static applyRule(rule, actorData) {
    let changes = {};
    let targetElement = rule.targetElement ? actorData.items.get(rule.targetElement) : actorData;
    let targetElementType = rule.targetElement ? "Item" : "Actor";
    let currentValue = getProperty(targetElement, rule.target);
    if (!currentValue) {
      return changes;
    }
    let targetType = getType(currentValue);
    let ruleValue = null;
    if (rule.value[0] == "$") {
      ruleValue = getProperty(actorData.items.get(rule.source.item), rule.value.substring(1, rule.value.length));
    } else if (rule.value[0] == "£") {
      ruleValue = getProperty(actorData, rule.value.substring(1, rule.value.length));
    } else {
      ruleValue = rule.value;
    }
    let delta = this._castDelta(ruleValue, targetType);
    let newValue = getProperty(targetElement, rule.target);
    switch (rule.operator) {
      case "override":
        newValue = delta;
        break;
      case "add":
        newValue = newValue += delta;
        break;
      case "minus":
        newValue = newValue -= delta;
        break;
      case "multiply":
        newValue = newValue * delta;
        break;
      case "divide":
        const divisor = delta !== 0 ? delta : 1;
        newValue = newValue / divisor;
        break;
      case "upgrade":
        newValue = newValue < delta ? delta : newValue;
        break;
      case "downgrade":
        newValue = newValue > delta ? delta : newValue;
        break;
    }
    if (currentValue != newValue) {
      const elementChanges = { [rule.target]: newValue, rules: [rule.id] };
      let sourceValue = currentValue;
      if (Object.keys(actorData.ruleOverrides).includes(rule.target)) {
        sourceValue = actorData.ruleOverrides[rule.target].sourceValue;
      }
      changes = { target: rule.target, value: newValue, sourceValue, targetElementType, targetElement: rule.targetElement };
      mergeObject(targetElement, elementChanges);
    }
    return changes;
  }
  static _castDelta(raw, type) {
    let delta;
    switch (type) {
      case "boolean":
        delta = Boolean(this._parseOrString(raw));
        break;
      case "number":
        delta = Number.fromString(raw);
        if (Number.isNaN(delta))
          delta = 0;
        break;
      case "string":
        delta = String(raw);
        break;
      default:
        delta = this._parseOrString(raw);
    }
    return delta;
  }
  static _parseOrString(raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return raw;
    }
  }
}
__publicField(AbbrewActiveEffect, "validOperators", [
  "override",
  "add",
  "minus",
  "multiply",
  "divide",
  "upgrade",
  "downgrade"
]);
class ChoiceSetPrompt extends Dialog {
  constructor(data = { promptTitle, choices }, options2 = {}) {
    options2.buttons = {};
    data.buttons = {};
    super(data, options2);
    __publicField(this, "selection");
    __publicField(this, "choices");
    this.choices = data.content.choices;
  }
  /** @override */
  get template() {
    return "systems/abbrew/templates/rules/choice-set-prompt.hbs";
  }
  /** @override */
  activateListeners($html) {
    const html = $html[0];
    html.querySelectorAll("a[data-choice], button[type=button]").forEach((element) => {
      element.addEventListener("click", (event) => {
        console.log("clicked");
        this.selection = event.currentTarget.dataset.id;
        this.close();
      });
    });
  }
  getData() {
    console.log("getData", this);
    const data = super.getData();
    data.header = this.data.header;
    data.footer = this.data.footer;
    data.choices = data.content.choices;
    data.promptTitle = data.content.promptTitle;
    console.log(data);
    return data;
  }
  /** Return early if there is only one choice */
  async resolveSelection() {
    if (this.choices.length === 0) {
      await this.close({ force: true });
      return null;
    }
    const firstChoice = this.choices.at(0);
    if (firstChoice && this.choices.length === 1) {
      return this.selection = firstChoice[0];
    }
    this.render(true);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  /** @override */
  /** Close the dialog, applying the effect with configured target or warning the user that something went wrong. */
  async close({ force = false } = {}) {
    var _a;
    this.element.find("button, select").css({ pointerEvents: "none" });
    if (!this.selection) {
      if (force) {
        ui.notifications.warn(
          game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoValidOptions", {
            actor: this.actor.name,
            item: this.item.name
          })
        );
      } else if (!this.allowNoSelection) {
        ui.notifications.warn(
          game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoSelectionMade")
        );
      }
    }
    (_a = this.resolve) == null ? void 0 : _a.call(this, this.selection);
    await super.close({ force });
  }
}
class AbbrewChoiceSet extends AbbrewRule {
  constructor(id, label, candidate, source, valid) {
    super(id, label, ABBREW.RuleTypes.ChoiceSet, source, valid);
    __publicField(this, "options");
    __publicField(this, "choice");
    if (candidate && typeof candidate == "object") {
      candidate && Object.assign(this, candidate);
      return;
    }
    this.options = ["weapon", "armour", "consumable", "anatomy"];
    this.choice = "";
  }
  set target(target) {
    this.target = target;
  }
  static validate(candidate) {
    return super.validate(candidate) && candidate.hasOwnProperty("options");
  }
  static async applyRule(rule, actorData) {
    return {};
  }
  static async getChoice(rule, actorData) {
    if (rule.choice) {
      return rule.choice;
    }
    let choices2 = [];
    if (rule.options.includes("weapon")) {
      choices2 = mergeObject(choices2, this.getItemWeapons(actorData));
    }
    if (rule.options.includes("armour")) {
      choices2 = mergeObject(choices2, this.getItemArmour(actorData));
    }
    if (rule.options.includes("consumable")) {
      choices2 = mergeObject(choices2, this.getItemConsumable(actorData));
    }
    if (rule.options.includes("anatomy")) {
      choices2 = mergeObject(choices2, this.getItemAnatomy(actorData));
    }
    const data = { content: { promptTitle: "Hello", choices: choices2 }, buttons: {} };
    const choice = await new ChoiceSetPrompt(data).resolveSelection();
    let parentItemId = rule.source.item;
    if (!rule.source.actor) {
      parentItemId = actorData.items.map((i) => i.system.rules).flat(1).filter((i) => i.id == rule.id)[0].source.item;
    }
    const parentItem = actorData.items.get(parentItemId);
    for (let i = 0; i < parentItem.system.rules.length; i++) {
      parentItem.system.rules[i].targetElement = choice;
      if (parentItem.system.rules[i].id == rule.id) {
        parentItem.system.rules[i].choice = choice;
        const ruleContent = parentItem.system.rules[i].content;
        let parsedContent = JSON.parse(ruleContent);
        parsedContent.choice = choice;
        parentItem.system.rules[i].content = JSON.stringify(parsedContent);
      }
    }
    parentItem.update({ system: { rules: parentItem.system.rules } });
    return choice;
  }
  static getItemWeapons(actorData) {
    return actorData.itemTypes.item.filter((i) => i.system.isWeapon).map((i) => ({ id: i._id, name: i.name }));
  }
  static getItemArmour(actorData) {
    return actorData.itemTypes.item.filter((i) => i.system.isArmour).map((i) => ({ id: i._id, name: i.name }));
  }
  static getItemConsumable(actorData) {
    return actorData.itemTypes.item.filter((i) => i.system.isConsumable).map((i) => ({ id: i._id, name: i.name }));
  }
  static getItemAnatomy(actorData) {
    return actorData.itemTypes.anatomy.map((i) => ({ id: i._id, name: i.name }));
  }
}
class AbbrewRuleField {
  constructor({ id, type, label, content, source }) {
    __publicField(this, "id");
    __publicField(this, "type");
    __publicField(this, "active");
    __publicField(this, "label");
    __publicField(this, "content");
    __publicField(this, "source");
    __publicField(this, "options");
    __publicField(this, "targetElement");
    this.id = id;
    this.type = type;
    this.active = true;
    this.label = label;
    this.content = content;
    this.source = source;
    this.options = options;
    this.targetElement = "";
  }
}
const options = [
  new AbbrewActiveEffect(),
  new AbbrewChoiceSet()
];
class RuleSource {
  constructor(uuid2) {
    __publicField(this, "actor");
    __publicField(this, "item");
    __publicField(this, "uuid");
    this.uuid = uuid2;
    this.actor = "";
    this.item = "";
    const parts = uuid2.split(".");
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] == "Actor") {
        this.actor = parts[i + 1];
      }
      if (parts[i] == "Item") {
        this.item = parts[i + 1];
      }
    }
  }
}
async function onManageRule(event, item) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const ruleId = li.dataset.ruleId;
  let rules = foundry.utils.deepClone(item.system.rules);
  switch (a.dataset.action) {
    case "create":
      const id = uuid();
      rules = [
        new AbbrewRuleField({ id, type: 0, label: "New Rule", content: options[0].template(), source: new RuleSource(item.uuid) }),
        ...rules
      ];
      break;
    case "delete":
      rules = rules.filter((r) => r.id != ruleId);
      break;
  }
  return await item.update({
    "system.rules": rules
  });
}
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
async function prepareRules(actor) {
  const rules = actor.items._source.map((i) => i.system.rules).flat(1);
  const validRules = [];
  const sourceTargets = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule.active) {
      continue;
    }
    if (sourceTargets[rule.source.uuid]) {
      rule.targetElement = sourceTargets[rule.source.uuid];
    }
    const parsedRule = JSON.parse(rule.content);
    let typedRule = {};
    let valid = false;
    switch (parsedRule.type) {
      case ABBREW.RuleTypes.ActiveEffect:
        console.log("Active Effect");
        valid = AbbrewActiveEffect.validate(parsedRule);
        typedRule = new AbbrewActiveEffect(rule.id, rule.label, parsedRule, rule.source, valid);
        typedRule.targetElement = rule.targetElement;
        const equipState = actor.items.get(typedRule.source.item).system.equipState;
        if (typedRule.requireEquippedItem && (equipState.worn || equipState.wielded) || !typedRule.requireEquippedItem) {
          validRules.push(typedRule);
        }
        break;
      case ABBREW.RuleTypes.ChoiceSet:
        console.log("Choice Set");
        valid = AbbrewChoiceSet.validate(parsedRule);
        typedRule = new AbbrewChoiceSet(rule.id, rule.label, parsedRule, rule.source, valid);
        const choice = await AbbrewChoiceSet.getChoice(typedRule, actor);
        sourceTargets[rule.source.uuid] = choice;
        typedRule.targetElement = choice;
        typedRule.choice = choice;
        validRules.push(typedRule);
        break;
    }
  }
  await actor.update({ "system.rules": validRules });
}
function applyRule(rule, actorData) {
  let changes = {};
  switch (rule.type) {
    case ABBREW.RuleTypes.ActiveEffect:
      changes = AbbrewActiveEffect.applyRule(rule, actorData);
      break;
    case ABBREW.RuleTypes.ChoiceSet:
      changes = AbbrewChoiceSet.applyRule(rule, actorData);
      break;
  }
  return changes;
}
function writeToPath(element, path, value) {
  let pathWrite = [];
  pathWrite[path] = value;
  let keyed = expandObject(pathWrite);
  element.update(keyed);
}
class AbbrewActor extends Actor {
  constructor() {
    super(...arguments);
    __publicField(this, "ruleOverrides");
  }
  /** @override */
  prepareData() {
    console.log("before");
    super.prepareData();
    console.log("between");
    console.log("after");
  }
  /** @override */
  prepareBaseData() {
    console.log("is it before?");
  }
  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    actorData.system;
    actorData.flags.abbrew || {};
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character")
      return;
    const systemData = actorData.system;
    this._processRules(this);
    this._prepareAbilityModifiers(systemData);
    this._prepareAnatomy(systemData);
    this._prepareMovement(systemData);
    this._prepareDefences(systemData);
    this._prepareArmour(systemData);
    this._preparePower(systemData);
    this._prepareActions(systemData);
    this._prepareFeatures(systemData);
  }
  async _updateObject(event, formData) {
    console.log("here");
    await super._updateObject(event, formData);
  }
  _onUpdate(data, options2, userId) {
    console.log("here2");
    super._onUpdate(data, options2, userId);
  }
  async _preUpdate(changed, options2, user) {
    console.log("pre-update");
    if (this.ruleOverrides) {
      let flatChanges = flattenObject(changed, 1);
      let flatChangesArray = Object.keys(flatChanges).map((key) => [key, flatChanges[key]]);
      const overrideKeys = Object.keys(this.ruleOverrides);
      flatChangesArray.forEach((c) => {
        if (overrideKeys.includes(c[0]) && this.ruleOverrides[c[0]].overrideValue == c[1]) {
          const path = c[0];
          let keys = path.split(".");
          let prop = keys.pop();
          let parent = keys.reduce((obj, key) => obj[key], changed);
          delete parent[prop];
        }
      });
    }
    super._preUpdate(changed, options2, user);
  }
  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options2, userId) {
    console.log(`Update Object: ${embeddedName}`);
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options2, userId);
  }
  _processRules(actorData) {
    this.prepareItems(this);
    this.resetItems(this);
    prepareRules(this);
    if (actorData.system.rules.length == 0) {
      this.ruleOverrides = [];
      return;
    }
    let changes = [];
    this.ruleOverrides = [];
    actorData.ruleOverrides = [];
    actorData.system.rules.filter(
      (r) => r.valid
    ).sort((r1, r2) => r2.priority - r1.priority).forEach((r) => {
      const ruleChange = applyRule(r, actorData);
      if (Object.keys(ruleChange).length == 0) {
        return;
      }
      changes[ruleChange.target] = {
        overrideValue: ruleChange.value,
        sourceValue: ruleChange.sourceValue,
        targetType: ruleChange.targetType,
        targetElement: ruleChange.targetElement
      };
      actorData.ruleOverrides[ruleChange.target] = changes[ruleChange.target];
    });
    this.ruleOverrides = changes;
  }
  /**
   * Reset item overridden fields to pre-rule values.
   * @param {AbbrewActor} actorData    
   */
  prepareItems(actorData) {
    actorData.items.filter((i) => i.system.rules.length > 0).forEach((i) => {
      i.system.rules.forEach((r) => {
        if (r.source.actor && r.source.item) {
          return;
        }
        r.source.actor = this.id;
        r.source.item = i.id;
        r.source.uuid = `Actor.${this.id}.Item.${i.id}`;
      });
      const item = actorData.items.get(i.id);
      writeToPath(item, "system.rules", i.system.rules);
    });
  }
  resetItems(actorData) {
    if (!actorData.ruleOverrides) {
      return;
    }
    for (const [key, override] of Object.entries(actorData.ruleOverrides)) {
      if (override.targetType == "Item") {
        const item = actorData.items.get(override.targetElement);
        const path = key;
        let keys = path.split(".");
        let itemValue = keys.reduce((obj, key2) => obj[key2], item);
        if (itemValue == override.overrideValue) {
          writeToPath(item, path, override.sourceValue);
        }
      }
    }
  }
  async _updateDocuments(documentClass, { updates, options: options2, pack }, user) {
    console.log("update-documents");
    super._updateDocuments(documentClass, { updates, options: options2, pack }, user);
  }
  _prepareAnatomy(systemData) {
    this.itemTypes.anatomy.forEach(
      (a) => {
        const tags = a.system.tags.replace(" ", "").split(",");
        a.system.tagsArray = tags;
        const armourPoints = a.system.armourPoints.replace(" ", "").split(",");
        a.system.armourPointsArray = armourPoints;
      }
    );
    systemData.anatomy = this.itemTypes.anatomy;
  }
  _prepareDefences(systemData) {
    const defences = Object.fromEntries(Object.entries(this.itemTypes.defence).map(([k, v]) => [v.name, v.system]));
    systemData.defences = { ...systemData.defences, ...defences };
  }
  _prepareFeatures(systemData) {
    const weapons = this._getWeapons();
    const attacks = weapons.map((w) => this._prepareWeaponAttack(w, systemData));
    systemData.attacks = attacks.flat();
  }
  _getWeapons() {
    return this._getItemWeapons().map((i) => ({ "name": i.name, "img": i.img, "weaponId": i._id, "weight": i.system.weight, "concepts": i.system.concepts, "material": i.system.material, "equipState": i.system.equipState, ...i.system.weapon }));
  }
  _getItemWeapons() {
    return this.itemTypes.item.filter((i) => i.system.isWeapon);
  }
  _prepareWeaponAttack(weapon) {
    const results = weapon.weaponProfiles.split(",").map((wp, index) => {
      const profileParts = wp.split("-");
      const damageType = profileParts[0].replace(" ", "");
      const attackType = profileParts[1];
      const requirements = { strength: { value: 5 } };
      let damageBase = 0;
      switch (profileParts[1]) {
        case "arc":
          damageBase = +weapon.material.structure + requirements.strength.value * (1 + weapon.minimumEffectiveReach) + weapon.material.tier * 5;
          break;
        case "thrust":
          damageBase = +weapon.material.structure + weapon.material.tier * 5;
          weapon.penetration = weapon.material.tier * 5;
          break;
        default:
          return;
      }
      return new AbbrewAttackProfile(
        index,
        "@system.statistics.strength.mod",
        damageBase,
        true,
        {
          requirements: weapon.requirements,
          reach: weapon.reach,
          minimumEffectiveReach: weapon.minimumEffectiveReach,
          focused: weapon.focused,
          penetration: weapon.penetration,
          traits: weapon.traits,
          handsSupplied: weapon.handsSupplied,
          handsRequired: weapon.handsRequired,
          traitsArray: weapon.traitsArray,
          criticalThreshold: weapon.criticalThreshold,
          damageType,
          attackType
        },
        false,
        {}
      );
    });
    return {
      id: weapon.weaponId,
      name: weapon.name,
      image: weapon.img || "icons/svg/sword.svg",
      isWeapon: true,
      isEquipped: weapon.equipState.wielded,
      profiles: results
    };
  }
  async equipWeapon(id, equip) {
    const updates = [];
    updates.push({ _id: id, system: { equipState: { wielded: equip } } });
    await this.updateEmbeddedDocuments("Item", updates);
  }
  async equipArmour(id, equip) {
    const updates = [];
    updates.push({ _id: id, system: { equipState: { worn: equip } } });
    await this.updateEmbeddedDocuments("Item", updates);
  }
  _prepareAbilityModifiers(systemData) {
    for (let [key, ability] of Object.entries(systemData.statistics)) {
      ability.mod = Math.floor(ability.value / 2);
    }
  }
  _prepareMovement(systemData) {
    const base = systemData.statistics.agility.mod;
    const limbs = systemData.anatomy.filter((a) => a.system.tagsArray.includes("primary")).length;
    systemData.movement.base = base * limbs;
  }
  _prepareArmour(systemData) {
    systemData.armours = this.itemTypes.item.filter((a) => a.system.isArmour);
    let naturalBonuses = this.itemTypes.anatomy.map((a) => a.system.armourBonus);
    const naturalValue = foundry.utils.getProperty(this, this.system.naturalArmour);
    naturalBonuses = naturalBonuses.map((b) => {
      if (b === "natural") {
        b = naturalValue;
      }
      return b;
    });
    const initialValue = 0;
    const fullArmourMax = naturalBonuses.map((b) => +b).reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
    systemData.armour.max = fullArmourMax;
    const defencesArray = systemData.armour.defences.replaceAll(" ", "").split(",");
    systemData.armour.defencesArray = defencesArray;
  }
  _preparePower(systemData) {
    const result = this._sumValues(systemData);
    systemData.attributes.power.value = result;
  }
  _prepareActions(systemData) {
    const actions = 3;
    systemData.actions = { current: actions, maximum: actions };
  }
  // TODO: Generalise or change
  _sumValues(systemData) {
    return Object.values(systemData.statistics).reduce(function(sum, ability) {
      return sum += ability.value;
    }, 0);
  }
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc")
      return;
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }
  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data);
    this._getNpcRollData(data);
    return data;
  }
  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== "character")
      return;
    if (data.statistics) {
      for (let [k, v] of Object.entries(data.statistics)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }
  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== "npc")
      return;
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */
  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(html) {
    html.on("click", ".damage-application button", this.onDamageAccept.bind(this));
  }
  /* async */
  static onDamageAccept(event) {
    console.log(event);
    const button = event.currentTarget;
    const card = button.closest(".chat-message");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    tokens[0].actor.acceptDamage(message.rolls, message.flags.data);
  }
  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
  dot(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
  }
  normalize(vector) {
    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x = vector.x / length;
    vector.y = vector.y / length;
    return vector;
  }
  convertFoundryAngle(angle) {
    const angleDiff = angle - 270;
    return angleDiff > 0 ? 360 - angleDiff : Math.abs(angleDiff);
  }
  // Directly Down is 0, Left is 90, Up 180, Right 270
  /* async */
  acceptDamage(damageRolls, attackData) {
    let actor = this;
    let systemData = this.system;
    let damage = damageRolls[0]._total;
    let damageRoll = damageRolls[0];
    let damagePenetrate = attackData.attackProfile.weapon.penetration;
    var placeables = (
      /* await */
      game.canvas.tokens.placeables
    );
    var token = (
      /* await */
      placeables.filter((p) => p.document.actorId == this.id && p.controlled)[0]
    );
    var nonAllyTokens = (
      /* await */
      placeables.filter((p) => p.document.disposition != token.document.disposition)
    );
    token.center;
    var tokenAngle = this.toRadians(this.convertFoundryAngle(token.document.rotation));
    var nonAllyAngle = this.toRadians(this.convertFoundryAngle(nonAllyTokens[0].document.rotation));
    var tokenVector = { x: Math.cos(tokenAngle), y: Math.sin(tokenAngle) };
    var nonAllyVector = { x: Math.cos(nonAllyAngle), y: Math.sin(nonAllyAngle) };
    var vectorToFace = { x: token.center.x - nonAllyTokens[0].center.x, y: nonAllyTokens[0].center.y - token.center.y };
    tokenVector = this.normalize(tokenVector);
    tokenVector = Object.values(tokenVector);
    nonAllyVector = this.normalize(nonAllyVector);
    nonAllyVector = Object.values(nonAllyVector);
    vectorToFace = this.normalize(vectorToFace);
    vectorToFace = Object.values(vectorToFace);
    var isNonAllyFacing = vectorToFace.map((x, i) => vectorToFace[i] * nonAllyVector[i]).reduce((m, n) => m + n);
    var matching = tokenVector.map((x, i) => tokenVector[i] * nonAllyVector[i]).reduce((m, n) => m + n);
    console.log("enemy facing: " + Math.round(isNonAllyFacing * 1e5) / 1e5);
    console.log("which side: " + Math.round(matching * 1e5) / 1e5);
    let currentArmour = systemData.armour.value;
    let newArmour = currentArmour;
    const damageType = attackData.attackProfile.weapon.damageType;
    if (!systemData.defences[damageType]) {
      const untypedCritical = this.getCriticalExplosions(damageRoll, 0, 0);
      this.handleDamage(systemData, damage, "untyped", untypedCritical);
    }
    const damageTypeDefence = systemData.defences[damageType];
    if (damageTypeDefence.absorb) {
      this.absorbDamage(actor, systemData, damage);
      return;
    }
    if (damageTypeDefence.immune) {
      return;
    }
    if (damageTypeDefence.deflect && damageTypeDefence.conduct)
      ;
    else if (damageTypeDefence.deflect) {
      damage = this.deflectDamage(damageRoll);
    } else if (damageTypeDefence.conduct) {
      damage = this.conductDamage(damageRoll);
    }
    let criticalExplosions = this.getCriticalExplosions(damageRoll, damageTypeDefence.vulnerable, damageTypeDefence.negate);
    if (systemData.armour.defencesArray.includes(damageType)) {
      const penetrate = damageTypeDefence.penetrate + damagePenetrate;
      const adjustedBlock = Math.max(0, damageTypeDefence.block - penetrate);
      const adjustedPenetration = Math.max(0, penetrate - damageTypeDefence.block);
      const fullDamage = damage;
      let adjustedArmour = currentArmour + adjustedBlock - adjustedPenetration;
      adjustedArmour = adjustedArmour < 0 ? 0 : adjustedArmour;
      const damageThroughArmour = adjustedArmour - damage;
      if (damageThroughArmour < 0) {
        damage = Math.min(Math.abs(damageThroughArmour), fullDamage);
      } else {
        damage = 0;
      }
      const damageThroughBlock = adjustedBlock - fullDamage;
      const adjustedDamageThroughBlock = damageThroughBlock > 0 ? 0 : damageThroughBlock;
      newArmour = Math.max(0, currentArmour - Math.abs(adjustedDamageThroughBlock));
    }
    let updates = {};
    if (damage > 0) {
      updates = this.handleDamage(systemData, damage, damageType, criticalExplosions, attackData.attackProfile);
    }
    updates["system.armour.value"] = newArmour;
    actor.update(updates);
  }
  absorbDamage(actor, systemData, damage) {
    let currentBlood = systemData.blood.value;
    currentBlood = Math.min(currentBlood + damage, systemData.blood.fullMax);
    const maxBlood = Math.max(currentBlood, systemData.blood.max);
    actor.update({ "system.blood.value": currentBlood, "system.blood.max": maxBlood });
  }
  deflectDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    return damageRoll.total - diceResults;
  }
  conductDamage(damageRoll) {
    const diceResults = damageRoll.terms[0].rolls[0].terms[0].results.reduce((a, b) => a + b.result, 0);
    const totalDice = damageRoll.terms[0].rolls[0].terms[0].results.length;
    const maximiseDifference = totalDice * 10 - diceResults;
    return damageRoll.total + maximiseDifference;
  }
  getCriticalExplosions(damageRoll, vulnerable, negate) {
    const criticalThreshold = +damageRoll.terms[0].rolls[0].terms[0].modifiers[0].split("=")[1];
    const criticalChecks = damageRoll.terms[0].rolls[0].terms[0].results.filter((r) => r.result >= criticalThreshold).length;
    return criticalChecks - negate + vulnerable;
  }
  handleDamage(systemData, damage, damageType, criticalExplosions, attackProfile) {
    if (damageType === "heat") {
      return this.handleHeat(systemData, damage, criticalExplosions, attackProfile);
    }
    if (["crushing", "slashing", "piercing", "untyped"].includes(damageType)) {
      return this.handlePhysical(systemData, damage, criticalExplosions, attackProfile);
    }
  }
  handleHeat(systemData, damage, criticalExplosions, attackProfile) {
    systemData.wounds.healing += damage;
    systemData.state += attackProfile.thermalChange;
    const updates = { "system.wounds.healing": damage };
    if (criticalExplosions) {
      let currentBlood = systemData.blood.value -= damage;
      let maxBlood = systemData.blood.max -= damage;
      updates["system.blood.current"] = currentBlood;
      updates["system.blood.max"] = maxBlood;
    }
    return updates;
  }
  handlePhysical(systemData, damage, criticalExplosions, attackProfile) {
    const updates = {};
    if (systemData.canBleed) {
      let activeWounds = systemData.wounds.active += damage;
      updates["system.wounds.active"] = activeWounds;
    }
    if (systemData.suffersPain) {
      const pain = systemData.pain += damage;
      updates["system.pain"] = pain;
    }
    if (criticalExplosions) {
      switch (attackProfile.weapon.damageType) {
        case "crushing":
          this.handleCrushingCritical(updates, damage, criticalExplosions);
          break;
        case "slashing":
          this.handleSlashingCritical(updates, damage, criticalExplosions);
          break;
        case "piercing":
          this.handlePiercingCritical(updates, damage, criticalExplosions);
          break;
      }
    }
    return updates;
  }
  handleCrushingCritical(updates, damage, _) {
    updates["system.conditions.sundered"] = damage;
  }
  handleSlashingCritical(updates, damage, _) {
    updates["system.wounds.active"] += damage;
  }
  handlePiercingCritical(updates, _, criticalExplosions) {
    updates["system.conditions.gushingWounds"] = criticalExplosions;
  }
}
class AbbrewItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    if (!this.actor)
      return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;
    if (!this.system.formula) {
      ChatMessage.create({
        speaker,
        rollMode,
        flavor: label,
        content: item.system.description ?? ""
      });
    } else {
      const rollData = this.getRollData();
      const roll = new Roll(rollData.item.formula, rollData);
      roll.toMessage({
        speaker,
        rollMode,
        flavor: label
      });
      return roll;
    }
  }
  async use(config = {}, options2 = {}) {
    let item = this;
    item.system;
    item.actor.system;
    options2 = foundry.utils.mergeObject({
      configureDialog: true,
      createMessage: true,
      "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
    }, options2);
    const card = await this.displayCard(options2);
    return card;
  }
  async displayCard(options2 = {}) {
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: (token == null ? void 0 : token.uuid) || null,
      item: this,
      data: await this.getChatData(),
      labels: this.labels,
      hasAttack: this.hasAttack,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      isVersatile: this.isVersatile,
      isSpell: this.type === "spell",
      hasSave: this.hasSave,
      hasAreaTarget: this.hasAreaTarget,
      isTool: this.type === "tool",
      hasAbilityCheck: this.hasAbilityCheck
    };
    const html = await renderTemplate("systems/abbrew/templates/chat/item-card.hbs", templateData);
    const chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
      flags: { "core.canPopout": true }
    };
    chatData.flags = foundry.utils.mergeObject(chatData.flags, options2.flags);
    Hooks.callAll("abbrew.preDisplayCard", this, chatData, options2);
    const card = options2.createMessage !== false ? await ChatMessage.create(chatData) : chatData;
    Hooks.callAll("abbrew.displayCard", this, card);
    return card;
  }
  async getChatData(htmlOptions = {}) {
    const data = this.toObject().system;
    this.labels;
    data.description = await TextEditor.enrichHTML(data.description, {
      async: true,
      relativeTo: this,
      rollData: this.getRollData(),
      ...htmlOptions
    });
    const props = [];
    data.properties = props.filter((p) => !!p);
    return data;
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */
  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }
  static async _onChatCardAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;
    const actor = await this._getChatCardActor(card);
    if (!actor)
      return;
    const isTargetted = action === "contest";
    if (!(isTargetted || game.user.isGM || actor.isOwner)) {
      return;
    }
    const storedData = message.getFlag("abbrew", "itemData");
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      const err = game.i18n.format("ABBREW.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name });
      return ui.notifications.error(err);
    }
    await item.rollAttack({ event });
    button.disabled = false;
  }
  async rollAttack(options2 = {}) {
    const { rollData, parts } = this.getAttack();
    let title = `${this.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
    rollData.mod = 10;
    const rollConfig = foundry.utils.mergeObject({
      actor: this.actor,
      data: rollData,
      critical: this.getCriticalThreshold(),
      title,
      flavor: title,
      dialogOptions: {
        width: 400,
        top: options2.event ? options2.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {
        "flags.abbrew.roll": { type: "attack", itemId: this.id, itemUuid: this.uuid },
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      }
    }, options2);
    rollConfig.parts = parts.concat(options2.parts ?? []);
    const roll = await d10Roll(rollConfig);
    return roll;
  }
  // TODO: Allow to change
  getCriticalThreshold() {
    return 10;
  }
  // TODO: Check this is needed
  getAttack() {
    const rollData = this.getRollData();
    const parts = [];
    return { rollData, parts };
  }
  async update(data = {}, context = {}) {
    console.log("update item");
    super.update(data, context);
  }
  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }
  /**
  * Get the Actor which is the author of a chat card
  * @param {HTMLElement} card    The chat card being used
  * @returns {Actor|null}        The Actor document or null
  * @private
  */
  static async _getChatCardActor(card) {
    if (card.dataset.tokenId) {
      const token = await fromUuid(card.dataset.tokenId);
      if (!token)
        return null;
      return token.actor;
    }
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }
  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor[]}            An Array of Actor documents, if any
   * @private
   */
  static _getChatCardTargets(card) {
    let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
    if (!targets.length && game.user.character)
      targets = targets.concat(game.user.character.getActiveTokens());
    if (!targets.length)
      ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken"));
    return targets;
  }
}
async function ChatAbbrew(dataset, element, actor) {
  return;
}
function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        source: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : void 0,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({ disabled: !effect.disabled });
  }
}
function prepareActiveEffectCategories(effects) {
  const categories = {
    temporary: {
      type: "temporary",
      label: "Temporary Effects",
      effects: []
    },
    passive: {
      type: "passive",
      label: "Passive Effects",
      effects: []
    },
    inactive: {
      type: "inactive",
      label: "Inactive Effects",
      effects: []
    }
  };
  for (let e of effects) {
    e._getSourceName();
    if (e.disabled)
      categories.inactive.effects.push(e);
    else if (e.isTemporary)
      categories.temporary.effects.push(e);
    else
      categories.passive.effects.push(e);
  }
  return categories;
}
class AbbrewActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "actor"],
      template: "systems/abbrew/templates/actor/actor-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }
  /** @override */
  get template() {
    return `systems/abbrew/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }
  /* -------------------------------------------- */
  /** @override */
  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareAttacks(context);
      this._prepareArmours(context);
      context.displayConditions = actorData.system.displayConditions;
    }
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }
    context.rollData = context.actor.getRollData();
    context.effects = prepareActiveEffectCategories(this.actor.effects);
    return context;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.system.statistics)) {
      v.label = game.i18n.localize(CONFIG.ABBREW.statistics[k]) ?? k;
    }
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    const anatomy = [];
    const resources = [];
    const abilities = [];
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === "anatomy") {
        anatomy.push(i);
      } else if (i.type === "resource") {
        resources.push(i);
      } else if (i.type === "item") {
        gear.push(i);
      } else if (i.type === "feature") {
        features.push(i);
      } else if (i.type === "ability") {
        abilities.push(i);
      } else if (i.type === "spell") {
        if (i.system.spellLevel != void 0) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }
    context.resource = resources;
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.anatomy = anatomy;
    context.ability = abilities;
  }
  /* -------------------------------------------- */
  _prepareAttacks(context) {
    context.attacks = context.system.attacks;
  }
  /* -------------------------------------------- */
  _prepareArmours(context) {
    context.armours = context.system.armours;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });
    if (!this.isEditable)
      return;
    html.find(".conditions-header").click(async (ev) => {
      super.getData();
      await this.actor.update({ "system.displayConditions": !this.actor.system.displayConditions });
    });
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.actor));
    html.find(".rollable .item-image").click(this._onItemUse.bind(this));
    html.find(".equip-weapon").click(this._equipWeapon.bind(this));
    html.find(".rollable.attack").click(this._onAttackUse.bind(this));
    html.find(".equip-armour").click(this._equipArmour.bind(this));
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header"))
          return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  async _equipWeapon(event) {
    event.preventDefault();
    const dataSet = event.target.dataset;
    const weaponId = dataSet.weaponid;
    const equip = dataSet.equip === "true";
    await this.actor.equipWeapon(weaponId, equip);
  }
  async _equipArmour(event) {
    event.preventDefault();
    const dataSet = event.target.dataset;
    const armourId = dataSet.armourid;
    const equip = dataSet.equip === "true";
    await this.actor.equipArmour(armourId, equip);
  }
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    if (type === "ability" && this.actor.system.IP.current + 1 > this.actor.system.IP.total) {
      const err = game.i18n.format("ABBREW.InspirationPointsExceededWarn", { max: this.actor.system.IP.total });
      return ui.notifications.error(err);
    }
    const itemData = {
      name: game.i18n.format("ABBREW.ItemNew", { type: game.i18n.localize(`ITEM.Type${type.capitalize()}`) }),
      type,
      system: { ...header.dataset.type }
    };
    delete itemData.system.type;
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemUse(event) {
    event.preventDefault();
    const element = event.currentTarget;
    element.dataset;
    this.actor;
    ChatAbbrew();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.use({}, { event });
  }
  async _onAttackUse(event) {
    event.preventDefault();
    console.log(event);
    const data = event.target.dataset;
    const attack = this.actor.system.attacks.filter((a) => a.id === data.attack)[0];
    const attackProfile = attack.profiles.flat().filter((ap) => ap.id === +data.attackprofile)[0];
    useAttack(attack, attackProfile, this.actor);
  }
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var tagify_minExports = {};
var tagify_min = {
  get exports() {
    return tagify_minExports;
  },
  set exports(v) {
    tagify_minExports = v;
  }
};
(function(module, exports) {
  !function(t, e) {
    module.exports = e();
  }(commonjsGlobal, function() {
    function t(t2, e2) {
      var i2 = Object.keys(t2);
      if (Object.getOwnPropertySymbols) {
        var s2 = Object.getOwnPropertySymbols(t2);
        e2 && (s2 = s2.filter(function(e3) {
          return Object.getOwnPropertyDescriptor(t2, e3).enumerable;
        })), i2.push.apply(i2, s2);
      }
      return i2;
    }
    function e(e2) {
      for (var s2 = 1; s2 < arguments.length; s2++) {
        var a2 = null != arguments[s2] ? arguments[s2] : {};
        s2 % 2 ? t(Object(a2), true).forEach(function(t2) {
          i(e2, t2, a2[t2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(a2)) : t(Object(a2)).forEach(function(t2) {
          Object.defineProperty(e2, t2, Object.getOwnPropertyDescriptor(a2, t2));
        });
      }
      return e2;
    }
    function i(t2, e2, i2) {
      return (e2 = function(t3) {
        var e3 = function(t4, e4) {
          if ("object" != typeof t4 || null === t4)
            return t4;
          var i3 = t4[Symbol.toPrimitive];
          if (void 0 !== i3) {
            var s2 = i3.call(t4, e4 || "default");
            if ("object" != typeof s2)
              return s2;
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return ("string" === e4 ? String : Number)(t4);
        }(t3, "string");
        return "symbol" == typeof e3 ? e3 : String(e3);
      }(e2)) in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
    }
    const s = (t2, e2, i2, s2) => (t2 = "" + t2, e2 = "" + e2, s2 && (t2 = t2.trim(), e2 = e2.trim()), i2 ? t2 == e2 : t2.toLowerCase() == e2.toLowerCase()), a = (t2, e2) => t2 && Array.isArray(t2) && t2.map((t3) => n(t3, e2));
    function n(t2, e2) {
      var i2, s2 = {};
      for (i2 in t2)
        e2.indexOf(i2) < 0 && (s2[i2] = t2[i2]);
      return s2;
    }
    function o(t2) {
      var e2 = document.createElement("div");
      return t2.replace(/\&#?[0-9a-z]+;/gi, function(t3) {
        return e2.innerHTML = t3, e2.innerText;
      });
    }
    function r(t2) {
      return new DOMParser().parseFromString(t2.trim(), "text/html").body.firstElementChild;
    }
    function l(t2, e2) {
      for (e2 = e2 || "previous"; t2 = t2[e2 + "Sibling"]; )
        if (3 == t2.nodeType)
          return t2;
    }
    function d(t2) {
      return "string" == typeof t2 ? t2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/`|'/g, "&#039;") : t2;
    }
    function h(t2) {
      var e2 = Object.prototype.toString.call(t2).split(" ")[1].slice(0, -1);
      return t2 === Object(t2) && "Array" != e2 && "Function" != e2 && "RegExp" != e2 && "HTMLUnknownElement" != e2;
    }
    function g(t2, e2, i2) {
      function s2(t3, e3) {
        for (var i3 in e3)
          if (e3.hasOwnProperty(i3)) {
            if (h(e3[i3])) {
              h(t3[i3]) ? s2(t3[i3], e3[i3]) : t3[i3] = Object.assign({}, e3[i3]);
              continue;
            }
            if (Array.isArray(e3[i3])) {
              t3[i3] = Object.assign([], e3[i3]);
              continue;
            }
            t3[i3] = e3[i3];
          }
      }
      return t2 instanceof Object || (t2 = {}), s2(t2, e2), i2 && s2(t2, i2), t2;
    }
    function p() {
      const t2 = [], e2 = {};
      for (let i2 of arguments)
        for (let s2 of i2)
          h(s2) ? e2[s2.value] || (t2.push(s2), e2[s2.value] = 1) : t2.includes(s2) || t2.push(s2);
      return t2;
    }
    function c(t2) {
      return String.prototype.normalize ? "string" == typeof t2 ? t2.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : void 0 : t2;
    }
    var u = () => /(?=.*chrome)(?=.*android)/i.test(navigator.userAgent);
    function m() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (t2) => (t2 ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> t2 / 4).toString(16));
    }
    function v(t2) {
      return t2 && t2.classList && t2.classList.contains(this.settings.classNames.tag);
    }
    function f(t2, e2) {
      var i2 = window.getSelection();
      return e2 = e2 || i2.getRangeAt(0), "string" == typeof t2 && (t2 = document.createTextNode(t2)), e2 && (e2.deleteContents(), e2.insertNode(t2)), t2;
    }
    function T(t2, e2, i2) {
      return t2 ? (e2 && (t2.__tagifyTagData = i2 ? e2 : g({}, t2.__tagifyTagData || {}, e2)), t2.__tagifyTagData) : (console.warn("tag element doesn't exist", t2, e2), e2);
    }
    var w = { delimiters: ",", pattern: null, tagTextProp: "value", maxTags: 1 / 0, callbacks: {}, addTagOnBlur: true, onChangeAfterBlur: true, duplicates: false, whitelist: [], blacklist: [], enforceWhitelist: false, userInput: true, keepInvalidTags: false, createInvalidTags: true, mixTagsAllowedAfter: /,|\.|\:|\s/, mixTagsInterpolator: ["[[", "]]"], backspace: true, skipInvalid: false, pasteAsTags: true, editTags: { clicks: 2, keepInvalid: true }, transformTag: () => {
    }, trim: true, a11y: { focusableTags: false }, mixMode: { insertAfterTag: " " }, autoComplete: { enabled: true, rightKey: false }, classNames: { namespace: "tagify", mixMode: "tagify--mix", selectMode: "tagify--select", input: "tagify__input", focus: "tagify--focus", tagNoAnimation: "tagify--noAnim", tagInvalid: "tagify--invalid", tagNotAllowed: "tagify--notAllowed", scopeLoading: "tagify--loading", hasMaxTags: "tagify--hasMaxTags", hasNoTags: "tagify--noTags", empty: "tagify--empty", inputInvalid: "tagify__input--invalid", dropdown: "tagify__dropdown", dropdownWrapper: "tagify__dropdown__wrapper", dropdownHeader: "tagify__dropdown__header", dropdownFooter: "tagify__dropdown__footer", dropdownItem: "tagify__dropdown__item", dropdownItemActive: "tagify__dropdown__item--active", dropdownItemHidden: "tagify__dropdown__item--hidden", dropdownInital: "tagify__dropdown--initial", tag: "tagify__tag", tagText: "tagify__tag-text", tagX: "tagify__tag__removeBtn", tagLoading: "tagify__tag--loading", tagEditing: "tagify__tag--editable", tagFlash: "tagify__tag--flash", tagHide: "tagify__tag--hide" }, dropdown: { classname: "", enabled: 2, maxItems: 10, searchKeys: ["value", "searchBy"], fuzzySearch: true, caseSensitive: false, accentedSearch: true, includeSelectedTags: false, highlightFirst: false, closeOnSelect: true, clearOnSelect: true, position: "all", appendTarget: null }, hooks: { beforeRemoveTag: () => Promise.resolve(), beforePaste: () => Promise.resolve(), suggestionClick: () => Promise.resolve() } };
    function b() {
      this.dropdown = {};
      for (let t2 in this._dropdown)
        this.dropdown[t2] = "function" == typeof this._dropdown[t2] ? this._dropdown[t2].bind(this) : this._dropdown[t2];
      this.dropdown.refs();
    }
    var y = { refs() {
      this.DOM.dropdown = this.parseTemplate("dropdown", [this.settings]), this.DOM.dropdown.content = this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-wrapper']");
    }, getHeaderRef() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-header']");
    }, getFooterRef() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-footer']");
    }, getAllSuggestionsRefs() {
      return [...this.DOM.dropdown.content.querySelectorAll(this.settings.classNames.dropdownItemSelector)];
    }, show(t2) {
      var e2, i2, a2, n2 = this.settings, o2 = "mix" == n2.mode && !n2.enforceWhitelist, r2 = !n2.whitelist || !n2.whitelist.length, l2 = "manual" == n2.dropdown.position;
      if (t2 = void 0 === t2 ? this.state.inputText : t2, !(r2 && !o2 && !n2.templates.dropdownItemNoMatch || false === n2.dropdown.enable || this.state.isLoading || this.settings.readonly)) {
        if (clearTimeout(this.dropdownHide__bindEventsTimeout), this.suggestedListItems = this.dropdown.filterListItems(t2), t2 && !this.suggestedListItems.length && (this.trigger("dropdown:noMatch", t2), n2.templates.dropdownItemNoMatch && (a2 = n2.templates.dropdownItemNoMatch.call(this, { value: t2 }))), !a2) {
          if (this.suggestedListItems.length)
            t2 && o2 && !this.state.editing.scope && !s(this.suggestedListItems[0].value, t2) && this.suggestedListItems.unshift({ value: t2 });
          else {
            if (!t2 || !o2 || this.state.editing.scope)
              return this.input.autocomplete.suggest.call(this), void this.dropdown.hide();
            this.suggestedListItems = [{ value: t2 }];
          }
          i2 = "" + (h(e2 = this.suggestedListItems[0]) ? e2.value : e2), n2.autoComplete && i2 && 0 == i2.indexOf(t2) && this.input.autocomplete.suggest.call(this, e2);
        }
        this.dropdown.fill(a2), n2.dropdown.highlightFirst && this.dropdown.highlightOption(this.DOM.dropdown.content.querySelector(n2.classNames.dropdownItemSelector)), this.state.dropdown.visible || setTimeout(this.dropdown.events.binding.bind(this)), this.state.dropdown.visible = t2 || true, this.state.dropdown.query = t2, this.setStateSelection(), l2 || setTimeout(() => {
          this.dropdown.position(), this.dropdown.render();
        }), setTimeout(() => {
          this.trigger("dropdown:show", this.DOM.dropdown);
        });
      }
    }, hide(t2) {
      var e2 = this.DOM, i2 = e2.scope, s2 = e2.dropdown, a2 = "manual" == this.settings.dropdown.position && !t2;
      if (s2 && document.body.contains(s2) && !a2)
        return window.removeEventListener("resize", this.dropdown.position), this.dropdown.events.binding.call(this, false), i2.setAttribute("aria-expanded", false), s2.parentNode.removeChild(s2), setTimeout(() => {
          this.state.dropdown.visible = false;
        }, 100), this.state.dropdown.query = this.state.ddItemData = this.state.ddItemElm = this.state.selection = null, this.state.tag && this.state.tag.value.length && (this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag), this.trigger("dropdown:hide", s2), this;
    }, toggle(t2) {
      this.dropdown[this.state.dropdown.visible && !t2 ? "hide" : "show"]();
    }, render() {
      var t2, e2, i2, s2 = (t2 = this.DOM.dropdown, (i2 = t2.cloneNode(true)).style.cssText = "position:fixed; top:-9999px; opacity:0", document.body.appendChild(i2), e2 = i2.clientHeight, i2.parentNode.removeChild(i2), e2), a2 = this.settings;
      return "number" == typeof a2.dropdown.enabled && a2.dropdown.enabled >= 0 ? (this.DOM.scope.setAttribute("aria-expanded", true), document.body.contains(this.DOM.dropdown) || (this.DOM.dropdown.classList.add(a2.classNames.dropdownInital), this.dropdown.position(s2), a2.dropdown.appendTarget.appendChild(this.DOM.dropdown), setTimeout(() => this.DOM.dropdown.classList.remove(a2.classNames.dropdownInital))), this) : this;
    }, fill(t2) {
      t2 = "string" == typeof t2 ? t2 : this.dropdown.createListHTML(t2 || this.suggestedListItems);
      var e2, i2 = this.settings.templates.dropdownContent.call(this, t2);
      this.DOM.dropdown.content.innerHTML = (e2 = i2) ? e2.replace(/\>[\r\n ]+\</g, "><").replace(/(<.*?>)|\s+/g, (t3, e3) => e3 || " ") : "";
    }, fillHeaderFooter() {
      var t2 = this.dropdown.filterListItems(this.state.dropdown.query), e2 = this.parseTemplate("dropdownHeader", [t2]), i2 = this.parseTemplate("dropdownFooter", [t2]), s2 = this.dropdown.getHeaderRef(), a2 = this.dropdown.getFooterRef();
      e2 && (s2 == null ? void 0 : s2.parentNode.replaceChild(e2, s2)), i2 && (a2 == null ? void 0 : a2.parentNode.replaceChild(i2, a2));
    }, refilter(t2) {
      t2 = t2 || this.state.dropdown.query || "", this.suggestedListItems = this.dropdown.filterListItems(t2), this.dropdown.fill(), this.suggestedListItems.length || this.dropdown.hide(), this.trigger("dropdown:updated", this.DOM.dropdown);
    }, position(t2) {
      var e2 = this.settings.dropdown;
      if ("manual" != e2.position) {
        var i2, s2, a2, n2, o2, r2, l2 = this.DOM.dropdown, d2 = e2.placeAbove, h2 = e2.appendTarget === document.body, g2 = h2 ? window.pageYOffset : e2.appendTarget.scrollTop, p2 = document.fullscreenElement || document.webkitFullscreenElement || document.documentElement, c2 = p2.clientHeight, u2 = Math.max(p2.clientWidth || 0, window.innerWidth || 0) > 480 ? e2.position : "all", m2 = this.DOM["input" == u2 ? "input" : "scope"];
        if (t2 = t2 || l2.clientHeight, this.state.dropdown.visible) {
          if ("text" == u2 ? (a2 = (i2 = function() {
            const t3 = document.getSelection();
            if (t3.rangeCount) {
              const e3 = t3.getRangeAt(0), i3 = e3.startContainer, s3 = e3.startOffset;
              let a3, n3;
              if (s3 > 0)
                return n3 = document.createRange(), n3.setStart(i3, s3 - 1), n3.setEnd(i3, s3), a3 = n3.getBoundingClientRect(), { left: a3.right, top: a3.top, bottom: a3.bottom };
              if (i3.getBoundingClientRect)
                return i3.getBoundingClientRect();
            }
            return { left: -9999, top: -9999 };
          }()).bottom, s2 = i2.top, n2 = i2.left, o2 = "auto") : (r2 = function(t3) {
            for (var e3 = 0, i3 = 0; t3 && t3 != p2; )
              e3 += t3.offsetLeft || 0, i3 += t3.offsetTop || 0, t3 = t3.parentNode;
            return { left: e3, top: i3 };
          }(e2.appendTarget), s2 = (i2 = m2.getBoundingClientRect()).top - r2.top, a2 = i2.bottom - 1 - r2.top, n2 = i2.left - r2.left, o2 = i2.width + "px"), !h2) {
            let t3 = function() {
              for (var t4 = 0, i3 = e2.appendTarget.parentNode; i3; )
                t4 += i3.scrollTop || 0, i3 = i3.parentNode;
              return t4;
            }();
            s2 += t3, a2 += t3;
          }
          s2 = Math.floor(s2), a2 = Math.ceil(a2), d2 = void 0 === d2 ? c2 - i2.bottom < t2 : d2, l2.style.cssText = "left:" + (n2 + window.pageXOffset) + "px; width:" + o2 + ";" + (d2 ? "top: " + (s2 + g2) + "px" : "top: " + (a2 + g2) + "px"), l2.setAttribute("placement", d2 ? "top" : "bottom"), l2.setAttribute("position", u2);
        }
      }
    }, events: { binding() {
      let t2 = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
      var e2 = this.dropdown.events.callbacks, i2 = this.listeners.dropdown = this.listeners.dropdown || { position: this.dropdown.position.bind(this, null), onKeyDown: e2.onKeyDown.bind(this), onMouseOver: e2.onMouseOver.bind(this), onMouseLeave: e2.onMouseLeave.bind(this), onClick: e2.onClick.bind(this), onScroll: e2.onScroll.bind(this) }, s2 = t2 ? "addEventListener" : "removeEventListener";
      "manual" != this.settings.dropdown.position && (document[s2]("scroll", i2.position, true), window[s2]("resize", i2.position), window[s2]("keydown", i2.onKeyDown)), this.DOM.dropdown[s2]("mouseover", i2.onMouseOver), this.DOM.dropdown[s2]("mouseleave", i2.onMouseLeave), this.DOM.dropdown[s2]("mousedown", i2.onClick), this.DOM.dropdown.content[s2]("scroll", i2.onScroll);
    }, callbacks: { onKeyDown(t2) {
      if (this.state.hasFocus && !this.state.composing) {
        var e2 = this.DOM.dropdown.querySelector(this.settings.classNames.dropdownItemActiveSelector), i2 = this.dropdown.getSuggestionDataByNode(e2);
        switch (t2.key) {
          case "ArrowDown":
          case "ArrowUp":
          case "Down":
          case "Up":
            t2.preventDefault();
            var s2 = this.dropdown.getAllSuggestionsRefs(), a2 = "ArrowUp" == t2.key || "Up" == t2.key;
            e2 && (e2 = this.dropdown.getNextOrPrevOption(e2, !a2)), e2 && e2.matches(this.settings.classNames.dropdownItemSelector) || (e2 = s2[a2 ? s2.length - 1 : 0]), this.dropdown.highlightOption(e2, true);
            break;
          case "Escape":
          case "Esc":
            this.dropdown.hide();
            break;
          case "ArrowRight":
            if (this.state.actions.ArrowLeft)
              return;
          case "Tab":
            if ("mix" != this.settings.mode && e2 && !this.settings.autoComplete.rightKey && !this.state.editing) {
              t2.preventDefault();
              var n2 = this.dropdown.getMappedValue(i2);
              return this.input.autocomplete.set.call(this, n2), false;
            }
            return true;
          case "Enter":
            t2.preventDefault(), this.settings.hooks.suggestionClick(t2, { tagify: this, tagData: i2, suggestionElm: e2 }).then(() => {
              if (e2)
                return this.dropdown.selectOption(e2), e2 = this.dropdown.getNextOrPrevOption(e2, !a2), void this.dropdown.highlightOption(e2);
              this.dropdown.hide(), "mix" != this.settings.mode && this.addTags(this.state.inputText.trim(), true);
            }).catch((t3) => t3);
            break;
          case "Backspace": {
            if ("mix" == this.settings.mode || this.state.editing.scope)
              return;
            const t3 = this.input.raw.call(this);
            "" != t3 && 8203 != t3.charCodeAt(0) || (true === this.settings.backspace ? this.removeTags() : "edit" == this.settings.backspace && setTimeout(this.editTag.bind(this), 0));
          }
        }
      }
    }, onMouseOver(t2) {
      var e2 = t2.target.closest(this.settings.classNames.dropdownItemSelector);
      e2 && this.dropdown.highlightOption(e2);
    }, onMouseLeave(t2) {
      this.dropdown.highlightOption();
    }, onClick(t2) {
      if (0 == t2.button && t2.target != this.DOM.dropdown && t2.target != this.DOM.dropdown.content) {
        var e2 = t2.target.closest(this.settings.classNames.dropdownItemSelector), i2 = this.dropdown.getSuggestionDataByNode(e2);
        this.state.actions.selectOption = true, setTimeout(() => this.state.actions.selectOption = false, 50), this.settings.hooks.suggestionClick(t2, { tagify: this, tagData: i2, suggestionElm: e2 }).then(() => {
          e2 ? this.dropdown.selectOption(e2, t2) : this.dropdown.hide();
        }).catch((t3) => console.warn(t3));
      }
    }, onScroll(t2) {
      var e2 = t2.target, i2 = e2.scrollTop / (e2.scrollHeight - e2.parentNode.clientHeight) * 100;
      this.trigger("dropdown:scroll", { percentage: Math.round(i2) });
    } } }, getSuggestionDataByNode(t2) {
      var e2 = t2 && t2.getAttribute("value");
      return this.suggestedListItems.find((t3) => t3.value == e2) || null;
    }, getNextOrPrevOption(t2) {
      let e2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
      var i2 = this.dropdown.getAllSuggestionsRefs(), s2 = i2.findIndex((e3) => e3 === t2);
      return e2 ? i2[s2 + 1] : i2[s2 - 1];
    }, highlightOption(t2, e2) {
      var i2, s2 = this.settings.classNames.dropdownItemActive;
      if (this.state.ddItemElm && (this.state.ddItemElm.classList.remove(s2), this.state.ddItemElm.removeAttribute("aria-selected")), !t2)
        return this.state.ddItemData = null, this.state.ddItemElm = null, void this.input.autocomplete.suggest.call(this);
      i2 = this.dropdown.getSuggestionDataByNode(t2), this.state.ddItemData = i2, this.state.ddItemElm = t2, t2.classList.add(s2), t2.setAttribute("aria-selected", true), e2 && (t2.parentNode.scrollTop = t2.clientHeight + t2.offsetTop - t2.parentNode.clientHeight), this.settings.autoComplete && (this.input.autocomplete.suggest.call(this, i2), this.dropdown.position());
    }, selectOption(t2, e2) {
      var i2 = this.settings.dropdown, s2 = i2.clearOnSelect, a2 = i2.closeOnSelect;
      if (!t2)
        return this.addTags(this.state.inputText, true), void (a2 && this.dropdown.hide());
      e2 = e2 || {};
      var n2 = t2.getAttribute("value"), o2 = "noMatch" == n2, r2 = this.suggestedListItems.find((t3) => (t3.value ?? t3) == n2);
      this.trigger("dropdown:select", { data: r2, elm: t2, event: e2 }), n2 && (r2 || o2) ? (this.state.editing ? this.onEditTagDone(null, g({ __isValid: true }, this.normalizeTags([r2])[0])) : this["mix" == this.settings.mode ? "addMixTags" : "addTags"]([r2 || this.input.raw.call(this)], s2), this.DOM.input.parentNode && (setTimeout(() => {
        this.DOM.input.focus(), this.toggleFocusClass(true);
      }), a2 && setTimeout(this.dropdown.hide.bind(this)), t2.addEventListener("transitionend", () => {
        this.dropdown.fillHeaderFooter(), setTimeout(() => t2.remove(), 100);
      }, { once: true }), t2.classList.add(this.settings.classNames.dropdownItemHidden))) : a2 && setTimeout(this.dropdown.hide.bind(this));
    }, selectAll(t2) {
      this.suggestedListItems.length = 0, this.dropdown.hide(), this.dropdown.filterListItems("");
      var e2 = this.dropdown.filterListItems("");
      return t2 || (e2 = this.state.dropdown.suggestions), this.addTags(e2, true), this;
    }, filterListItems(t2, e2) {
      var i2, s2, a2, n2, o2, r2 = this.settings, l2 = r2.dropdown, d2 = (e2 = e2 || {}, []), g2 = [], p2 = r2.whitelist, u2 = l2.maxItems >= 0 ? l2.maxItems : 1 / 0, m2 = l2.searchKeys, v2 = 0;
      if (!(t2 = "select" == r2.mode && this.value.length && this.value[0][r2.tagTextProp] == t2 ? "" : t2) || !m2.length)
        return d2 = l2.includeSelectedTags ? p2 : p2.filter((t3) => !this.isTagDuplicate(h(t3) ? t3.value : t3)), this.state.dropdown.suggestions = d2, d2.slice(0, u2);
      function f2(t3, e3) {
        return e3.toLowerCase().split(" ").every((e4) => t3.includes(e4.toLowerCase()));
      }
      for (o2 = l2.caseSensitive ? "" + t2 : ("" + t2).toLowerCase(); v2 < p2.length; v2++) {
        let t3, r3;
        i2 = p2[v2] instanceof Object ? p2[v2] : { value: p2[v2] };
        let u3 = !Object.keys(i2).some((t4) => m2.includes(t4)) ? ["value"] : m2;
        l2.fuzzySearch && !e2.exact ? (a2 = u3.reduce((t4, e3) => t4 + " " + (i2[e3] || ""), "").toLowerCase().trim(), l2.accentedSearch && (a2 = c(a2), o2 = c(o2)), t3 = 0 == a2.indexOf(o2), r3 = a2 === o2, s2 = f2(a2, o2)) : (t3 = true, s2 = u3.some((t4) => {
          var s3 = "" + (i2[t4] || "");
          return l2.accentedSearch && (s3 = c(s3), o2 = c(o2)), l2.caseSensitive || (s3 = s3.toLowerCase()), r3 = s3 === o2, e2.exact ? s3 === o2 : 0 == s3.indexOf(o2);
        })), n2 = !l2.includeSelectedTags && this.isTagDuplicate(h(i2) ? i2.value : i2), s2 && !n2 && (r3 && t3 ? g2.push(i2) : "startsWith" == l2.sortby && t3 ? d2.unshift(i2) : d2.push(i2));
      }
      return this.state.dropdown.suggestions = g2.concat(d2), "function" == typeof l2.sortby ? l2.sortby(g2.concat(d2), o2) : g2.concat(d2).slice(0, u2);
    }, getMappedValue(t2) {
      var e2 = this.settings.dropdown.mapValueTo;
      return e2 ? "function" == typeof e2 ? e2(t2) : t2[e2] || t2.value : t2.value;
    }, createListHTML(t2) {
      return g([], t2).map((t3, i2) => {
        "string" != typeof t3 && "number" != typeof t3 || (t3 = { value: t3 });
        var s2 = this.dropdown.getMappedValue(t3);
        return s2 = "string" == typeof s2 ? d(s2) : s2, this.settings.templates.dropdownItem.apply(this, [e(e({}, t3), {}, { mappedValue: s2 }), this]);
      }).join("");
    } };
    const x = "@yaireo/tagify/";
    var O, D = { empty: "empty", exceed: "number of tags exceeded", pattern: "pattern mismatch", duplicate: "already exists", notAllowed: "not allowed" }, M = { wrapper: (t2, e2) => `<tags class="${e2.classNames.namespace} ${e2.mode ? `${e2.classNames[e2.mode + "Mode"]}` : ""} ${t2.className}"
                    ${e2.readonly ? "readonly" : ""}
                    ${e2.disabled ? "disabled" : ""}
                    ${e2.required ? "required" : ""}
                    ${"select" === e2.mode ? "spellcheck='false'" : ""}
                    tabIndex="-1">
            <span ${!e2.readonly && e2.userInput ? "contenteditable" : ""} tabIndex="0" data-placeholder="${e2.placeholder || "&#8203;"}" aria-placeholder="${e2.placeholder || ""}"
                class="${e2.classNames.input}"
                role="textbox"
                aria-autocomplete="both"
                aria-multiline="${"mix" == e2.mode}"></span>
                &#8203;
        </tags>`, tag(t2, e2) {
      let i2 = e2.settings;
      return `<tag title="${t2.title || t2.value}"
                    contenteditable='false'
                    spellcheck='false'
                    tabIndex="${i2.a11y.focusableTags ? 0 : -1}"
                    class="${i2.classNames.tag} ${t2.class || ""}"
                    ${this.getAttributes(t2)}>
            <x title='' class="${i2.classNames.tagX}" role='button' aria-label='remove tag'></x>
            <div>
                <span class="${i2.classNames.tagText}">${t2[i2.tagTextProp] || t2.value}</span>
            </div>
        </tag>`;
    }, dropdown(t2) {
      var e2 = t2.dropdown, i2 = "manual" == e2.position, s2 = `${t2.classNames.dropdown}`;
      return `<div class="${i2 ? "" : s2} ${e2.classname}" role="listbox" aria-labelledby="dropdown">
                    <div data-selector='tagify-suggestions-wrapper' class="${t2.classNames.dropdownWrapper}"></div>
                </div>`;
    }, dropdownContent(t2) {
      var e2 = this.settings, i2 = this.state.dropdown.suggestions;
      return `
            ${e2.templates.dropdownHeader.call(this, i2)}
            ${t2}
            ${e2.templates.dropdownFooter.call(this, i2)}
        `;
    }, dropdownItem(t2) {
      return `<div ${this.getAttributes(t2)}
                    class='${this.settings.classNames.dropdownItem} ${t2.class ? t2.class : ""}'
                    tabindex="0"
                    role="option">${t2.mappedValue || t2.value}</div>`;
    }, dropdownHeader(t2) {
      return `<header data-selector='tagify-suggestions-header' class="${this.settings.classNames.dropdownHeader}"></header>`;
    }, dropdownFooter(t2) {
      var e2 = t2.length - this.settings.dropdown.maxItems;
      return e2 > 0 ? `<footer data-selector='tagify-suggestions-footer' class="${this.settings.classNames.dropdownFooter}">
                ${e2} more items. Refine your search.
            </footer>` : "";
    }, dropdownItemNoMatch: null };
    var I = { customBinding() {
      this.customEventsList.forEach((t2) => {
        this.on(t2, this.settings.callbacks[t2]);
      });
    }, binding() {
      let t2 = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
      var e2, i2 = this.events.callbacks, s2 = t2 ? "addEventListener" : "removeEventListener";
      if (!this.state.mainEvents || !t2) {
        for (var a2 in this.state.mainEvents = t2, t2 && !this.listeners.main && (this.events.bindGlobal.call(this), this.settings.isJQueryPlugin && jQuery(this.DOM.originalInput).on("tagify.removeAllTags", this.removeAllTags.bind(this))), e2 = this.listeners.main = this.listeners.main || { focus: ["input", i2.onFocusBlur.bind(this)], keydown: ["input", i2.onKeydown.bind(this)], click: ["scope", i2.onClickScope.bind(this)], dblclick: ["scope", i2.onDoubleClickScope.bind(this)], paste: ["input", i2.onPaste.bind(this)], drop: ["input", i2.onDrop.bind(this)], compositionstart: ["input", i2.onCompositionStart.bind(this)], compositionend: ["input", i2.onCompositionEnd.bind(this)] })
          this.DOM[e2[a2][0]][s2](a2, e2[a2][1]);
        clearInterval(this.listeners.main.originalInputValueObserverInterval), this.listeners.main.originalInputValueObserverInterval = setInterval(i2.observeOriginalInputValue.bind(this), 500);
        var n2 = this.listeners.main.inputMutationObserver || new MutationObserver(i2.onInputDOMChange.bind(this));
        n2.disconnect(), "mix" == this.settings.mode && n2.observe(this.DOM.input, { childList: true });
      }
    }, bindGlobal(t2) {
      var e2, i2 = this.events.callbacks, s2 = t2 ? "removeEventListener" : "addEventListener";
      if (this.listeners && (t2 || !this.listeners.global))
        for (e2 of (this.listeners.global = this.listeners.global || [{ type: this.isIE ? "keydown" : "input", target: this.DOM.input, cb: i2[this.isIE ? "onInputIE" : "onInput"].bind(this) }, { type: "keydown", target: window, cb: i2.onWindowKeyDown.bind(this) }, { type: "blur", target: this.DOM.input, cb: i2.onFocusBlur.bind(this) }, { type: "click", target: document, cb: i2.onClickAnywhere.bind(this) }], this.listeners.global))
          e2.target[s2](e2.type, e2.cb);
    }, unbindGlobal() {
      this.events.bindGlobal.call(this, true);
    }, callbacks: { onFocusBlur(t2) {
      var _a, _b;
      var e2 = this.settings, i2 = t2.target ? this.trim(t2.target.textContent) : "", s2 = (_b = (_a = this.value) == null ? void 0 : _a[0]) == null ? void 0 : _b[e2.tagTextProp], a2 = t2.type, n2 = e2.dropdown.enabled >= 0, o2 = { relatedTarget: t2.relatedTarget }, r2 = this.state.actions.selectOption && (n2 || !e2.dropdown.closeOnSelect), l2 = this.state.actions.addNew && n2, d2 = t2.relatedTarget && v.call(this, t2.relatedTarget) && this.DOM.scope.contains(t2.relatedTarget);
      if ("blur" == a2) {
        if (t2.relatedTarget === this.DOM.scope)
          return this.dropdown.hide(), void this.DOM.input.focus();
        this.postUpdate(), e2.onChangeAfterBlur && this.triggerChangeEvent();
      }
      if (!r2 && !l2)
        if (this.state.hasFocus = "focus" == a2 && +/* @__PURE__ */ new Date(), this.toggleFocusClass(this.state.hasFocus), "mix" != e2.mode) {
          if ("focus" == a2)
            return this.trigger("focus", o2), void (0 !== e2.dropdown.enabled && e2.userInput || this.dropdown.show(this.value.length ? "" : void 0));
          "blur" == a2 && (this.trigger("blur", o2), this.loading(false), "select" == e2.mode && (d2 && (this.removeTags(), i2 = ""), s2 === i2 && (i2 = "")), i2 && !this.state.actions.selectOption && e2.addTagOnBlur && this.addTags(i2, true)), this.DOM.input.removeAttribute("style"), this.dropdown.hide();
        } else
          "focus" == a2 ? this.trigger("focus", o2) : "blur" == t2.type && (this.trigger("blur", o2), this.loading(false), this.dropdown.hide(), this.state.dropdown.visible = void 0, this.setStateSelection());
    }, onCompositionStart(t2) {
      this.state.composing = true;
    }, onCompositionEnd(t2) {
      this.state.composing = false;
    }, onWindowKeyDown(t2) {
      var e2, i2 = document.activeElement, s2 = v.call(this, i2) && this.DOM.scope.contains(document.activeElement), a2 = s2 && i2.hasAttribute("readonly");
      if (s2 && !a2)
        switch (e2 = i2.nextElementSibling, t2.key) {
          case "Backspace":
            this.settings.readonly || (this.removeTags(i2), (e2 || this.DOM.input).focus());
            break;
          case "Enter":
            setTimeout(this.editTag.bind(this), 0, i2);
        }
    }, onKeydown(t2) {
      var e2 = this.settings;
      if (!this.state.composing && e2.userInput) {
        "select" == e2.mode && e2.enforceWhitelist && this.value.length && "Tab" != t2.key && t2.preventDefault();
        var i2 = this.trim(t2.target.textContent);
        if (this.trigger("keydown", { event: t2 }), "mix" == e2.mode) {
          switch (t2.key) {
            case "Left":
            case "ArrowLeft":
              this.state.actions.ArrowLeft = true;
              break;
            case "Delete":
            case "Backspace":
              if (this.state.editing)
                return;
              var s2 = document.getSelection(), a2 = "Delete" == t2.key && s2.anchorOffset == (s2.anchorNode.length || 0), n2 = s2.anchorNode.previousSibling, r2 = 1 == s2.anchorNode.nodeType || !s2.anchorOffset && n2 && 1 == n2.nodeType && s2.anchorNode.previousSibling;
              o(this.DOM.input.innerHTML);
              var d2, h2, g2, p2 = this.getTagElms();
              if ("edit" == e2.backspace && r2)
                return d2 = 1 == s2.anchorNode.nodeType ? null : s2.anchorNode.previousElementSibling, setTimeout(this.editTag.bind(this), 0, d2), void t2.preventDefault();
              if (u() && r2 instanceof Element)
                return g2 = l(r2), r2.hasAttribute("readonly") || r2.remove(), this.DOM.input.focus(), void setTimeout(() => {
                  this.placeCaretAfterNode(g2), this.DOM.input.click();
                });
              if ("BR" == s2.anchorNode.nodeName)
                return;
              if ((a2 || r2) && 1 == s2.anchorNode.nodeType ? h2 = 0 == s2.anchorOffset ? a2 ? p2[0] : null : p2[Math.min(p2.length, s2.anchorOffset) - 1] : a2 ? h2 = s2.anchorNode.nextElementSibling : r2 instanceof Element && (h2 = r2), 3 == s2.anchorNode.nodeType && !s2.anchorNode.nodeValue && s2.anchorNode.previousElementSibling && t2.preventDefault(), (r2 || a2) && !e2.backspace)
                return void t2.preventDefault();
              if ("Range" != s2.type && !s2.anchorOffset && s2.anchorNode == this.DOM.input && "Delete" != t2.key)
                return void t2.preventDefault();
              if ("Range" != s2.type && h2 && h2.hasAttribute("readonly"))
                return void this.placeCaretAfterNode(l(h2));
              clearTimeout(O), O = setTimeout(() => {
                var t3 = document.getSelection();
                o(this.DOM.input.innerHTML), !a2 && t3.anchorNode.previousSibling, this.value = [].map.call(p2, (t4, e3) => {
                  var i3 = T(t4);
                  if (t4.parentNode || i3.readonly)
                    return i3;
                  this.trigger("remove", { tag: t4, index: e3, data: i3 });
                }).filter((t4) => t4);
              }, 20);
          }
          return true;
        }
        switch (t2.key) {
          case "Backspace":
            "select" == e2.mode && e2.enforceWhitelist && this.value.length ? this.removeTags() : this.state.dropdown.visible && "manual" != e2.dropdown.position || "" != t2.target.textContent && 8203 != i2.charCodeAt(0) || (true === e2.backspace ? this.removeTags() : "edit" == e2.backspace && setTimeout(this.editTag.bind(this), 0));
            break;
          case "Esc":
          case "Escape":
            if (this.state.dropdown.visible)
              return;
            t2.target.blur();
            break;
          case "Down":
          case "ArrowDown":
            this.state.dropdown.visible || this.dropdown.show();
            break;
          case "ArrowRight": {
            let t3 = this.state.inputSuggestion || this.state.ddItemData;
            if (t3 && e2.autoComplete.rightKey)
              return void this.addTags([t3], true);
            break;
          }
          case "Tab": {
            let s3 = "select" == e2.mode;
            if (!i2 || s3)
              return true;
            t2.preventDefault();
          }
          case "Enter":
            if (this.state.dropdown.visible && "manual" != e2.dropdown.position)
              return;
            t2.preventDefault(), setTimeout(() => {
              this.state.dropdown.visible || this.state.actions.selectOption || this.addTags(i2, true);
            });
        }
      }
    }, onInput(t2) {
      this.postUpdate();
      var e2 = this.settings;
      if ("mix" == e2.mode)
        return this.events.callbacks.onMixTagsInput.call(this, t2);
      var i2 = this.input.normalize.call(this), s2 = i2.length >= e2.dropdown.enabled, a2 = { value: i2, inputElm: this.DOM.input }, n2 = this.validateTag({ value: i2 });
      "select" == e2.mode && this.toggleScopeValidation(n2), a2.isValid = n2, this.state.inputText != i2 && (this.input.set.call(this, i2, false), -1 != i2.search(e2.delimiters) ? this.addTags(i2) && this.input.set.call(this) : e2.dropdown.enabled >= 0 && this.dropdown[s2 ? "show" : "hide"](i2), this.trigger("input", a2));
    }, onMixTagsInput(t2) {
      var e2, i2, s2, a2, n2, o2, r2, l2, d2 = this.settings, h2 = this.value.length, p2 = this.getTagElms(), c2 = document.createDocumentFragment(), m2 = window.getSelection().getRangeAt(0), v2 = [].map.call(p2, (t3) => T(t3).value);
      if ("deleteContentBackward" == t2.inputType && u() && this.events.callbacks.onKeydown.call(this, { target: t2.target, key: "Backspace" }), this.value.slice().forEach((t3) => {
        t3.readonly && !v2.includes(t3.value) && c2.appendChild(this.createTagElem(t3));
      }), c2.childNodes.length && (m2.insertNode(c2), this.setRangeAtStartEnd(false, c2.lastChild)), p2.length != h2)
        return this.value = [].map.call(this.getTagElms(), (t3) => T(t3)), void this.update({ withoutChangeEvent: true });
      if (this.hasMaxTags())
        return true;
      if (window.getSelection && (o2 = window.getSelection()).rangeCount > 0 && 3 == o2.anchorNode.nodeType) {
        if ((m2 = o2.getRangeAt(0).cloneRange()).collapse(true), m2.setStart(o2.focusNode, 0), s2 = (e2 = m2.toString().slice(0, m2.endOffset)).split(d2.pattern).length - 1, (i2 = e2.match(d2.pattern)) && (a2 = e2.slice(e2.lastIndexOf(i2[i2.length - 1]))), a2) {
          if (this.state.actions.ArrowLeft = false, this.state.tag = { prefix: a2.match(d2.pattern)[0], value: a2.replace(d2.pattern, "") }, this.state.tag.baseOffset = o2.baseOffset - this.state.tag.value.length, l2 = this.state.tag.value.match(d2.delimiters))
            return this.state.tag.value = this.state.tag.value.replace(d2.delimiters, ""), this.state.tag.delimiters = l2[0], this.addTags(this.state.tag.value, d2.dropdown.clearOnSelect), void this.dropdown.hide();
          n2 = this.state.tag.value.length >= d2.dropdown.enabled;
          try {
            r2 = (r2 = this.state.flaggedTags[this.state.tag.baseOffset]).prefix == this.state.tag.prefix && r2.value[0] == this.state.tag.value[0], this.state.flaggedTags[this.state.tag.baseOffset] && !this.state.tag.value && delete this.state.flaggedTags[this.state.tag.baseOffset];
          } catch (t3) {
          }
          (r2 || s2 < this.state.mixMode.matchedPatternCount) && (n2 = false);
        } else
          this.state.flaggedTags = {};
        this.state.mixMode.matchedPatternCount = s2;
      }
      setTimeout(() => {
        this.update({ withoutChangeEvent: true }), this.trigger("input", g({}, this.state.tag, { textContent: this.DOM.input.textContent })), this.state.tag && this.dropdown[n2 ? "show" : "hide"](this.state.tag.value);
      }, 10);
    }, onInputIE(t2) {
      var e2 = this;
      setTimeout(function() {
        e2.events.callbacks.onInput.call(e2, t2);
      });
    }, observeOriginalInputValue() {
      this.DOM.originalInput.parentNode || this.destroy(), this.DOM.originalInput.value != this.DOM.originalInput.tagifyValue && this.loadOriginalValues();
    }, onClickAnywhere(t2) {
      t2.target == this.DOM.scope || this.DOM.scope.contains(t2.target) || (this.toggleFocusClass(false), this.state.hasFocus = false);
    }, onClickScope(t2) {
      var e2 = this.settings, i2 = t2.target.closest("." + e2.classNames.tag), s2 = +/* @__PURE__ */ new Date() - this.state.hasFocus;
      if (t2.target != this.DOM.scope) {
        if (!t2.target.classList.contains(e2.classNames.tagX))
          return i2 ? (this.trigger("click", { tag: i2, index: this.getNodeIndex(i2), data: T(i2), event: t2 }), void (1 !== e2.editTags && 1 !== e2.editTags.clicks || this.events.callbacks.onDoubleClickScope.call(this, t2))) : void (t2.target == this.DOM.input && ("mix" == e2.mode && this.fixFirefoxLastTagNoCaret(), s2 > 500) ? this.state.dropdown.visible ? this.dropdown.hide() : 0 === e2.dropdown.enabled && "mix" != e2.mode && this.dropdown.show(this.value.length ? "" : void 0) : "select" != e2.mode || 0 !== e2.dropdown.enabled || this.state.dropdown.visible || this.dropdown.show());
        this.removeTags(t2.target.parentNode);
      } else
        this.DOM.input.focus();
    }, onPaste(t2) {
      t2.preventDefault();
      var e2, i2, s2 = this.settings;
      if ("select" == s2.mode && s2.enforceWhitelist || !s2.userInput)
        return false;
      s2.readonly || (e2 = t2.clipboardData || window.clipboardData, i2 = e2.getData("Text"), s2.hooks.beforePaste(t2, { tagify: this, pastedText: i2, clipboardData: e2 }).then((e3) => {
        void 0 === e3 && (e3 = i2), e3 && (this.injectAtCaret(e3, window.getSelection().getRangeAt(0)), "mix" == this.settings.mode ? this.events.callbacks.onMixTagsInput.call(this, t2) : this.settings.pasteAsTags ? this.addTags(this.state.inputText + e3, true) : this.state.inputText = e3);
      }).catch((t3) => t3));
    }, onDrop(t2) {
      t2.preventDefault();
    }, onEditTagInput(t2, e2) {
      var i2 = t2.closest("." + this.settings.classNames.tag), s2 = this.getNodeIndex(i2), a2 = T(i2), n2 = this.input.normalize.call(this, t2), o2 = { [this.settings.tagTextProp]: n2, __tagId: a2.__tagId }, r2 = this.validateTag(o2);
      this.editTagChangeDetected(g(a2, o2)) || true !== t2.originalIsValid || (r2 = true), i2.classList.toggle(this.settings.classNames.tagInvalid, true !== r2), a2.__isValid = r2, i2.title = true === r2 ? a2.title || a2.value : r2, n2.length >= this.settings.dropdown.enabled && (this.state.editing && (this.state.editing.value = n2), this.dropdown.show(n2)), this.trigger("edit:input", { tag: i2, index: s2, data: g({}, this.value[s2], { newValue: n2 }), event: e2 });
    }, onEditTagPaste(t2, e2) {
      var i2 = (e2.clipboardData || window.clipboardData).getData("Text");
      e2.preventDefault();
      var s2 = f(i2);
      this.setRangeAtStartEnd(false, s2);
    }, onEditTagFocus(t2) {
      this.state.editing = { scope: t2, input: t2.querySelector("[contenteditable]") };
    }, onEditTagBlur(t2) {
      if (this.state.hasFocus || this.toggleFocusClass(), this.DOM.scope.contains(t2)) {
        var e2, i2, s2 = this.settings, a2 = t2.closest("." + s2.classNames.tag), n2 = T(a2), o2 = this.input.normalize.call(this, t2), r2 = { [s2.tagTextProp]: o2, __tagId: n2.__tagId }, l2 = n2.__originalData, d2 = this.editTagChangeDetected(g(n2, r2)), h2 = this.validateTag(r2);
        if (o2)
          if (d2) {
            if (e2 = this.hasMaxTags(), i2 = g({}, l2, { [s2.tagTextProp]: this.trim(o2), __isValid: h2 }), s2.transformTag.call(this, i2, l2), true !== (h2 = (!e2 || true === l2.__isValid) && this.validateTag(i2))) {
              if (this.trigger("invalid", { data: i2, tag: a2, message: h2 }), s2.editTags.keepInvalid)
                return;
              s2.keepInvalidTags ? i2.__isValid = h2 : i2 = l2;
            } else
              s2.keepInvalidTags && (delete i2.title, delete i2["aria-invalid"], delete i2.class);
            this.onEditTagDone(a2, i2);
          } else
            this.onEditTagDone(a2, l2);
        else
          this.onEditTagDone(a2);
      }
    }, onEditTagkeydown(t2, e2) {
      if (!this.state.composing)
        switch (this.trigger("edit:keydown", { event: t2 }), t2.key) {
          case "Esc":
          case "Escape":
            e2.parentNode.replaceChild(e2.__tagifyTagData.__originalHTML, e2), this.state.editing = false;
          case "Enter":
          case "Tab":
            t2.preventDefault(), t2.target.blur();
        }
    }, onDoubleClickScope(t2) {
      var e2, i2, s2 = t2.target.closest("." + this.settings.classNames.tag), a2 = T(s2), n2 = this.settings;
      s2 && n2.userInput && false !== a2.editable && (e2 = s2.classList.contains(this.settings.classNames.tagEditing), i2 = s2.hasAttribute("readonly"), "select" == n2.mode || n2.readonly || e2 || i2 || !this.settings.editTags || this.editTag(s2), this.toggleFocusClass(true), this.trigger("dblclick", { tag: s2, index: this.getNodeIndex(s2), data: T(s2) }));
    }, onInputDOMChange(t2) {
      t2.forEach((t3) => {
        t3.addedNodes.forEach((t4) => {
          var _a;
          if ("<div><br></div>" == t4.outerHTML)
            t4.replaceWith(document.createElement("br"));
          else if (1 == t4.nodeType && t4.querySelector(this.settings.classNames.tagSelector)) {
            let e3 = document.createTextNode("");
            3 == t4.childNodes[0].nodeType && "BR" != t4.previousSibling.nodeName && (e3 = document.createTextNode("\n")), t4.replaceWith(e3, ...[...t4.childNodes].slice(0, -1)), this.placeCaretAfterNode(e3);
          } else if (v.call(this, t4) && (3 != ((_a = t4.previousSibling) == null ? void 0 : _a.nodeType) || t4.previousSibling.textContent || t4.previousSibling.remove(), t4.previousSibling && "BR" == t4.previousSibling.nodeName)) {
            t4.previousSibling.replaceWith("\n​");
            let e3 = t4.nextSibling, i2 = "";
            for (; e3; )
              i2 += e3.textContent, e3 = e3.nextSibling;
            i2.trim() && this.placeCaretAfterNode(t4.previousSibling);
          }
        }), t3.removedNodes.forEach((t4) => {
          t4 && "BR" == t4.nodeName && v.call(this, e2) && (this.removeTags(e2), this.fixFirefoxLastTagNoCaret());
        });
      });
      var e2 = this.DOM.input.lastChild;
      e2 && "" == e2.nodeValue && e2.remove(), e2 && "BR" == e2.nodeName || this.DOM.input.appendChild(document.createElement("br"));
    } } };
    function N(t2, e2) {
      if (!t2) {
        console.warn("Tagify:", "input element not found", t2);
        const e3 = new Proxy(this, { get: () => () => e3 });
        return e3;
      }
      if (t2.__tagify)
        return console.warn("Tagify: ", "input element is already Tagified - Same instance is returned.", t2), t2.__tagify;
      var i2;
      g(this, function(t3) {
        var e3 = document.createTextNode("");
        function i3(t4, i4, s2) {
          s2 && i4.split(/\s+/g).forEach((i5) => e3[t4 + "EventListener"].call(e3, i5, s2));
        }
        return { off(t4, e4) {
          return i3("remove", t4, e4), this;
        }, on(t4, e4) {
          return e4 && "function" == typeof e4 && i3("add", t4, e4), this;
        }, trigger(i4, s2, a2) {
          var n2;
          if (a2 = a2 || { cloneData: true }, i4)
            if (t3.settings.isJQueryPlugin)
              "remove" == i4 && (i4 = "removeTag"), jQuery(t3.DOM.originalInput).triggerHandler(i4, [s2]);
            else {
              try {
                var o2 = "object" == typeof s2 ? s2 : { value: s2 };
                if ((o2 = a2.cloneData ? g({}, o2) : o2).tagify = this, s2.event && (o2.event = this.cloneEvent(s2.event)), s2 instanceof Object)
                  for (var r2 in s2)
                    s2[r2] instanceof HTMLElement && (o2[r2] = s2[r2]);
                n2 = new CustomEvent(i4, { detail: o2 });
              } catch (t4) {
                console.warn(t4);
              }
              e3.dispatchEvent(n2);
            }
        } };
      }(this)), this.isFirefox = /firefox|fxios/i.test(navigator.userAgent) && !/seamonkey/i.test(navigator.userAgent), this.isIE = window.document.documentMode, e2 = e2 || {}, this.getPersistedData = (i2 = e2.id, (t3) => {
        let e3, s2 = "/" + t3;
        if (1 == localStorage.getItem(x + i2 + "/v", 1))
          try {
            e3 = JSON.parse(localStorage[x + i2 + s2]);
          } catch (t4) {
          }
        return e3;
      }), this.setPersistedData = ((t3) => t3 ? (localStorage.setItem(x + t3 + "/v", 1), (e3, i3) => {
        let s2 = "/" + i3, a2 = JSON.stringify(e3);
        e3 && i3 && (localStorage.setItem(x + t3 + s2, a2), dispatchEvent(new Event("storage")));
      }) : () => {
      })(e2.id), this.clearPersistedData = ((t3) => (e3) => {
        const i3 = x + "/" + t3 + "/";
        if (e3)
          localStorage.removeItem(i3 + e3);
        else
          for (let t4 in localStorage)
            t4.includes(i3) && localStorage.removeItem(t4);
      })(e2.id), this.applySettings(t2, e2), this.state = { inputText: "", editing: false, composing: false, actions: {}, mixMode: {}, dropdown: {}, flaggedTags: {} }, this.value = [], this.listeners = {}, this.DOM = {}, this.build(t2), b.call(this), this.getCSSVars(), this.loadOriginalValues(), this.events.customBinding.call(this), this.events.binding.call(this), t2.autofocus && this.DOM.input.focus(), t2.__tagify = this;
    }
    return N.prototype = { _dropdown: y, getSetTagData: T, helpers: { sameStr: s, removeCollectionProp: a, omit: n, isObject: h, parseHTML: r, escapeHTML: d, extend: g, concatWithoutDups: p, getUID: m, isNodeTag: v }, customEventsList: ["change", "add", "remove", "invalid", "input", "click", "keydown", "focus", "blur", "edit:input", "edit:beforeUpdate", "edit:updated", "edit:start", "edit:keydown", "dropdown:show", "dropdown:hide", "dropdown:select", "dropdown:updated", "dropdown:noMatch", "dropdown:scroll"], dataProps: ["__isValid", "__removed", "__originalData", "__originalHTML", "__tagId"], trim(t2) {
      return this.settings.trim && t2 && "string" == typeof t2 ? t2.trim() : t2;
    }, parseHTML: r, templates: M, parseTemplate(t2, e2) {
      return r((t2 = this.settings.templates[t2] || t2).apply(this, e2));
    }, set whitelist(t2) {
      const e2 = t2 && Array.isArray(t2);
      this.settings.whitelist = e2 ? t2 : [], this.setPersistedData(e2 ? t2 : [], "whitelist");
    }, get whitelist() {
      return this.settings.whitelist;
    }, generateClassSelectors(t2) {
      for (let e2 in t2) {
        let i2 = e2;
        Object.defineProperty(t2, i2 + "Selector", { get() {
          return "." + this[i2].split(" ")[0];
        } });
      }
    }, applySettings(t2, i2) {
      var _a, _b;
      w.templates = this.templates;
      var s2 = g({}, w, "mix" == i2.mode ? { dropdown: { position: "text" } } : {}), a2 = this.settings = g({}, s2, i2);
      if (a2.disabled = t2.hasAttribute("disabled"), a2.readonly = a2.readonly || t2.hasAttribute("readonly"), a2.placeholder = d(t2.getAttribute("placeholder") || a2.placeholder || ""), a2.required = t2.hasAttribute("required"), this.generateClassSelectors(a2.classNames), void 0 === a2.dropdown.includeSelectedTags && (a2.dropdown.includeSelectedTags = a2.duplicates), this.isIE && (a2.autoComplete = false), ["whitelist", "blacklist"].forEach((e2) => {
        var i3 = t2.getAttribute("data-" + e2);
        i3 && (i3 = i3.split(a2.delimiters)) instanceof Array && (a2[e2] = i3);
      }), "autoComplete" in i2 && !h(i2.autoComplete) && (a2.autoComplete = w.autoComplete, a2.autoComplete.enabled = i2.autoComplete), "mix" == a2.mode && (a2.pattern = a2.pattern || /@/, a2.autoComplete.rightKey = true, a2.delimiters = i2.delimiters || null, a2.tagTextProp && !a2.dropdown.searchKeys.includes(a2.tagTextProp) && a2.dropdown.searchKeys.push(a2.tagTextProp)), t2.pattern)
        try {
          a2.pattern = new RegExp(t2.pattern);
        } catch (t3) {
        }
      if (a2.delimiters) {
        a2._delimiters = a2.delimiters;
        try {
          a2.delimiters = new RegExp(this.settings.delimiters, "g");
        } catch (t3) {
        }
      }
      a2.disabled && (a2.userInput = false), this.TEXTS = e(e({}, D), a2.texts || {}), ("select" != a2.mode || ((_a = i2.dropdown) == null ? void 0 : _a.enabled)) && a2.userInput || (a2.dropdown.enabled = 0), a2.dropdown.appendTarget = ((_b = i2.dropdown) == null ? void 0 : _b.appendTarget) || document.body;
      let n2 = this.getPersistedData("whitelist");
      Array.isArray(n2) && (this.whitelist = Array.isArray(a2.whitelist) ? p(a2.whitelist, n2) : n2);
    }, getAttributes(t2) {
      var e2, i2 = this.getCustomAttributes(t2), s2 = "";
      for (e2 in i2)
        s2 += " " + e2 + (void 0 !== t2[e2] ? `="${i2[e2]}"` : "");
      return s2;
    }, getCustomAttributes(t2) {
      if (!h(t2))
        return "";
      var e2, i2 = {};
      for (e2 in t2)
        "__" != e2.slice(0, 2) && "class" != e2 && t2.hasOwnProperty(e2) && void 0 !== t2[e2] && (i2[e2] = d(t2[e2]));
      return i2;
    }, setStateSelection() {
      var t2 = window.getSelection(), e2 = { anchorOffset: t2.anchorOffset, anchorNode: t2.anchorNode, range: t2.getRangeAt && t2.rangeCount && t2.getRangeAt(0) };
      return this.state.selection = e2, e2;
    }, getCSSVars() {
      var t2 = getComputedStyle(this.DOM.scope, null);
      var e2;
      this.CSSVars = { tagHideTransition: ((t3) => {
        let e3 = t3.value;
        return "s" == t3.unit ? 1e3 * e3 : e3;
      })(function(t3) {
        if (!t3)
          return {};
        var e3 = (t3 = t3.trim().split(" ")[0]).split(/\d+/g).filter((t4) => t4).pop().trim();
        return { value: +t3.split(e3).filter((t4) => t4)[0].trim(), unit: e3 };
      }((e2 = "tag-hide-transition", t2.getPropertyValue("--" + e2)))) };
    }, build(t2) {
      var e2 = this.DOM;
      this.settings.mixMode.integrated ? (e2.originalInput = null, e2.scope = t2, e2.input = t2) : (e2.originalInput = t2, e2.originalInput_tabIndex = t2.tabIndex, e2.scope = this.parseTemplate("wrapper", [t2, this.settings]), e2.input = e2.scope.querySelector(this.settings.classNames.inputSelector), t2.parentNode.insertBefore(e2.scope, t2), t2.tabIndex = -1);
    }, destroy() {
      this.events.unbindGlobal.call(this), this.DOM.scope.parentNode.removeChild(this.DOM.scope), this.DOM.originalInput.tabIndex = this.DOM.originalInput_tabIndex, delete this.DOM.originalInput.__tagify, this.dropdown.hide(true), clearTimeout(this.dropdownHide__bindEventsTimeout), clearInterval(this.listeners.main.originalInputValueObserverInterval);
    }, loadOriginalValues(t2) {
      var e2, i2 = this.settings;
      if (this.state.blockChangeEvent = true, void 0 === t2) {
        const e3 = this.getPersistedData("value");
        t2 = e3 && !this.DOM.originalInput.value ? e3 : i2.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value;
      }
      if (this.removeAllTags(), t2)
        if ("mix" == i2.mode)
          this.parseMixTags(t2), (e2 = this.DOM.input.lastChild) && "BR" == e2.tagName || this.DOM.input.insertAdjacentHTML("beforeend", "<br>");
        else {
          try {
            JSON.parse(t2) instanceof Array && (t2 = JSON.parse(t2));
          } catch (t3) {
          }
          this.addTags(t2, true).forEach((t3) => t3 && t3.classList.add(i2.classNames.tagNoAnimation));
        }
      else
        this.postUpdate();
      this.state.lastOriginalValueReported = i2.mixMode.integrated ? "" : this.DOM.originalInput.value;
    }, cloneEvent(t2) {
      var e2 = {};
      for (var i2 in t2)
        "path" != i2 && (e2[i2] = t2[i2]);
      return e2;
    }, loading(t2) {
      return this.state.isLoading = t2, this.DOM.scope.classList[t2 ? "add" : "remove"](this.settings.classNames.scopeLoading), this;
    }, tagLoading(t2, e2) {
      return t2 && t2.classList[e2 ? "add" : "remove"](this.settings.classNames.tagLoading), this;
    }, toggleClass(t2, e2) {
      "string" == typeof t2 && this.DOM.scope.classList.toggle(t2, e2);
    }, toggleScopeValidation(t2) {
      var e2 = true === t2 || void 0 === t2;
      !this.settings.required && t2 && t2 === this.TEXTS.empty && (e2 = true), this.toggleClass(this.settings.classNames.tagInvalid, !e2), this.DOM.scope.title = e2 ? "" : t2;
    }, toggleFocusClass(t2) {
      this.toggleClass(this.settings.classNames.focus, !!t2);
    }, triggerChangeEvent: function() {
      if (!this.settings.mixMode.integrated) {
        var t2 = this.DOM.originalInput, e2 = this.state.lastOriginalValueReported !== t2.value, i2 = new CustomEvent("change", { bubbles: true });
        e2 && (this.state.lastOriginalValueReported = t2.value, i2.simulated = true, t2._valueTracker && t2._valueTracker.setValue(Math.random()), t2.dispatchEvent(i2), this.trigger("change", this.state.lastOriginalValueReported), t2.value = this.state.lastOriginalValueReported);
      }
    }, events: I, fixFirefoxLastTagNoCaret() {
    }, setRangeAtStartEnd(t2, e2) {
      if (e2) {
        t2 = "number" == typeof t2 ? t2 : !!t2, e2 = e2.lastChild || e2;
        var i2 = document.getSelection();
        if (i2.focusNode instanceof Element && !this.DOM.input.contains(i2.focusNode))
          return true;
        try {
          i2.rangeCount >= 1 && ["Start", "End"].forEach((s2) => i2.getRangeAt(0)["set" + s2](e2, t2 || e2.length));
        } catch (t3) {
        }
      }
    }, placeCaretAfterNode(t2) {
      if (t2 && t2.parentNode) {
        var e2 = t2, i2 = window.getSelection(), s2 = i2.getRangeAt(0);
        i2.rangeCount && (s2.setStartAfter(e2), s2.collapse(true), i2.removeAllRanges(), i2.addRange(s2));
      }
    }, insertAfterTag(t2, e2) {
      if (e2 = e2 || this.settings.mixMode.insertAfterTag, t2 && t2.parentNode && e2)
        return e2 = "string" == typeof e2 ? document.createTextNode(e2) : e2, t2.parentNode.insertBefore(e2, t2.nextSibling), e2;
    }, editTagChangeDetected(t2) {
      var e2 = t2.__originalData;
      for (var i2 in e2)
        if (!this.dataProps.includes(i2) && t2[i2] != e2[i2])
          return true;
      return false;
    }, getTagTextNode(t2) {
      return t2.querySelector(this.settings.classNames.tagTextSelector);
    }, setTagTextNode(t2, e2) {
      this.getTagTextNode(t2).innerHTML = d(e2);
    }, editTag(t2, e2) {
      t2 = t2 || this.getLastTag(), e2 = e2 || {}, this.dropdown.hide();
      var i2 = this.settings, s2 = this.getTagTextNode(t2), a2 = this.getNodeIndex(t2), n2 = T(t2), o2 = this.events.callbacks, r2 = this, l2 = true;
      if (s2) {
        if (!(n2 instanceof Object && "editable" in n2) || n2.editable)
          return n2 = T(t2, { __originalData: g({}, n2), __originalHTML: t2.cloneNode(true) }), T(n2.__originalHTML, n2.__originalData), s2.setAttribute("contenteditable", true), t2.classList.add(i2.classNames.tagEditing), s2.addEventListener("focus", o2.onEditTagFocus.bind(this, t2)), s2.addEventListener("blur", function() {
            setTimeout(() => o2.onEditTagBlur.call(r2, r2.getTagTextNode(t2)));
          }), s2.addEventListener("input", o2.onEditTagInput.bind(this, s2)), s2.addEventListener("paste", o2.onEditTagPaste.bind(this, s2)), s2.addEventListener("keydown", (e3) => o2.onEditTagkeydown.call(this, e3, t2)), s2.addEventListener("compositionstart", o2.onCompositionStart.bind(this)), s2.addEventListener("compositionend", o2.onCompositionEnd.bind(this)), e2.skipValidation || (l2 = this.editTagToggleValidity(t2)), s2.originalIsValid = l2, this.trigger("edit:start", { tag: t2, index: a2, data: n2, isValid: l2 }), s2.focus(), this.setRangeAtStartEnd(false, s2), this;
      } else
        console.warn("Cannot find element in Tag template: .", i2.classNames.tagTextSelector);
    }, editTagToggleValidity(t2, e2) {
      var i2;
      if (e2 = e2 || T(t2))
        return (i2 = !("__isValid" in e2) || true === e2.__isValid) || this.removeTagsFromValue(t2), this.update(), t2.classList.toggle(this.settings.classNames.tagNotAllowed, !i2), e2.__isValid;
      console.warn("tag has no data: ", t2, e2);
    }, onEditTagDone(t2, e2) {
      e2 = e2 || {};
      var i2 = { tag: t2 = t2 || this.state.editing.scope, index: this.getNodeIndex(t2), previousData: T(t2), data: e2 };
      this.trigger("edit:beforeUpdate", i2, { cloneData: false }), this.state.editing = false, delete e2.__originalData, delete e2.__originalHTML, t2 && e2[this.settings.tagTextProp] ? (t2 = this.replaceTag(t2, e2), this.editTagToggleValidity(t2, e2), this.settings.a11y.focusableTags ? t2.focus() : this.placeCaretAfterNode(t2)) : t2 && this.removeTags(t2), this.trigger("edit:updated", i2), this.dropdown.hide(), this.settings.keepInvalidTags && this.reCheckInvalidTags();
    }, replaceTag(t2, e2) {
      e2 && e2.value || (e2 = t2.__tagifyTagData), e2.__isValid && 1 != e2.__isValid && g(e2, this.getInvalidTagAttrs(e2, e2.__isValid));
      var i2 = this.createTagElem(e2);
      return t2.parentNode.replaceChild(i2, t2), this.updateValueByDOMTags(), i2;
    }, updateValueByDOMTags() {
      this.value.length = 0, [].forEach.call(this.getTagElms(), (t2) => {
        t2.classList.contains(this.settings.classNames.tagNotAllowed.split(" ")[0]) || this.value.push(T(t2));
      }), this.update();
    }, injectAtCaret(t2, e2) {
      var _a;
      return !(e2 = e2 || ((_a = this.state.selection) == null ? void 0 : _a.range)) && t2 ? (this.appendMixTags(t2), this) : (f(t2, e2), this.setRangeAtStartEnd(false, t2), this.updateValueByDOMTags(), this.update(), this);
    }, input: { set() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "", e2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
      var i2 = this.settings.dropdown.closeOnSelect;
      this.state.inputText = t2, e2 && (this.DOM.input.innerHTML = d("" + t2)), !t2 && i2 && this.dropdown.hide.bind(this), this.input.autocomplete.suggest.call(this), this.input.validate.call(this);
    }, raw() {
      return this.DOM.input.textContent;
    }, validate() {
      var t2 = !this.state.inputText || true === this.validateTag({ value: this.state.inputText });
      return this.DOM.input.classList.toggle(this.settings.classNames.inputInvalid, !t2), t2;
    }, normalize(t2) {
      var e2 = t2 || this.DOM.input, i2 = [];
      e2.childNodes.forEach((t3) => 3 == t3.nodeType && i2.push(t3.nodeValue)), i2 = i2.join("\n");
      try {
        i2 = i2.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0));
      } catch (t3) {
      }
      return i2 = i2.replace(/\s/g, " "), this.trim(i2);
    }, autocomplete: { suggest(t2) {
      if (this.settings.autoComplete.enabled) {
        "string" == typeof (t2 = t2 || { value: "" }) && (t2 = { value: t2 });
        var e2 = this.dropdown.getMappedValue(t2);
        if ("number" != typeof e2) {
          var i2 = e2.substr(0, this.state.inputText.length).toLowerCase(), s2 = e2.substring(this.state.inputText.length);
          e2 && this.state.inputText && i2 == this.state.inputText.toLowerCase() ? (this.DOM.input.setAttribute("data-suggest", s2), this.state.inputSuggestion = t2) : (this.DOM.input.removeAttribute("data-suggest"), delete this.state.inputSuggestion);
        }
      }
    }, set(t2) {
      var e2 = this.DOM.input.getAttribute("data-suggest"), i2 = t2 || (e2 ? this.state.inputText + e2 : null);
      return !!i2 && ("mix" == this.settings.mode ? this.replaceTextWithNode(document.createTextNode(this.state.tag.prefix + i2)) : (this.input.set.call(this, i2), this.setRangeAtStartEnd(false, this.DOM.input)), this.input.autocomplete.suggest.call(this), this.dropdown.hide(), true);
    } } }, getTagIdx(t2) {
      return this.value.findIndex((e2) => e2.__tagId == (t2 || {}).__tagId);
    }, getNodeIndex(t2) {
      var e2 = 0;
      if (t2)
        for (; t2 = t2.previousElementSibling; )
          e2++;
      return e2;
    }, getTagElms() {
      for (var t2 = arguments.length, e2 = new Array(t2), i2 = 0; i2 < t2; i2++)
        e2[i2] = arguments[i2];
      var s2 = "." + [...this.settings.classNames.tag.split(" "), ...e2].join(".");
      return [].slice.call(this.DOM.scope.querySelectorAll(s2));
    }, getLastTag() {
      var t2 = this.DOM.scope.querySelectorAll(`${this.settings.classNames.tagSelector}:not(.${this.settings.classNames.tagHide}):not([readonly])`);
      return t2[t2.length - 1];
    }, isTagDuplicate(t2, e2, i2) {
      var a2 = 0;
      if ("select" == this.settings.mode)
        return false;
      for (let n2 of this.value) {
        s(this.trim("" + t2), n2.value, e2) && i2 != n2.__tagId && a2++;
      }
      return a2;
    }, getTagIndexByValue(t2) {
      var e2 = [];
      return this.getTagElms().forEach((i2, a2) => {
        s(this.trim(i2.textContent), t2, this.settings.dropdown.caseSensitive) && e2.push(a2);
      }), e2;
    }, getTagElmByValue(t2) {
      var e2 = this.getTagIndexByValue(t2)[0];
      return this.getTagElms()[e2];
    }, flashTag(t2) {
      t2 && (t2.classList.add(this.settings.classNames.tagFlash), setTimeout(() => {
        t2.classList.remove(this.settings.classNames.tagFlash);
      }, 100));
    }, isTagBlacklisted(t2) {
      return t2 = this.trim(t2.toLowerCase()), this.settings.blacklist.filter((e2) => ("" + e2).toLowerCase() == t2).length;
    }, isTagWhitelisted(t2) {
      return !!this.getWhitelistItem(t2);
    }, getWhitelistItem(t2, e2, i2) {
      e2 = e2 || "value";
      var a2, n2 = this.settings;
      return (i2 = i2 || n2.whitelist).some((i3) => {
        var o2 = "string" == typeof i3 ? i3 : i3[e2] || i3.value;
        if (s(o2, t2, n2.dropdown.caseSensitive, n2.trim))
          return a2 = "string" == typeof i3 ? { value: i3 } : i3, true;
      }), a2 || "value" != e2 || "value" == n2.tagTextProp || (a2 = this.getWhitelistItem(t2, n2.tagTextProp, i2)), a2;
    }, validateTag(t2) {
      var e2 = this.settings, i2 = "value" in t2 ? "value" : e2.tagTextProp, s2 = this.trim(t2[i2] + "");
      return (t2[i2] + "").trim() ? e2.pattern && e2.pattern instanceof RegExp && !e2.pattern.test(s2) ? this.TEXTS.pattern : !e2.duplicates && this.isTagDuplicate(s2, e2.dropdown.caseSensitive, t2.__tagId) ? this.TEXTS.duplicate : this.isTagBlacklisted(s2) || e2.enforceWhitelist && !this.isTagWhitelisted(s2) ? this.TEXTS.notAllowed : !e2.validate || e2.validate(t2) : this.TEXTS.empty;
    }, getInvalidTagAttrs(t2, e2) {
      return { "aria-invalid": true, class: `${t2.class || ""} ${this.settings.classNames.tagNotAllowed}`.trim(), title: e2 };
    }, hasMaxTags() {
      return this.value.length >= this.settings.maxTags && this.TEXTS.exceed;
    }, setReadonly(t2, e2) {
      var i2 = this.settings;
      document.activeElement.blur(), i2[e2 || "readonly"] = t2, this.DOM.scope[(t2 ? "set" : "remove") + "Attribute"](e2 || "readonly", true), this.setContentEditable(!t2);
    }, setContentEditable(t2) {
      this.settings.userInput && (this.DOM.input.contentEditable = t2, this.DOM.input.tabIndex = t2 ? 0 : -1);
    }, setDisabled(t2) {
      this.setReadonly(t2, "disabled");
    }, normalizeTags(t2) {
      var e2 = this.settings, i2 = e2.whitelist, s2 = e2.delimiters, a2 = e2.mode, n2 = e2.tagTextProp, o2 = [], r2 = !!i2 && i2[0] instanceof Object, l2 = Array.isArray(t2), d2 = l2 && t2[0].value, h2 = (t3) => (t3 + "").split(s2).filter((t4) => t4).map((t4) => ({ [n2]: this.trim(t4), value: this.trim(t4) }));
      if ("number" == typeof t2 && (t2 = t2.toString()), "string" == typeof t2) {
        if (!t2.trim())
          return [];
        t2 = h2(t2);
      } else
        l2 && (t2 = [].concat(...t2.map((t3) => null != t3.value ? t3 : h2(t3))));
      return r2 && !d2 && (t2.forEach((t3) => {
        var e3 = o2.map((t4) => t4.value), i3 = this.dropdown.filterListItems.call(this, t3[n2], { exact: true });
        this.settings.duplicates || (i3 = i3.filter((t4) => !e3.includes(t4.value)));
        var s3 = i3.length > 1 ? this.getWhitelistItem(t3[n2], n2, i3) : i3[0];
        s3 && s3 instanceof Object ? o2.push(s3) : "mix" != a2 && (null == t3.value && (t3.value = t3[n2]), o2.push(t3));
      }), o2.length && (t2 = o2)), t2;
    }, parseMixTags(t2) {
      var e2 = this.settings, i2 = e2.mixTagsInterpolator, s2 = e2.duplicates, a2 = e2.transformTag, n2 = e2.enforceWhitelist, o2 = e2.maxTags, r2 = e2.tagTextProp, l2 = [];
      return t2 = t2.split(i2[0]).map((t3, e3) => {
        var d2, h2, g2, p2 = t3.split(i2[1]), c2 = p2[0], u2 = l2.length == o2;
        try {
          if (c2 == +c2)
            throw Error;
          h2 = JSON.parse(c2);
        } catch (t4) {
          h2 = this.normalizeTags(c2)[0] || { value: c2 };
        }
        if (a2.call(this, h2), u2 || !(p2.length > 1) || n2 && !this.isTagWhitelisted(h2.value) || !s2 && this.isTagDuplicate(h2.value)) {
          if (t3)
            return e3 ? i2[0] + t3 : t3;
        } else
          h2[d2 = h2[r2] ? r2 : "value"] = this.trim(h2[d2]), g2 = this.createTagElem(h2), l2.push(h2), g2.classList.add(this.settings.classNames.tagNoAnimation), p2[0] = g2.outerHTML, this.value.push(h2);
        return p2.join("");
      }).join(""), this.DOM.input.innerHTML = t2, this.DOM.input.appendChild(document.createTextNode("")), this.DOM.input.normalize(), this.getTagElms().forEach((t3, e3) => T(t3, l2[e3])), this.update({ withoutChangeEvent: true }), t2;
    }, replaceTextWithNode(t2, e2) {
      if (this.state.tag || e2) {
        e2 = e2 || this.state.tag.prefix + this.state.tag.value;
        var i2, s2, a2 = this.state.selection || window.getSelection(), n2 = a2.anchorNode, o2 = this.state.tag.delimiters ? this.state.tag.delimiters.length : 0;
        return n2.splitText(a2.anchorOffset - o2), -1 == (i2 = n2.nodeValue.lastIndexOf(e2)) ? true : (s2 = n2.splitText(i2), t2 && n2.parentNode.replaceChild(t2, s2), true);
      }
    }, selectTag(t2, e2) {
      var i2 = this.settings;
      if (!i2.enforceWhitelist || this.isTagWhitelisted(e2.value)) {
        this.input.set.call(this, e2[i2.tagTextProp] || e2.value, true), this.state.actions.selectOption && setTimeout(() => this.setRangeAtStartEnd(false, this.DOM.input));
        var s2 = this.getLastTag();
        return s2 ? this.replaceTag(s2, e2) : this.appendTag(t2), this.value[0] = e2, this.update(), this.trigger("add", { tag: t2, data: e2 }), [t2];
      }
    }, addEmptyTag(t2) {
      var e2 = g({ value: "" }, t2 || {}), i2 = this.createTagElem(e2);
      T(i2, e2), this.appendTag(i2), this.editTag(i2, { skipValidation: true });
    }, addTags(t2, e2, i2) {
      var s2 = [], a2 = this.settings, n2 = [], o2 = document.createDocumentFragment();
      if (i2 = i2 || a2.skipInvalid, !t2 || 0 == t2.length)
        return s2;
      switch (t2 = this.normalizeTags(t2), a2.mode) {
        case "mix":
          return this.addMixTags(t2);
        case "select":
          e2 = false, this.removeAllTags();
      }
      return this.DOM.input.removeAttribute("style"), t2.forEach((t3) => {
        var e3, r2 = {}, l2 = Object.assign({}, t3, { value: t3.value + "" });
        if (t3 = Object.assign({}, l2), a2.transformTag.call(this, t3), t3.__isValid = this.hasMaxTags() || this.validateTag(t3), true !== t3.__isValid) {
          if (i2)
            return;
          if (g(r2, this.getInvalidTagAttrs(t3, t3.__isValid), { __preInvalidData: l2 }), t3.__isValid == this.TEXTS.duplicate && this.flashTag(this.getTagElmByValue(t3.value)), !a2.createInvalidTags)
            return void n2.push(t3.value);
        }
        if ("readonly" in t3 && (t3.readonly ? r2["aria-readonly"] = true : delete t3.readonly), e3 = this.createTagElem(t3, r2), s2.push(e3), "select" == a2.mode)
          return this.selectTag(e3, t3);
        o2.appendChild(e3), t3.__isValid && true === t3.__isValid ? (this.value.push(t3), this.trigger("add", { tag: e3, index: this.value.length - 1, data: t3 })) : (this.trigger("invalid", { data: t3, index: this.value.length, tag: e3, message: t3.__isValid }), a2.keepInvalidTags || setTimeout(() => this.removeTags(e3, true), 1e3)), this.dropdown.position();
      }), this.appendTag(o2), this.update(), t2.length && e2 && (this.input.set.call(this, a2.createInvalidTags ? "" : n2.join(a2._delimiters)), this.setRangeAtStartEnd(false, this.DOM.input)), a2.dropdown.enabled && this.dropdown.refilter(), s2;
    }, addMixTags(t2) {
      if ((t2 = this.normalizeTags(t2))[0].prefix || this.state.tag)
        return this.prefixedTextToTag(t2[0]);
      var e2 = document.createDocumentFragment();
      return t2.forEach((t3) => {
        var i2 = this.createTagElem(t3);
        e2.appendChild(i2);
      }), this.appendMixTags(e2), e2;
    }, appendMixTags(t2) {
      var e2 = !!this.state.selection;
      e2 ? this.injectAtCaret(t2) : (this.DOM.input.focus(), (e2 = this.setStateSelection()).range.setStart(this.DOM.input, e2.range.endOffset), e2.range.setEnd(this.DOM.input, e2.range.endOffset), this.DOM.input.appendChild(t2), this.updateValueByDOMTags(), this.update());
    }, prefixedTextToTag(t2) {
      var e2, i2 = this.settings, s2 = this.state.tag.delimiters;
      if (i2.transformTag.call(this, t2), t2.prefix = t2.prefix || this.state.tag ? this.state.tag.prefix : (i2.pattern.source || i2.pattern)[0], e2 = this.createTagElem(t2), this.replaceTextWithNode(e2) || this.DOM.input.appendChild(e2), setTimeout(() => e2.classList.add(this.settings.classNames.tagNoAnimation), 300), this.value.push(t2), this.update(), !s2) {
        var a2 = this.insertAfterTag(e2) || e2;
        setTimeout(this.placeCaretAfterNode, 0, a2);
      }
      return this.state.tag = null, this.trigger("add", g({}, { tag: e2 }, { data: t2 })), e2;
    }, appendTag(t2) {
      var e2 = this.DOM, i2 = e2.input;
      e2.scope.insertBefore(t2, i2);
    }, createTagElem(t2, i2) {
      t2.__tagId = m();
      var s2, a2 = g({}, t2, e({ value: d(t2.value + "") }, i2));
      return function(t3) {
        for (var e2, i3 = document.createNodeIterator(t3, NodeFilter.SHOW_TEXT, null, false); e2 = i3.nextNode(); )
          e2.textContent.trim() || e2.parentNode.removeChild(e2);
      }(s2 = this.parseTemplate("tag", [a2, this])), T(s2, t2), s2;
    }, reCheckInvalidTags() {
      var t2 = this.settings;
      this.getTagElms(t2.classNames.tagNotAllowed).forEach((e2, i2) => {
        var s2 = T(e2), a2 = this.hasMaxTags(), n2 = this.validateTag(s2), o2 = true === n2 && !a2;
        if ("select" == t2.mode && this.toggleScopeValidation(n2), o2)
          return s2 = s2.__preInvalidData ? s2.__preInvalidData : { value: s2.value }, this.replaceTag(e2, s2);
        e2.title = a2 || n2;
      });
    }, removeTags(t2, e2, i2) {
      var s2, a2 = this.settings;
      if (t2 = t2 && t2 instanceof HTMLElement ? [t2] : t2 instanceof Array ? t2 : t2 ? [t2] : [this.getLastTag()], s2 = t2.reduce((t3, e3) => {
        e3 && "string" == typeof e3 && (e3 = this.getTagElmByValue(e3));
        var i3 = T(e3);
        return e3 && i3 && !i3.readonly && t3.push({ node: e3, idx: this.getTagIdx(i3), data: T(e3, { __removed: true }) }), t3;
      }, []), i2 = "number" == typeof i2 ? i2 : this.CSSVars.tagHideTransition, "select" == a2.mode && (i2 = 0, this.input.set.call(this)), 1 == s2.length && "select" != a2.mode && s2[0].node.classList.contains(a2.classNames.tagNotAllowed) && (e2 = true), s2.length)
        return a2.hooks.beforeRemoveTag(s2, { tagify: this }).then(() => {
          function t3(t4) {
            t4.node.parentNode && (t4.node.parentNode.removeChild(t4.node), e2 ? a2.keepInvalidTags && this.trigger("remove", { tag: t4.node, index: t4.idx }) : (this.trigger("remove", { tag: t4.node, index: t4.idx, data: t4.data }), this.dropdown.refilter(), this.dropdown.position(), this.DOM.input.normalize(), a2.keepInvalidTags && this.reCheckInvalidTags()));
          }
          i2 && i2 > 10 && 1 == s2.length ? function(e3) {
            e3.node.style.width = parseFloat(window.getComputedStyle(e3.node).width) + "px", document.body.clientTop, e3.node.classList.add(a2.classNames.tagHide), setTimeout(t3.bind(this), i2, e3);
          }.call(this, s2[0]) : s2.forEach(t3.bind(this)), e2 || (this.removeTagsFromValue(s2.map((t4) => t4.node)), this.update(), "select" == a2.mode && this.setContentEditable(true));
        }).catch((t3) => {
        });
    }, removeTagsFromDOM() {
      [].slice.call(this.getTagElms()).forEach((t2) => t2.parentNode.removeChild(t2));
    }, removeTagsFromValue(t2) {
      (t2 = Array.isArray(t2) ? t2 : [t2]).forEach((t3) => {
        var e2 = T(t3), i2 = this.getTagIdx(e2);
        i2 > -1 && this.value.splice(i2, 1);
      });
    }, removeAllTags(t2) {
      t2 = t2 || {}, this.value = [], "mix" == this.settings.mode ? this.DOM.input.innerHTML = "" : this.removeTagsFromDOM(), this.dropdown.refilter(), this.dropdown.position(), this.state.dropdown.visible && setTimeout(() => {
        this.DOM.input.focus();
      }), "select" == this.settings.mode && (this.input.set.call(this), this.setContentEditable(true)), this.update(t2);
    }, postUpdate() {
      var _a, _b;
      this.state.blockChangeEvent = false;
      var t2 = this.settings, e2 = t2.classNames, i2 = "mix" == t2.mode ? t2.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value.trim() : this.value.length + this.input.raw.call(this).length;
      this.toggleClass(e2.hasMaxTags, this.value.length >= t2.maxTags), this.toggleClass(e2.hasNoTags, !this.value.length), this.toggleClass(e2.empty, !i2), "select" == t2.mode && this.toggleScopeValidation((_b = (_a = this.value) == null ? void 0 : _a[0]) == null ? void 0 : _b.__isValid);
    }, setOriginalInputValue(t2) {
      var e2 = this.DOM.originalInput;
      this.settings.mixMode.integrated || (e2.value = t2, e2.tagifyValue = e2.value, this.setPersistedData(t2, "value"));
    }, update(t2) {
      clearTimeout(this.debouncedUpdateTimeout), this.debouncedUpdateTimeout = setTimeout(function() {
        var e2 = this.getInputValue();
        this.setOriginalInputValue(e2), this.settings.onChangeAfterBlur && (t2 || {}).withoutChangeEvent || this.state.blockChangeEvent || this.triggerChangeEvent();
        this.postUpdate();
      }.bind(this), 100);
    }, getInputValue() {
      var t2 = this.getCleanValue();
      return "mix" == this.settings.mode ? this.getMixedTagsAsString(t2) : t2.length ? this.settings.originalInputValueFormat ? this.settings.originalInputValueFormat(t2) : JSON.stringify(t2) : "";
    }, getCleanValue(t2) {
      return a(t2 || this.value, this.dataProps);
    }, getMixedTagsAsString() {
      var t2 = "", e2 = this, i2 = this.settings, s2 = i2.originalInputValueFormat || JSON.stringify, a2 = i2.mixTagsInterpolator;
      return function i3(o2) {
        o2.childNodes.forEach((o3) => {
          if (1 == o3.nodeType) {
            const r2 = T(o3);
            if ("BR" == o3.tagName && (t2 += "\r\n"), r2 && v.call(e2, o3)) {
              if (r2.__removed)
                return;
              t2 += a2[0] + s2(n(r2, e2.dataProps)) + a2[1];
            } else
              o3.getAttribute("style") || ["B", "I", "U"].includes(o3.tagName) ? t2 += o3.textContent : "DIV" != o3.tagName && "P" != o3.tagName || (t2 += "\r\n", i3(o3));
          } else
            t2 += o3.textContent;
        });
      }(this.DOM.input), t2;
    } }, N.prototype.removeTag = N.prototype.removeTags, N;
  });
})(tagify_min);
class AbbrewItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }
  /** @override */
  get template() {
    const path = "systems/abbrew/templates/item";
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }
  /* -------------------------------------------- */
  /** @override */
  getData() {
    var _a;
    const context = super.getData();
    const itemData = context.item;
    context.rollData = {};
    let actor = ((_a = this.object) == null ? void 0 : _a.parent) ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.system = itemData.system;
    context.flags = itemData.flags;
    return context;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) {
      return;
    }
    const requirements = html[0].querySelector('input[name="system.weapon.requirements"]');
    if (requirements) {
      new tagify_minExports(requirements, {});
    }
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.item));
    html.find(".rule-control").click(async (ev) => await onManageRule(ev, this.item));
  }
  async _updateObject(event, formData) {
    if (event.handleObj && event.handleObj.type == "change" || event.type && event.type == "change") {
      if (event.currentTarget) {
        await this.manualUpdate(event, formData);
      } else {
        super._updateObject(event, formData);
      }
    }
    return;
  }
  async manualUpdate(event, formData) {
    const target = event.currentTarget;
    if (target.classList.contains("rule-editor")) {
      const dataset = target.dataset;
      const ruleId = dataset.ruleId;
      const field = dataset.field;
      const updateData = formData[target.name];
      let rules = foundry.utils.deepClone(this.item.system.rules);
      const index = rules.findIndex((r) => r.id == ruleId);
      rules[index][field] = updateData;
      if (field == "type") {
        rules[index].content = options[updateData].template();
      }
      return await this.item.update({
        "system.rules": rules
      });
    } else {
      super._updateObject(event, formData);
    }
  }
  close(options2 = {}) {
    console.log("closing sheet");
    this.getData();
    super.close(options2);
  }
}
class AbbrewItemAnatomySheet extends AbbrewItemSheet {
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }
  /** @override */
  get template() {
    const path = "systems/abbrew/templates/item";
    return `${path}/item-anatomy-sheet.hbs`;
  }
}
const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor partials.
    "systems/abbrew/templates/actor/parts/actor-features.hbs",
    "systems/abbrew/templates/actor/parts/actor-items.hbs",
    "systems/abbrew/templates/actor/parts/actor-anatomy.hbs",
    "systems/abbrew/templates/actor/parts/actor-resources.hbs",
    "systems/abbrew/templates/actor/parts/actor-spells.hbs",
    "systems/abbrew/templates/actor/parts/actor-effects.hbs",
    "systems/abbrew/templates/actor/parts/actor-attacks.hbs",
    "systems/abbrew/templates/actor/parts/actor-defences.hbs",
    "systems/abbrew/templates/actor/parts/actor-armour.hbs",
    "systems/abbrew/templates/actor/parts/actor-form.hbs",
    "systems/abbrew/templates/actor/parts/actor-conditions.hbs",
    "systems/abbrew/templates/parts/active-effects.hbs",
    "systems/abbrew/templates/chat/damage-roll.hbs",
    "systems/abbrew/templates/parts/item-rules.hbs"
  ]);
};
class AbbrewRoll extends Roll {
  constructor(formula, data, options2) {
    super(formula, data, options2);
    if (!this.options.configured) {
      this._configureModifiers();
    }
  }
  static async fromRoll(roll) {
    const newRoll = new this(roll.formula, roll.data, roll.options);
    await newRoll.evaluate({ async: true });
    return newRoll;
  }
  get validD10Roll() {
    return this.terms[0].rolls[0].terms[0] instanceof Die && this.terms[0].rolls[0].terms[0].faces === 10;
  }
  async render(flavor, template, isPrivate) {
    template = this.CHAT_TEMPLATE;
    return super.render(flavor, template, isPrivate);
  }
  /** @inheritdoc */
  async toMessage(messageData = {}, options2 = {}) {
    if (!this.validD10Roll) {
      return;
    }
    if (!this._evaluated)
      await this.evaluate({ async: true });
    options2.rollMode = options2.rollMode ?? this.options.rollMode;
    return super.toMessage(messageData, options2);
  }
  async configureDialog({ title, template } = {}, options2 = {}) {
    const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
      formula: `d10!`
    });
    let defaultButton = "normal";
    return new Promise((resolve) => {
      new Dialog({
        title,
        content,
        buttons: {
          advantage: {
            label: "1",
            callback: (html) => resolve(this._onDialogSubmit(
              html
              /* , D20Roll.ADV_MODE.ADVANTAGE */
            ))
          },
          normal: {
            label: "2",
            callback: (html) => resolve(this._onDialogSubmit(
              html
              /* , D20Roll.ADV_MODE.NORMAL */
            ))
          },
          disadvantage: {
            label: "3",
            callback: (html) => resolve(this._onDialogSubmit(
              html
              /* , D20Roll.ADV_MODE.DISADVANTAGE */
            ))
          }
        },
        default: defaultButton,
        close: () => resolve(null)
      }, options2).render(true);
    });
  }
  // async RollAbbrew(element, dataset, actor) {
  //   // Handle item rolls.
  //   if (dataset.rollType) {
  //     if (dataset.rollType == 'item') {
  //       const itemId = element.closest('.item').dataset.itemId;
  //       const item = actor.items.get(itemId);
  //       if (item) {
  //         return await ChatAbbrew(actor, item);
  //         //   let label = item.name;
  //         //   let roll = new Roll("d10! + " + item.system.formula, actor.getRollData());
  //         //   roll.toMessage({
  //         //     speaker: ChatMessage.getSpeaker({ actor: actor }),
  //         //     flavor: label,
  //         //     rollMode: game.settings.get('core', 'rollMode'),
  //         //   });
  //         //   Hooks.callAll('abbrew.ability', label);
  //         //   return roll;
  //       }
  //     }
  //   }
  //   // Handle rolls that supply the formula directly.
  //   if (dataset.ability) {
  //     let label = dataset.label ? `[ability] ${dataset.label}` : '';
  //     let roll = new Roll("d10 + " + dataset.ability, actor.getRollData());
  //     roll.toMessage({
  //       speaker: ChatMessage.getSpeaker({ actor: actor }),
  //       flavor: label,
  //       rollMode: game.settings.get('core', 'rollMode'),
  //     });
  //     Hooks.callAll('abbrew.ability', label);
  //     return roll;
  //   }
  // }
  _onDialogSubmit(html, advantageMode) {
    const form = html[0].querySelector("form");
    if (form.weakOrStrong.value) {
      const weakOrStrong = form.weakOrStrong.value;
      if (weakOrStrong < 0) {
        this.options.weak = true;
        this.options.weakValue = Math.abs(weakOrStrong);
      } else if (weakOrStrong > 0) {
        this.options.strong = true;
        this.options.strongValue = Math.abs(weakOrStrong);
      }
    }
    this._configureModifiers();
    return this;
  }
  _configureModifiers() {
    const d10 = this.terms[0].rolls[0];
    if (this.options.weak) {
      d10.terms[4].number += this.options.weakValue;
    }
    if (this.options.strong) {
      d10.terms[0].number += this.options.strongValue;
    }
    this._formula = this.constructor.getFormula(this.terms);
    this.options.configured = true;
  }
}
__publicField(AbbrewRoll, "EVALUATION_TEMPLATE", "systems/abbrew/templates/chat/roll-dialog.hbs");
__publicField(AbbrewRoll, "CHAT_TEMPLATE", "systems/abbrew/templates/chat/damage-roll.hbs");
async function handleTurnStart(combat, updateData, updateOptions) {
  if (updateData.round < combat.round || updateData.round == combat.round && updateData.turn < combat.turn) {
    return;
  }
  let nextActor = combat.current.combatantId ? combat.nextCombatant.actor : combat.turns[0].actor;
  await turnStart(nextActor);
}
async function turnStart(actor) {
  ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor }) });
  if (actor.system.canBleed) {
    let activeWounds = actor.system.wounds.active;
    console.log(activeWounds);
    let currentBlood = actor.system.blood.value;
    console.log(currentBlood);
    let bleedPrevention = actor.system.conditions.bleedPrevention;
    if (bleedPrevention > 0) {
      bleedPrevention = bleedPrevention < activeWounds ? bleedPrevention : activeWounds;
      let healingWounds = actor.system.wounds.healing + bleedPrevention;
      await actor.update({ "system.wounds.healing": healingWounds });
    }
    activeWounds = activeWounds - bleedPrevention;
    await actor.update({ system: { wounds: { active: activeWounds } } });
    let gushingWounds = 0;
    if (activeWounds === 0) {
      await actor.update({ "system.conditions.gushingWounds": 0 });
    }
    if (actor.system.conditions.gushingWounds > 0) {
      gushingWounds = actor.system.conditions.gushingWounds * 5;
    }
    let newBlood = Math.max(currentBlood - (activeWounds + gushingWounds), 0);
    console.log(newBlood);
    if (newBlood != currentBlood) {
      await actor.update({ "system.blood.value": newBlood });
    }
    if (newBlood <= actor.system.blood.nausea) {
      await actor.update({ "system.conditions.nausea": 1 });
    } else {
      await actor.update({ "system.conditions.nausea": 0 });
    }
    if (newBlood <= actor.system.blood.unconscious) {
      await actor.update({ "system.conditions.unconscious": 1 });
    } else {
      await actor.update({ "system.conditions.unconscious": 0 });
    }
  }
  let armour = actor.system.armour;
  let newArmour = armour.value;
  console.log("Armour: ", armour);
  if (armour.value < armour.max) {
    getOut:
      if (actor.effects.find((e) => e.label === "Regenerating")) {
        console.log("Check for regain Armour");
        if (actor.effects.find((e) => e.label === "Weakened")) {
          console.log("Exposed so no armour regained");
          break getOut;
        }
        let armourMultiplier = 1;
        if (actor.effects.find((e) => e.label === "Cursed")) {
          armourMultiplier = 0.5;
        }
        console.log("Regain Armour");
        let missingArmour = armour.max - armour.value;
        console.log("Missing Armour: ", missingArmour);
        newArmour = armour.value + Math.max(Math.floor(missingArmour * armourMultiplier / 2), 1);
        console.log("newArmour", newArmour);
      }
  } else {
    newArmour = armour.max;
  }
  await actor.update({ "system.armour.value": newArmour });
}
Hooks.once("init", async function() {
  Handlebars.registerHelper("json", function(context) {
    return JSON.stringify(context);
  });
  game.abbrew = {
    AbbrewActor,
    AbbrewItem,
    rollItemMacro
  };
  CONFIG.ABBREW = ABBREW;
  CONFIG.Combat.initiative = {
    formula: "1d10 + @statistics.dexterity.mod + @statistics.agility.mod + @statistics.wits.mod",
    decimals: 2
  };
  CONFIG.Dice.AbbrewRoll = AbbrewRoll;
  CONFIG.Dice.rolls.push(AbbrewRoll);
  CONFIG.Actor.documentClass = AbbrewActor;
  CONFIG.Item.documentClass = AbbrewItem;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("abbrew", AbbrewActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  const sheetEntries = [
    ["anatomy", AbbrewItemAnatomySheet],
    ["item", AbbrewItemSheet],
    ["feature", AbbrewItemSheet],
    ["spell", AbbrewItemSheet],
    ["resource", AbbrewItemSheet],
    ["attack", AbbrewItemSheet],
    ["defence", AbbrewItemSheet]
  ];
  for (const [type, Sheet] of sheetEntries) {
    Items.registerSheet("abbrew", Sheet, {
      types: [type],
      label: game.i18n.localize(ABBREW.SheetLabel, { type }),
      makeDefault: true
    });
  }
  return preloadHandlebarsTemplates();
});
Hooks.on("pauseGame", async function(paused) {
  const actor = game.actors.get("rLEUu5Vg7QCj59dE");
  console.log("paused");
  const items = actor.items;
  const choices2 = items.map((i) => ({ id: i._id, name: i.name }));
  const data = { content: { promptTitle: "Hello", choices: choices2 }, buttons: {} };
  const returned = await new ChoiceSetPrompt(data).resolveSelection();
  console.log(returned);
});
Handlebars.registerHelper("concat", function() {
  var outStr = "";
  for (var arg in arguments) {
    if (typeof arguments[arg] != "object") {
      outStr += arguments[arg];
    }
  }
  return outStr;
});
Handlebars.registerHelper("toLowerCase", function(str) {
  return str.toLowerCase();
});
Handlebars.registerHelper("isNumber", function(value) {
  return typeof value === "number";
});
Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
async function createItemMacro(data, slot) {
  if (data.type !== "Item")
    return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  const item = await Item.fromDropData(data);
  const command = `game.abbrew.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "abbrew.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
function rollItemMacro(itemUuid) {
  const dropData = {
    type: "Item",
    uuid: itemUuid
  };
  Item.fromDropData(dropData).then((item) => {
    if (!item || !item.parent) {
      const itemName = (item == null ? void 0 : item.name) ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }
    item.roll();
  });
}
Hooks.on("renderChatLog", (app, html, data) => {
  AbbrewActor.chatListeners(html);
  AbbrewItem.chatListeners(html);
});
Hooks.on("abbrew.ability", function(ability) {
  console.log("Hooked on " + ability);
});
Hooks.once("dragRuler.ready", (SpeedProvider) => {
  class AbbrewSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: "walk", default: 65280, name: "abbrew.speeds.walk" },
        { id: "dash", default: 16776960, name: "abbrew.speeds.dash" },
        { id: "run", default: 16744448, name: "abbrew.speeds.run" }
      ];
    }
    getRanges(token) {
      const baseSpeed = token.actor.system.movement.base;
      const ranges = [
        { range: baseSpeed, color: "walk" },
        { range: baseSpeed * 2, color: "dash" },
        { range: baseSpeed * 3, color: "run" }
      ];
      return ranges;
    }
  }
  dragRuler.registerSystem("abbrew", AbbrewSpeedProvider);
});
Hooks.on("combatStart", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData);
});
Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData);
});
Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
  await handleTurnStart(combat, updateData);
});
Hooks.on("updateActor", (value) => {
  console.log("ActorUpdated");
});
Hooks.on("updateToken", (value) => {
  console.log("TokenUpdated");
});
//# sourceMappingURL=abbrew.mjs.map
