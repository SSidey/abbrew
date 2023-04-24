var x = Object.defineProperty;
var N = (i, s, e) => s in i ? x(i, s, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[s] = e;
var u = (i, s, e) => (N(i, typeof s != "symbol" ? s + "" : s, e), e);
async function O({
  parts: i = [],
  data: s = {},
  title: e,
  flavour: t,
  dialogOptions: a,
  messageData: r = {},
  options: o = {},
  chatMessage: l = !0,
  rollMode: n,
  flavor: c
}) {
  let m = 1 + s.amplification, p = 0 + s.weakness;
  m = "" + m, p = "" + p;
  const b = ["{" + m + "d10x>=" + s.criticalThreshold, ...i].join("+") + " -" + p + "d10, 0}kh", f = n || game.settings.get("core", "rollMode");
  foundry.utils.mergeObject(o, {
    flavor: c || e,
    defaultRollMode: f,
    rollMode: n
  });
  const g = new CONFIG.Dice.AbbrewRoll(b, s);
  await g.configureDialog({ title: "Additional Modifiers" }), await g.evaluate({ async: !0 }), r = {}, r.flags = { data: s }, await g.toMessage(r);
}
Hooks.on("init", () => {
  $(document).on("click", ".damage-application button", G);
});
class H {
  constructor(s, e, t, a, r, o, l) {
    u(this, "id", "");
    u(this, "abilityModifier", "");
    u(this, "damageBase", 0);
    u(this, "isWeapon", !1);
    u(this, "weapon", {});
    u(this, "isMagic", !1);
    u(this, "magic", {});
    this.id = s, this.abilityModifier = e, this.damageBase = t, this.isWeapon = a, this.weapon = r, this.isMagic = o, this.magic = l;
  }
}
async function V(i, s, e) {
  let t = `${i.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
  const a = L(e, i, s);
  a.mod = 10;
  const r = {
    parts: [s.abilityModifier, "@attackProfile.damageBase"],
    data: a,
    title: t,
    flavour: t,
    dialogOptions: {
      width: 400,
      top: null,
      left: window.innerWidth - 710
    },
    messageData: {
      "flags.abbrew.roll": { type: "attack", attack: i.id, attackProfile: s.id },
      speaker: ChatMessage.getSpeaker({ actor: e })
    },
    options: {
      damageType: s.damageType
    }
  };
  return await O(r);
}
function L(i, s, e) {
  if (!i)
    return null;
  const t = i.getRollData();
  return t.attack = foundry.utils.deepClone(s), t.attackProfile = foundry.utils.deepClone(e), t.criticalThreshold = q(i, e), t.amplification = U(i, e), t.weakness = F(i, e), t;
}
function q(i, s) {
  const e = s.weapon.criticalThreshold, t = s.weapon.damageType, a = i.system.concepts.attack.criticalThreshold;
  let r = 10;
  i.system.concepts[t] && (r = i.system.concepts[t].criticalThreshold);
  const o = Math.min(e, a, r);
  return Math.max(o, 5);
}
function U(i, s) {
  const e = s.weapon.damageType;
  return i.system.concepts[e] ? i.system.concepts[e].amplification : 0;
}
function F(i, s) {
  const e = s.weapon.damageType;
  return i.system.concepts[e] ? i.system.concepts[e].weakness : 0;
}
async function G(i) {
  console.log(i);
  const t = i.currentTarget.closest(".chat-message").closest(".message").dataset.messageId, a = game.messages.get(t);
  await canvas.tokens.controlled.filter((o) => o.actor)[0].actor.acceptDamage(a.rolls, a.flags.data);
}
class D {
  constructor(s, e, t, a, r) {
    u(this, "id");
    u(this, "label");
    u(this, "type");
    u(this, "priority");
    u(this, "predicate");
    // The property to modify e.g. system.abilities.strength.value
    u(this, "target");
    u(this, "source");
    u(this, "valid");
    this.type = t, this.priority = 100, this.id = s, this.label = e, this.valid = r, this.source = a, this.predicate = "", this.target = "";
  }
  get _type() {
    return this.type;
  }
  template() {
    return JSON.stringify(this);
  }
  static applyRule(s, e) {
    return {};
  }
  static validate(s) {
    return s.hasOwnProperty("type") && s.hasOwnProperty("priority") && s.hasOwnProperty("predicate") && s.hasOwnProperty("target");
  }
}
const d = {};
d.abilities = {
  strength: "ABBREW.AbilityStrength",
  dexterity: "ABBREW.AbilityDexterity",
  constitution: "ABBREW.AbilityConstitution",
  agility: "ABBREW.AbilityAgility",
  intelligence: "ABBREW.AbilityIntelligence",
  will: "ABBREW.AbilityWill",
  wits: "ABBREW.AbilityWits",
  visualisation: "ABBREW.AbilityVisualisation"
};
d.abilityAbbreviations = {
  str: "ABBREW.AbilityStrengthAbbreviation",
  dex: "ABBREW.AbilityDexterityAbbreviation",
  con: "ABBREW.AbilityConstitutionAbbreviation",
  agi: "ABBREW.AbilityAgilityAbbreviation",
  int: "ABBREW.AbilityIntelligenceAbbreviation",
  wll: "ABBREW.AbilityWillAbbreviation",
  wts: "ABBREW.AbilityWitsAbbreviation",
  wis: "ABBREW.AbilityVisualisationAbbreviation"
};
d.ActionTypes = {
  Damage: "damage"
};
d.Reach = {
  natural: "ABBREW.ReachNatural",
  short: "ABBREW.ReachShort",
  standard: "ABBREW.ReachStandard",
  long: "ABBREW.ReachLong"
};
d.DamageTypes = {
  physical: "ABBREW.physical",
  crushing: "ABBREW.crushing",
  slashing: "ABBREW.slashing",
  piercing: "ABBREW.piercing"
};
d.DamageProjection = {
  arc: "ABBREW.Arc",
  thrust: "ABBREW.Thrust"
};
d.UI = {
  RuleElements: {
    Prompt: {
      NoValidOptions: "ABBREW.NoValidOptions",
      NoSelectionMade: "ABBREW.NoSelectionMade"
    }
  }
};
d.RuleTypes = {
  ActiveEffect: "ABBREW.ActiveEffect",
  ChoiceSet: "ABBREW.ChoiceSet"
};
class A extends D {
  constructor(e, t, a, r, o) {
    super(e, t, d.RuleTypes.ActiveEffect, r, o);
    u(this, "operator");
    u(this, "value");
    if (a && typeof a == "object") {
      a && Object.assign(this, a);
      return;
    }
    this.operator = "", this.value = "";
  }
  static validate(e) {
    return super.validate(e) && e.hasOwnProperty("operator") && e.hasOwnProperty("value") && this.validOperators.includes(e.operator) && !!e.value;
  }
  static applyRule(e, t) {
    let a = {}, r = e.targetElement ? t.items.get(e.targetElement) : t, o = e.targetElement ? "Item" : "Actor", l = getProperty(r, e.target);
    if (!l)
      return a;
    let n = getProperty(r, e.target);
    switch (e.operator) {
      case "override":
        n = +e.value;
        break;
      case "add":
        n = n += +e.value;
        break;
      case "minus":
        n = n -= +e.value;
        break;
      case "multiply":
        n = n * +e.value;
        break;
      case "divide":
        const c = +e.value != 0 ? +e.value : 1;
        n = n / c;
        break;
      case "upgrade":
        n = n < e.value ? e.value : n;
        break;
      case "downgrade":
        n = n > e.value ? e.value : n;
        break;
    }
    if (l != n) {
      const c = { [e.target]: n, rules: [e.id] };
      let m = l;
      Object.keys(t.ruleOverrides).includes(e.target) && (m = t.ruleOverrides[e.target].sourceValue), a = { target: e.target, value: n, sourceValue: m, targetType: o, targetElement: e.targetElement }, mergeObject(r, c);
    }
    return a;
  }
}
u(A, "validOperators", [
  "override",
  "add",
  "minus",
  "multiply",
  "divide",
  "upgrade",
  "downgrade"
]);
class S extends Dialog {
  constructor(e = { promptTitle, choices }, t = {}) {
    t.buttons = {}, e.buttons = {};
    super(e, t);
    u(this, "selection");
    u(this, "choices");
    this.choices = e.content.choices;
  }
  /** @override */
  get template() {
    return "systems/abbrew/templates/rules/choice-set-prompt.hbs";
  }
  /** @override */
  activateListeners(e) {
    e[0].querySelectorAll("a[data-choice], button[type=button]").forEach((a) => {
      a.addEventListener("click", (r) => {
        console.log("clicked"), this.selection = r.currentTarget.dataset.id, this.close();
      });
    });
  }
  getData() {
    console.log("getData", this);
    const e = super.getData();
    return e.header = this.data.header, e.footer = this.data.footer, e.choices = e.content.choices, e.promptTitle = e.content.promptTitle, console.log(e), e;
  }
  /** Return early if there is only one choice */
  async resolveSelection() {
    if (this.choices.length === 0)
      return await this.close({ force: !0 }), null;
    const e = this.choices.at(0);
    return e && this.choices.length === 1 ? this.selection = e[0] : (this.render(!0), new Promise((t) => {
      this.resolve = t;
    }));
  }
  /** @override */
  /** Close the dialog, applying the effect with configured target or warning the user that something went wrong. */
  async close({ force: e = !1 } = {}) {
    var t;
    this.element.find("button, select").css({ pointerEvents: "none" }), this.selection || (e ? ui.notifications.warn(
      game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoValidOptions", {
        actor: this.actor.name,
        item: this.item.name
      })
    ) : this.allowNoSelection || ui.notifications.warn(
      game.i18n.format("ABBREW.UI.RuleElements.Prompt.NoSelectionMade")
    )), (t = this.resolve) == null || t.call(this, this.selection), await super.close({ force: e });
  }
}
class w extends D {
  constructor(e, t, a, r, o) {
    super(e, t, d.RuleTypes.ChoiceSet, r, o);
    u(this, "options");
    u(this, "choice");
    if (a && typeof a == "object") {
      a && Object.assign(this, a);
      return;
    }
    this.options = ["weapon", "armour", "consumable", "anatomy"], this.choice = "";
  }
  set target(e) {
    this.target = e;
  }
  static validate(e) {
    return super.validate(e) && e.hasOwnProperty("options");
  }
  static async applyRule(e, t) {
    return {};
  }
  static async getChoice(e, t) {
    if (e.choice)
      return e.choice;
    let a = [];
    e.options.includes("weapon") && (a = mergeObject(a, this.getItemWeapons(t))), e.options.includes("armour") && (a = mergeObject(a, this.getItemArmour(t))), e.options.includes("consumable") && (a = mergeObject(a, this.getItemConsumable(t))), e.options.includes("anatomy") && (a = mergeObject(a, this.getItemAnatomy(t)));
    const r = { content: { promptTitle: "Hello", choices: a }, buttons: {} }, o = await new S(r).resolveSelection();
    let l = e.source.item;
    e.source.actor || (l = t.items.map((c) => c.system.rules).flat(1).filter((c) => c.id == e.id)[0].source.item);
    const n = t.items.get(l);
    for (let c = 0; c < n.system.rules.length; c++)
      if (n.system.rules[c].targetElement = o, n.system.rules[c].id == e.id) {
        n.system.rules[c].choice = o;
        const m = n.system.rules[c].content;
        let p = JSON.parse(m);
        p.choice = o, n.system.rules[c].content = JSON.stringify(p);
      }
    return n.update({ system: { rules: n.system.rules } }), o;
  }
  static getItemWeapons(e) {
    return e.itemTypes.item.filter((t) => t.system.isWeapon).map((t) => ({ id: t._id, name: t.name }));
  }
  static getItemArmour(e) {
    return e.itemTypes.item.filter((t) => t.system.isArmour).map((t) => ({ id: t._id, name: t.name }));
  }
  static getItemConsumable(e) {
    return e.itemTypes.item.filter((t) => t.system.isConsumable).map((t) => ({ id: t._id, name: t.name }));
  }
  static getItemAnatomy(e) {
    return e.itemTypes.anatomy.map((t) => ({ id: t._id, name: t.name }));
  }
}
class z {
  constructor({ id: s, type: e, label: t, content: a, source: r }) {
    u(this, "id");
    u(this, "type");
    u(this, "label");
    u(this, "content");
    u(this, "source");
    u(this, "options");
    u(this, "targetElement");
    this.id = s, this.type = e, this.label = t, this.content = a, this.source = r, this.options = T, this.targetElement = "";
  }
}
const T = [
  new A(),
  new w()
];
class J {
  constructor(s) {
    u(this, "actor");
    u(this, "item");
    u(this, "uuid");
    this.uuid = s, this.actor = "", this.item = "";
    const e = s.split(".");
    for (let t = 0; t < e.length; t++)
      e[t] == "Actor" && (this.actor = e[t + 1]), e[t] == "Item" && (this.item = e[t + 1]);
  }
}
async function Y(i, s) {
  i.preventDefault();
  const e = i.currentTarget, a = e.closest("li").dataset.ruleId;
  let r = foundry.utils.deepClone(s.system.rules);
  switch (e.dataset.action) {
    case "create":
      const o = K();
      r = [
        new z({ id: o, type: 0, label: "New Rule", content: T[0].template(), source: new J(s.uuid) }),
        ...r
      ];
      break;
    case "delete":
      r = r.filter((l) => l.id != a);
      break;
  }
  return await s.update({
    "system.rules": r
  });
}
function K() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
async function Q(i) {
  const s = i.items._source.map((a) => a.system.rules).flat(1), e = [], t = [];
  for (let a = 0; a < s.length; a++) {
    const r = s[a];
    t[r.source.uuid] && (r.targetElement = t[r.source.uuid]);
    const o = JSON.parse(r.content);
    let l = {}, n = !1;
    switch (o.type) {
      case d.RuleTypes.ActiveEffect:
        console.log("Active Effect"), n = A.validate(o), l = new A(r.id, r.label, o, r.source, n), l.targetElement = r.targetElement, e.push(l);
        break;
      case d.RuleTypes.ChoiceSet:
        console.log("Choice Set"), n = w.validate(o), l = new w(r.id, r.label, o, r.source, n);
        const c = await w.getChoice(l, i);
        t[r.source.uuid] = c, l.targetElement = c, l.choice = c, e.push(l);
        break;
    }
  }
  await i.update({ "system.rules": e });
}
function X(i, s) {
  let e = {};
  switch (i.type) {
    case d.RuleTypes.ActiveEffect:
      e = A.applyRule(i, s);
      break;
    case d.RuleTypes.ChoiceSet:
      e = w.applyRule(i, s);
      break;
  }
  return e;
}
function I(i, s, e) {
  let t = [];
  t[s] = e;
  let a = expandObject(t);
  i.update(a);
}
class B extends Actor {
  constructor() {
    super(...arguments);
    u(this, "ruleOverrides");
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
    const e = this;
    e.system, e.flags.abbrew, this._prepareCharacterData(e), this._prepareNpcData(e);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(e) {
    if (e.type !== "character")
      return;
    const t = e.system;
    this._processRules(this), this._prepareAbilityModifiers(t), this._prepareAnatomy(t), this._prepareMovement(t), this._prepareDefences(t), this._prepareArmour(t), this._preparePower(t), this._prepareActions(t), this._prepareFeatures(t);
  }
  async _updateObject(e, t) {
    console.log("here"), await super._updateObject(e, t);
  }
  _onUpdate(e, t, a) {
    console.log("here2"), super._onUpdate(e, t, a);
  }
  async _preUpdate(e, t, a) {
    if (console.log("pre-update"), this.ruleOverrides) {
      let r = flattenObject(e, 1), o = Object.keys(r).map((n) => [n, r[n]]);
      const l = Object.keys(this.ruleOverrides);
      o.forEach((n) => {
        if (l.includes(n[0]) && this.ruleOverrides[n[0]].overrideValue == n[1]) {
          let m = n[0].split("."), p = m.pop(), h = m.reduce((b, f) => b[f], e);
          delete h[p];
        }
      });
    }
    super._preUpdate(e, t, a);
  }
  _onUpdateEmbeddedDocuments(e, t, a, r, o) {
    console.log(`Update Object: ${e}`), super._onUpdateEmbeddedDocuments(e, t, a, r, o);
  }
  _processRules(e) {
    if (this.prepareItems(this), this.resetItems(this), Q(this), e.system.rules.length == 0) {
      this.ruleOverrides = [];
      return;
    }
    let t = [];
    this.ruleOverrides = [], e.ruleOverrides = [], e.system.rules.filter(
      (a) => a.valid
    ).sort((a, r) => r.priority - a.priority).forEach((a) => {
      const r = X(a, e);
      Object.keys(r).length != 0 && (t[r.target] = {
        overrideValue: r.value,
        sourceValue: r.sourceValue,
        targetType: r.targetType,
        targetElement: r.targetElement
      }, e.ruleOverrides[r.target] = t[r.target]);
    }), this.ruleOverrides = t;
  }
  /**
   * Reset item overridden fields to pre-rule values.
   * @param {AbbrewActor} actorData    
   */
  prepareItems(e) {
    e.items.filter((t) => t.system.rules.length > 0).forEach((t) => {
      t.system.rules.forEach((r) => {
        r.source.actor && r.source.item || (r.source.actor = this.id, r.source.item = t.id, r.source.uuid = `Actor.${this.id}.Item.${t.id}`);
      });
      const a = e.items.get(t.id);
      I(a, "system.rules", t.system.rules);
    });
  }
  resetItems(e) {
    if (e.ruleOverrides) {
      for (const [t, a] of Object.entries(e.ruleOverrides))
        if (a.targetType == "Item") {
          const r = e.items.get(a.targetElement), o = t;
          o.split(".").reduce((c, m) => c[m], r) == a.overrideValue && I(r, o, a.sourceValue);
        }
    }
  }
  async _updateDocuments(e, { updates: t, options: a, pack: r }, o) {
    console.log("update-documents"), super._updateDocuments(e, { updates: t, options: a, pack: r }, o);
  }
  _prepareAnatomy(e) {
    this.itemTypes.anatomy.forEach(
      (t) => {
        const a = t.system.tags.replace(" ", "").split(",");
        t.system.tagsArray = a;
        const r = t.system.armourPoints.replace(" ", "").split(",");
        t.system.armourPointsArray = r;
      }
    ), e.anatomy = this.itemTypes.anatomy;
  }
  _prepareDefences(e) {
    const t = Object.fromEntries(Object.entries(this.itemTypes.defence).map(([a, r]) => [r.name, r.system]));
    e.defences = { ...e.defences, ...t };
  }
  _prepareFeatures(e) {
    const a = this._getWeapons().map((r) => this._prepareWeaponAttack(r, e));
    e.attacks = a.flat();
  }
  _getWeapons() {
    return this._getItemWeapons().map((e) => ({ name: e.name, img: e.img, weaponId: e._id, weight: e.system.weight, concepts: e.system.concepts, material: e.system.material, ...e.system.weapon }));
  }
  _getItemWeapons() {
    return this.itemTypes.item.filter((e) => e.system.isWeapon);
  }
  _prepareWeaponAttack(e) {
    const t = e.weaponProfiles.split(",").map((a, r) => {
      const o = a.split("-"), l = o[0].replace(" ", ""), n = o[1], c = JSON.parse(e.requirements);
      let m = 0;
      switch (o[1]) {
        case "arc":
          m = +e.material.structure + c.strength.value * (1 + e.minimumEffectiveReach) + e.material.tier * 5;
          break;
        case "thrust":
          m = +e.material.structure + e.material.tier * 5, e.penetration = e.material.tier * 5;
          break;
        default:
          return;
      }
      return new H(
        r,
        "@system.abilities.strength.mod",
        m,
        !0,
        {
          requirements: e.requirements,
          reach: e.reach,
          minimumEffectiveReach: e.minimumEffectiveReach,
          focused: e.focused,
          penetration: e.penetration,
          traits: e.traits,
          handsSupplied: e.handsSupplied,
          handsRequired: e.handsRequired,
          traitsArray: e.traitsArray,
          criticalThreshold: e.criticalThreshold,
          damageType: l,
          attackType: n
        },
        !1,
        {}
      );
    });
    return {
      id: e.weaponId,
      name: e.name,
      image: e.img || "icons/svg/sword.svg",
      isWeapon: !0,
      isEquipped: e.isEquipped,
      profiles: t
    };
  }
  async equipWeapon(e, t) {
    const a = [];
    a.push({ _id: e, system: { weapon: { isEquipped: t } } }), await this.updateEmbeddedDocuments("Item", a);
  }
  async equipArmour(e, t) {
    const a = [];
    a.push({ _id: e, system: { armour: { isEquipped: t } } }), await this.updateEmbeddedDocuments("Item", a);
  }
  _prepareAbilityModifiers(e) {
    for (let [t, a] of Object.entries(e.abilities))
      a.mod = Math.floor(a.value / 2);
  }
  _prepareMovement(e) {
    const t = e.abilities.agility.mod, a = e.anatomy.filter((r) => r.system.tagsArray.includes("primary")).length;
    e.movement.base = t * a;
  }
  _prepareArmour(e) {
    e.armours = this.itemTypes.item.filter((n) => n.system.isArmour);
    let t = this.itemTypes.anatomy.map((n) => n.system.armourBonus);
    const a = foundry.utils.getProperty(this, this.system.naturalArmour);
    t = t.map((n) => (n === "natural" && (n = a), n));
    const r = 0, o = t.map((n) => +n).reduce((n, c) => n + c, r);
    e.armour.max = o;
    const l = e.armour.defences.replaceAll(" ", "").split(",");
    e.armour.defencesArray = l;
  }
  _preparePower(e) {
    const t = this._sumValues(e);
    e.attributes.power.value = t;
  }
  _prepareActions(e) {
    e.actions = { current: 3, maximum: 3 };
  }
  // TODO: Generalise or change
  _sumValues(e) {
    return Object.values(e.abilities).reduce(function(t, a) {
      return t += a.value;
    }, 0);
  }
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(e) {
    if (e.type !== "npc")
      return;
    const t = e.system;
    t.xp = t.cr * t.cr * 100;
  }
  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const e = super.getRollData();
    return this._getCharacterRollData(e), this._getNpcRollData(e), e;
  }
  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(e) {
    if (this.type === "character") {
      if (e.abilities)
        for (let [t, a] of Object.entries(e.abilities))
          e[t] = foundry.utils.deepClone(a);
      e.attributes.level && (e.lvl = e.attributes.level.value ?? 0);
    }
  }
  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(e) {
    this.type;
  }
  async acceptDamage(e, t) {
    const a = this, r = this.system;
    let o = e[0]._total, l = e[0], n = t.attackProfile.weapon.penetration, c = r.armour.value, m = c;
    const p = t.attackProfile.weapon.damageType;
    if (!r.defences[p]) {
      const g = await this.getCriticalExplosions(l, 0, 0);
      await this.handleDamage(r, o, "untyped", g);
    }
    const h = r.defences[p];
    if (h.absorb) {
      await this.absorbDamage(a, r, o);
      return;
    }
    if (h.immune)
      return;
    h.deflect && h.conduct || (h.deflect ? o = await this.deflectDamage(l) : h.conduct && (o = await this.conductDamage(l)));
    let b = await this.getCriticalExplosions(l, h.vulnerable, h.negate);
    if (r.armour.defencesArray.includes(p)) {
      const g = h.penetrate + n, C = h.block - g, R = o, _ = c + C - o;
      if (_ < 0 ? o = Math.min(Math.abs(_), R) : o = 0, g < c + h.block) {
        const P = c + C, j = Math.min(P, R);
        m = c - j;
      } else
        m = c;
    }
    let f = {};
    o > 0 && (f = await this.handleDamage(r, o, p, b, t.attackProfile)), f["system.armour.value"] = m, await a.update(f);
  }
  async absorbDamage(e, t, a) {
    let r = t.blood.value;
    r = Math.min(r + a, t.blood.fullMax);
    const o = Math.max(r, t.blood.max);
    await e.update({ "system.blood.value": r, "system.blood.max": o });
  }
  async deflectDamage(e) {
    const t = e.terms[0].rolls[0].terms[0].results.reduce((a, r) => a + r.result, 0);
    return e.total - t;
  }
  async conductDamage(e) {
    const t = e.terms[0].rolls[0].terms[0].results.reduce((o, l) => o + l.result, 0), r = e.terms[0].rolls[0].terms[0].results.length * 10 - t;
    return e.total + r;
  }
  async getCriticalExplosions(e, t, a) {
    const r = +e.terms[0].rolls[0].terms[0].modifiers[0].split("=")[1];
    return e.terms[0].rolls[0].terms[0].results.filter((l) => l.result >= r).length - a + t;
  }
  async handleDamage(e, t, a, r, o) {
    if (a === "heat")
      return await this.handleHeat(e, t, r, o);
    if (["crushing", "slashing", "piercing", "untyped"].includes(a))
      return await this.handlePhysical(e, t, r, o);
  }
  async handleHeat(e, t, a, r) {
    e.wounds.healing += t, e.state += r.thermalChange;
    const o = { "system.wounds.healing": t };
    if (a) {
      let l = e.blood.value -= t, n = e.blood.max -= t;
      o["system.blood.current"] = l, o["system.blood.max"] = n;
    }
    return o;
  }
  async handlePhysical(e, t, a, r) {
    const o = {};
    if (e.canBleed) {
      let l = e.wounds.active += t;
      o["system.wounds.active"] = l;
    }
    if (e.suffersPain) {
      const l = e.pain += t;
      o["system.pain"] = l;
    }
    if (a)
      switch (r.weapon.damageType) {
        case "crushing":
          await this.handleCrushingCritical(o, t, a);
          break;
        case "slashing":
          await this.handleSlashingCritical(o, t, a);
          break;
        case "piercing":
          await this.handlePiercingCritical(o, t, a);
          break;
      }
    return o;
  }
  async handleCrushingCritical(e, t, a) {
    e["system.conditions.sundered"] = t;
  }
  async handleSlashingCritical(e, t, a) {
    e["system.wounds.active"] += t;
  }
  async handlePiercingCritical(e, t, a) {
    e["system.conditions.gushingWounds"] = a;
  }
}
class k extends Item {
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
    const s = this.actor.getRollData();
    return s.item = foundry.utils.deepClone(this.system), s;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const s = this, e = ChatMessage.getSpeaker({ actor: this.actor }), t = game.settings.get("core", "rollMode"), a = `[${s.type}] ${s.name}`;
    if (!this.system.formula)
      ChatMessage.create({
        speaker: e,
        rollMode: t,
        flavor: a,
        content: s.system.description ?? ""
      });
    else {
      const r = this.getRollData(), o = new Roll(r.item.formula, r);
      return o.toMessage({
        speaker: e,
        rollMode: t,
        flavor: a
      }), o;
    }
  }
  async use(s = {}, e = {}) {
    let t = this;
    return t.system, t.actor.system, e = foundry.utils.mergeObject({
      configureDialog: !0,
      createMessage: !0,
      "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
    }, e), await this.displayCard(e);
  }
  async displayCard(s = {}) {
    const e = this.actor.token, t = {
      actor: this.actor,
      tokenId: (e == null ? void 0 : e.uuid) || null,
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
    }, a = await renderTemplate("systems/abbrew/templates/chat/item-card.hbs", t), r = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: a,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token: e }),
      flags: { "core.canPopout": !0 }
    };
    r.flags = foundry.utils.mergeObject(r.flags, s.flags), Hooks.callAll("abbrew.preDisplayCard", this, r, s);
    const o = s.createMessage !== !1 ? await ChatMessage.create(r) : r;
    return Hooks.callAll("abbrew.displayCard", this, o), o;
  }
  async getChatData(s = {}) {
    const e = this.toObject().system;
    this.labels, e.description = await TextEditor.enrichHTML(e.description, {
      async: !0,
      relativeTo: this,
      rollData: this.getRollData(),
      ...s
    });
    const t = [];
    return e.properties = t.filter((a) => !!a), e;
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */
  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners(s) {
    s.on("click", ".card-buttons button", this._onChatCardAction.bind(this)), s.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }
  static async _onChatCardAction(s) {
    s.preventDefault();
    const e = s.currentTarget;
    e.disabled = !0;
    const t = e.closest(".chat-card"), a = t.closest(".message").dataset.messageId, r = game.messages.get(a), o = e.dataset.action, l = await this._getChatCardActor(t);
    if (!l || !(o === "contest" || game.user.isGM || l.isOwner))
      return;
    const c = r.getFlag("abbrew", "itemData"), m = c ? new this(c, { parent: l }) : l.items.get(t.dataset.itemId);
    if (!m) {
      const p = game.i18n.format("ABBREW.ActionWarningNoItem", { item: t.dataset.itemId, name: l.name });
      return ui.notifications.error(p);
    }
    await m.rollAttack({ event: s }), e.disabled = !1;
  }
  async rollAttack(s = {}) {
    const { rollData: e, parts: t } = this.getAttack();
    let a = `${this.name} - ${game.i18n.localize("ABBREW.AttackRoll")}`;
    e.mod = 10;
    const r = foundry.utils.mergeObject({
      actor: this.actor,
      data: e,
      critical: this.getCriticalThreshold(),
      title: a,
      flavor: a,
      dialogOptions: {
        width: 400,
        top: s.event ? s.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {
        "flags.abbrew.roll": { type: "attack", itemId: this.id, itemUuid: this.uuid },
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      }
    }, s);
    return r.parts = t.concat(s.parts ?? []), await O(r);
  }
  // TODO: Allow to change
  getCriticalThreshold() {
    return 10;
  }
  // TODO: Check this is needed
  getAttack() {
    return { rollData: this.getRollData(), parts: [] };
  }
  async update(s = {}, e = {}) {
    console.log("update item"), super.update(s, e);
  }
  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(s) {
    s.preventDefault();
    const a = s.currentTarget.closest(".chat-card").querySelector(".card-content");
    a.style.display = a.style.display === "none" ? "block" : "none";
  }
  /**
  * Get the Actor which is the author of a chat card
  * @param {HTMLElement} card    The chat card being used
  * @returns {Actor|null}        The Actor document or null
  * @private
  */
  static async _getChatCardActor(s) {
    if (s.dataset.tokenId) {
      const t = await fromUuid(s.dataset.tokenId);
      return t ? t.actor : null;
    }
    const e = s.dataset.actorId;
    return game.actors.get(e) || null;
  }
  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor[]}            An Array of Actor documents, if any
   * @private
   */
  static _getChatCardTargets(s) {
    let e = canvas.tokens.controlled.filter((t) => !!t.actor);
    return !e.length && game.user.character && (e = e.concat(game.user.character.getActiveTokens())), e.length || ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken")), e;
  }
}
async function Z(i, s, e) {
}
function W(i, s) {
  i.preventDefault();
  const e = i.currentTarget, t = e.closest("li"), a = t.dataset.effectId ? s.effects.get(t.dataset.effectId) : null;
  switch (e.dataset.action) {
    case "create":
      return s.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        source: s.uuid,
        "duration.rounds": t.dataset.effectType === "temporary" ? 1 : void 0,
        disabled: t.dataset.effectType === "inactive"
      }]);
    case "edit":
      return a.sheet.render(!0);
    case "delete":
      return a.delete();
    case "toggle":
      return a.update({ disabled: !a.disabled });
  }
}
function M(i) {
  const s = {
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
  for (let e of i)
    e._getSourceName(), e.disabled ? s.inactive.effects.push(e) : e.isTemporary ? s.temporary.effects.push(e) : s.passive.effects.push(e);
  return s;
}
class ee extends ActorSheet {
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
    const s = super.getData(), e = this.actor.toObject(!1);
    return s.system = e.system, s.flags = e.flags, e.type == "character" && (this._prepareItems(s), this._prepareCharacterData(s), this._prepareAttacks(s), this._prepareArmours(s), s.displayConditions = e.system.displayConditions), e.type == "npc" && this._prepareItems(s), s.rollData = s.actor.getRollData(), s.effects = M(this.actor.effects), s;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(s) {
    for (let [e, t] of Object.entries(s.system.abilities))
      t.label = game.i18n.localize(CONFIG.ABBREW.abilities[e]) ?? e;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(s) {
    const e = [], t = [], a = [], r = [], o = [], l = {
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
    for (let n of s.items)
      n.img = n.img || DEFAULT_TOKEN, n.type === "anatomy" ? e.push(n) : n.type === "resource" ? t.push(n) : n.type === "item" ? r.push(n) : n.type === "feature" ? o.push(n) : n.type === "ability" ? a.push(n) : n.type === "spell" && n.system.spellLevel != null && l[n.system.spellLevel].push(n);
    s.resource = t, s.gear = r, s.features = o, s.spells = l, s.anatomy = e, s.ability = a;
  }
  /* -------------------------------------------- */
  _prepareAttacks(s) {
    s.attacks = s.system.attacks;
  }
  /* -------------------------------------------- */
  _prepareArmours(s) {
    s.armours = s.system.armours;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(s) {
    if (super.activateListeners(s), s.find(".item-edit").click((e) => {
      const t = $(e.currentTarget).parents(".item");
      this.actor.items.get(t.data("itemId")).sheet.render(!0);
    }), !!this.isEditable && (s.find(".conditions-header").click(async (e) => {
      super.getData(), await this.actor.update({ "system.displayConditions": !this.actor.system.displayConditions });
    }), s.find(".item-create").click(this._onItemCreate.bind(this)), s.find(".item-delete").click((e) => {
      const t = $(e.currentTarget).parents(".item");
      this.actor.items.get(t.data("itemId")).delete(), t.slideUp(200, () => this.render(!1));
    }), s.find(".effect-control").click((e) => W(e, this.actor)), s.find(".rollable .item-image").click(this._onItemUse.bind(this)), s.find(".equip-weapon").click(this._equipWeapon.bind(this)), s.find(".rollable.attack").click(this._onAttackUse.bind(this)), s.find(".equip-armour").click(this._equipArmour.bind(this)), this.actor.isOwner)) {
      let e = (t) => this._onDragStart(t);
      s.find("li.item").each((t, a) => {
        a.classList.contains("inventory-header") || (a.setAttribute("draggable", !0), a.addEventListener("dragstart", e, !1));
      });
    }
  }
  async _equipWeapon(s) {
    s.preventDefault();
    const e = s.target.dataset, t = e.weaponid, a = e.equip === "true";
    await this.actor.equipWeapon(t, a);
  }
  async _equipArmour(s) {
    s.preventDefault();
    const e = s.target.dataset, t = e.armourid, a = e.equip === "true";
    await this.actor.equipArmour(t, a);
  }
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(s) {
    s.preventDefault();
    const e = s.currentTarget, t = e.dataset.type;
    if (t === "ability" && this.actor.system.IP.current + 1 > this.actor.system.IP.total) {
      const r = game.i18n.format("ABBREW.InspirationPointsExceededWarn", { max: this.actor.system.IP.total });
      return ui.notifications.error(r);
    }
    const a = {
      name: game.i18n.format("ABBREW.ItemNew", { type: game.i18n.localize(`ITEM.Type${t.capitalize()}`) }),
      type: t,
      system: { ...e.dataset.type }
    };
    return delete a.system.type, this.actor.createEmbeddedDocuments("Item", [a]);
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemUse(s) {
    s.preventDefault(), s.currentTarget.dataset, this.actor, Z();
    const t = s.currentTarget.closest(".item").dataset.itemId;
    return this.actor.items.get(t).use({}, { event: s });
  }
  async _onAttackUse(s) {
    s.preventDefault(), console.log(s);
    const e = s.target.dataset, t = this.actor.system.attacks.filter((r) => r.id === e.attack)[0], a = t.profiles.flat().filter((r) => r.id === +e.attackprofile)[0];
    V(t, a, this.actor);
  }
}
class y extends ItemSheet {
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
    var a;
    const s = super.getData(), e = s.item;
    s.rollData = {};
    let t = ((a = this.object) == null ? void 0 : a.parent) ?? null;
    return t && (s.rollData = t.getRollData()), s.effects = M(this.item.effects), s.system = e.system, s.flags = e.flags, s;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(s) {
    super.activateListeners(s), this.isEditable && (s.find(".effect-control").click((e) => W(e, this.item)), s.find(".rule-control").click(async (e) => await Y(e, this.item)));
  }
  async _updateObject(s, e) {
    s.handleObj && s.handleObj.type == "change" && (s.currentTarget ? await this.manualUpdate(s, e) : super._updateObject(s, e)), console.log("form submit prevented");
  }
  async manualUpdate(s, e) {
    const t = s.currentTarget;
    if (t.classList.contains("rule-editor")) {
      const a = t.dataset, r = a.ruleId, o = a.field, l = e[t.name];
      let n = foundry.utils.deepClone(this.item.system.rules);
      const c = n.findIndex((m) => m.id == r);
      return n[c][o] = l, o == "type" && (n[c].content = T[l].template()), await this.item.update({
        "system.rules": n
      });
    } else
      super._updateObject(s, e);
  }
  close(s = {}) {
    console.log("closing sheet"), this.getData(), super.close(s);
  }
}
class te extends y {
  /** @override */
  activateListeners(s) {
    super.activateListeners(s);
  }
  /** @override */
  get template() {
    return "systems/abbrew/templates/item/item-anatomy-sheet.hbs";
  }
}
const se = async function() {
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
class v extends Roll {
  constructor(s, e, t) {
    super(s, e, t), this.options.configured || this._configureModifiers();
  }
  static async fromRoll(s) {
    const e = new this(s.formula, s.data, s.options);
    return await e.evaluate({ async: !0 }), e;
  }
  get validD10Roll() {
    return this.terms[0].rolls[0].terms[0] instanceof Die && this.terms[0].rolls[0].terms[0].faces === 10;
  }
  async render(s, e, t) {
    return e = this.CHAT_TEMPLATE, super.render(s, e, t);
  }
  /** @inheritdoc */
  async toMessage(s = {}, e = {}) {
    if (this.validD10Roll)
      return this._evaluated || await this.evaluate({ async: !0 }), e.rollMode = e.rollMode ?? this.options.rollMode, super.toMessage(s, e);
  }
  async configureDialog({ title: s, template: e } = {}, t = {}) {
    const a = await renderTemplate(e ?? this.constructor.EVALUATION_TEMPLATE, {
      formula: "d10!"
    });
    let r = "normal";
    return new Promise((o) => {
      new Dialog({
        title: s,
        content: a,
        buttons: {
          advantage: {
            label: "1",
            callback: (l) => o(this._onDialogSubmit(
              l
              /* , D20Roll.ADV_MODE.ADVANTAGE */
            ))
          },
          normal: {
            label: "2",
            callback: (l) => o(this._onDialogSubmit(
              l
              /* , D20Roll.ADV_MODE.NORMAL */
            ))
          },
          disadvantage: {
            label: "3",
            callback: (l) => o(this._onDialogSubmit(
              l
              /* , D20Roll.ADV_MODE.DISADVANTAGE */
            ))
          }
        },
        default: r,
        close: () => o(null)
      }, t).render(!0);
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
  _onDialogSubmit(s, e) {
    const t = s[0].querySelector("form");
    if (t.weakOrStrong.value) {
      const a = t.weakOrStrong.value;
      a < 0 ? (this.options.weak = !0, this.options.weakValue = Math.abs(a)) : a > 0 && (this.options.strong = !0, this.options.strongValue = Math.abs(a));
    }
    return this._configureModifiers(), this;
  }
  _configureModifiers() {
    const s = this.terms[0].rolls[0];
    this.options.weak && (s.terms[4].number += this.options.weakValue), this.options.strong && (s.terms[0].number += this.options.strongValue), this._formula = this.constructor.getFormula(this.terms), this.options.configured = !0;
  }
}
u(v, "EVALUATION_TEMPLATE", "systems/abbrew/templates/chat/roll-dialog.hbs"), u(v, "CHAT_TEMPLATE", "systems/abbrew/templates/chat/damage-roll.hbs");
async function E(i, s, e) {
  if (s.round < i.round || s.round == i.round && s.turn < i.turn)
    return;
  let t = i.current.combatantId ? i.nextCombatant.actor : i.turns[0].actor;
  await ae(t);
}
async function ae(i) {
  if (ChatMessage.create({ content: `${i.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor: i }) }), i.system.canBleed) {
    let t = i.system.wounds.active;
    console.log(t);
    let a = i.system.blood.value;
    console.log(a);
    let r = 0;
    t === 0 && await i.update({ "system.conditions.gushingWounds": 0 }), i.system.conditions.gushingWounds > 0 && (r = i.system.conditions.gushingWounds * 5);
    let o = i.system.conditions.bleedPrevention;
    if (o > 0) {
      let n = i.system.wounds.healing + o;
      await i.update({ "system.wounds.healing": n });
    }
    let l = a - (t + r - o);
    console.log(l), await i.update({ "system.blood.value": l }), l <= i.system.blood.nausea ? await i.update({ "system.conditions.nausea": 1 }) : await i.update({ "system.conditions.nausea": 0 }), l <= i.system.blood.unconscious ? await i.update({ "system.conditions.unconscious": 1 }) : await i.update({ "system.conditions.unconscious": 0 });
  }
  let s = i.system.armour, e = s.value;
  if (console.log("Armour: ", s), s.value < s.max) {
    e:
      if (i.effects.find((t) => t.label === "Regenerating")) {
        if (console.log("Check for regain Armour"), i.effects.find((r) => r.label === "Weakened")) {
          console.log("Exposed so no armour regained");
          break e;
        }
        let t = 1;
        i.effects.find((r) => r.label === "Cursed") && (t = 0.5), console.log("Regain Armour");
        let a = s.max - s.value;
        console.log("Missing Armour: ", a), e = s.value + Math.max(Math.floor(a * t / 2), 1), console.log("newArmour", e);
      }
  } else
    e = s.max;
  await i.update({ "system.armour.value": e });
}
Hooks.once("init", async function() {
  Handlebars.registerHelper("json", function(s) {
    return JSON.stringify(s);
  }), game.abbrew = {
    AbbrewActor: B,
    AbbrewItem: k,
    rollItemMacro: ie
  }, CONFIG.ABBREW = d, CONFIG.Combat.initiative = {
    formula: "1d10 + @abilities.dexterity.mod + @abilities.agility.mod + @abilities.wits.mod",
    decimals: 2
  }, CONFIG.Dice.AbbrewRoll = v, CONFIG.Dice.rolls.push(v), CONFIG.Actor.documentClass = B, CONFIG.Item.documentClass = k, Actors.unregisterSheet("core", ActorSheet), Actors.registerSheet("abbrew", ee, { makeDefault: !0 }), Items.unregisterSheet("core", ItemSheet);
  const i = [
    ["anatomy", te],
    ["item", y],
    ["feature", y],
    ["spell", y],
    ["resource", y],
    ["attack", y],
    ["defence", y]
  ];
  for (const [s, e] of i)
    Items.registerSheet("abbrew", e, {
      types: [s],
      label: game.i18n.localize(d.SheetLabel, { type: s }),
      makeDefault: !0
    });
  return se();
});
Hooks.on("pauseGame", async function(i) {
  const s = game.actors.get("rLEUu5Vg7QCj59dE");
  console.log("paused");
  const a = { content: { promptTitle: "Hello", choices: s.items.map((o) => ({ id: o._id, name: o.name })) }, buttons: {} }, r = await new S(a).resolveSelection();
  console.log(r);
});
Handlebars.registerHelper("concat", function() {
  var i = "";
  for (var s in arguments)
    typeof arguments[s] != "object" && (i += arguments[s]);
  return i;
});
Handlebars.registerHelper("toLowerCase", function(i) {
  return i.toLowerCase();
});
Handlebars.registerHelper("isNumber", function(i) {
  return typeof i == "number";
});
Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (i, s, e) => re(s, e));
});
async function re(i, s) {
  if (i.type !== "Item")
    return;
  if (!i.uuid.includes("Actor.") && !i.uuid.includes("Token."))
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  const e = await Item.fromDropData(i), t = `game.abbrew.rollItemMacro("${i.uuid}");`;
  let a = game.macros.find((r) => r.name === e.name && r.command === t);
  return a || (a = await Macro.create({
    name: e.name,
    type: "script",
    img: e.img,
    command: t,
    flags: { "abbrew.itemMacro": !0 }
  })), game.user.assignHotbarMacro(a, s), !1;
}
function ie(i) {
  const s = {
    type: "Item",
    uuid: i
  };
  Item.fromDropData(s).then((e) => {
    if (!e || !e.parent) {
      const t = (e == null ? void 0 : e.name) ?? i;
      return ui.notifications.warn(`Could not find item ${t}. You may need to delete and recreate this macro.`);
    }
    e.roll();
  });
}
Hooks.on("renderChatLog", (i, s, e) => k.chatListeners(s));
Hooks.on("abbrew.ability", function(i) {
  console.log("Hooked on " + i);
});
Hooks.once("dragRuler.ready", (i) => {
  class s extends i {
    get colors() {
      return [
        { id: "walk", default: 65280, name: "abbrew.speeds.walk" },
        { id: "dash", default: 16776960, name: "abbrew.speeds.dash" },
        { id: "run", default: 16744448, name: "abbrew.speeds.run" }
      ];
    }
    getRanges(t) {
      const a = t.actor.system.movement.base;
      return [
        { range: a, color: "walk" },
        { range: a * 2, color: "dash" },
        { range: a * 3, color: "run" }
      ];
    }
  }
  dragRuler.registerSystem("abbrew", s);
});
Hooks.on("combatStart", async (i, s, e) => {
  await E(i, s);
});
Hooks.on("combatRound", async (i, s, e) => {
  await E(i, s);
});
Hooks.on("combatTurn", async (i, s, e) => {
  await E(i, s);
});
Hooks.on("updateActor", (i) => {
  console.log("ActorUpdated");
});
Hooks.on("updateToken", (i) => {
  console.log("TokenUpdated");
});
//# sourceMappingURL=abbrew.mjs.map
