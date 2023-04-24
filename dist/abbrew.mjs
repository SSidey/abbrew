var fe = Object.defineProperty;
var ve = (u, r, s) => r in u ? fe(u, r, { enumerable: !0, configurable: !0, writable: !0, value: s }) : u[r] = s;
var O = (u, r, s) => (ve(u, typeof r != "symbol" ? r + "" : r, s), s);
async function re({
  parts: u = [],
  data: r = {},
  title: s,
  flavour: n,
  dialogOptions: o,
  messageData: d = {},
  options: p = {},
  chatMessage: v = !0,
  rollMode: m,
  flavor: b
}) {
  let D = 1 + r.amplification, M = 0 + r.weakness;
  D = "" + D, M = "" + M;
  const E = ["{" + D + "d10x>=" + r.criticalThreshold, ...u].join("+") + " -" + M + "d10, 0}kh", P = m || game.settings.get("core", "rollMode");
  foundry.utils.mergeObject(p, {
    flavor: b || s,
    defaultRollMode: P,
    rollMode: m
  });
  const V = new CONFIG.Dice.AbbrewRoll(E, r);
  await V.configureDialog({ title: "Additional Modifiers" }), await V.evaluate({ async: !0 }), d = {}, d.flags = { data: r }, await V.toMessage(d);
}
Hooks.on("init", () => {
  $(document).on("click", ".damage-application button", De);
});
class ye {
  constructor(r, s, n, o, d, p, v) {
    O(this, "id", "");
    O(this, "abilityModifier", "");
    O(this, "damageBase", 0);
    O(this, "isWeapon", !1);
    O(this, "weapon", {});
    O(this, "isMagic", !1);
    O(this, "magic", {});
    this.id = r, this.abilityModifier = s, this.damageBase = n, this.isWeapon = o, this.weapon = d, this.isMagic = p, this.magic = v;
  }
}
async function be(u, r, s) {
  let n = `${u.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
  const o = we(s, u, r);
  o.mod = 10;
  const d = {
    parts: [r.abilityModifier, "@attackProfile.damageBase"],
    data: o,
    title: n,
    flavour: n,
    dialogOptions: {
      width: 400,
      top: null,
      left: window.innerWidth - 710
    },
    messageData: {
      "flags.abbrew.roll": { type: "attack", attack: u.id, attackProfile: r.id },
      speaker: ChatMessage.getSpeaker({ actor: s })
    },
    options: {
      damageType: r.damageType
    }
  };
  return await re(d);
}
function we(u, r, s) {
  if (!u)
    return null;
  const n = u.getRollData();
  return n.attack = foundry.utils.deepClone(r), n.attackProfile = foundry.utils.deepClone(s), n.criticalThreshold = Te(u, s), n.amplification = Ae(u, s), n.weakness = Oe(u, s), n;
}
function Te(u, r) {
  const s = r.weapon.criticalThreshold, n = r.weapon.damageType, o = u.system.concepts.attack.criticalThreshold;
  let d = 10;
  u.system.concepts[n] && (d = u.system.concepts[n].criticalThreshold);
  const p = Math.min(s, o, d);
  return Math.max(p, 5);
}
function Ae(u, r) {
  const s = r.weapon.damageType;
  return u.system.concepts[s] ? u.system.concepts[s].amplification : 0;
}
function Oe(u, r) {
  const s = r.weapon.damageType;
  return u.system.concepts[s] ? u.system.concepts[s].weakness : 0;
}
async function De(u) {
  console.log(u);
  const n = u.currentTarget.closest(".chat-message").closest(".message").dataset.messageId, o = game.messages.get(n);
  await canvas.tokens.controlled.filter((p) => p.actor)[0].actor.acceptDamage(o.rolls, o.flags.data);
}
class oe {
  constructor(r, s, n, o, d) {
    O(this, "id");
    O(this, "label");
    O(this, "type");
    O(this, "priority");
    O(this, "predicate");
    // The property to modify e.g. system.abilities.strength.value
    O(this, "target");
    O(this, "source");
    O(this, "valid");
    this.type = n, this.priority = 100, this.id = r, this.label = s, this.valid = d, this.source = o, this.predicate = "", this.target = "";
  }
  get _type() {
    return this.type;
  }
  template() {
    return JSON.stringify(this);
  }
  static applyRule(r, s) {
    return {};
  }
  static validate(r) {
    return r.hasOwnProperty("type") && r.hasOwnProperty("priority") && r.hasOwnProperty("predicate") && r.hasOwnProperty("target");
  }
}
const R = {};
R.abilities = {
  strength: "ABBREW.AbilityStrength",
  dexterity: "ABBREW.AbilityDexterity",
  constitution: "ABBREW.AbilityConstitution",
  agility: "ABBREW.AbilityAgility",
  intelligence: "ABBREW.AbilityIntelligence",
  will: "ABBREW.AbilityWill",
  wits: "ABBREW.AbilityWits",
  visualisation: "ABBREW.AbilityVisualisation"
};
R.abilityAbbreviations = {
  str: "ABBREW.AbilityStrengthAbbreviation",
  dex: "ABBREW.AbilityDexterityAbbreviation",
  con: "ABBREW.AbilityConstitutionAbbreviation",
  agi: "ABBREW.AbilityAgilityAbbreviation",
  int: "ABBREW.AbilityIntelligenceAbbreviation",
  wll: "ABBREW.AbilityWillAbbreviation",
  wts: "ABBREW.AbilityWitsAbbreviation",
  wis: "ABBREW.AbilityVisualisationAbbreviation"
};
R.ActionTypes = {
  Damage: "damage"
};
R.Reach = {
  natural: "ABBREW.ReachNatural",
  short: "ABBREW.ReachShort",
  standard: "ABBREW.ReachStandard",
  long: "ABBREW.ReachLong"
};
R.DamageTypes = {
  physical: "ABBREW.physical",
  crushing: "ABBREW.crushing",
  slashing: "ABBREW.slashing",
  piercing: "ABBREW.piercing"
};
R.DamageProjection = {
  arc: "ABBREW.Arc",
  thrust: "ABBREW.Thrust"
};
R.UI = {
  RuleElements: {
    Prompt: {
      NoValidOptions: "ABBREW.NoValidOptions",
      NoSelectionMade: "ABBREW.NoSelectionMade"
    }
  }
};
R.RuleTypes = {
  ActiveEffect: "ABBREW.ActiveEffect",
  ChoiceSet: "ABBREW.ChoiceSet"
};
class K extends oe {
  constructor(s, n, o, d, p) {
    super(s, n, R.RuleTypes.ActiveEffect, d, p);
    O(this, "operator");
    O(this, "value");
    if (o && typeof o == "object") {
      o && Object.assign(this, o);
      return;
    }
    this.operator = "", this.value = "";
  }
  static validate(s) {
    return super.validate(s) && s.hasOwnProperty("operator") && s.hasOwnProperty("value") && this.validOperators.includes(s.operator) && !!s.value;
  }
  static applyRule(s, n) {
    let o = {}, d = s.targetElement ? n.items.get(s.targetElement) : n, p = s.targetElement ? "Item" : "Actor", v = getProperty(d, s.target);
    if (!v)
      return o;
    let m = getProperty(d, s.target);
    switch (s.operator) {
      case "override":
        m = +s.value;
        break;
      case "add":
        m = m += +s.value;
        break;
      case "minus":
        m = m -= +s.value;
        break;
      case "multiply":
        m = m * +s.value;
        break;
      case "divide":
        const b = +s.value != 0 ? +s.value : 1;
        m = m / b;
        break;
      case "upgrade":
        m = m < s.value ? s.value : m;
        break;
      case "downgrade":
        m = m > s.value ? s.value : m;
        break;
    }
    if (v != m) {
      const b = { [s.target]: m, rules: [s.id] };
      let D = v;
      Object.keys(n.ruleOverrides).includes(s.target) && (D = n.ruleOverrides[s.target].sourceValue), o = { target: s.target, value: m, sourceValue: D, targetType: p, targetElement: s.targetElement }, mergeObject(d, b);
    }
    return o;
  }
}
O(K, "validOperators", [
  "override",
  "add",
  "minus",
  "multiply",
  "divide",
  "upgrade",
  "downgrade"
]);
class le extends Dialog {
  constructor(s = { promptTitle, choices }, n = {}) {
    n.buttons = {}, s.buttons = {};
    super(s, n);
    O(this, "selection");
    O(this, "choices");
    this.choices = s.content.choices;
  }
  /** @override */
  get template() {
    return "systems/abbrew/templates/rules/choice-set-prompt.hbs";
  }
  /** @override */
  activateListeners(s) {
    s[0].querySelectorAll("a[data-choice], button[type=button]").forEach((o) => {
      o.addEventListener("click", (d) => {
        console.log("clicked"), this.selection = d.currentTarget.dataset.id, this.close();
      });
    });
  }
  getData() {
    console.log("getData", this);
    const s = super.getData();
    return s.header = this.data.header, s.footer = this.data.footer, s.choices = s.content.choices, s.promptTitle = s.content.promptTitle, console.log(s), s;
  }
  /** Return early if there is only one choice */
  async resolveSelection() {
    if (this.choices.length === 0)
      return await this.close({ force: !0 }), null;
    const s = this.choices.at(0);
    return s && this.choices.length === 1 ? this.selection = s[0] : (this.render(!0), new Promise((n) => {
      this.resolve = n;
    }));
  }
  /** @override */
  /** Close the dialog, applying the effect with configured target or warning the user that something went wrong. */
  async close({ force: s = !1 } = {}) {
    var n;
    this.element.find("button, select").css({ pointerEvents: "none" }), this.selection || (s ? ui.notifications.warn(
      game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoValidOptions", {
        actor: this.actor.name,
        item: this.item.name
      })
    ) : this.allowNoSelection || ui.notifications.warn(
      game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoSelectionMade")
    )), (n = this.resolve) == null || n.call(this, this.selection), await super.close({ force: s });
  }
}
class z extends oe {
  constructor(s, n, o, d, p) {
    super(s, n, R.RuleTypes.ChoiceSet, d, p);
    O(this, "options");
    O(this, "choice");
    if (o && typeof o == "object") {
      o && Object.assign(this, o);
      return;
    }
    this.options = ["weapon", "armour", "consumable", "anatomy"], this.choice = "";
  }
  set target(s) {
    this.target = s;
  }
  static validate(s) {
    return super.validate(s) && s.hasOwnProperty("options");
  }
  static async applyRule(s, n) {
    return {};
  }
  static async getChoice(s, n) {
    if (s.choice)
      return s.choice;
    let o = [];
    s.options.includes("weapon") && (o = mergeObject(o, this.getItemWeapons(n))), s.options.includes("armour") && (o = mergeObject(o, this.getItemArmour(n))), s.options.includes("consumable") && (o = mergeObject(o, this.getItemConsumable(n))), s.options.includes("anatomy") && (o = mergeObject(o, this.getItemAnatomy(n)));
    const d = { content: { promptTitle: "Hello", choices: o }, buttons: {} }, p = await new le(d).resolveSelection();
    let v = s.source.item;
    s.source.actor || (v = n.items.map((b) => b.system.rules).flat(1).filter((b) => b.id == s.id)[0].source.item);
    const m = n.items.get(v);
    for (let b = 0; b < m.system.rules.length; b++)
      if (m.system.rules[b].targetElement = p, m.system.rules[b].id == s.id) {
        m.system.rules[b].choice = p;
        const D = m.system.rules[b].content;
        let M = JSON.parse(D);
        M.choice = p, m.system.rules[b].content = JSON.stringify(M);
      }
    return m.update({ system: { rules: m.system.rules } }), p;
  }
  static getItemWeapons(s) {
    return s.itemTypes.item.filter((n) => n.system.isWeapon).map((n) => ({ id: n._id, name: n.name }));
  }
  static getItemArmour(s) {
    return s.itemTypes.item.filter((n) => n.system.isArmour).map((n) => ({ id: n._id, name: n.name }));
  }
  static getItemConsumable(s) {
    return s.itemTypes.item.filter((n) => n.system.isConsumable).map((n) => ({ id: n._id, name: n.name }));
  }
  static getItemAnatomy(s) {
    return s.itemTypes.anatomy.map((n) => ({ id: n._id, name: n.name }));
  }
}
class Ee {
  constructor({ id: r, type: s, label: n, content: o, source: d }) {
    O(this, "id");
    O(this, "type");
    O(this, "label");
    O(this, "content");
    O(this, "source");
    O(this, "options");
    O(this, "targetElement");
    this.id = r, this.type = s, this.label = n, this.content = o, this.source = d, this.options = te, this.targetElement = "";
  }
}
const te = [
  new K(),
  new z()
];
class Ie {
  constructor(r) {
    O(this, "actor");
    O(this, "item");
    O(this, "uuid");
    this.uuid = r, this.actor = "", this.item = "";
    const s = r.split(".");
    for (let n = 0; n < s.length; n++)
      s[n] == "Actor" && (this.actor = s[n + 1]), s[n] == "Item" && (this.item = s[n + 1]);
  }
}
async function xe(u, r) {
  u.preventDefault();
  const s = u.currentTarget, o = s.closest("li").dataset.ruleId;
  let d = foundry.utils.deepClone(r.system.rules);
  switch (s.dataset.action) {
    case "create":
      const p = Ce();
      d = [
        new Ee({ id: p, type: 0, label: "New Rule", content: te[0].template(), source: new Ie(r.uuid) }),
        ...d
      ];
      break;
    case "delete":
      d = d.filter((v) => v.id != o);
      break;
  }
  return await r.update({
    "system.rules": d
  });
}
function Ce() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
async function _e(u) {
  const r = u.items._source.map((o) => o.system.rules).flat(1), s = [], n = [];
  for (let o = 0; o < r.length; o++) {
    const d = r[o];
    n[d.source.uuid] && (d.targetElement = n[d.source.uuid]);
    const p = JSON.parse(d.content);
    let v = {}, m = !1;
    switch (p.type) {
      case R.RuleTypes.ActiveEffect:
        console.log("Active Effect"), m = K.validate(p), v = new K(d.id, d.label, p, d.source, m), v.targetElement = d.targetElement, s.push(v);
        break;
      case R.RuleTypes.ChoiceSet:
        console.log("Choice Set"), m = z.validate(p), v = new z(d.id, d.label, p, d.source, m);
        const b = await z.getChoice(v, u);
        n[d.source.uuid] = b, v.targetElement = b, v.choice = b, s.push(v);
        break;
    }
  }
  await u.update({ "system.rules": s });
}
function Me(u, r) {
  let s = {};
  switch (u.type) {
    case R.RuleTypes.ActiveEffect:
      s = K.applyRule(u, r);
      break;
    case R.RuleTypes.ChoiceSet:
      s = z.applyRule(u, r);
      break;
  }
  return s;
}
function ae(u, r, s) {
  let n = [];
  n[r] = s;
  let o = expandObject(n);
  u.update(o);
}
class ne extends Actor {
  constructor() {
    super(...arguments);
    O(this, "ruleOverrides");
  }
  /** @override */
  prepareData() {
    console.log("before"), super.prepareData(), console.log("between"), console.log("after");
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
    const s = this;
    s.system, s.flags.abbrew, this._prepareCharacterData(s), this._prepareNpcData(s);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(s) {
    if (s.type !== "character")
      return;
    const n = s.system;
    this._processRules(this), this._prepareAbilityModifiers(n), this._prepareAnatomy(n), this._prepareMovement(n), this._prepareDefences(n), this._prepareArmour(n), this._preparePower(n), this._prepareActions(n), this._prepareFeatures(n);
  }
  async _updateObject(s, n) {
    console.log("here"), await super._updateObject(s, n);
  }
  _onUpdate(s, n, o) {
    console.log("here2"), super._onUpdate(s, n, o);
  }
  async _preUpdate(s, n, o) {
    if (console.log("pre-update"), this.ruleOverrides) {
      let d = flattenObject(s, 1), p = Object.keys(d).map((m) => [m, d[m]]);
      const v = Object.keys(this.ruleOverrides);
      p.forEach((m) => {
        if (v.includes(m[0]) && this.ruleOverrides[m[0]].overrideValue == m[1]) {
          let D = m[0].split("."), M = D.pop(), C = D.reduce((E, P) => E[P], s);
          delete C[M];
        }
      });
    }
    super._preUpdate(s, n, o);
  }
  _onUpdateEmbeddedDocuments(s, n, o, d, p) {
    console.log(`Update Object: ${s}`), super._onUpdateEmbeddedDocuments(s, n, o, d, p);
  }
  _processRules(s) {
    if (this.prepareItems(this), this.resetItems(this), _e(this), s.system.rules.length == 0) {
      this.ruleOverrides = [];
      return;
    }
    let n = [];
    this.ruleOverrides = [], s.ruleOverrides = [], s.system.rules.filter(
      (o) => o.valid
    ).sort((o, d) => d.priority - o.priority).forEach((o) => {
      const d = Me(o, s);
      Object.keys(d).length != 0 && (n[d.target] = {
        overrideValue: d.value,
        sourceValue: d.sourceValue,
        targetType: d.targetType,
        targetElement: d.targetElement
      }, s.ruleOverrides[d.target] = n[d.target]);
    }), this.ruleOverrides = n;
  }
  /**
   * Reset item overridden fields to pre-rule values.
   * @param {AbbrewActor} actorData    
   */
  prepareItems(s) {
    s.items.filter((n) => n.system.rules.length > 0).forEach((n) => {
      n.system.rules.forEach((d) => {
        d.source.actor && d.source.item || (d.source.actor = this.id, d.source.item = n.id, d.source.uuid = `Actor.${this.id}.Item.${n.id}`);
      });
      const o = s.items.get(n.id);
      ae(o, "system.rules", n.system.rules);
    });
  }
  resetItems(s) {
    if (s.ruleOverrides) {
      for (const [n, o] of Object.entries(s.ruleOverrides))
        if (o.targetType == "Item") {
          const d = s.items.get(o.targetElement), p = n;
          p.split(".").reduce((b, D) => b[D], d) == o.overrideValue && ae(d, p, o.sourceValue);
        }
    }
  }
  async _updateDocuments(s, { updates: n, options: o, pack: d }, p) {
    console.log("update-documents"), super._updateDocuments(s, { updates: n, options: o, pack: d }, p);
  }
  _prepareAnatomy(s) {
    this.itemTypes.anatomy.forEach(
      (n) => {
        const o = n.system.tags.replace(" ", "").split(",");
        n.system.tagsArray = o;
        const d = n.system.armourPoints.replace(" ", "").split(",");
        n.system.armourPointsArray = d;
      }
    ), s.anatomy = this.itemTypes.anatomy;
  }
  _prepareDefences(s) {
    const n = Object.fromEntries(Object.entries(this.itemTypes.defence).map(([o, d]) => [d.name, d.system]));
    s.defences = { ...s.defences, ...n };
  }
  _prepareFeatures(s) {
    const o = this._getWeapons().map((d) => this._prepareWeaponAttack(d, s));
    s.attacks = o.flat();
  }
  _getWeapons() {
    return this._getItemWeapons().map((s) => ({ name: s.name, img: s.img, weaponId: s._id, weight: s.system.weight, concepts: s.system.concepts, material: s.system.material, ...s.system.weapon }));
  }
  _getItemWeapons() {
    return this.itemTypes.item.filter((s) => s.system.isWeapon);
  }
  _prepareWeaponAttack(s) {
    const n = s.weaponProfiles.split(",").map((o, d) => {
      const p = o.split("-"), v = p[0].replace(" ", ""), m = p[1], b = { strength: { value: 5 } };
      let D = 0;
      switch (p[1]) {
        case "arc":
          D = +s.material.structure + b.strength.value * (1 + s.minimumEffectiveReach) + s.material.tier * 5;
          break;
        case "thrust":
          D = +s.material.structure + s.material.tier * 5, s.penetration = s.material.tier * 5;
          break;
        default:
          return;
      }
      return new ye(
        d,
        "@system.abilities.strength.mod",
        D,
        !0,
        {
          requirements: s.requirements,
          reach: s.reach,
          minimumEffectiveReach: s.minimumEffectiveReach,
          focused: s.focused,
          penetration: s.penetration,
          traits: s.traits,
          handsSupplied: s.handsSupplied,
          handsRequired: s.handsRequired,
          traitsArray: s.traitsArray,
          criticalThreshold: s.criticalThreshold,
          damageType: v,
          attackType: m
        },
        !1,
        {}
      );
    });
    return {
      id: s.weaponId,
      name: s.name,
      image: s.img || "icons/svg/sword.svg",
      isWeapon: !0,
      isEquipped: s.isEquipped,
      profiles: n
    };
  }
  async equipWeapon(s, n) {
    const o = [];
    o.push({ _id: s, system: { weapon: { isEquipped: n } } }), await this.updateEmbeddedDocuments("Item", o);
  }
  async equipArmour(s, n) {
    const o = [];
    o.push({ _id: s, system: { armour: { isEquipped: n } } }), await this.updateEmbeddedDocuments("Item", o);
  }
  _prepareAbilityModifiers(s) {
    for (let [n, o] of Object.entries(s.abilities))
      o.mod = Math.floor(o.value / 2);
  }
  _prepareMovement(s) {
    const n = s.abilities.agility.mod, o = s.anatomy.filter((d) => d.system.tagsArray.includes("primary")).length;
    s.movement.base = n * o;
  }
  _prepareArmour(s) {
    s.armours = this.itemTypes.item.filter((m) => m.system.isArmour);
    let n = this.itemTypes.anatomy.map((m) => m.system.armourBonus);
    const o = foundry.utils.getProperty(this, this.system.naturalArmour);
    n = n.map((m) => (m === "natural" && (m = o), m));
    const d = 0, p = n.map((m) => +m).reduce((m, b) => m + b, d);
    s.armour.max = p;
    const v = s.armour.defences.replaceAll(" ", "").split(",");
    s.armour.defencesArray = v;
  }
  _preparePower(s) {
    const n = this._sumValues(s);
    s.attributes.power.value = n;
  }
  _prepareActions(s) {
    s.actions = { current: 3, maximum: 3 };
  }
  // TODO: Generalise or change
  _sumValues(s) {
    return Object.values(s.abilities).reduce(function(n, o) {
      return n += o.value;
    }, 0);
  }
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(s) {
    if (s.type !== "npc")
      return;
    const n = s.system;
    n.xp = n.cr * n.cr * 100;
  }
  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const s = super.getRollData();
    return this._getCharacterRollData(s), this._getNpcRollData(s), s;
  }
  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(s) {
    if (this.type === "character") {
      if (s.abilities)
        for (let [n, o] of Object.entries(s.abilities))
          s[n] = foundry.utils.deepClone(o);
      s.attributes.level && (s.lvl = s.attributes.level.value ?? 0);
    }
  }
  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(s) {
    this.type;
  }
  async acceptDamage(s, n) {
    const o = this, d = this.system;
    let p = s[0]._total, v = s[0], m = n.attackProfile.weapon.penetration, b = d.armour.value, D = b;
    const M = n.attackProfile.weapon.damageType;
    if (!d.defences[M]) {
      const V = await this.getCriticalExplosions(v, 0, 0);
      await this.handleDamage(d, p, "untyped", V);
    }
    const C = d.defences[M];
    if (C.absorb) {
      await this.absorbDamage(o, d, p);
      return;
    }
    if (C.immune)
      return;
    C.deflect && C.conduct || (C.deflect ? p = await this.deflectDamage(v) : C.conduct && (p = await this.conductDamage(v)));
    let E = await this.getCriticalExplosions(v, C.vulnerable, C.negate);
    if (d.armour.defencesArray.includes(M)) {
      const V = C.penetrate + m, F = C.block - V, q = p, W = b + F - p;
      if (W < 0 ? p = Math.min(Math.abs(W), q) : p = 0, V < b + C.block) {
        const G = b + F, I = Math.min(G, q);
        D = b - I;
      } else
        D = b;
    }
    let P = {};
    p > 0 && (P = await this.handleDamage(d, p, M, E, n.attackProfile)), P["system.armour.value"] = D, await o.update(P);
  }
  async absorbDamage(s, n, o) {
    let d = n.blood.value;
    d = Math.min(d + o, n.blood.fullMax);
    const p = Math.max(d, n.blood.max);
    await s.update({ "system.blood.value": d, "system.blood.max": p });
  }
  async deflectDamage(s) {
    const n = s.terms[0].rolls[0].terms[0].results.reduce((o, d) => o + d.result, 0);
    return s.total - n;
  }
  async conductDamage(s) {
    const n = s.terms[0].rolls[0].terms[0].results.reduce((p, v) => p + v.result, 0), d = s.terms[0].rolls[0].terms[0].results.length * 10 - n;
    return s.total + d;
  }
  async getCriticalExplosions(s, n, o) {
    const d = +s.terms[0].rolls[0].terms[0].modifiers[0].split("=")[1];
    return s.terms[0].rolls[0].terms[0].results.filter((v) => v.result >= d).length - o + n;
  }
  async handleDamage(s, n, o, d, p) {
    if (o === "heat")
      return await this.handleHeat(s, n, d, p);
    if (["crushing", "slashing", "piercing", "untyped"].includes(o))
      return await this.handlePhysical(s, n, d, p);
  }
  async handleHeat(s, n, o, d) {
    s.wounds.healing += n, s.state += d.thermalChange;
    const p = { "system.wounds.healing": n };
    if (o) {
      let v = s.blood.value -= n, m = s.blood.max -= n;
      p["system.blood.current"] = v, p["system.blood.max"] = m;
    }
    return p;
  }
  async handlePhysical(s, n, o, d) {
    const p = {};
    if (s.canBleed) {
      let v = s.wounds.active += n;
      p["system.wounds.active"] = v;
    }
    if (s.suffersPain) {
      const v = s.pain += n;
      p["system.pain"] = v;
    }
    if (o)
      switch (d.weapon.damageType) {
        case "crushing":
          await this.handleCrushingCritical(p, n, o);
          break;
        case "slashing":
          await this.handleSlashingCritical(p, n, o);
          break;
        case "piercing":
          await this.handlePiercingCritical(p, n, o);
          break;
      }
    return p;
  }
  async handleCrushingCritical(s, n, o) {
    s["system.conditions.sundered"] = n;
  }
  async handleSlashingCritical(s, n, o) {
    s["system.wounds.active"] += n;
  }
  async handlePiercingCritical(s, n, o) {
    s["system.conditions.gushingWounds"] = o;
  }
}
class Z extends Item {
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
    const r = this.actor.getRollData();
    return r.item = foundry.utils.deepClone(this.system), r;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const r = this, s = ChatMessage.getSpeaker({ actor: this.actor }), n = game.settings.get("core", "rollMode"), o = `[${r.type}] ${r.name}`;
    if (!this.system.formula)
      ChatMessage.create({
        speaker: s,
        rollMode: n,
        flavor: o,
        content: r.system.description ?? ""
      });
    else {
      const d = this.getRollData(), p = new Roll(d.item.formula, d);
      return p.toMessage({
        speaker: s,
        rollMode: n,
        flavor: o
      }), p;
    }
  }
  async use(r = {}, s = {}) {
    let n = this;
    return n.system, n.actor.system, s = foundry.utils.mergeObject({
      configureDialog: !0,
      createMessage: !0,
      "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
    }, s), await this.displayCard(s);
  }
  async displayCard(r = {}) {
    const s = this.actor.token, n = {
      actor: this.actor,
      tokenId: (s == null ? void 0 : s.uuid) || null,
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
    }, o = await renderTemplate("systems/abbrew/templates/chat/item-card.hbs", n), d = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: o,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token: s }),
      flags: { "core.canPopout": !0 }
    };
    d.flags = foundry.utils.mergeObject(d.flags, r.flags), Hooks.callAll("abbrew.preDisplayCard", this, d, r);
    const p = r.createMessage !== !1 ? await ChatMessage.create(d) : d;
    return Hooks.callAll("abbrew.displayCard", this, p), p;
  }
  async getChatData(r = {}) {
    const s = this.toObject().system;
    this.labels, s.description = await TextEditor.enrichHTML(s.description, {
      async: !0,
      relativeTo: this,
      rollData: this.getRollData(),
      ...r
    });
    const n = [];
    return s.properties = n.filter((o) => !!o), s;
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */
  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(r) {
    r.on("click", ".card-buttons button", this._onChatCardAction.bind(this)), r.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }
  static async _onChatCardAction(r) {
    r.preventDefault();
    const s = r.currentTarget;
    s.disabled = !0;
    const n = s.closest(".chat-card"), o = n.closest(".message").dataset.messageId, d = game.messages.get(o), p = s.dataset.action, v = await this._getChatCardActor(n);
    if (!v || !(p === "contest" || game.user.isGM || v.isOwner))
      return;
    const b = d.getFlag("abbrew", "itemData"), D = b ? new this(b, { parent: v }) : v.items.get(n.dataset.itemId);
    if (!D) {
      const M = game.i18n.format("ABBREW.ActionWarningNoItem", { item: n.dataset.itemId, name: v.name });
      return ui.notifications.error(M);
    }
    await D.rollAttack({ event: r }), s.disabled = !1;
  }
  async rollAttack(r = {}) {
    const { rollData: s, parts: n } = this.getAttack();
    let o = `${this.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
    s.mod = 10;
    const d = foundry.utils.mergeObject({
      actor: this.actor,
      data: s,
      critical: this.getCriticalThreshold(),
      title: o,
      flavor: o,
      dialogOptions: {
        width: 400,
        top: r.event ? r.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {
        "flags.abbrew.roll": { type: "attack", itemId: this.id, itemUuid: this.uuid },
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      }
    }, r);
    return d.parts = n.concat(r.parts ?? []), await re(d);
  }
  // TODO: Allow to change
  getCriticalThreshold() {
    return 10;
  }
  // TODO: Check this is needed
  getAttack() {
    return { rollData: this.getRollData(), parts: [] };
  }
  async update(r = {}, s = {}) {
    console.log("update item"), super.update(r, s);
  }
  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(r) {
    r.preventDefault();
    const o = r.currentTarget.closest(".chat-card").querySelector(".card-content");
    o.style.display = o.style.display === "none" ? "block" : "none";
  }
  /**
  * Get the Actor which is the author of a chat card
  * @param {HTMLElement} card    The chat card being used
  * @returns {Actor|null}        The Actor document or null
  * @private
  */
  static async _getChatCardActor(r) {
    if (r.dataset.tokenId) {
      const n = await fromUuid(r.dataset.tokenId);
      return n ? n.actor : null;
    }
    const s = r.dataset.actorId;
    return game.actors.get(s) || null;
  }
  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor[]}            An Array of Actor documents, if any
   * @private
   */
  static _getChatCardTargets(r) {
    let s = canvas.tokens.controlled.filter((n) => !!n.actor);
    return !s.length && game.user.character && (s = s.concat(game.user.character.getActiveTokens())), s.length || ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken")), s;
  }
}
async function ke(u, r, s) {
}
function de(u, r) {
  u.preventDefault();
  const s = u.currentTarget, n = s.closest("li"), o = n.dataset.effectId ? r.effects.get(n.dataset.effectId) : null;
  switch (s.dataset.action) {
    case "create":
      return r.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        source: r.uuid,
        "duration.rounds": n.dataset.effectType === "temporary" ? 1 : void 0,
        disabled: n.dataset.effectType === "inactive"
      }]);
    case "edit":
      return o.sheet.render(!0);
    case "delete":
      return o.delete();
    case "toggle":
      return o.update({ disabled: !o.disabled });
  }
}
function ce(u) {
  const r = {
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
  for (let s of u)
    s._getSourceName(), s.disabled ? r.inactive.effects.push(s) : s.isTemporary ? r.temporary.effects.push(s) : r.passive.effects.push(s);
  return r;
}
class Se extends ActorSheet {
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
    const r = super.getData(), s = this.actor.toObject(!1);
    return r.system = s.system, r.flags = s.flags, s.type == "character" && (this._prepareItems(r), this._prepareCharacterData(r), this._prepareAttacks(r), this._prepareArmours(r), r.displayConditions = s.system.displayConditions), s.type == "npc" && this._prepareItems(r), r.rollData = r.actor.getRollData(), r.effects = ce(this.actor.effects), r;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(r) {
    for (let [s, n] of Object.entries(r.system.abilities))
      n.label = game.i18n.localize(CONFIG.ABBREW.abilities[s]) ?? s;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(r) {
    const s = [], n = [], o = [], d = [], p = [], v = {
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
    for (let m of r.items)
      m.img = m.img || DEFAULT_TOKEN, m.type === "anatomy" ? s.push(m) : m.type === "resource" ? n.push(m) : m.type === "item" ? d.push(m) : m.type === "feature" ? p.push(m) : m.type === "ability" ? o.push(m) : m.type === "spell" && m.system.spellLevel != null && v[m.system.spellLevel].push(m);
    r.resource = n, r.gear = d, r.features = p, r.spells = v, r.anatomy = s, r.ability = o;
  }
  /* -------------------------------------------- */
  _prepareAttacks(r) {
    r.attacks = r.system.attacks;
  }
  /* -------------------------------------------- */
  _prepareArmours(r) {
    r.armours = r.system.armours;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(r) {
    if (super.activateListeners(r), r.find(".item-edit").click((s) => {
      const n = $(s.currentTarget).parents(".item");
      this.actor.items.get(n.data("itemId")).sheet.render(!0);
    }), !!this.isEditable && (r.find(".conditions-header").click(async (s) => {
      super.getData(), await this.actor.update({ "system.displayConditions": !this.actor.system.displayConditions });
    }), r.find(".item-create").click(this._onItemCreate.bind(this)), r.find(".item-delete").click((s) => {
      const n = $(s.currentTarget).parents(".item");
      this.actor.items.get(n.data("itemId")).delete(), n.slideUp(200, () => this.render(!1));
    }), r.find(".effect-control").click((s) => de(s, this.actor)), r.find(".rollable .item-image").click(this._onItemUse.bind(this)), r.find(".equip-weapon").click(this._equipWeapon.bind(this)), r.find(".rollable.attack").click(this._onAttackUse.bind(this)), r.find(".equip-armour").click(this._equipArmour.bind(this)), this.actor.isOwner)) {
      let s = (n) => this._onDragStart(n);
      r.find("li.item").each((n, o) => {
        o.classList.contains("inventory-header") || (o.setAttribute("draggable", !0), o.addEventListener("dragstart", s, !1));
      });
    }
  }
  async _equipWeapon(r) {
    r.preventDefault();
    const s = r.target.dataset, n = s.weaponid, o = s.equip === "true";
    await this.actor.equipWeapon(n, o);
  }
  async _equipArmour(r) {
    r.preventDefault();
    const s = r.target.dataset, n = s.armourid, o = s.equip === "true";
    await this.actor.equipArmour(n, o);
  }
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(r) {
    r.preventDefault();
    const s = r.currentTarget, n = s.dataset.type;
    if (n === "ability" && this.actor.system.IP.current + 1 > this.actor.system.IP.total) {
      const d = game.i18n.format("ABBREW.InspirationPointsExceededWarn", { max: this.actor.system.IP.total });
      return ui.notifications.error(d);
    }
    const o = {
      name: game.i18n.format("ABBREW.ItemNew", { type: game.i18n.localize(`ITEM.Type${n.capitalize()}`) }),
      type: n,
      system: { ...s.dataset.type }
    };
    return delete o.system.type, this.actor.createEmbeddedDocuments("Item", [o]);
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemUse(r) {
    r.preventDefault(), r.currentTarget.dataset, this.actor, ke();
    const n = r.currentTarget.closest(".item").dataset.itemId;
    return this.actor.items.get(n).use({}, { event: r });
  }
  async _onAttackUse(r) {
    r.preventDefault(), console.log(r);
    const s = r.target.dataset, n = this.actor.system.attacks.filter((d) => d.id === s.attack)[0], o = n.profiles.flat().filter((d) => d.id === +s.attackprofile)[0];
    be(n, o, this.actor);
  }
}
var Ne = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, ee = {}, Re = {
  get exports() {
    return ee;
  },
  set exports(u) {
    ee = u;
  }
};
(function(u, r) {
  (function(s, n) {
    u.exports = n();
  })(Ne, function() {
    function s(e, t) {
      var i = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var a = Object.getOwnPropertySymbols(e);
        t && (a = a.filter(function(l) {
          return Object.getOwnPropertyDescriptor(e, l).enumerable;
        })), i.push.apply(i, a);
      }
      return i;
    }
    function n(e) {
      for (var t = 1; t < arguments.length; t++) {
        var i = arguments[t] != null ? arguments[t] : {};
        t % 2 ? s(Object(i), !0).forEach(function(a) {
          o(e, a, i[a]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i)) : s(Object(i)).forEach(function(a) {
          Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(i, a));
        });
      }
      return e;
    }
    function o(e, t, i) {
      return (t = function(a) {
        var l = function(h, c) {
          if (typeof h != "object" || h === null)
            return h;
          var g = h[Symbol.toPrimitive];
          if (g !== void 0) {
            var f = g.call(h, c || "default");
            if (typeof f != "object")
              return f;
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return (c === "string" ? String : Number)(h);
        }(a, "string");
        return typeof l == "symbol" ? l : String(l);
      }(t)) in e ? Object.defineProperty(e, t, { value: i, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = i, e;
    }
    const d = (e, t, i, a) => (e = "" + e, t = "" + t, a && (e = e.trim(), t = t.trim()), i ? e == t : e.toLowerCase() == t.toLowerCase()), p = (e, t) => e && Array.isArray(e) && e.map((i) => v(i, t));
    function v(e, t) {
      var i, a = {};
      for (i in e)
        t.indexOf(i) < 0 && (a[i] = e[i]);
      return a;
    }
    function m(e) {
      var t = document.createElement("div");
      return e.replace(/\&#?[0-9a-z]+;/gi, function(i) {
        return t.innerHTML = i, t.innerText;
      });
    }
    function b(e) {
      return new DOMParser().parseFromString(e.trim(), "text/html").body.firstElementChild;
    }
    function D(e, t) {
      for (t = t || "previous"; e = e[t + "Sibling"]; )
        if (e.nodeType == 3)
          return e;
    }
    function M(e) {
      return typeof e == "string" ? e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/`|'/g, "&#039;") : e;
    }
    function C(e) {
      var t = Object.prototype.toString.call(e).split(" ")[1].slice(0, -1);
      return e === Object(e) && t != "Array" && t != "Function" && t != "RegExp" && t != "HTMLUnknownElement";
    }
    function E(e, t, i) {
      function a(l, h) {
        for (var c in h)
          if (h.hasOwnProperty(c)) {
            if (C(h[c])) {
              C(l[c]) ? a(l[c], h[c]) : l[c] = Object.assign({}, h[c]);
              continue;
            }
            if (Array.isArray(h[c])) {
              l[c] = Object.assign([], h[c]);
              continue;
            }
            l[c] = h[c];
          }
      }
      return e instanceof Object || (e = {}), a(e, t), i && a(e, i), e;
    }
    function P() {
      const e = [], t = {};
      for (let i of arguments)
        for (let a of i)
          C(a) ? t[a.value] || (e.push(a), t[a.value] = 1) : e.includes(a) || e.push(a);
      return e;
    }
    function V(e) {
      return String.prototype.normalize ? typeof e == "string" ? e.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : void 0 : e;
    }
    var F = () => /(?=.*chrome)(?=.*android)/i.test(navigator.userAgent);
    function q() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (e) => (e ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> e / 4).toString(16));
    }
    function W(e) {
      return e && e.classList && e.classList.contains(this.settings.classNames.tag);
    }
    function G(e, t) {
      var i = window.getSelection();
      return t = t || i.getRangeAt(0), typeof e == "string" && (e = document.createTextNode(e)), t && (t.deleteContents(), t.insertNode(e)), e;
    }
    function I(e, t, i) {
      return e ? (t && (e.__tagifyTagData = i ? t : E({}, e.__tagifyTagData || {}, t)), e.__tagifyTagData) : (console.warn("tag element doesn't exist", e, t), t);
    }
    var Y = { delimiters: ",", pattern: null, tagTextProp: "value", maxTags: 1 / 0, callbacks: {}, addTagOnBlur: !0, onChangeAfterBlur: !0, duplicates: !1, whitelist: [], blacklist: [], enforceWhitelist: !1, userInput: !0, keepInvalidTags: !1, createInvalidTags: !0, mixTagsAllowedAfter: /,|\.|\:|\s/, mixTagsInterpolator: ["[[", "]]"], backspace: !0, skipInvalid: !1, pasteAsTags: !0, editTags: { clicks: 2, keepInvalid: !0 }, transformTag: () => {
    }, trim: !0, a11y: { focusableTags: !1 }, mixMode: { insertAfterTag: " " }, autoComplete: { enabled: !0, rightKey: !1 }, classNames: { namespace: "tagify", mixMode: "tagify--mix", selectMode: "tagify--select", input: "tagify__input", focus: "tagify--focus", tagNoAnimation: "tagify--noAnim", tagInvalid: "tagify--invalid", tagNotAllowed: "tagify--notAllowed", scopeLoading: "tagify--loading", hasMaxTags: "tagify--hasMaxTags", hasNoTags: "tagify--noTags", empty: "tagify--empty", inputInvalid: "tagify__input--invalid", dropdown: "tagify__dropdown", dropdownWrapper: "tagify__dropdown__wrapper", dropdownHeader: "tagify__dropdown__header", dropdownFooter: "tagify__dropdown__footer", dropdownItem: "tagify__dropdown__item", dropdownItemActive: "tagify__dropdown__item--active", dropdownItemHidden: "tagify__dropdown__item--hidden", dropdownInital: "tagify__dropdown--initial", tag: "tagify__tag", tagText: "tagify__tag-text", tagX: "tagify__tag__removeBtn", tagLoading: "tagify__tag--loading", tagEditing: "tagify__tag--editable", tagFlash: "tagify__tag--flash", tagHide: "tagify__tag--hide" }, dropdown: { classname: "", enabled: 2, maxItems: 10, searchKeys: ["value", "searchBy"], fuzzySearch: !0, caseSensitive: !1, accentedSearch: !0, includeSelectedTags: !1, highlightFirst: !1, closeOnSelect: !0, clearOnSelect: !0, position: "all", appendTarget: null }, hooks: { beforeRemoveTag: () => Promise.resolve(), beforePaste: () => Promise.resolve(), suggestionClick: () => Promise.resolve() } };
    function he() {
      this.dropdown = {};
      for (let e in this._dropdown)
        this.dropdown[e] = typeof this._dropdown[e] == "function" ? this._dropdown[e].bind(this) : this._dropdown[e];
      this.dropdown.refs();
    }
    var ue = { refs() {
      this.DOM.dropdown = this.parseTemplate("dropdown", [this.settings]), this.DOM.dropdown.content = this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-wrapper']");
    }, getHeaderRef() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-header']");
    }, getFooterRef() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-footer']");
    }, getAllSuggestionsRefs() {
      return [...this.DOM.dropdown.content.querySelectorAll(this.settings.classNames.dropdownItemSelector)];
    }, show(e) {
      var t, i, a, l = this.settings, h = l.mode == "mix" && !l.enforceWhitelist, c = !l.whitelist || !l.whitelist.length, g = l.dropdown.position == "manual";
      if (e = e === void 0 ? this.state.inputText : e, !(c && !h && !l.templates.dropdownItemNoMatch || l.dropdown.enable === !1 || this.state.isLoading || this.settings.readonly)) {
        if (clearTimeout(this.dropdownHide__bindEventsTimeout), this.suggestedListItems = this.dropdown.filterListItems(e), e && !this.suggestedListItems.length && (this.trigger("dropdown:noMatch", e), l.templates.dropdownItemNoMatch && (a = l.templates.dropdownItemNoMatch.call(this, { value: e }))), !a) {
          if (this.suggestedListItems.length)
            e && h && !this.state.editing.scope && !d(this.suggestedListItems[0].value, e) && this.suggestedListItems.unshift({ value: e });
          else {
            if (!e || !h || this.state.editing.scope)
              return this.input.autocomplete.suggest.call(this), void this.dropdown.hide();
            this.suggestedListItems = [{ value: e }];
          }
          i = "" + (C(t = this.suggestedListItems[0]) ? t.value : t), l.autoComplete && i && i.indexOf(e) == 0 && this.input.autocomplete.suggest.call(this, t);
        }
        this.dropdown.fill(a), l.dropdown.highlightFirst && this.dropdown.highlightOption(this.DOM.dropdown.content.querySelector(l.classNames.dropdownItemSelector)), this.state.dropdown.visible || setTimeout(this.dropdown.events.binding.bind(this)), this.state.dropdown.visible = e || !0, this.state.dropdown.query = e, this.setStateSelection(), g || setTimeout(() => {
          this.dropdown.position(), this.dropdown.render();
        }), setTimeout(() => {
          this.trigger("dropdown:show", this.DOM.dropdown);
        });
      }
    }, hide(e) {
      var t = this.DOM, i = t.scope, a = t.dropdown, l = this.settings.dropdown.position == "manual" && !e;
      if (a && document.body.contains(a) && !l)
        return window.removeEventListener("resize", this.dropdown.position), this.dropdown.events.binding.call(this, !1), i.setAttribute("aria-expanded", !1), a.parentNode.removeChild(a), setTimeout(() => {
          this.state.dropdown.visible = !1;
        }, 100), this.state.dropdown.query = this.state.ddItemData = this.state.ddItemElm = this.state.selection = null, this.state.tag && this.state.tag.value.length && (this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag), this.trigger("dropdown:hide", a), this;
    }, toggle(e) {
      this.dropdown[this.state.dropdown.visible && !e ? "hide" : "show"]();
    }, render() {
      var e, t, i, a = (e = this.DOM.dropdown, (i = e.cloneNode(!0)).style.cssText = "position:fixed; top:-9999px; opacity:0", document.body.appendChild(i), t = i.clientHeight, i.parentNode.removeChild(i), t), l = this.settings;
      return typeof l.dropdown.enabled == "number" && l.dropdown.enabled >= 0 ? (this.DOM.scope.setAttribute("aria-expanded", !0), document.body.contains(this.DOM.dropdown) || (this.DOM.dropdown.classList.add(l.classNames.dropdownInital), this.dropdown.position(a), l.dropdown.appendTarget.appendChild(this.DOM.dropdown), setTimeout(() => this.DOM.dropdown.classList.remove(l.classNames.dropdownInital))), this) : this;
    }, fill(e) {
      e = typeof e == "string" ? e : this.dropdown.createListHTML(e || this.suggestedListItems);
      var t, i = this.settings.templates.dropdownContent.call(this, e);
      this.DOM.dropdown.content.innerHTML = (t = i) ? t.replace(/\>[\r\n ]+\</g, "><").replace(/(<.*?>)|\s+/g, (a, l) => l || " ") : "";
    }, fillHeaderFooter() {
      var e = this.dropdown.filterListItems(this.state.dropdown.query), t = this.parseTemplate("dropdownHeader", [e]), i = this.parseTemplate("dropdownFooter", [e]), a = this.dropdown.getHeaderRef(), l = this.dropdown.getFooterRef();
      t && (a == null || a.parentNode.replaceChild(t, a)), i && (l == null || l.parentNode.replaceChild(i, l));
    }, refilter(e) {
      e = e || this.state.dropdown.query || "", this.suggestedListItems = this.dropdown.filterListItems(e), this.dropdown.fill(), this.suggestedListItems.length || this.dropdown.hide(), this.trigger("dropdown:updated", this.DOM.dropdown);
    }, position(e) {
      var t = this.settings.dropdown;
      if (t.position != "manual") {
        var i, a, l, h, c, g, f = this.DOM.dropdown, y = t.placeAbove, T = t.appendTarget === document.body, w = T ? window.pageYOffset : t.appendTarget.scrollTop, A = document.fullscreenElement || document.webkitFullscreenElement || document.documentElement, k = A.clientHeight, _ = Math.max(A.clientWidth || 0, window.innerWidth || 0) > 480 ? t.position : "all", S = this.DOM[_ == "input" ? "input" : "scope"];
        if (e = e || f.clientHeight, this.state.dropdown.visible) {
          if (_ == "text" ? (l = (i = function() {
            const x = document.getSelection();
            if (x.rangeCount) {
              const L = x.getRangeAt(0), N = L.startContainer, j = L.startOffset;
              let B, X;
              if (j > 0)
                return X = document.createRange(), X.setStart(N, j - 1), X.setEnd(N, j), B = X.getBoundingClientRect(), { left: B.right, top: B.top, bottom: B.bottom };
              if (N.getBoundingClientRect)
                return N.getBoundingClientRect();
            }
            return { left: -9999, top: -9999 };
          }()).bottom, a = i.top, h = i.left, c = "auto") : (g = function(x) {
            for (var L = 0, N = 0; x && x != A; )
              L += x.offsetLeft || 0, N += x.offsetTop || 0, x = x.parentNode;
            return { left: L, top: N };
          }(t.appendTarget), a = (i = S.getBoundingClientRect()).top - g.top, l = i.bottom - 1 - g.top, h = i.left - g.left, c = i.width + "px"), !T) {
            let x = function() {
              for (var L = 0, N = t.appendTarget.parentNode; N; )
                L += N.scrollTop || 0, N = N.parentNode;
              return L;
            }();
            a += x, l += x;
          }
          a = Math.floor(a), l = Math.ceil(l), y = y === void 0 ? k - i.bottom < e : y, f.style.cssText = "left:" + (h + window.pageXOffset) + "px; width:" + c + ";" + (y ? "top: " + (a + w) + "px" : "top: " + (l + w) + "px"), f.setAttribute("placement", y ? "top" : "bottom"), f.setAttribute("position", _);
        }
      }
    }, events: { binding() {
      let e = !(arguments.length > 0 && arguments[0] !== void 0) || arguments[0];
      var t = this.dropdown.events.callbacks, i = this.listeners.dropdown = this.listeners.dropdown || { position: this.dropdown.position.bind(this, null), onKeyDown: t.onKeyDown.bind(this), onMouseOver: t.onMouseOver.bind(this), onMouseLeave: t.onMouseLeave.bind(this), onClick: t.onClick.bind(this), onScroll: t.onScroll.bind(this) }, a = e ? "addEventListener" : "removeEventListener";
      this.settings.dropdown.position != "manual" && (document[a]("scroll", i.position, !0), window[a]("resize", i.position), window[a]("keydown", i.onKeyDown)), this.DOM.dropdown[a]("mouseover", i.onMouseOver), this.DOM.dropdown[a]("mouseleave", i.onMouseLeave), this.DOM.dropdown[a]("mousedown", i.onClick), this.DOM.dropdown.content[a]("scroll", i.onScroll);
    }, callbacks: { onKeyDown(e) {
      if (this.state.hasFocus && !this.state.composing) {
        var t = this.DOM.dropdown.querySelector(this.settings.classNames.dropdownItemActiveSelector), i = this.dropdown.getSuggestionDataByNode(t);
        switch (e.key) {
          case "ArrowDown":
          case "ArrowUp":
          case "Down":
          case "Up":
            e.preventDefault();
            var a = this.dropdown.getAllSuggestionsRefs(), l = e.key == "ArrowUp" || e.key == "Up";
            t && (t = this.dropdown.getNextOrPrevOption(t, !l)), t && t.matches(this.settings.classNames.dropdownItemSelector) || (t = a[l ? a.length - 1 : 0]), this.dropdown.highlightOption(t, !0);
            break;
          case "Escape":
          case "Esc":
            this.dropdown.hide();
            break;
          case "ArrowRight":
            if (this.state.actions.ArrowLeft)
              return;
          case "Tab":
            if (this.settings.mode != "mix" && t && !this.settings.autoComplete.rightKey && !this.state.editing) {
              e.preventDefault();
              var h = this.dropdown.getMappedValue(i);
              return this.input.autocomplete.set.call(this, h), !1;
            }
            return !0;
          case "Enter":
            e.preventDefault(), this.settings.hooks.suggestionClick(e, { tagify: this, tagData: i, suggestionElm: t }).then(() => {
              if (t)
                return this.dropdown.selectOption(t), t = this.dropdown.getNextOrPrevOption(t, !l), void this.dropdown.highlightOption(t);
              this.dropdown.hide(), this.settings.mode != "mix" && this.addTags(this.state.inputText.trim(), !0);
            }).catch((c) => c);
            break;
          case "Backspace": {
            if (this.settings.mode == "mix" || this.state.editing.scope)
              return;
            const c = this.input.raw.call(this);
            c != "" && c.charCodeAt(0) != 8203 || (this.settings.backspace === !0 ? this.removeTags() : this.settings.backspace == "edit" && setTimeout(this.editTag.bind(this), 0));
          }
        }
      }
    }, onMouseOver(e) {
      var t = e.target.closest(this.settings.classNames.dropdownItemSelector);
      t && this.dropdown.highlightOption(t);
    }, onMouseLeave(e) {
      this.dropdown.highlightOption();
    }, onClick(e) {
      if (e.button == 0 && e.target != this.DOM.dropdown && e.target != this.DOM.dropdown.content) {
        var t = e.target.closest(this.settings.classNames.dropdownItemSelector), i = this.dropdown.getSuggestionDataByNode(t);
        this.state.actions.selectOption = !0, setTimeout(() => this.state.actions.selectOption = !1, 50), this.settings.hooks.suggestionClick(e, { tagify: this, tagData: i, suggestionElm: t }).then(() => {
          t ? this.dropdown.selectOption(t, e) : this.dropdown.hide();
        }).catch((a) => console.warn(a));
      }
    }, onScroll(e) {
      var t = e.target, i = t.scrollTop / (t.scrollHeight - t.parentNode.clientHeight) * 100;
      this.trigger("dropdown:scroll", { percentage: Math.round(i) });
    } } }, getSuggestionDataByNode(e) {
      var t = e && e.getAttribute("value");
      return this.suggestedListItems.find((i) => i.value == t) || null;
    }, getNextOrPrevOption(e) {
      let t = !(arguments.length > 1 && arguments[1] !== void 0) || arguments[1];
      var i = this.dropdown.getAllSuggestionsRefs(), a = i.findIndex((l) => l === e);
      return t ? i[a + 1] : i[a - 1];
    }, highlightOption(e, t) {
      var i, a = this.settings.classNames.dropdownItemActive;
      if (this.state.ddItemElm && (this.state.ddItemElm.classList.remove(a), this.state.ddItemElm.removeAttribute("aria-selected")), !e)
        return this.state.ddItemData = null, this.state.ddItemElm = null, void this.input.autocomplete.suggest.call(this);
      i = this.dropdown.getSuggestionDataByNode(e), this.state.ddItemData = i, this.state.ddItemElm = e, e.classList.add(a), e.setAttribute("aria-selected", !0), t && (e.parentNode.scrollTop = e.clientHeight + e.offsetTop - e.parentNode.clientHeight), this.settings.autoComplete && (this.input.autocomplete.suggest.call(this, i), this.dropdown.position());
    }, selectOption(e, t) {
      var i = this.settings.dropdown, a = i.clearOnSelect, l = i.closeOnSelect;
      if (!e)
        return this.addTags(this.state.inputText, !0), void (l && this.dropdown.hide());
      t = t || {};
      var h = e.getAttribute("value"), c = h == "noMatch", g = this.suggestedListItems.find((f) => (f.value ?? f) == h);
      this.trigger("dropdown:select", { data: g, elm: e, event: t }), h && (g || c) ? (this.state.editing ? this.onEditTagDone(null, E({ __isValid: !0 }, this.normalizeTags([g])[0])) : this[this.settings.mode == "mix" ? "addMixTags" : "addTags"]([g || this.input.raw.call(this)], a), this.DOM.input.parentNode && (setTimeout(() => {
        this.DOM.input.focus(), this.toggleFocusClass(!0);
      }), l && setTimeout(this.dropdown.hide.bind(this)), e.addEventListener("transitionend", () => {
        this.dropdown.fillHeaderFooter(), setTimeout(() => e.remove(), 100);
      }, { once: !0 }), e.classList.add(this.settings.classNames.dropdownItemHidden))) : l && setTimeout(this.dropdown.hide.bind(this));
    }, selectAll(e) {
      this.suggestedListItems.length = 0, this.dropdown.hide(), this.dropdown.filterListItems("");
      var t = this.dropdown.filterListItems("");
      return e || (t = this.state.dropdown.suggestions), this.addTags(t, !0), this;
    }, filterListItems(e, t) {
      var i, a, l, h, c, g = this.settings, f = g.dropdown, y = (t = t || {}, []), T = [], w = g.whitelist, A = f.maxItems >= 0 ? f.maxItems : 1 / 0, k = f.searchKeys, _ = 0;
      if (!(e = g.mode == "select" && this.value.length && this.value[0][g.tagTextProp] == e ? "" : e) || !k.length)
        return y = f.includeSelectedTags ? w : w.filter((x) => !this.isTagDuplicate(C(x) ? x.value : x)), this.state.dropdown.suggestions = y, y.slice(0, A);
      function S(x, L) {
        return L.toLowerCase().split(" ").every((N) => x.includes(N.toLowerCase()));
      }
      for (c = f.caseSensitive ? "" + e : ("" + e).toLowerCase(); _ < w.length; _++) {
        let x, L;
        i = w[_] instanceof Object ? w[_] : { value: w[_] };
        let N = Object.keys(i).some((j) => k.includes(j)) ? k : ["value"];
        f.fuzzySearch && !t.exact ? (l = N.reduce((j, B) => j + " " + (i[B] || ""), "").toLowerCase().trim(), f.accentedSearch && (l = V(l), c = V(c)), x = l.indexOf(c) == 0, L = l === c, a = S(l, c)) : (x = !0, a = N.some((j) => {
          var B = "" + (i[j] || "");
          return f.accentedSearch && (B = V(B), c = V(c)), f.caseSensitive || (B = B.toLowerCase()), L = B === c, t.exact ? B === c : B.indexOf(c) == 0;
        })), h = !f.includeSelectedTags && this.isTagDuplicate(C(i) ? i.value : i), a && !h && (L && x ? T.push(i) : f.sortby == "startsWith" && x ? y.unshift(i) : y.push(i));
      }
      return this.state.dropdown.suggestions = T.concat(y), typeof f.sortby == "function" ? f.sortby(T.concat(y), c) : T.concat(y).slice(0, A);
    }, getMappedValue(e) {
      var t = this.settings.dropdown.mapValueTo;
      return t ? typeof t == "function" ? t(e) : e[t] || e.value : e.value;
    }, createListHTML(e) {
      return E([], e).map((t, i) => {
        typeof t != "string" && typeof t != "number" || (t = { value: t });
        var a = this.dropdown.getMappedValue(t);
        return a = typeof a == "string" ? M(a) : a, this.settings.templates.dropdownItem.apply(this, [n(n({}, t), {}, { mappedValue: a }), this]);
      }).join("");
    } };
    const U = "@yaireo/tagify/";
    var ie, ge = { empty: "empty", exceed: "number of tags exceeded", pattern: "pattern mismatch", duplicate: "already exists", notAllowed: "not allowed" }, pe = { wrapper: (e, t) => `<tags class="${t.classNames.namespace} ${t.mode ? `${t.classNames[t.mode + "Mode"]}` : ""} ${e.className}"
                    ${t.readonly ? "readonly" : ""}
                    ${t.disabled ? "disabled" : ""}
                    ${t.required ? "required" : ""}
                    ${t.mode === "select" ? "spellcheck='false'" : ""}
                    tabIndex="-1">
            <span ${!t.readonly && t.userInput ? "contenteditable" : ""} tabIndex="0" data-placeholder="${t.placeholder || "&#8203;"}" aria-placeholder="${t.placeholder || ""}"
                class="${t.classNames.input}"
                role="textbox"
                aria-autocomplete="both"
                aria-multiline="${t.mode == "mix"}"></span>
                &#8203;
        </tags>`, tag(e, t) {
      let i = t.settings;
      return `<tag title="${e.title || e.value}"
                    contenteditable='false'
                    spellcheck='false'
                    tabIndex="${i.a11y.focusableTags ? 0 : -1}"
                    class="${i.classNames.tag} ${e.class || ""}"
                    ${this.getAttributes(e)}>
            <x title='' class="${i.classNames.tagX}" role='button' aria-label='remove tag'></x>
            <div>
                <span class="${i.classNames.tagText}">${e[i.tagTextProp] || e.value}</span>
            </div>
        </tag>`;
    }, dropdown(e) {
      var t = e.dropdown, i = t.position == "manual", a = `${e.classNames.dropdown}`;
      return `<div class="${i ? "" : a} ${t.classname}" role="listbox" aria-labelledby="dropdown">
                    <div data-selector='tagify-suggestions-wrapper' class="${e.classNames.dropdownWrapper}"></div>
                </div>`;
    }, dropdownContent(e) {
      var t = this.settings, i = this.state.dropdown.suggestions;
      return `
            ${t.templates.dropdownHeader.call(this, i)}
            ${e}
            ${t.templates.dropdownFooter.call(this, i)}
        `;
    }, dropdownItem(e) {
      return `<div ${this.getAttributes(e)}
                    class='${this.settings.classNames.dropdownItem} ${e.class ? e.class : ""}'
                    tabindex="0"
                    role="option">${e.mappedValue || e.value}</div>`;
    }, dropdownHeader(e) {
      return `<header data-selector='tagify-suggestions-header' class="${this.settings.classNames.dropdownHeader}"></header>`;
    }, dropdownFooter(e) {
      var t = e.length - this.settings.dropdown.maxItems;
      return t > 0 ? `<footer data-selector='tagify-suggestions-footer' class="${this.settings.classNames.dropdownFooter}">
                ${t} more items. Refine your search.
            </footer>` : "";
    }, dropdownItemNoMatch: null }, me = { customBinding() {
      this.customEventsList.forEach((e) => {
        this.on(e, this.settings.callbacks[e]);
      });
    }, binding() {
      let e = !(arguments.length > 0 && arguments[0] !== void 0) || arguments[0];
      var t, i = this.events.callbacks, a = e ? "addEventListener" : "removeEventListener";
      if (!this.state.mainEvents || !e) {
        for (var l in this.state.mainEvents = e, e && !this.listeners.main && (this.events.bindGlobal.call(this), this.settings.isJQueryPlugin && jQuery(this.DOM.originalInput).on("tagify.removeAllTags", this.removeAllTags.bind(this))), t = this.listeners.main = this.listeners.main || { focus: ["input", i.onFocusBlur.bind(this)], keydown: ["input", i.onKeydown.bind(this)], click: ["scope", i.onClickScope.bind(this)], dblclick: ["scope", i.onDoubleClickScope.bind(this)], paste: ["input", i.onPaste.bind(this)], drop: ["input", i.onDrop.bind(this)], compositionstart: ["input", i.onCompositionStart.bind(this)], compositionend: ["input", i.onCompositionEnd.bind(this)] })
          this.DOM[t[l][0]][a](l, t[l][1]);
        clearInterval(this.listeners.main.originalInputValueObserverInterval), this.listeners.main.originalInputValueObserverInterval = setInterval(i.observeOriginalInputValue.bind(this), 500);
        var h = this.listeners.main.inputMutationObserver || new MutationObserver(i.onInputDOMChange.bind(this));
        h.disconnect(), this.settings.mode == "mix" && h.observe(this.DOM.input, { childList: !0 });
      }
    }, bindGlobal(e) {
      var t, i = this.events.callbacks, a = e ? "removeEventListener" : "addEventListener";
      if (this.listeners && (e || !this.listeners.global))
        for (t of (this.listeners.global = this.listeners.global || [{ type: this.isIE ? "keydown" : "input", target: this.DOM.input, cb: i[this.isIE ? "onInputIE" : "onInput"].bind(this) }, { type: "keydown", target: window, cb: i.onWindowKeyDown.bind(this) }, { type: "blur", target: this.DOM.input, cb: i.onFocusBlur.bind(this) }, { type: "click", target: document, cb: i.onClickAnywhere.bind(this) }], this.listeners.global))
          t.target[a](t.type, t.cb);
    }, unbindGlobal() {
      this.events.bindGlobal.call(this, !0);
    }, callbacks: { onFocusBlur(e) {
      var T, w;
      var t = this.settings, i = e.target ? this.trim(e.target.textContent) : "", a = (w = (T = this.value) == null ? void 0 : T[0]) == null ? void 0 : w[t.tagTextProp], l = e.type, h = t.dropdown.enabled >= 0, c = { relatedTarget: e.relatedTarget }, g = this.state.actions.selectOption && (h || !t.dropdown.closeOnSelect), f = this.state.actions.addNew && h, y = e.relatedTarget && W.call(this, e.relatedTarget) && this.DOM.scope.contains(e.relatedTarget);
      if (l == "blur") {
        if (e.relatedTarget === this.DOM.scope)
          return this.dropdown.hide(), void this.DOM.input.focus();
        this.postUpdate(), t.onChangeAfterBlur && this.triggerChangeEvent();
      }
      if (!g && !f)
        if (this.state.hasFocus = l == "focus" && +/* @__PURE__ */ new Date(), this.toggleFocusClass(this.state.hasFocus), t.mode != "mix") {
          if (l == "focus")
            return this.trigger("focus", c), void (t.dropdown.enabled !== 0 && t.userInput || this.dropdown.show(this.value.length ? "" : void 0));
          l == "blur" && (this.trigger("blur", c), this.loading(!1), t.mode == "select" && (y && (this.removeTags(), i = ""), a === i && (i = "")), i && !this.state.actions.selectOption && t.addTagOnBlur && this.addTags(i, !0)), this.DOM.input.removeAttribute("style"), this.dropdown.hide();
        } else
          l == "focus" ? this.trigger("focus", c) : e.type == "blur" && (this.trigger("blur", c), this.loading(!1), this.dropdown.hide(), this.state.dropdown.visible = void 0, this.setStateSelection());
    }, onCompositionStart(e) {
      this.state.composing = !0;
    }, onCompositionEnd(e) {
      this.state.composing = !1;
    }, onWindowKeyDown(e) {
      var t, i = document.activeElement, a = W.call(this, i) && this.DOM.scope.contains(document.activeElement), l = a && i.hasAttribute("readonly");
      if (a && !l)
        switch (t = i.nextElementSibling, e.key) {
          case "Backspace":
            this.settings.readonly || (this.removeTags(i), (t || this.DOM.input).focus());
            break;
          case "Enter":
            setTimeout(this.editTag.bind(this), 0, i);
        }
    }, onKeydown(e) {
      var t = this.settings;
      if (!this.state.composing && t.userInput) {
        t.mode == "select" && t.enforceWhitelist && this.value.length && e.key != "Tab" && e.preventDefault();
        var i = this.trim(e.target.textContent);
        if (this.trigger("keydown", { event: e }), t.mode == "mix") {
          switch (e.key) {
            case "Left":
            case "ArrowLeft":
              this.state.actions.ArrowLeft = !0;
              break;
            case "Delete":
            case "Backspace":
              if (this.state.editing)
                return;
              var a = document.getSelection(), l = e.key == "Delete" && a.anchorOffset == (a.anchorNode.length || 0), h = a.anchorNode.previousSibling, c = a.anchorNode.nodeType == 1 || !a.anchorOffset && h && h.nodeType == 1 && a.anchorNode.previousSibling;
              m(this.DOM.input.innerHTML);
              var g, f, y, T = this.getTagElms();
              if (t.backspace == "edit" && c)
                return g = a.anchorNode.nodeType == 1 ? null : a.anchorNode.previousElementSibling, setTimeout(this.editTag.bind(this), 0, g), void e.preventDefault();
              if (F() && c instanceof Element)
                return y = D(c), c.hasAttribute("readonly") || c.remove(), this.DOM.input.focus(), void setTimeout(() => {
                  this.placeCaretAfterNode(y), this.DOM.input.click();
                });
              if (a.anchorNode.nodeName == "BR")
                return;
              if ((l || c) && a.anchorNode.nodeType == 1 ? f = a.anchorOffset == 0 ? l ? T[0] : null : T[Math.min(T.length, a.anchorOffset) - 1] : l ? f = a.anchorNode.nextElementSibling : c instanceof Element && (f = c), a.anchorNode.nodeType == 3 && !a.anchorNode.nodeValue && a.anchorNode.previousElementSibling && e.preventDefault(), (c || l) && !t.backspace || a.type != "Range" && !a.anchorOffset && a.anchorNode == this.DOM.input && e.key != "Delete")
                return void e.preventDefault();
              if (a.type != "Range" && f && f.hasAttribute("readonly"))
                return void this.placeCaretAfterNode(D(f));
              clearTimeout(ie), ie = setTimeout(() => {
                var w = document.getSelection();
                m(this.DOM.input.innerHTML), !l && w.anchorNode.previousSibling, this.value = [].map.call(T, (A, k) => {
                  var _ = I(A);
                  if (A.parentNode || _.readonly)
                    return _;
                  this.trigger("remove", { tag: A, index: k, data: _ });
                }).filter((A) => A);
              }, 20);
          }
          return !0;
        }
        switch (e.key) {
          case "Backspace":
            t.mode == "select" && t.enforceWhitelist && this.value.length ? this.removeTags() : this.state.dropdown.visible && t.dropdown.position != "manual" || e.target.textContent != "" && i.charCodeAt(0) != 8203 || (t.backspace === !0 ? this.removeTags() : t.backspace == "edit" && setTimeout(this.editTag.bind(this), 0));
            break;
          case "Esc":
          case "Escape":
            if (this.state.dropdown.visible)
              return;
            e.target.blur();
            break;
          case "Down":
          case "ArrowDown":
            this.state.dropdown.visible || this.dropdown.show();
            break;
          case "ArrowRight": {
            let w = this.state.inputSuggestion || this.state.ddItemData;
            if (w && t.autoComplete.rightKey)
              return void this.addTags([w], !0);
            break;
          }
          case "Tab": {
            let w = t.mode == "select";
            if (!i || w)
              return !0;
            e.preventDefault();
          }
          case "Enter":
            if (this.state.dropdown.visible && t.dropdown.position != "manual")
              return;
            e.preventDefault(), setTimeout(() => {
              this.state.dropdown.visible || this.state.actions.selectOption || this.addTags(i, !0);
            });
        }
      }
    }, onInput(e) {
      this.postUpdate();
      var t = this.settings;
      if (t.mode == "mix")
        return this.events.callbacks.onMixTagsInput.call(this, e);
      var i = this.input.normalize.call(this), a = i.length >= t.dropdown.enabled, l = { value: i, inputElm: this.DOM.input }, h = this.validateTag({ value: i });
      t.mode == "select" && this.toggleScopeValidation(h), l.isValid = h, this.state.inputText != i && (this.input.set.call(this, i, !1), i.search(t.delimiters) != -1 ? this.addTags(i) && this.input.set.call(this) : t.dropdown.enabled >= 0 && this.dropdown[a ? "show" : "hide"](i), this.trigger("input", l));
    }, onMixTagsInput(e) {
      var t, i, a, l, h, c, g, f, y = this.settings, T = this.value.length, w = this.getTagElms(), A = document.createDocumentFragment(), k = window.getSelection().getRangeAt(0), _ = [].map.call(w, (S) => I(S).value);
      if (e.inputType == "deleteContentBackward" && F() && this.events.callbacks.onKeydown.call(this, { target: e.target, key: "Backspace" }), this.value.slice().forEach((S) => {
        S.readonly && !_.includes(S.value) && A.appendChild(this.createTagElem(S));
      }), A.childNodes.length && (k.insertNode(A), this.setRangeAtStartEnd(!1, A.lastChild)), w.length != T)
        return this.value = [].map.call(this.getTagElms(), (S) => I(S)), void this.update({ withoutChangeEvent: !0 });
      if (this.hasMaxTags())
        return !0;
      if (window.getSelection && (c = window.getSelection()).rangeCount > 0 && c.anchorNode.nodeType == 3) {
        if ((k = c.getRangeAt(0).cloneRange()).collapse(!0), k.setStart(c.focusNode, 0), a = (t = k.toString().slice(0, k.endOffset)).split(y.pattern).length - 1, (i = t.match(y.pattern)) && (l = t.slice(t.lastIndexOf(i[i.length - 1]))), l) {
          if (this.state.actions.ArrowLeft = !1, this.state.tag = { prefix: l.match(y.pattern)[0], value: l.replace(y.pattern, "") }, this.state.tag.baseOffset = c.baseOffset - this.state.tag.value.length, f = this.state.tag.value.match(y.delimiters))
            return this.state.tag.value = this.state.tag.value.replace(y.delimiters, ""), this.state.tag.delimiters = f[0], this.addTags(this.state.tag.value, y.dropdown.clearOnSelect), void this.dropdown.hide();
          h = this.state.tag.value.length >= y.dropdown.enabled;
          try {
            g = (g = this.state.flaggedTags[this.state.tag.baseOffset]).prefix == this.state.tag.prefix && g.value[0] == this.state.tag.value[0], this.state.flaggedTags[this.state.tag.baseOffset] && !this.state.tag.value && delete this.state.flaggedTags[this.state.tag.baseOffset];
          } catch {
          }
          (g || a < this.state.mixMode.matchedPatternCount) && (h = !1);
        } else
          this.state.flaggedTags = {};
        this.state.mixMode.matchedPatternCount = a;
      }
      setTimeout(() => {
        this.update({ withoutChangeEvent: !0 }), this.trigger("input", E({}, this.state.tag, { textContent: this.DOM.input.textContent })), this.state.tag && this.dropdown[h ? "show" : "hide"](this.state.tag.value);
      }, 10);
    }, onInputIE(e) {
      var t = this;
      setTimeout(function() {
        t.events.callbacks.onInput.call(t, e);
      });
    }, observeOriginalInputValue() {
      this.DOM.originalInput.parentNode || this.destroy(), this.DOM.originalInput.value != this.DOM.originalInput.tagifyValue && this.loadOriginalValues();
    }, onClickAnywhere(e) {
      e.target == this.DOM.scope || this.DOM.scope.contains(e.target) || (this.toggleFocusClass(!1), this.state.hasFocus = !1);
    }, onClickScope(e) {
      var t = this.settings, i = e.target.closest("." + t.classNames.tag), a = +/* @__PURE__ */ new Date() - this.state.hasFocus;
      if (e.target != this.DOM.scope) {
        if (!e.target.classList.contains(t.classNames.tagX))
          return i ? (this.trigger("click", { tag: i, index: this.getNodeIndex(i), data: I(i), event: e }), void (t.editTags !== 1 && t.editTags.clicks !== 1 || this.events.callbacks.onDoubleClickScope.call(this, e))) : void (e.target == this.DOM.input && (t.mode == "mix" && this.fixFirefoxLastTagNoCaret(), a > 500) ? this.state.dropdown.visible ? this.dropdown.hide() : t.dropdown.enabled === 0 && t.mode != "mix" && this.dropdown.show(this.value.length ? "" : void 0) : t.mode != "select" || t.dropdown.enabled !== 0 || this.state.dropdown.visible || this.dropdown.show());
        this.removeTags(e.target.parentNode);
      } else
        this.DOM.input.focus();
    }, onPaste(e) {
      e.preventDefault();
      var t, i, a = this.settings;
      if (a.mode == "select" && a.enforceWhitelist || !a.userInput)
        return !1;
      a.readonly || (t = e.clipboardData || window.clipboardData, i = t.getData("Text"), a.hooks.beforePaste(e, { tagify: this, pastedText: i, clipboardData: t }).then((l) => {
        l === void 0 && (l = i), l && (this.injectAtCaret(l, window.getSelection().getRangeAt(0)), this.settings.mode == "mix" ? this.events.callbacks.onMixTagsInput.call(this, e) : this.settings.pasteAsTags ? this.addTags(this.state.inputText + l, !0) : this.state.inputText = l);
      }).catch((l) => l));
    }, onDrop(e) {
      e.preventDefault();
    }, onEditTagInput(e, t) {
      var i = e.closest("." + this.settings.classNames.tag), a = this.getNodeIndex(i), l = I(i), h = this.input.normalize.call(this, e), c = { [this.settings.tagTextProp]: h, __tagId: l.__tagId }, g = this.validateTag(c);
      this.editTagChangeDetected(E(l, c)) || e.originalIsValid !== !0 || (g = !0), i.classList.toggle(this.settings.classNames.tagInvalid, g !== !0), l.__isValid = g, i.title = g === !0 ? l.title || l.value : g, h.length >= this.settings.dropdown.enabled && (this.state.editing && (this.state.editing.value = h), this.dropdown.show(h)), this.trigger("edit:input", { tag: i, index: a, data: E({}, this.value[a], { newValue: h }), event: t });
    }, onEditTagPaste(e, t) {
      var i = (t.clipboardData || window.clipboardData).getData("Text");
      t.preventDefault();
      var a = G(i);
      this.setRangeAtStartEnd(!1, a);
    }, onEditTagFocus(e) {
      this.state.editing = { scope: e, input: e.querySelector("[contenteditable]") };
    }, onEditTagBlur(e) {
      if (this.state.hasFocus || this.toggleFocusClass(), this.DOM.scope.contains(e)) {
        var t, i, a = this.settings, l = e.closest("." + a.classNames.tag), h = I(l), c = this.input.normalize.call(this, e), g = { [a.tagTextProp]: c, __tagId: h.__tagId }, f = h.__originalData, y = this.editTagChangeDetected(E(h, g)), T = this.validateTag(g);
        if (c)
          if (y) {
            if (t = this.hasMaxTags(), i = E({}, f, { [a.tagTextProp]: this.trim(c), __isValid: T }), a.transformTag.call(this, i, f), (T = (!t || f.__isValid === !0) && this.validateTag(i)) !== !0) {
              if (this.trigger("invalid", { data: i, tag: l, message: T }), a.editTags.keepInvalid)
                return;
              a.keepInvalidTags ? i.__isValid = T : i = f;
            } else
              a.keepInvalidTags && (delete i.title, delete i["aria-invalid"], delete i.class);
            this.onEditTagDone(l, i);
          } else
            this.onEditTagDone(l, f);
        else
          this.onEditTagDone(l);
      }
    }, onEditTagkeydown(e, t) {
      if (!this.state.composing)
        switch (this.trigger("edit:keydown", { event: e }), e.key) {
          case "Esc":
          case "Escape":
            t.parentNode.replaceChild(t.__tagifyTagData.__originalHTML, t), this.state.editing = !1;
          case "Enter":
          case "Tab":
            e.preventDefault(), e.target.blur();
        }
    }, onDoubleClickScope(e) {
      var t, i, a = e.target.closest("." + this.settings.classNames.tag), l = I(a), h = this.settings;
      a && h.userInput && l.editable !== !1 && (t = a.classList.contains(this.settings.classNames.tagEditing), i = a.hasAttribute("readonly"), h.mode == "select" || h.readonly || t || i || !this.settings.editTags || this.editTag(a), this.toggleFocusClass(!0), this.trigger("dblclick", { tag: a, index: this.getNodeIndex(a), data: I(a) }));
    }, onInputDOMChange(e) {
      e.forEach((i) => {
        i.addedNodes.forEach((a) => {
          var l;
          if (a.outerHTML == "<div><br></div>")
            a.replaceWith(document.createElement("br"));
          else if (a.nodeType == 1 && a.querySelector(this.settings.classNames.tagSelector)) {
            let h = document.createTextNode("");
            a.childNodes[0].nodeType == 3 && a.previousSibling.nodeName != "BR" && (h = document.createTextNode(`
`)), a.replaceWith(h, ...[...a.childNodes].slice(0, -1)), this.placeCaretAfterNode(h);
          } else if (W.call(this, a) && (((l = a.previousSibling) == null ? void 0 : l.nodeType) != 3 || a.previousSibling.textContent || a.previousSibling.remove(), a.previousSibling && a.previousSibling.nodeName == "BR")) {
            a.previousSibling.replaceWith(`
​`);
            let h = a.nextSibling, c = "";
            for (; h; )
              c += h.textContent, h = h.nextSibling;
            c.trim() && this.placeCaretAfterNode(a.previousSibling);
          }
        }), i.removedNodes.forEach((a) => {
          a && a.nodeName == "BR" && W.call(this, t) && (this.removeTags(t), this.fixFirefoxLastTagNoCaret());
        });
      });
      var t = this.DOM.input.lastChild;
      t && t.nodeValue == "" && t.remove(), t && t.nodeName == "BR" || this.DOM.input.appendChild(document.createElement("br"));
    } } };
    function J(e, t) {
      if (!e) {
        console.warn("Tagify:", "input element not found", e);
        const a = new Proxy(this, { get: () => () => a });
        return a;
      }
      if (e.__tagify)
        return console.warn("Tagify: ", "input element is already Tagified - Same instance is returned.", e), e.__tagify;
      var i;
      E(this, function(a) {
        var l = document.createTextNode("");
        function h(c, g, f) {
          f && g.split(/\s+/g).forEach((y) => l[c + "EventListener"].call(l, y, f));
        }
        return { off(c, g) {
          return h("remove", c, g), this;
        }, on(c, g) {
          return g && typeof g == "function" && h("add", c, g), this;
        }, trigger(c, g, f) {
          var y;
          if (f = f || { cloneData: !0 }, c)
            if (a.settings.isJQueryPlugin)
              c == "remove" && (c = "removeTag"), jQuery(a.DOM.originalInput).triggerHandler(c, [g]);
            else {
              try {
                var T = typeof g == "object" ? g : { value: g };
                if ((T = f.cloneData ? E({}, T) : T).tagify = this, g.event && (T.event = this.cloneEvent(g.event)), g instanceof Object)
                  for (var w in g)
                    g[w] instanceof HTMLElement && (T[w] = g[w]);
                y = new CustomEvent(c, { detail: T });
              } catch (A) {
                console.warn(A);
              }
              l.dispatchEvent(y);
            }
        } };
      }(this)), this.isFirefox = /firefox|fxios/i.test(navigator.userAgent) && !/seamonkey/i.test(navigator.userAgent), this.isIE = window.document.documentMode, t = t || {}, this.getPersistedData = (i = t.id, (a) => {
        let l, h = "/" + a;
        if (localStorage.getItem(U + i + "/v", 1) == 1)
          try {
            l = JSON.parse(localStorage[U + i + h]);
          } catch {
          }
        return l;
      }), this.setPersistedData = ((a) => a ? (localStorage.setItem(U + a + "/v", 1), (l, h) => {
        let c = "/" + h, g = JSON.stringify(l);
        l && h && (localStorage.setItem(U + a + c, g), dispatchEvent(new Event("storage")));
      }) : () => {
      })(t.id), this.clearPersistedData = ((a) => (l) => {
        const h = U + "/" + a + "/";
        if (l)
          localStorage.removeItem(h + l);
        else
          for (let c in localStorage)
            c.includes(h) && localStorage.removeItem(c);
      })(t.id), this.applySettings(e, t), this.state = { inputText: "", editing: !1, composing: !1, actions: {}, mixMode: {}, dropdown: {}, flaggedTags: {} }, this.value = [], this.listeners = {}, this.DOM = {}, this.build(e), he.call(this), this.getCSSVars(), this.loadOriginalValues(), this.events.customBinding.call(this), this.events.binding.call(this), e.autofocus && this.DOM.input.focus(), e.__tagify = this;
    }
    return J.prototype = { _dropdown: ue, getSetTagData: I, helpers: { sameStr: d, removeCollectionProp: p, omit: v, isObject: C, parseHTML: b, escapeHTML: M, extend: E, concatWithoutDups: P, getUID: q, isNodeTag: W }, customEventsList: ["change", "add", "remove", "invalid", "input", "click", "keydown", "focus", "blur", "edit:input", "edit:beforeUpdate", "edit:updated", "edit:start", "edit:keydown", "dropdown:show", "dropdown:hide", "dropdown:select", "dropdown:updated", "dropdown:noMatch", "dropdown:scroll"], dataProps: ["__isValid", "__removed", "__originalData", "__originalHTML", "__tagId"], trim(e) {
      return this.settings.trim && e && typeof e == "string" ? e.trim() : e;
    }, parseHTML: b, templates: pe, parseTemplate(e, t) {
      return b((e = this.settings.templates[e] || e).apply(this, t));
    }, set whitelist(e) {
      const t = e && Array.isArray(e);
      this.settings.whitelist = t ? e : [], this.setPersistedData(t ? e : [], "whitelist");
    }, get whitelist() {
      return this.settings.whitelist;
    }, generateClassSelectors(e) {
      for (let t in e) {
        let i = t;
        Object.defineProperty(e, i + "Selector", { get() {
          return "." + this[i].split(" ")[0];
        } });
      }
    }, applySettings(e, t) {
      var h, c;
      Y.templates = this.templates;
      var i = E({}, Y, t.mode == "mix" ? { dropdown: { position: "text" } } : {}), a = this.settings = E({}, i, t);
      if (a.disabled = e.hasAttribute("disabled"), a.readonly = a.readonly || e.hasAttribute("readonly"), a.placeholder = M(e.getAttribute("placeholder") || a.placeholder || ""), a.required = e.hasAttribute("required"), this.generateClassSelectors(a.classNames), a.dropdown.includeSelectedTags === void 0 && (a.dropdown.includeSelectedTags = a.duplicates), this.isIE && (a.autoComplete = !1), ["whitelist", "blacklist"].forEach((g) => {
        var f = e.getAttribute("data-" + g);
        f && (f = f.split(a.delimiters)) instanceof Array && (a[g] = f);
      }), "autoComplete" in t && !C(t.autoComplete) && (a.autoComplete = Y.autoComplete, a.autoComplete.enabled = t.autoComplete), a.mode == "mix" && (a.pattern = a.pattern || /@/, a.autoComplete.rightKey = !0, a.delimiters = t.delimiters || null, a.tagTextProp && !a.dropdown.searchKeys.includes(a.tagTextProp) && a.dropdown.searchKeys.push(a.tagTextProp)), e.pattern)
        try {
          a.pattern = new RegExp(e.pattern);
        } catch {
        }
      if (a.delimiters) {
        a._delimiters = a.delimiters;
        try {
          a.delimiters = new RegExp(this.settings.delimiters, "g");
        } catch {
        }
      }
      a.disabled && (a.userInput = !1), this.TEXTS = n(n({}, ge), a.texts || {}), (a.mode != "select" || (h = t.dropdown) != null && h.enabled) && a.userInput || (a.dropdown.enabled = 0), a.dropdown.appendTarget = ((c = t.dropdown) == null ? void 0 : c.appendTarget) || document.body;
      let l = this.getPersistedData("whitelist");
      Array.isArray(l) && (this.whitelist = Array.isArray(a.whitelist) ? P(a.whitelist, l) : l);
    }, getAttributes(e) {
      var t, i = this.getCustomAttributes(e), a = "";
      for (t in i)
        a += " " + t + (e[t] !== void 0 ? `="${i[t]}"` : "");
      return a;
    }, getCustomAttributes(e) {
      if (!C(e))
        return "";
      var t, i = {};
      for (t in e)
        t.slice(0, 2) != "__" && t != "class" && e.hasOwnProperty(t) && e[t] !== void 0 && (i[t] = M(e[t]));
      return i;
    }, setStateSelection() {
      var e = window.getSelection(), t = { anchorOffset: e.anchorOffset, anchorNode: e.anchorNode, range: e.getRangeAt && e.rangeCount && e.getRangeAt(0) };
      return this.state.selection = t, t;
    }, getCSSVars() {
      var e = getComputedStyle(this.DOM.scope, null), t;
      this.CSSVars = { tagHideTransition: ((i) => {
        let a = i.value;
        return i.unit == "s" ? 1e3 * a : a;
      })(function(i) {
        if (!i)
          return {};
        var a = (i = i.trim().split(" ")[0]).split(/\d+/g).filter((l) => l).pop().trim();
        return { value: +i.split(a).filter((l) => l)[0].trim(), unit: a };
      }((t = "tag-hide-transition", e.getPropertyValue("--" + t)))) };
    }, build(e) {
      var t = this.DOM;
      this.settings.mixMode.integrated ? (t.originalInput = null, t.scope = e, t.input = e) : (t.originalInput = e, t.originalInput_tabIndex = e.tabIndex, t.scope = this.parseTemplate("wrapper", [e, this.settings]), t.input = t.scope.querySelector(this.settings.classNames.inputSelector), e.parentNode.insertBefore(t.scope, e), e.tabIndex = -1);
    }, destroy() {
      this.events.unbindGlobal.call(this), this.DOM.scope.parentNode.removeChild(this.DOM.scope), this.DOM.originalInput.tabIndex = this.DOM.originalInput_tabIndex, delete this.DOM.originalInput.__tagify, this.dropdown.hide(!0), clearTimeout(this.dropdownHide__bindEventsTimeout), clearInterval(this.listeners.main.originalInputValueObserverInterval);
    }, loadOriginalValues(e) {
      var t, i = this.settings;
      if (this.state.blockChangeEvent = !0, e === void 0) {
        const a = this.getPersistedData("value");
        e = a && !this.DOM.originalInput.value ? a : i.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value;
      }
      if (this.removeAllTags(), e)
        if (i.mode == "mix")
          this.parseMixTags(e), (t = this.DOM.input.lastChild) && t.tagName == "BR" || this.DOM.input.insertAdjacentHTML("beforeend", "<br>");
        else {
          try {
            JSON.parse(e) instanceof Array && (e = JSON.parse(e));
          } catch {
          }
          this.addTags(e, !0).forEach((a) => a && a.classList.add(i.classNames.tagNoAnimation));
        }
      else
        this.postUpdate();
      this.state.lastOriginalValueReported = i.mixMode.integrated ? "" : this.DOM.originalInput.value;
    }, cloneEvent(e) {
      var t = {};
      for (var i in e)
        i != "path" && (t[i] = e[i]);
      return t;
    }, loading(e) {
      return this.state.isLoading = e, this.DOM.scope.classList[e ? "add" : "remove"](this.settings.classNames.scopeLoading), this;
    }, tagLoading(e, t) {
      return e && e.classList[t ? "add" : "remove"](this.settings.classNames.tagLoading), this;
    }, toggleClass(e, t) {
      typeof e == "string" && this.DOM.scope.classList.toggle(e, t);
    }, toggleScopeValidation(e) {
      var t = e === !0 || e === void 0;
      !this.settings.required && e && e === this.TEXTS.empty && (t = !0), this.toggleClass(this.settings.classNames.tagInvalid, !t), this.DOM.scope.title = t ? "" : e;
    }, toggleFocusClass(e) {
      this.toggleClass(this.settings.classNames.focus, !!e);
    }, triggerChangeEvent: function() {
      if (!this.settings.mixMode.integrated) {
        var e = this.DOM.originalInput, t = this.state.lastOriginalValueReported !== e.value, i = new CustomEvent("change", { bubbles: !0 });
        t && (this.state.lastOriginalValueReported = e.value, i.simulated = !0, e._valueTracker && e._valueTracker.setValue(Math.random()), e.dispatchEvent(i), this.trigger("change", this.state.lastOriginalValueReported), e.value = this.state.lastOriginalValueReported);
      }
    }, events: me, fixFirefoxLastTagNoCaret() {
    }, setRangeAtStartEnd(e, t) {
      if (t) {
        e = typeof e == "number" ? e : !!e, t = t.lastChild || t;
        var i = document.getSelection();
        if (i.focusNode instanceof Element && !this.DOM.input.contains(i.focusNode))
          return !0;
        try {
          i.rangeCount >= 1 && ["Start", "End"].forEach((a) => i.getRangeAt(0)["set" + a](t, e || t.length));
        } catch {
        }
      }
    }, placeCaretAfterNode(e) {
      if (e && e.parentNode) {
        var t = e, i = window.getSelection(), a = i.getRangeAt(0);
        i.rangeCount && (a.setStartAfter(t), a.collapse(!0), i.removeAllRanges(), i.addRange(a));
      }
    }, insertAfterTag(e, t) {
      if (t = t || this.settings.mixMode.insertAfterTag, e && e.parentNode && t)
        return t = typeof t == "string" ? document.createTextNode(t) : t, e.parentNode.insertBefore(t, e.nextSibling), t;
    }, editTagChangeDetected(e) {
      var t = e.__originalData;
      for (var i in t)
        if (!this.dataProps.includes(i) && e[i] != t[i])
          return !0;
      return !1;
    }, getTagTextNode(e) {
      return e.querySelector(this.settings.classNames.tagTextSelector);
    }, setTagTextNode(e, t) {
      this.getTagTextNode(e).innerHTML = M(t);
    }, editTag(e, t) {
      e = e || this.getLastTag(), t = t || {}, this.dropdown.hide();
      var i = this.settings, a = this.getTagTextNode(e), l = this.getNodeIndex(e), h = I(e), c = this.events.callbacks, g = this, f = !0;
      if (a) {
        if (!(h instanceof Object && "editable" in h) || h.editable)
          return h = I(e, { __originalData: E({}, h), __originalHTML: e.cloneNode(!0) }), I(h.__originalHTML, h.__originalData), a.setAttribute("contenteditable", !0), e.classList.add(i.classNames.tagEditing), a.addEventListener("focus", c.onEditTagFocus.bind(this, e)), a.addEventListener("blur", function() {
            setTimeout(() => c.onEditTagBlur.call(g, g.getTagTextNode(e)));
          }), a.addEventListener("input", c.onEditTagInput.bind(this, a)), a.addEventListener("paste", c.onEditTagPaste.bind(this, a)), a.addEventListener("keydown", (y) => c.onEditTagkeydown.call(this, y, e)), a.addEventListener("compositionstart", c.onCompositionStart.bind(this)), a.addEventListener("compositionend", c.onCompositionEnd.bind(this)), t.skipValidation || (f = this.editTagToggleValidity(e)), a.originalIsValid = f, this.trigger("edit:start", { tag: e, index: l, data: h, isValid: f }), a.focus(), this.setRangeAtStartEnd(!1, a), this;
      } else
        console.warn("Cannot find element in Tag template: .", i.classNames.tagTextSelector);
    }, editTagToggleValidity(e, t) {
      var i;
      if (t = t || I(e))
        return (i = !("__isValid" in t) || t.__isValid === !0) || this.removeTagsFromValue(e), this.update(), e.classList.toggle(this.settings.classNames.tagNotAllowed, !i), t.__isValid;
      console.warn("tag has no data: ", e, t);
    }, onEditTagDone(e, t) {
      t = t || {};
      var i = { tag: e = e || this.state.editing.scope, index: this.getNodeIndex(e), previousData: I(e), data: t };
      this.trigger("edit:beforeUpdate", i, { cloneData: !1 }), this.state.editing = !1, delete t.__originalData, delete t.__originalHTML, e && t[this.settings.tagTextProp] ? (e = this.replaceTag(e, t), this.editTagToggleValidity(e, t), this.settings.a11y.focusableTags ? e.focus() : this.placeCaretAfterNode(e)) : e && this.removeTags(e), this.trigger("edit:updated", i), this.dropdown.hide(), this.settings.keepInvalidTags && this.reCheckInvalidTags();
    }, replaceTag(e, t) {
      t && t.value || (t = e.__tagifyTagData), t.__isValid && t.__isValid != 1 && E(t, this.getInvalidTagAttrs(t, t.__isValid));
      var i = this.createTagElem(t);
      return e.parentNode.replaceChild(i, e), this.updateValueByDOMTags(), i;
    }, updateValueByDOMTags() {
      this.value.length = 0, [].forEach.call(this.getTagElms(), (e) => {
        e.classList.contains(this.settings.classNames.tagNotAllowed.split(" ")[0]) || this.value.push(I(e));
      }), this.update();
    }, injectAtCaret(e, t) {
      var i;
      return !(t = t || ((i = this.state.selection) == null ? void 0 : i.range)) && e ? (this.appendMixTags(e), this) : (G(e, t), this.setRangeAtStartEnd(!1, e), this.updateValueByDOMTags(), this.update(), this);
    }, input: { set() {
      let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = !(arguments.length > 1 && arguments[1] !== void 0) || arguments[1];
      var i = this.settings.dropdown.closeOnSelect;
      this.state.inputText = e, t && (this.DOM.input.innerHTML = M("" + e)), !e && i && this.dropdown.hide.bind(this), this.input.autocomplete.suggest.call(this), this.input.validate.call(this);
    }, raw() {
      return this.DOM.input.textContent;
    }, validate() {
      var e = !this.state.inputText || this.validateTag({ value: this.state.inputText }) === !0;
      return this.DOM.input.classList.toggle(this.settings.classNames.inputInvalid, !e), e;
    }, normalize(e) {
      var t = e || this.DOM.input, i = [];
      t.childNodes.forEach((a) => a.nodeType == 3 && i.push(a.nodeValue)), i = i.join(`
`);
      try {
        i = i.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0));
      } catch {
      }
      return i = i.replace(/\s/g, " "), this.trim(i);
    }, autocomplete: { suggest(e) {
      if (this.settings.autoComplete.enabled) {
        typeof (e = e || { value: "" }) == "string" && (e = { value: e });
        var t = this.dropdown.getMappedValue(e);
        if (typeof t != "number") {
          var i = t.substr(0, this.state.inputText.length).toLowerCase(), a = t.substring(this.state.inputText.length);
          t && this.state.inputText && i == this.state.inputText.toLowerCase() ? (this.DOM.input.setAttribute("data-suggest", a), this.state.inputSuggestion = e) : (this.DOM.input.removeAttribute("data-suggest"), delete this.state.inputSuggestion);
        }
      }
    }, set(e) {
      var t = this.DOM.input.getAttribute("data-suggest"), i = e || (t ? this.state.inputText + t : null);
      return !!i && (this.settings.mode == "mix" ? this.replaceTextWithNode(document.createTextNode(this.state.tag.prefix + i)) : (this.input.set.call(this, i), this.setRangeAtStartEnd(!1, this.DOM.input)), this.input.autocomplete.suggest.call(this), this.dropdown.hide(), !0);
    } } }, getTagIdx(e) {
      return this.value.findIndex((t) => t.__tagId == (e || {}).__tagId);
    }, getNodeIndex(e) {
      var t = 0;
      if (e)
        for (; e = e.previousElementSibling; )
          t++;
      return t;
    }, getTagElms() {
      for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++)
        t[i] = arguments[i];
      var a = "." + [...this.settings.classNames.tag.split(" "), ...t].join(".");
      return [].slice.call(this.DOM.scope.querySelectorAll(a));
    }, getLastTag() {
      var e = this.DOM.scope.querySelectorAll(`${this.settings.classNames.tagSelector}:not(.${this.settings.classNames.tagHide}):not([readonly])`);
      return e[e.length - 1];
    }, isTagDuplicate(e, t, i) {
      var a = 0;
      if (this.settings.mode == "select")
        return !1;
      for (let l of this.value)
        d(this.trim("" + e), l.value, t) && i != l.__tagId && a++;
      return a;
    }, getTagIndexByValue(e) {
      var t = [];
      return this.getTagElms().forEach((i, a) => {
        d(this.trim(i.textContent), e, this.settings.dropdown.caseSensitive) && t.push(a);
      }), t;
    }, getTagElmByValue(e) {
      var t = this.getTagIndexByValue(e)[0];
      return this.getTagElms()[t];
    }, flashTag(e) {
      e && (e.classList.add(this.settings.classNames.tagFlash), setTimeout(() => {
        e.classList.remove(this.settings.classNames.tagFlash);
      }, 100));
    }, isTagBlacklisted(e) {
      return e = this.trim(e.toLowerCase()), this.settings.blacklist.filter((t) => ("" + t).toLowerCase() == e).length;
    }, isTagWhitelisted(e) {
      return !!this.getWhitelistItem(e);
    }, getWhitelistItem(e, t, i) {
      t = t || "value";
      var a, l = this.settings;
      return (i = i || l.whitelist).some((h) => {
        var c = typeof h == "string" ? h : h[t] || h.value;
        if (d(c, e, l.dropdown.caseSensitive, l.trim))
          return a = typeof h == "string" ? { value: h } : h, !0;
      }), a || t != "value" || l.tagTextProp == "value" || (a = this.getWhitelistItem(e, l.tagTextProp, i)), a;
    }, validateTag(e) {
      var t = this.settings, i = "value" in e ? "value" : t.tagTextProp, a = this.trim(e[i] + "");
      return (e[i] + "").trim() ? t.pattern && t.pattern instanceof RegExp && !t.pattern.test(a) ? this.TEXTS.pattern : !t.duplicates && this.isTagDuplicate(a, t.dropdown.caseSensitive, e.__tagId) ? this.TEXTS.duplicate : this.isTagBlacklisted(a) || t.enforceWhitelist && !this.isTagWhitelisted(a) ? this.TEXTS.notAllowed : !t.validate || t.validate(e) : this.TEXTS.empty;
    }, getInvalidTagAttrs(e, t) {
      return { "aria-invalid": !0, class: `${e.class || ""} ${this.settings.classNames.tagNotAllowed}`.trim(), title: t };
    }, hasMaxTags() {
      return this.value.length >= this.settings.maxTags && this.TEXTS.exceed;
    }, setReadonly(e, t) {
      var i = this.settings;
      document.activeElement.blur(), i[t || "readonly"] = e, this.DOM.scope[(e ? "set" : "remove") + "Attribute"](t || "readonly", !0), this.setContentEditable(!e);
    }, setContentEditable(e) {
      this.settings.userInput && (this.DOM.input.contentEditable = e, this.DOM.input.tabIndex = e ? 0 : -1);
    }, setDisabled(e) {
      this.setReadonly(e, "disabled");
    }, normalizeTags(e) {
      var t = this.settings, i = t.whitelist, a = t.delimiters, l = t.mode, h = t.tagTextProp, c = [], g = !!i && i[0] instanceof Object, f = Array.isArray(e), y = f && e[0].value, T = (w) => (w + "").split(a).filter((A) => A).map((A) => ({ [h]: this.trim(A), value: this.trim(A) }));
      if (typeof e == "number" && (e = e.toString()), typeof e == "string") {
        if (!e.trim())
          return [];
        e = T(e);
      } else
        f && (e = [].concat(...e.map((w) => w.value != null ? w : T(w))));
      return g && !y && (e.forEach((w) => {
        var A = c.map((S) => S.value), k = this.dropdown.filterListItems.call(this, w[h], { exact: !0 });
        this.settings.duplicates || (k = k.filter((S) => !A.includes(S.value)));
        var _ = k.length > 1 ? this.getWhitelistItem(w[h], h, k) : k[0];
        _ && _ instanceof Object ? c.push(_) : l != "mix" && (w.value == null && (w.value = w[h]), c.push(w));
      }), c.length && (e = c)), e;
    }, parseMixTags(e) {
      var t = this.settings, i = t.mixTagsInterpolator, a = t.duplicates, l = t.transformTag, h = t.enforceWhitelist, c = t.maxTags, g = t.tagTextProp, f = [];
      return e = e.split(i[0]).map((y, T) => {
        var w, A, k, _ = y.split(i[1]), S = _[0], x = f.length == c;
        try {
          if (S == +S)
            throw Error;
          A = JSON.parse(S);
        } catch {
          A = this.normalizeTags(S)[0] || { value: S };
        }
        if (l.call(this, A), x || !(_.length > 1) || h && !this.isTagWhitelisted(A.value) || !a && this.isTagDuplicate(A.value)) {
          if (y)
            return T ? i[0] + y : y;
        } else
          A[w = A[g] ? g : "value"] = this.trim(A[w]), k = this.createTagElem(A), f.push(A), k.classList.add(this.settings.classNames.tagNoAnimation), _[0] = k.outerHTML, this.value.push(A);
        return _.join("");
      }).join(""), this.DOM.input.innerHTML = e, this.DOM.input.appendChild(document.createTextNode("")), this.DOM.input.normalize(), this.getTagElms().forEach((y, T) => I(y, f[T])), this.update({ withoutChangeEvent: !0 }), e;
    }, replaceTextWithNode(e, t) {
      if (this.state.tag || t) {
        t = t || this.state.tag.prefix + this.state.tag.value;
        var i, a, l = this.state.selection || window.getSelection(), h = l.anchorNode, c = this.state.tag.delimiters ? this.state.tag.delimiters.length : 0;
        return h.splitText(l.anchorOffset - c), (i = h.nodeValue.lastIndexOf(t)) == -1 || (a = h.splitText(i), e && h.parentNode.replaceChild(e, a)), !0;
      }
    }, selectTag(e, t) {
      var i = this.settings;
      if (!i.enforceWhitelist || this.isTagWhitelisted(t.value)) {
        this.input.set.call(this, t[i.tagTextProp] || t.value, !0), this.state.actions.selectOption && setTimeout(() => this.setRangeAtStartEnd(!1, this.DOM.input));
        var a = this.getLastTag();
        return a ? this.replaceTag(a, t) : this.appendTag(e), this.value[0] = t, this.update(), this.trigger("add", { tag: e, data: t }), [e];
      }
    }, addEmptyTag(e) {
      var t = E({ value: "" }, e || {}), i = this.createTagElem(t);
      I(i, t), this.appendTag(i), this.editTag(i, { skipValidation: !0 });
    }, addTags(e, t, i) {
      var a = [], l = this.settings, h = [], c = document.createDocumentFragment();
      if (i = i || l.skipInvalid, !e || e.length == 0)
        return a;
      switch (e = this.normalizeTags(e), l.mode) {
        case "mix":
          return this.addMixTags(e);
        case "select":
          t = !1, this.removeAllTags();
      }
      return this.DOM.input.removeAttribute("style"), e.forEach((g) => {
        var f, y = {}, T = Object.assign({}, g, { value: g.value + "" });
        if (g = Object.assign({}, T), l.transformTag.call(this, g), g.__isValid = this.hasMaxTags() || this.validateTag(g), g.__isValid !== !0) {
          if (i)
            return;
          if (E(y, this.getInvalidTagAttrs(g, g.__isValid), { __preInvalidData: T }), g.__isValid == this.TEXTS.duplicate && this.flashTag(this.getTagElmByValue(g.value)), !l.createInvalidTags)
            return void h.push(g.value);
        }
        if ("readonly" in g && (g.readonly ? y["aria-readonly"] = !0 : delete g.readonly), f = this.createTagElem(g, y), a.push(f), l.mode == "select")
          return this.selectTag(f, g);
        c.appendChild(f), g.__isValid && g.__isValid === !0 ? (this.value.push(g), this.trigger("add", { tag: f, index: this.value.length - 1, data: g })) : (this.trigger("invalid", { data: g, index: this.value.length, tag: f, message: g.__isValid }), l.keepInvalidTags || setTimeout(() => this.removeTags(f, !0), 1e3)), this.dropdown.position();
      }), this.appendTag(c), this.update(), e.length && t && (this.input.set.call(this, l.createInvalidTags ? "" : h.join(l._delimiters)), this.setRangeAtStartEnd(!1, this.DOM.input)), l.dropdown.enabled && this.dropdown.refilter(), a;
    }, addMixTags(e) {
      if ((e = this.normalizeTags(e))[0].prefix || this.state.tag)
        return this.prefixedTextToTag(e[0]);
      var t = document.createDocumentFragment();
      return e.forEach((i) => {
        var a = this.createTagElem(i);
        t.appendChild(a);
      }), this.appendMixTags(t), t;
    }, appendMixTags(e) {
      var t = !!this.state.selection;
      t ? this.injectAtCaret(e) : (this.DOM.input.focus(), (t = this.setStateSelection()).range.setStart(this.DOM.input, t.range.endOffset), t.range.setEnd(this.DOM.input, t.range.endOffset), this.DOM.input.appendChild(e), this.updateValueByDOMTags(), this.update());
    }, prefixedTextToTag(e) {
      var t, i = this.settings, a = this.state.tag.delimiters;
      if (i.transformTag.call(this, e), e.prefix = e.prefix || this.state.tag ? this.state.tag.prefix : (i.pattern.source || i.pattern)[0], t = this.createTagElem(e), this.replaceTextWithNode(t) || this.DOM.input.appendChild(t), setTimeout(() => t.classList.add(this.settings.classNames.tagNoAnimation), 300), this.value.push(e), this.update(), !a) {
        var l = this.insertAfterTag(t) || t;
        setTimeout(this.placeCaretAfterNode, 0, l);
      }
      return this.state.tag = null, this.trigger("add", E({}, { tag: t }, { data: e })), t;
    }, appendTag(e) {
      var t = this.DOM, i = t.input;
      t.scope.insertBefore(e, i);
    }, createTagElem(e, t) {
      e.__tagId = q();
      var i, a = E({}, e, n({ value: M(e.value + "") }, t));
      return function(l) {
        for (var h, c = document.createNodeIterator(l, NodeFilter.SHOW_TEXT, null, !1); h = c.nextNode(); )
          h.textContent.trim() || h.parentNode.removeChild(h);
      }(i = this.parseTemplate("tag", [a, this])), I(i, e), i;
    }, reCheckInvalidTags() {
      var e = this.settings;
      this.getTagElms(e.classNames.tagNotAllowed).forEach((t, i) => {
        var a = I(t), l = this.hasMaxTags(), h = this.validateTag(a), c = h === !0 && !l;
        if (e.mode == "select" && this.toggleScopeValidation(h), c)
          return a = a.__preInvalidData ? a.__preInvalidData : { value: a.value }, this.replaceTag(t, a);
        t.title = l || h;
      });
    }, removeTags(e, t, i) {
      var a, l = this.settings;
      if (e = e && e instanceof HTMLElement ? [e] : e instanceof Array ? e : e ? [e] : [this.getLastTag()], a = e.reduce((h, c) => {
        c && typeof c == "string" && (c = this.getTagElmByValue(c));
        var g = I(c);
        return c && g && !g.readonly && h.push({ node: c, idx: this.getTagIdx(g), data: I(c, { __removed: !0 }) }), h;
      }, []), i = typeof i == "number" ? i : this.CSSVars.tagHideTransition, l.mode == "select" && (i = 0, this.input.set.call(this)), a.length == 1 && l.mode != "select" && a[0].node.classList.contains(l.classNames.tagNotAllowed) && (t = !0), a.length)
        return l.hooks.beforeRemoveTag(a, { tagify: this }).then(() => {
          function h(c) {
            c.node.parentNode && (c.node.parentNode.removeChild(c.node), t ? l.keepInvalidTags && this.trigger("remove", { tag: c.node, index: c.idx }) : (this.trigger("remove", { tag: c.node, index: c.idx, data: c.data }), this.dropdown.refilter(), this.dropdown.position(), this.DOM.input.normalize(), l.keepInvalidTags && this.reCheckInvalidTags()));
          }
          i && i > 10 && a.length == 1 ? function(c) {
            c.node.style.width = parseFloat(window.getComputedStyle(c.node).width) + "px", document.body.clientTop, c.node.classList.add(l.classNames.tagHide), setTimeout(h.bind(this), i, c);
          }.call(this, a[0]) : a.forEach(h.bind(this)), t || (this.removeTagsFromValue(a.map((c) => c.node)), this.update(), l.mode == "select" && this.setContentEditable(!0));
        }).catch((h) => {
        });
    }, removeTagsFromDOM() {
      [].slice.call(this.getTagElms()).forEach((e) => e.parentNode.removeChild(e));
    }, removeTagsFromValue(e) {
      (e = Array.isArray(e) ? e : [e]).forEach((t) => {
        var i = I(t), a = this.getTagIdx(i);
        a > -1 && this.value.splice(a, 1);
      });
    }, removeAllTags(e) {
      e = e || {}, this.value = [], this.settings.mode == "mix" ? this.DOM.input.innerHTML = "" : this.removeTagsFromDOM(), this.dropdown.refilter(), this.dropdown.position(), this.state.dropdown.visible && setTimeout(() => {
        this.DOM.input.focus();
      }), this.settings.mode == "select" && (this.input.set.call(this), this.setContentEditable(!0)), this.update(e);
    }, postUpdate() {
      var a, l;
      this.state.blockChangeEvent = !1;
      var e = this.settings, t = e.classNames, i = e.mode == "mix" ? e.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value.trim() : this.value.length + this.input.raw.call(this).length;
      this.toggleClass(t.hasMaxTags, this.value.length >= e.maxTags), this.toggleClass(t.hasNoTags, !this.value.length), this.toggleClass(t.empty, !i), e.mode == "select" && this.toggleScopeValidation((l = (a = this.value) == null ? void 0 : a[0]) == null ? void 0 : l.__isValid);
    }, setOriginalInputValue(e) {
      var t = this.DOM.originalInput;
      this.settings.mixMode.integrated || (t.value = e, t.tagifyValue = t.value, this.setPersistedData(e, "value"));
    }, update(e) {
      clearTimeout(this.debouncedUpdateTimeout), this.debouncedUpdateTimeout = setTimeout(function() {
        var t = this.getInputValue();
        this.setOriginalInputValue(t), this.settings.onChangeAfterBlur && (e || {}).withoutChangeEvent || this.state.blockChangeEvent || this.triggerChangeEvent(), this.postUpdate();
      }.bind(this), 100);
    }, getInputValue() {
      var e = this.getCleanValue();
      return this.settings.mode == "mix" ? this.getMixedTagsAsString(e) : e.length ? this.settings.originalInputValueFormat ? this.settings.originalInputValueFormat(e) : JSON.stringify(e) : "";
    }, getCleanValue(e) {
      return p(e || this.value, this.dataProps);
    }, getMixedTagsAsString() {
      var e = "", t = this, i = this.settings, a = i.originalInputValueFormat || JSON.stringify, l = i.mixTagsInterpolator;
      return function h(c) {
        c.childNodes.forEach((g) => {
          if (g.nodeType == 1) {
            const f = I(g);
            if (g.tagName == "BR" && (e += `\r
`), f && W.call(t, g)) {
              if (f.__removed)
                return;
              e += l[0] + a(v(f, t.dataProps)) + l[1];
            } else
              g.getAttribute("style") || ["B", "I", "U"].includes(g.tagName) ? e += g.textContent : g.tagName != "DIV" && g.tagName != "P" || (e += `\r
`, h(g));
          } else
            e += g.textContent;
        });
      }(this.DOM.input), e;
    } }, J.prototype.removeTag = J.prototype.removeTags, J;
  });
})(Re);
class H extends ItemSheet {
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
    return `systems/abbrew/templates/item/item-${this.item.type}-sheet.hbs`;
  }
  /* -------------------------------------------- */
  /** @override */
  getData() {
    var o;
    const r = super.getData(), s = r.item;
    r.rollData = {};
    let n = ((o = this.object) == null ? void 0 : o.parent) ?? null;
    return n && (r.rollData = n.getRollData()), r.effects = ce(this.item.effects), r.system = s.system, r.flags = s.flags, r;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(r) {
    if (super.activateListeners(r), !this.isEditable)
      return;
    const s = r[0].querySelector('input[name="system.weapon.requirements"]');
    s && new ee(s, {}), r.find(".effect-control").click((n) => de(n, this.item)), r.find(".rule-control").click(async (n) => await xe(n, this.item));
  }
  async _updateObject(r, s) {
    r.handleObj && r.handleObj.type == "change" && (r.currentTarget ? await this.manualUpdate(r, s) : super._updateObject(r, s)), console.log("form submit prevented");
  }
  async manualUpdate(r, s) {
    const n = r.currentTarget;
    if (n.classList.contains("rule-editor")) {
      const o = n.dataset, d = o.ruleId, p = o.field, v = s[n.name];
      let m = foundry.utils.deepClone(this.item.system.rules);
      const b = m.findIndex((D) => D.id == d);
      return m[b][p] = v, p == "type" && (m[b].content = te[v].template()), await this.item.update({
        "system.rules": m
      });
    } else
      super._updateObject(r, s);
  }
  close(r = {}) {
    console.log("closing sheet"), this.getData(), super.close(r);
  }
}
class Le extends H {
  /** @override */
  activateListeners(r) {
    super.activateListeners(r);
  }
  /** @override */
  get template() {
    return "systems/abbrew/templates/item/item-anatomy-sheet.hbs";
  }
}
const Be = async function() {
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
class Q extends Roll {
  constructor(r, s, n) {
    super(r, s, n), this.options.configured || this._configureModifiers();
  }
  static async fromRoll(r) {
    const s = new this(r.formula, r.data, r.options);
    return await s.evaluate({ async: !0 }), s;
  }
  get validD10Roll() {
    return this.terms[0].rolls[0].terms[0] instanceof Die && this.terms[0].rolls[0].terms[0].faces === 10;
  }
  async render(r, s, n) {
    return s = this.CHAT_TEMPLATE, super.render(r, s, n);
  }
  /** @inheritdoc */
  async toMessage(r = {}, s = {}) {
    if (this.validD10Roll)
      return this._evaluated || await this.evaluate({ async: !0 }), s.rollMode = s.rollMode ?? this.options.rollMode, super.toMessage(r, s);
  }
  async configureDialog({ title: r, template: s } = {}, n = {}) {
    const o = await renderTemplate(s ?? this.constructor.EVALUATION_TEMPLATE, {
      formula: "d10!"
    });
    let d = "normal";
    return new Promise((p) => {
      new Dialog({
        title: r,
        content: o,
        buttons: {
          advantage: {
            label: "1",
            callback: (v) => p(this._onDialogSubmit(
              v
              /* , D20Roll.ADV_MODE.ADVANTAGE */
            ))
          },
          normal: {
            label: "2",
            callback: (v) => p(this._onDialogSubmit(
              v
              /* , D20Roll.ADV_MODE.NORMAL */
            ))
          },
          disadvantage: {
            label: "3",
            callback: (v) => p(this._onDialogSubmit(
              v
              /* , D20Roll.ADV_MODE.DISADVANTAGE */
            ))
          }
        },
        default: d,
        close: () => p(null)
      }, n).render(!0);
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
  _onDialogSubmit(r, s) {
    const n = r[0].querySelector("form");
    if (n.weakOrStrong.value) {
      const o = n.weakOrStrong.value;
      o < 0 ? (this.options.weak = !0, this.options.weakValue = Math.abs(o)) : o > 0 && (this.options.strong = !0, this.options.strongValue = Math.abs(o));
    }
    return this._configureModifiers(), this;
  }
  _configureModifiers() {
    const r = this.terms[0].rolls[0];
    this.options.weak && (r.terms[4].number += this.options.weakValue), this.options.strong && (r.terms[0].number += this.options.strongValue), this._formula = this.constructor.getFormula(this.terms), this.options.configured = !0;
  }
}
O(Q, "EVALUATION_TEMPLATE", "systems/abbrew/templates/chat/roll-dialog.hbs"), O(Q, "CHAT_TEMPLATE", "systems/abbrew/templates/chat/damage-roll.hbs");
async function se(u, r, s) {
  if (r.round < u.round || r.round == u.round && r.turn < u.turn)
    return;
  let n = u.current.combatantId ? u.nextCombatant.actor : u.turns[0].actor;
  await Ve(n);
}
async function Ve(u) {
  if (ChatMessage.create({ content: `${u.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: u }) }), u.system.canBleed) {
    let n = u.system.wounds.active;
    console.log(n);
    let o = u.system.blood.value;
    console.log(o);
    let d = 0;
    n === 0 && await u.update({ "system.conditions.gushingWounds": 0 }), u.system.conditions.gushingWounds > 0 && (d = u.system.conditions.gushingWounds * 5);
    let p = u.system.conditions.bleedPrevention;
    if (p > 0) {
      let m = u.system.wounds.healing + p;
      await u.update({ "system.wounds.healing": m });
    }
    let v = o - (n + d - p);
    console.log(v), await u.update({ "system.blood.value": v }), v <= u.system.blood.nausea ? await u.update({ "system.conditions.nausea": 1 }) : await u.update({ "system.conditions.nausea": 0 }), v <= u.system.blood.unconscious ? await u.update({ "system.conditions.unconscious": 1 }) : await u.update({ "system.conditions.unconscious": 0 });
  }
  let r = u.system.armour, s = r.value;
  if (console.log("Armour: ", r), r.value < r.max) {
    e:
      if (u.effects.find((n) => n.label === "Regenerating")) {
        if (console.log("Check for regain Armour"), u.effects.find((d) => d.label === "Weakened")) {
          console.log("Exposed so no armour regained");
          break e;
        }
        let n = 1;
        u.effects.find((d) => d.label === "Cursed") && (n = 0.5), console.log("Regain Armour");
        let o = r.max - r.value;
        console.log("Missing Armour: ", o), s = r.value + Math.max(Math.floor(o * n / 2), 1), console.log("newArmour", s);
      }
  } else
    s = r.max;
  await u.update({ "system.armour.value": s });
}
Hooks.once("init", async function() {
  Handlebars.registerHelper("json", function(r) {
    return JSON.stringify(r);
  }), game.abbrew = {
    AbbrewActor: ne,
    AbbrewItem: Z,
    rollItemMacro: We
  }, CONFIG.ABBREW = R, CONFIG.Combat.initiative = {
    formula: "1d10 + @abilities.dexterity.mod + @abilities.agility.mod + @abilities.wits.mod",
    decimals: 2
  }, CONFIG.Dice.AbbrewRoll = Q, CONFIG.Dice.rolls.push(Q), CONFIG.Actor.documentClass = ne, CONFIG.Item.documentClass = Z, Actors.unregisterSheet("core", ActorSheet), Actors.registerSheet("abbrew", Se, { makeDefault: !0 }), Items.unregisterSheet("core", ItemSheet);
  const u = [
    ["anatomy", Le],
    ["item", H],
    ["feature", H],
    ["spell", H],
    ["resource", H],
    ["attack", H],
    ["defence", H]
  ];
  for (const [r, s] of u)
    Items.registerSheet("abbrew", s, {
      types: [r],
      label: game.i18n.localize(R.SheetLabel, { type: r }),
      makeDefault: !0
    });
  return Be();
});
Hooks.on("pauseGame", async function(u) {
  const r = game.actors.get("rLEUu5Vg7QCj59dE");
  console.log("paused");
  const o = { content: { promptTitle: "Hello", choices: r.items.map((p) => ({ id: p._id, name: p.name })) }, buttons: {} }, d = await new le(o).resolveSelection();
  console.log(d);
});
Handlebars.registerHelper("concat", function() {
  var u = "";
  for (var r in arguments)
    typeof arguments[r] != "object" && (u += arguments[r]);
  return u;
});
Handlebars.registerHelper("toLowerCase", function(u) {
  return u.toLowerCase();
});
Handlebars.registerHelper("isNumber", function(u) {
  return typeof u == "number";
});
Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (u, r, s) => Pe(r, s));
});
async function Pe(u, r) {
  if (u.type !== "Item")
    return;
  if (!u.uuid.includes("Actor.") && !u.uuid.includes("Token."))
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  const s = await Item.fromDropData(u), n = `game.abbrew.rollItemMacro("${u.uuid}");`;
  let o = game.macros.find((d) => d.name === s.name && d.command === n);
  return o || (o = await Macro.create({
    name: s.name,
    type: "script",
    img: s.img,
    command: n,
    flags: { "abbrew.itemMacro": !0 }
  })), game.user.assignHotbarMacro(o, r), !1;
}
function We(u) {
  const r = {
    type: "Item",
    uuid: u
  };
  Item.fromDropData(r).then((s) => {
    if (!s || !s.parent) {
      const n = (s == null ? void 0 : s.name) ?? u;
      return ui.notifications.warn(`Could not find item ${n}. You may need to delete and recreate this macro.`);
    }
    s.roll();
  });
}
Hooks.on("renderChatLog", (u, r, s) => Z.chatListeners(r));
Hooks.on("abbrew.ability", function(u) {
  console.log("Hooked on " + u);
});
Hooks.once("dragRuler.ready", (u) => {
  class r extends u {
    get colors() {
      return [
        { id: "walk", default: 65280, name: "abbrew.speeds.walk" },
        { id: "dash", default: 16776960, name: "abbrew.speeds.dash" },
        { id: "run", default: 16744448, name: "abbrew.speeds.run" }
      ];
    }
    getRanges(n) {
      const o = n.actor.system.movement.base;
      return [
        { range: o, color: "walk" },
        { range: o * 2, color: "dash" },
        { range: o * 3, color: "run" }
      ];
    }
  }
  dragRuler.registerSystem("abbrew", r);
});
Hooks.on("combatStart", async (u, r, s) => {
  await se(u, r);
});
Hooks.on("combatRound", async (u, r, s) => {
  await se(u, r);
});
Hooks.on("combatTurn", async (u, r, s) => {
  await se(u, r);
});
Hooks.on("updateActor", (u) => {
  console.log("ActorUpdated");
});
Hooks.on("updateToken", (u) => {
  console.log("TokenUpdated");
});
//# sourceMappingURL=abbrew.mjs.map
