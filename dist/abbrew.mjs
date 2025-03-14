var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __publicField = (obj, key2, value) => {
  __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);
  return value;
};
function applyOperator(base, value, operator) {
  switch (operator) {
    case "add":
      return base += value;
    case "equal":
      return value;
    default:
      return base;
  }
}
async function handleCombatStart(combatants) {
  for (const index in combatants) {
    const combatant = combatants[index];
    const actor = game.actors.get(combatant.actorId);
    await actor.update({ "system.actions": [5] });
  }
}
async function handleTurnStart(prior, current, priorActor, currentActor) {
  if (current.round < prior.round || prior.round == current.round && current.turn < prior.turn) {
    return;
  }
  if (priorActor) {
    await turnEnd(priorActor);
  }
  await turnStart(currentActor);
}
function mergeActorWounds(actor, incomingWounds) {
  return mergeActorWoundsWithOperator(actor, incomingWounds, "add");
}
function mergeActorWoundsWithOperator(actor, incomingWounds, operator) {
  const wounds = actor.system.wounds;
  return mergeWoundsWithOperator(wounds, incomingWounds, operator);
}
function mergeWoundsWithOperator(wounds, incomingWounds, operator) {
  const result = [...wounds, ...incomingWounds].reduce((a, { type, value }) => ({ ...a, [type]: a[type] ? { type, value: applyOperator(a[type].value, value, operator) } : { type, value } }), {});
  return Object.values(result).filter((v) => v.value > 0);
}
async function updateActorWounds(actor, updateWounds) {
  await actor.update({ "system.wounds": updateWounds });
}
async function checkActorFatalWounds(actor) {
  if (actor.system.defense.fatalWounds) {
    const fatalWounds = JSON.parse(actor.system.defense.fatalWounds).map((w) => w.value.toLowerCase());
    const activeFatalWounds = actor.system.wounds.filter((w) => fatalWounds.includes(w.type));
    const totalActiveFatalWounds = activeFatalWounds.reduce((result, wound) => result += wound.value, 0);
    if (totalActiveFatalWounds >= actor.system.defense.resolve.max) {
      await setActorToDead(actor);
    }
  }
}
async function handleActorGuardConditions(actor) {
  if (actor.system.defense.guard.value <= 0) {
    await setActorToGuardBreak(actor);
  } else if (actor.effects.toObject().find((e) => e.name === "Guard Break")) {
    const id = actor.effects.toObject().find((e) => e.name === "Guard Break")._id;
    await actor.deleteEmbeddedDocuments("ActiveEffect", [id]);
  }
}
async function handleActorWoundConditions(actor) {
  const updatedWoundTotal = actor.system.wounds.reduce((total, wound) => total += wound.value, 0);
  if (actor.system.defense.resolve.value <= updatedWoundTotal) {
    await renderLostResolveCard(actor);
  }
  await checkActorFatalWounds(actor);
}
async function renderLostResolveCard(actor) {
  if (actor.statuses.has("defeated")) {
    return;
  }
  const templateData = {
    actor
  };
  await setActorToDefeated(actor);
  const html = await renderTemplate("systems/abbrew/templates/chat/lost-resolve-card.hbs", templateData);
  const speaker = ChatMessage.getSpeaker({ actor });
  ChatMessage.create({
    speaker,
    content: html
  });
}
async function setActorCondition(actor, conditionName) {
  const condition = CONFIG.ABBREW.conditions[conditionName];
  const statusSet = new Set(condition.statuses);
  if (statusSet.difference(actor.statuses).size) {
    const conditionEffectData = {
      _id: actor._id,
      name: game.i18n.localize(condition.name),
      img: condition.img,
      changes: [],
      disabled: false,
      duration: {},
      description: game.i18n.localize(condition.description),
      origin: actor._id,
      tint: "",
      transfer: false,
      statuses: statusSet,
      flags: {}
    };
    await actor.createEmbeddedDocuments("ActiveEffect", [conditionEffectData]);
    console.log(`${actor.name} gained ${conditionName}`);
  }
}
async function setActorToDefeated(actor) {
  setActorCondition(actor, "defeated");
}
async function setActorToDead(actor) {
  setActorCondition(actor, "dead");
}
async function setActorToGuardBreak(actor) {
  setActorCondition(actor, "guardBreak");
}
async function turnEnd(actor) {
  await actor.update({ "system.actions": 5 });
}
async function turnStart(actor) {
  if (game.settings.get("abbrew", "announceTurnStart")) {
    ChatMessage.create({ content: `${actor.name} starts their turn`, speaker: ChatMessage.getSpeaker({ actor }) });
  }
  const lingeringWoundTypes = foundry.utils.deepClone(CONFIG.ABBREW.lingeringWoundTypes);
  const woundToLingeringWounds = foundry.utils.deepClone(CONFIG.ABBREW.woundToLingeringWounds);
  const lingeringWoundImmunities = actor.system.traitsData.filter((t) => t.feature === "wound" && t.subFeature === "lingeringWound" && t.effect === "immunity").map((t) => t.data);
  const activeLingeringWounds = actor.system.wounds.filter((w) => lingeringWoundTypes.some((lw) => w.type === lw)).filter((w) => !lingeringWoundImmunities.includes(w.type));
  if (activeLingeringWounds.length > 0) {
    const appliedLingeringWounds = {};
    activeLingeringWounds.flatMap((lw) => woundToLingeringWounds[lw.type].map((lwt) => ({ type: lwt, value: lw.value }))).reduce((appliedLingeringWounds2, wound) => {
      if (wound.type in appliedLingeringWounds2) {
        appliedLingeringWounds2[wound.type] += wound.value;
      } else {
        appliedLingeringWounds2[wound.type] = wound.value;
      }
      return appliedLingeringWounds2;
    }, appliedLingeringWounds);
    const acuteWounUpdate = Object.entries(appliedLingeringWounds).map((alw) => ({ type: alw[0], value: alw[1] }));
    const lingeringWoundUpdate = activeLingeringWounds.flatMap((lw) => actor.system.wounds.filter((w) => w.type === lw.type).map((w) => ({ type: w.type, value: getLingeringWoundValueUpdate(w.value) })));
    const fullWoundUpdate = [...acuteWounUpdate, ...lingeringWoundUpdate];
    if (fullWoundUpdate.length > 0) {
      await updateActorWounds(actor, mergeActorWounds(actor, fullWoundUpdate));
    }
  }
}
function getLingeringWoundValueUpdate(woundValue) {
  return woundValue > 1 ? -1 : 0;
}
function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [
        {
          name: game.i18n.format("DOCUMENT.New", {
            type: game.i18n.localize("DOCUMENT.ActiveEffect")
          }),
          img: "icons/svg/aura.svg",
          origin: owner.uuid,
          "duration.rounds": li.dataset.effectType === "temporary" ? 1 : void 0,
          disabled: li.dataset.effectType === "inactive"
        }
      ]);
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
      label: game.i18n.localize("ABBREW.Effect.Temporary"),
      effects: []
    },
    passive: {
      type: "passive",
      label: game.i18n.localize("ABBREW.Effect.Passive"),
      effects: []
    },
    inactive: {
      type: "inactive",
      label: game.i18n.localize("ABBREW.Effect.Inactive"),
      effects: []
    }
  };
  for (let e of effects) {
    if (e.disabled)
      categories.inactive.effects.push(e);
    else if (e.isTemporary)
      categories.temporary.effects.push(e);
    else
      categories.passive.effects.push(e);
  }
  return categories;
}
function staticID(id) {
  if (id.length >= 16)
    return id.substring(0, 16);
  return id.padEnd(16, "0");
}
function doesNestedFieldExist(obj, props) {
  var splited = props.split(".");
  var temp = obj;
  for (var index in splited) {
    if (typeof temp[splited[index]] === "undefined")
      return false;
    temp = temp[splited[index]];
  }
  return true;
}
function arrayDifference(a, b) {
  return [...b.reduce(
    (acc, v) => acc.set(v, (acc.get(v) || 0) - 1),
    a.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), /* @__PURE__ */ new Map())
  )].reduce((acc, [v, count]) => acc.concat(Array(Math.abs(count)).fill(v)), []);
}
function getObjectValueByStringPath(entity, path) {
  return path.split(".").reduce(function(o, k) {
    return o && o[k];
  }, entity);
}
function getNumericParts(value) {
  return parseInt(value.replace(/\D/g, "")) ?? 0;
}
async function activateSkill(actor, skill) {
  let updates = {};
  if (skill.action.modifiers.guard.self.value) {
    const rawValue = skill.action.modifiers.guard.self.value;
    const value = isNumeric(rawValue) ? parseInt(rawValue) : parsePath(rawValue, actor);
    const skilledGuard = applySkillsForGuard(value, actor);
    const guard = applyOperator(
      actor.system.defense.guard.value,
      skilledGuard,
      skill.action.modifiers.guard.self.operator
    );
    updates["system.defense.guard.value"] = guard;
  }
  if (skill.action.modifiers.wounds.self.length > 0) {
    let updateWounds = actor.system.wounds;
    skill.action.modifiers.wounds.self.filter((w) => w.value && w.type && w.operator).forEach((w) => updateWounds = mergeWoundsWithOperator(updateWounds, [{ type: w.type, value: w.value }], w.operator));
    updates["system.wounds"] = updateWounds;
  }
  await actor.update(updates);
}
function isNumeric(str) {
  if (typeof str != "string")
    return false;
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  !isNaN(parseFloat(str));
}
function parsePath(rawValue, actor) {
  const entityType = rawValue.split(".").slice(0, 1).shift();
  const entity = function() {
    switch (entityType) {
      case "actor":
        return actor;
      case "item":
        const id = rawValue.split(".").slice(1, 2).shift();
        return id ? actor.items.filter((i) => i._id === id).shift() : actor;
    }
  }();
  const path = function() {
    switch (entityType) {
      case "actor":
        return rawValue.split(".").slice(1).join(".");
      case "item":
        return rawValue.split(".").slice(2).join(".");
    }
  }();
  if (getObjectValueByStringPath(entity, path)) {
    return getObjectValueByStringPath(entity, path);
  }
}
function applySkillsForGuard(value, actor) {
  let skilledValue = value;
  const skillFlags = actor.items.filter((i) => i.type === "skill").filter((i) => i.system.skillFlags).flatMap((i) => JSON.parse(i.system.skillFlags).map((ap) => ap.value));
  if (skillFlags.includes("Shield Training")) {
    const heldArmour = actor.getActorHeldItems().filter((i) => i.type === "armour").reduce((result, a) => result += a.system.defense.guard, 0);
    skilledValue += heldArmour;
  }
  return skilledValue;
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var tagify_min = { exports: {} };
(function(module, exports) {
  !function(t, e) {
    module.exports = e();
  }(commonjsGlobal, function() {
    var t = "&#8203;";
    function e(t2, e2) {
      (null == e2 || e2 > t2.length) && (e2 = t2.length);
      for (var i2 = 0, n2 = new Array(e2); i2 < e2; i2++)
        n2[i2] = t2[i2];
      return n2;
    }
    function i(t2) {
      return function(t3) {
        if (Array.isArray(t3))
          return e(t3);
      }(t2) || function(t3) {
        if ("undefined" != typeof Symbol && null != t3[Symbol.iterator] || null != t3["@@iterator"])
          return Array.from(t3);
      }(t2) || function(t3, i2) {
        if (!t3)
          return;
        if ("string" == typeof t3)
          return e(t3, i2);
        var n2 = Object.prototype.toString.call(t3).slice(8, -1);
        "Object" === n2 && t3.constructor && (n2 = t3.constructor.name);
        if ("Map" === n2 || "Set" === n2)
          return Array.from(n2);
        if ("Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2))
          return e(t3, i2);
      }(t2) || function() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }();
    }
    var n = { isEnabled: function() {
      var t2;
      return null === (t2 = window.TAGIFY_DEBUG) || void 0 === t2 || t2;
    }, log: function() {
      for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++)
        e2[n2] = arguments[n2];
      var s2;
      this.isEnabled() && (s2 = console).log.apply(s2, ["[Tagify]:"].concat(i(e2)));
    }, warn: function() {
      for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++)
        e2[n2] = arguments[n2];
      var s2;
      this.isEnabled() && (s2 = console).warn.apply(s2, ["[Tagify]:"].concat(i(e2)));
    } }, s = function(t2, e2, i2, n2) {
      return t2 = "" + t2, e2 = "" + e2, n2 && (t2 = t2.trim(), e2 = e2.trim()), i2 ? t2 == e2 : t2.toLowerCase() == e2.toLowerCase();
    }, a = function(t2, e2) {
      return t2 && Array.isArray(t2) && t2.map(function(t3) {
        return o(t3, e2);
      });
    };
    function o(t2, e2) {
      var i2, n2 = {};
      for (i2 in t2)
        e2.indexOf(i2) < 0 && (n2[i2] = t2[i2]);
      return n2;
    }
    function r(t2) {
      var e2 = document.createElement("div");
      return t2.replace(/\&#?[0-9a-z]+;/gi, function(t3) {
        return e2.innerHTML = t3, e2.innerText;
      });
    }
    function l(t2) {
      return new DOMParser().parseFromString(t2.trim(), "text/html").body.firstElementChild;
    }
    function d(t2, e2) {
      for (e2 = e2 || "previous"; t2 = t2[e2 + "Sibling"]; )
        if (3 == t2.nodeType)
          return t2;
    }
    function c(t2) {
      return "string" == typeof t2 ? t2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/`|'/g, "&#039;") : t2;
    }
    function u(t2) {
      var e2 = Object.prototype.toString.call(t2).split(" ")[1].slice(0, -1);
      return t2 === Object(t2) && "Array" != e2 && "Function" != e2 && "RegExp" != e2 && "HTMLUnknownElement" != e2;
    }
    function g(t2, e2, i2) {
      var n2, s2;
      function a2(t3, e3) {
        for (var i3 in e3)
          if (e3.hasOwnProperty(i3)) {
            if (u(e3[i3])) {
              u(t3[i3]) ? a2(t3[i3], e3[i3]) : t3[i3] = Object.assign({}, e3[i3]);
              continue;
            }
            if (Array.isArray(e3[i3])) {
              t3[i3] = Object.assign([], e3[i3]);
              continue;
            }
            t3[i3] = e3[i3];
          }
      }
      return n2 = t2, (null != (s2 = Object) && "undefined" != typeof Symbol && s2[Symbol.hasInstance] ? s2[Symbol.hasInstance](n2) : n2 instanceof s2) || (t2 = {}), a2(t2, e2), i2 && a2(t2, i2), t2;
    }
    function h() {
      var t2 = [], e2 = {}, i2 = true, n2 = false, s2 = void 0;
      try {
        for (var a2, o2 = arguments[Symbol.iterator](); !(i2 = (a2 = o2.next()).done); i2 = true) {
          var r2 = a2.value, l2 = true, d2 = false, c2 = void 0;
          try {
            for (var g2, h2 = r2[Symbol.iterator](); !(l2 = (g2 = h2.next()).done); l2 = true) {
              var p2 = g2.value;
              u(p2) ? e2[p2.value] || (t2.push(p2), e2[p2.value] = 1) : t2.includes(p2) || t2.push(p2);
            }
          } catch (t3) {
            d2 = true, c2 = t3;
          } finally {
            try {
              l2 || null == h2.return || h2.return();
            } finally {
              if (d2)
                throw c2;
            }
          }
        }
      } catch (t3) {
        n2 = true, s2 = t3;
      } finally {
        try {
          i2 || null == o2.return || o2.return();
        } finally {
          if (n2)
            throw s2;
        }
      }
      return t2;
    }
    function p(t2) {
      return String.prototype.normalize ? "string" == typeof t2 ? t2.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : void 0 : t2;
    }
    var f = function() {
      return /(?=.*chrome)(?=.*android)/i.test(navigator.userAgent);
    };
    function m() {
      return ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, function(t2) {
        return (t2 ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> t2 / 4).toString(16);
      });
    }
    function v(t2) {
      return t2 && t2.classList && t2.classList.contains(this.settings.classNames.tag);
    }
    function b(t2) {
      return t2 && t2.closest(this.settings.classNames.tagSelector);
    }
    function y(t2, e2) {
      var i2 = window.getSelection();
      return e2 = e2 || i2.getRangeAt(0), "string" == typeof t2 && (t2 = document.createTextNode(t2)), e2 && (e2.deleteContents(), e2.insertNode(t2)), t2;
    }
    function w(t2, e2, i2) {
      return t2 ? (e2 && (t2.__tagifyTagData = i2 ? e2 : g({}, t2.__tagifyTagData || {}, e2)), t2.__tagifyTagData) : (n.warn("tag element doesn't exist", { tagElm: t2, data: e2 }), e2);
    }
    function T(t2) {
      if (t2 && t2.parentNode) {
        var e2 = t2, i2 = window.getSelection(), n2 = i2.getRangeAt(0);
        i2.rangeCount && (n2.setStartAfter(e2), n2.collapse(true), i2.removeAllRanges(), i2.addRange(n2));
      }
    }
    function O(t2, e2) {
      t2.forEach(function(t3) {
        if (w(t3.previousSibling) || !t3.previousSibling) {
          var i2 = document.createTextNode("​");
          t3.before(i2), e2 && T(i2);
        }
      });
    }
    var x = { delimiters: ",", pattern: null, tagTextProp: "value", maxTags: 1 / 0, callbacks: {}, addTagOnBlur: true, addTagOn: ["blur", "tab", "enter"], onChangeAfterBlur: true, duplicates: false, whitelist: [], blacklist: [], enforceWhitelist: false, userInput: true, focusable: true, keepInvalidTags: false, createInvalidTags: true, mixTagsAllowedAfter: /,|\.|\:|\s/, mixTagsInterpolator: ["[[", "]]"], backspace: true, skipInvalid: false, pasteAsTags: true, editTags: { clicks: 2, keepInvalid: true }, transformTag: function() {
    }, trim: true, a11y: { focusableTags: false }, mixMode: { insertAfterTag: " " }, autoComplete: { enabled: true, rightKey: false, tabKey: false }, classNames: { namespace: "tagify", mixMode: "tagify--mix", selectMode: "tagify--select", input: "tagify__input", focus: "tagify--focus", tagNoAnimation: "tagify--noAnim", tagInvalid: "tagify--invalid", tagNotAllowed: "tagify--notAllowed", scopeLoading: "tagify--loading", hasMaxTags: "tagify--hasMaxTags", hasNoTags: "tagify--noTags", empty: "tagify--empty", inputInvalid: "tagify__input--invalid", dropdown: "tagify__dropdown", dropdownWrapper: "tagify__dropdown__wrapper", dropdownHeader: "tagify__dropdown__header", dropdownFooter: "tagify__dropdown__footer", dropdownItem: "tagify__dropdown__item", dropdownItemActive: "tagify__dropdown__item--active", dropdownItemHidden: "tagify__dropdown__item--hidden", dropdownInital: "tagify__dropdown--initial", tag: "tagify__tag", tagText: "tagify__tag-text", tagX: "tagify__tag__removeBtn", tagLoading: "tagify__tag--loading", tagEditing: "tagify__tag--editable", tagFlash: "tagify__tag--flash", tagHide: "tagify__tag--hide" }, dropdown: { classname: "", enabled: 2, maxItems: 10, searchKeys: ["value", "searchBy"], fuzzySearch: true, caseSensitive: false, accentedSearch: true, includeSelectedTags: false, escapeHTML: true, highlightFirst: true, closeOnSelect: true, clearOnSelect: true, position: "all", appendTarget: null }, hooks: { beforeRemoveTag: function() {
      return Promise.resolve();
    }, beforePaste: function() {
      return Promise.resolve();
    }, suggestionClick: function() {
      return Promise.resolve();
    }, beforeKeyDown: function() {
      return Promise.resolve();
    } } };
    function D(t2, e2, i2) {
      return e2 in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
    }
    function S(t2) {
      for (var e2 = 1; e2 < arguments.length; e2++) {
        var i2 = null != arguments[e2] ? arguments[e2] : {}, n2 = Object.keys(i2);
        "function" == typeof Object.getOwnPropertySymbols && (n2 = n2.concat(Object.getOwnPropertySymbols(i2).filter(function(t3) {
          return Object.getOwnPropertyDescriptor(i2, t3).enumerable;
        }))), n2.forEach(function(e3) {
          D(t2, e3, i2[e3]);
        });
      }
      return t2;
    }
    function I(t2, e2) {
      return e2 = null != e2 ? e2 : {}, Object.getOwnPropertyDescriptors ? Object.defineProperties(t2, Object.getOwnPropertyDescriptors(e2)) : function(t3, e3) {
        var i2 = Object.keys(t3);
        if (Object.getOwnPropertySymbols) {
          var n2 = Object.getOwnPropertySymbols(t3);
          e3 && (n2 = n2.filter(function(e4) {
            return Object.getOwnPropertyDescriptor(t3, e4).enumerable;
          })), i2.push.apply(i2, n2);
        }
        return i2;
      }(Object(e2)).forEach(function(i2) {
        Object.defineProperty(t2, i2, Object.getOwnPropertyDescriptor(e2, i2));
      }), t2;
    }
    var M = { events: { binding: function() {
      var t2 = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0], e2 = this.dropdown.events.callbacks, i2 = this.listeners.dropdown = this.listeners.dropdown || { position: this.dropdown.position.bind(this, null), onKeyDown: e2.onKeyDown.bind(this), onMouseOver: e2.onMouseOver.bind(this), onMouseLeave: e2.onMouseLeave.bind(this), onClick: e2.onClick.bind(this), onScroll: e2.onScroll.bind(this) }, n2 = t2 ? "addEventListener" : "removeEventListener";
      "manual" != this.settings.dropdown.position && (document[n2]("scroll", i2.position, true), window[n2]("resize", i2.position), window[n2]("keydown", i2.onKeyDown)), this.DOM.dropdown[n2]("mouseover", i2.onMouseOver), this.DOM.dropdown[n2]("mouseleave", i2.onMouseLeave), this.DOM.dropdown[n2]("mousedown", i2.onClick), this.DOM.dropdown.content[n2]("scroll", i2.onScroll);
    }, callbacks: { onKeyDown: function(t2) {
      var e2 = this;
      if (this.state.hasFocus && !this.state.composing) {
        var i2 = this.settings, s2 = this.DOM.dropdown.querySelector(i2.classNames.dropdownItemActiveSelector), a2 = this.dropdown.getSuggestionDataByNode(s2), o2 = "mix" == i2.mode, r2 = "select" == i2.mode;
        i2.hooks.beforeKeyDown(t2, { tagify: this }).then(function(l2) {
          switch (t2.key) {
            case "ArrowDown":
            case "ArrowUp":
            case "Down":
            case "Up":
              t2.preventDefault();
              var d2 = e2.dropdown.getAllSuggestionsRefs(), c2 = "ArrowUp" == t2.key || "Up" == t2.key;
              s2 && (s2 = e2.dropdown.getNextOrPrevOption(s2, !c2)), s2 && s2.matches(i2.classNames.dropdownItemSelector) || (s2 = d2[c2 ? d2.length - 1 : 0]), e2.dropdown.highlightOption(s2, true);
              break;
            case "Escape":
            case "Esc":
              e2.dropdown.hide();
              break;
            case "ArrowRight":
              if (e2.state.actions.ArrowLeft)
                return;
            case "Tab":
              var u2 = !i2.autoComplete.rightKey || !i2.autoComplete.tabKey;
              if (!o2 && !r2 && s2 && u2 && !e2.state.editing) {
                t2.preventDefault();
                var g2 = e2.dropdown.getMappedValue(a2);
                return e2.input.autocomplete.set.call(e2, g2), false;
              }
              return true;
            case "Enter":
              t2.preventDefault(), i2.hooks.suggestionClick(t2, { tagify: e2, tagData: a2, suggestionElm: s2 }).then(function() {
                if (s2)
                  return e2.dropdown.selectOption(s2), s2 = e2.dropdown.getNextOrPrevOption(s2, !c2), void e2.dropdown.highlightOption(s2);
                e2.dropdown.hide(), o2 || e2.addTags(e2.state.inputText.trim(), true);
              }).catch(function(t3) {
                return n.warn(t3);
              });
              break;
            case "Backspace":
              if (o2 || e2.state.editing.scope)
                return;
              var h2 = e2.input.raw.call(e2);
              "" != h2 && 8203 != h2.charCodeAt(0) || (true === i2.backspace ? e2.removeTags() : "edit" == i2.backspace && setTimeout(e2.editTag.bind(e2), 0));
          }
        });
      }
    }, onMouseOver: function(t2) {
      var e2 = t2.target.closest(this.settings.classNames.dropdownItemSelector);
      this.dropdown.highlightOption(e2);
    }, onMouseLeave: function(t2) {
      this.dropdown.highlightOption();
    }, onClick: function(t2) {
      var e2 = this;
      if (0 == t2.button && t2.target != this.DOM.dropdown && t2.target != this.DOM.dropdown.content) {
        var i2 = t2.target.closest(this.settings.classNames.dropdownItemSelector), s2 = this.dropdown.getSuggestionDataByNode(i2);
        this.state.actions.selectOption = true, setTimeout(function() {
          return e2.state.actions.selectOption = false;
        }, 50), this.settings.hooks.suggestionClick(t2, { tagify: this, tagData: s2, suggestionElm: i2 }).then(function() {
          i2 ? e2.dropdown.selectOption(i2, t2) : e2.dropdown.hide();
        }).catch(function(t3) {
          return n.warn(t3);
        });
      }
    }, onScroll: function(t2) {
      var e2 = t2.target, i2 = e2.scrollTop / (e2.scrollHeight - e2.parentNode.clientHeight) * 100;
      this.trigger("dropdown:scroll", { percentage: Math.round(i2) });
    } } }, refilter: function(t2) {
      t2 = t2 || this.state.dropdown.query || "", this.suggestedListItems = this.dropdown.filterListItems(t2), this.dropdown.fill(), this.suggestedListItems.length || this.dropdown.hide(), this.trigger("dropdown:updated", this.DOM.dropdown);
    }, getSuggestionDataByNode: function(t2) {
      var e2 = t2 && t2.getAttribute("value");
      return this.suggestedListItems.find(function(t3) {
        return t3.value == e2;
      }) || null;
    }, getNextOrPrevOption: function(t2) {
      var e2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.dropdown.getAllSuggestionsRefs(), n2 = i2.findIndex(function(e3) {
        return e3 === t2;
      });
      return e2 ? i2[n2 + 1] : i2[n2 - 1];
    }, highlightOption: function(t2, e2) {
      var i2, n2 = this.settings.classNames.dropdownItemActive;
      if (this.state.ddItemElm && (this.state.ddItemElm.classList.remove(n2), this.state.ddItemElm.removeAttribute("aria-selected")), !t2)
        return this.state.ddItemData = null, this.state.ddItemElm = null, void this.input.autocomplete.suggest.call(this);
      i2 = this.dropdown.getSuggestionDataByNode(t2), this.state.ddItemData = i2, this.state.ddItemElm = t2, t2.classList.add(n2), t2.setAttribute("aria-selected", true), e2 && (t2.parentNode.scrollTop = t2.clientHeight + t2.offsetTop - t2.parentNode.clientHeight), this.settings.autoComplete && (this.input.autocomplete.suggest.call(this, i2), this.dropdown.position());
    }, selectOption: function(t2, e2) {
      var i2 = this, n2 = this.settings, s2 = n2.dropdown, a2 = s2.clearOnSelect, o2 = s2.closeOnSelect;
      if (!t2)
        return this.addTags(this.state.inputText, true), void (o2 && this.dropdown.hide());
      e2 = e2 || {};
      var r2 = t2.getAttribute("value"), l2 = "noMatch" == r2, d2 = "mix" == n2.mode, c2 = this.suggestedListItems.find(function(t3) {
        var e3;
        return (null !== (e3 = t3.value) && void 0 !== e3 ? e3 : t3) == r2;
      });
      if (this.trigger("dropdown:select", { data: c2, elm: t2, event: e2 }), r2 && (c2 || l2)) {
        if (this.state.editing) {
          var u2 = this.normalizeTags([c2])[0];
          c2 = n2.transformTag.call(this, u2) || u2, this.onEditTagDone(null, g({ __isValid: true }, c2));
        } else
          this[d2 ? "addMixTags" : "addTags"]([c2 || this.input.raw.call(this)], a2);
        (d2 || this.DOM.input.parentNode) && (setTimeout(function() {
          i2.DOM.input.focus(), i2.toggleFocusClass(true);
        }), o2 && setTimeout(this.dropdown.hide.bind(this)), t2.addEventListener("transitionend", function() {
          i2.dropdown.fillHeaderFooter(), setTimeout(function() {
            return t2.remove();
          }, 100);
        }, { once: true }), t2.classList.add(this.settings.classNames.dropdownItemHidden));
      } else
        o2 && setTimeout(this.dropdown.hide.bind(this));
    }, selectAll: function(t2) {
      this.suggestedListItems.length = 0, this.dropdown.hide(), this.dropdown.filterListItems("");
      var e2 = this.dropdown.filterListItems("");
      return t2 || (e2 = this.state.dropdown.suggestions), this.addTags(e2, true), this;
    }, filterListItems: function(t2, e2) {
      var i2, n2, s2, a2, o2, r2, l2 = function() {
        var t3, l3, d3 = void 0, c3 = void 0;
        t3 = m2[y2], n2 = (null != (l3 = Object) && "undefined" != typeof Symbol && l3[Symbol.hasInstance] ? l3[Symbol.hasInstance](t3) : t3 instanceof l3) ? m2[y2] : { value: m2[y2] };
        var v3, w2 = !Object.keys(n2).some(function(t4) {
          return b2.includes(t4);
        }) ? ["value"] : b2;
        g2.fuzzySearch && !e2.exact ? (a2 = w2.reduce(function(t4, e3) {
          return t4 + " " + (n2[e3] || "");
        }, "").toLowerCase().trim(), g2.accentedSearch && (a2 = p(a2), r2 = p(r2)), d3 = 0 == a2.indexOf(r2), c3 = a2 === r2, v3 = a2, s2 = r2.toLowerCase().split(" ").every(function(t4) {
          return v3.includes(t4.toLowerCase());
        })) : (d3 = true, s2 = w2.some(function(t4) {
          var i3 = "" + (n2[t4] || "");
          return g2.accentedSearch && (i3 = p(i3), r2 = p(r2)), g2.caseSensitive || (i3 = i3.toLowerCase()), c3 = i3 === r2, e2.exact ? i3 === r2 : 0 == i3.indexOf(r2);
        })), o2 = !g2.includeSelectedTags && i2.isTagDuplicate(u(n2) ? n2.value : n2), s2 && !o2 && (c3 && d3 ? f2.push(n2) : "startsWith" == g2.sortby && d3 ? h2.unshift(n2) : h2.push(n2));
      }, d2 = this, c2 = this.settings, g2 = c2.dropdown, h2 = (e2 = e2 || {}, []), f2 = [], m2 = c2.whitelist, v2 = g2.maxItems >= 0 ? g2.maxItems : 1 / 0, b2 = g2.searchKeys, y2 = 0;
      if (!(t2 = "select" == c2.mode && this.value.length && this.value[0][c2.tagTextProp] == t2 ? "" : t2) || !b2.length)
        return h2 = g2.includeSelectedTags ? m2 : m2.filter(function(t3) {
          return !d2.isTagDuplicate(u(t3) ? t3.value : t3);
        }), this.state.dropdown.suggestions = h2, h2.slice(0, v2);
      for (r2 = g2.caseSensitive ? "" + t2 : ("" + t2).toLowerCase(); y2 < m2.length; y2++)
        i2 = this, l2();
      return this.state.dropdown.suggestions = f2.concat(h2), "function" == typeof g2.sortby ? g2.sortby(f2.concat(h2), r2) : f2.concat(h2).slice(0, v2);
    }, getMappedValue: function(t2) {
      var e2 = this.settings.dropdown.mapValueTo;
      return e2 ? "function" == typeof e2 ? e2(t2) : t2[e2] || t2.value : t2.value;
    }, createListHTML: function(t2) {
      var e2 = this;
      return g([], t2).map(function(t3, i2) {
        "string" != typeof t3 && "number" != typeof t3 || (t3 = { value: t3 });
        var n2 = e2.dropdown.getMappedValue(t3);
        return n2 = "string" == typeof n2 && e2.settings.dropdown.escapeHTML ? c(n2) : n2, e2.settings.templates.dropdownItem.apply(e2, [I(S({}, t3), { mappedValue: n2 }), e2]);
      }).join("");
    } };
    function E(t2, e2) {
      (null == e2 || e2 > t2.length) && (e2 = t2.length);
      for (var i2 = 0, n2 = new Array(e2); i2 < e2; i2++)
        n2[i2] = t2[i2];
      return n2;
    }
    function N(t2, e2, i2) {
      return e2 in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
    }
    function _(t2) {
      return function(t3) {
        if (Array.isArray(t3))
          return E(t3);
      }(t2) || function(t3) {
        if ("undefined" != typeof Symbol && null != t3[Symbol.iterator] || null != t3["@@iterator"])
          return Array.from(t3);
      }(t2) || function(t3, e2) {
        if (!t3)
          return;
        if ("string" == typeof t3)
          return E(t3, e2);
        var i2 = Object.prototype.toString.call(t3).slice(8, -1);
        "Object" === i2 && t3.constructor && (i2 = t3.constructor.name);
        if ("Map" === i2 || "Set" === i2)
          return Array.from(i2);
        if ("Arguments" === i2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i2))
          return E(t3, e2);
      }(t2) || function() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }();
    }
    function A() {
      for (var t2 in this.dropdown = {}, this._dropdown)
        this.dropdown[t2] = "function" == typeof this._dropdown[t2] ? this._dropdown[t2].bind(this) : this._dropdown[t2];
      this.dropdown.refs();
    }
    var C, k, L, P = (C = function(t2) {
      for (var e2 = 1; e2 < arguments.length; e2++) {
        var i2 = null != arguments[e2] ? arguments[e2] : {}, n2 = Object.keys(i2);
        "function" == typeof Object.getOwnPropertySymbols && (n2 = n2.concat(Object.getOwnPropertySymbols(i2).filter(function(t3) {
          return Object.getOwnPropertyDescriptor(i2, t3).enumerable;
        }))), n2.forEach(function(e3) {
          N(t2, e3, i2[e3]);
        });
      }
      return t2;
    }({}, M), k = null != (k = { refs: function() {
      this.DOM.dropdown = this.parseTemplate("dropdown", [this.settings]), this.DOM.dropdown.content = this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-wrapper']");
    }, getHeaderRef: function() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-header']");
    }, getFooterRef: function() {
      return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-footer']");
    }, getAllSuggestionsRefs: function() {
      return _(this.DOM.dropdown.content.querySelectorAll(this.settings.classNames.dropdownItemSelector));
    }, show: function(t2) {
      var e2, i2, n2, a2 = this, o2 = this.settings, r2 = "mix" == o2.mode && !o2.enforceWhitelist, l2 = !o2.whitelist || !o2.whitelist.length, d2 = "manual" == o2.dropdown.position;
      if (t2 = void 0 === t2 ? this.state.inputText : t2, !(l2 && !r2 && !o2.templates.dropdownItemNoMatch || false === o2.dropdown.enable || this.state.isLoading || this.settings.readonly)) {
        if (clearTimeout(this.dropdownHide__bindEventsTimeout), this.suggestedListItems = this.dropdown.filterListItems(t2), t2 && !this.suggestedListItems.length && (this.trigger("dropdown:noMatch", t2), o2.templates.dropdownItemNoMatch && (n2 = o2.templates.dropdownItemNoMatch.call(this, { value: t2 }))), !n2) {
          if (this.suggestedListItems.length)
            t2 && r2 && !this.state.editing.scope && !s(this.suggestedListItems[0].value, t2) && this.suggestedListItems.unshift({ value: t2 });
          else {
            if (!t2 || !r2 || this.state.editing.scope)
              return this.input.autocomplete.suggest.call(this), void this.dropdown.hide();
            this.suggestedListItems = [{ value: t2 }];
          }
          i2 = "" + (u(e2 = this.suggestedListItems[0]) ? e2.value : e2), o2.autoComplete && i2 && 0 == i2.indexOf(t2) && this.input.autocomplete.suggest.call(this, e2);
        }
        this.dropdown.fill(n2), o2.dropdown.highlightFirst && this.dropdown.highlightOption(this.DOM.dropdown.content.querySelector(o2.classNames.dropdownItemSelector)), this.state.dropdown.visible || setTimeout(this.dropdown.events.binding.bind(this)), this.state.dropdown.visible = t2 || true, this.state.dropdown.query = t2, this.setStateSelection(), d2 || setTimeout(function() {
          a2.dropdown.position(), a2.dropdown.render();
        }), setTimeout(function() {
          a2.trigger("dropdown:show", a2.DOM.dropdown);
        });
      }
    }, hide: function(t2) {
      var e2 = this, i2 = this.DOM, n2 = i2.scope, s2 = i2.dropdown, a2 = "manual" == this.settings.dropdown.position && !t2;
      if (s2 && document.body.contains(s2) && !a2)
        return window.removeEventListener("resize", this.dropdown.position), this.dropdown.events.binding.call(this, false), n2.setAttribute("aria-expanded", false), s2.parentNode.removeChild(s2), setTimeout(function() {
          e2.state.dropdown.visible = false;
        }, 100), this.state.dropdown.query = this.state.ddItemData = this.state.ddItemElm = this.state.selection = null, this.state.tag && this.state.tag.value.length && (this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag), this.trigger("dropdown:hide", s2), this;
    }, toggle: function(t2) {
      this.dropdown[this.state.dropdown.visible && !t2 ? "hide" : "show"]();
    }, getAppendTarget: function() {
      var t2 = this.settings.dropdown;
      return "function" == typeof t2.appendTarget ? t2.appendTarget() : t2.appendTarget;
    }, render: function() {
      var t2, e2, i2, n2 = this, s2 = (t2 = this.DOM.dropdown, (i2 = t2.cloneNode(true)).style.cssText = "position:fixed; top:-9999px; opacity:0", document.body.appendChild(i2), e2 = i2.clientHeight, i2.parentNode.removeChild(i2), e2), a2 = this.settings, o2 = "number" == typeof a2.dropdown.enabled && a2.dropdown.enabled >= 0, r2 = this.dropdown.getAppendTarget();
      return o2 ? (this.DOM.scope.setAttribute("aria-expanded", true), document.body.contains(this.DOM.dropdown) || (this.DOM.dropdown.classList.add(a2.classNames.dropdownInital), this.dropdown.position(s2), r2.appendChild(this.DOM.dropdown), setTimeout(function() {
        return n2.DOM.dropdown.classList.remove(a2.classNames.dropdownInital);
      })), this) : this;
    }, fill: function(t2) {
      t2 = "string" == typeof t2 ? t2 : this.dropdown.createListHTML(t2 || this.suggestedListItems);
      var e2, i2 = this.settings.templates.dropdownContent.call(this, t2);
      this.DOM.dropdown.content.innerHTML = (e2 = i2) ? e2.replace(/\>[\r\n ]+\</g, "><").split(/>\s+</).join("><").trim() : "";
    }, fillHeaderFooter: function() {
      var t2 = this.dropdown.filterListItems(this.state.dropdown.query), e2 = this.parseTemplate("dropdownHeader", [t2]), i2 = this.parseTemplate("dropdownFooter", [t2]), n2 = this.dropdown.getHeaderRef(), s2 = this.dropdown.getFooterRef();
      e2 && (null == n2 || n2.parentNode.replaceChild(e2, n2)), i2 && (null == s2 || s2.parentNode.replaceChild(i2, s2));
    }, position: function(t2) {
      var e2 = this.settings.dropdown, i2 = this.dropdown.getAppendTarget();
      if ("manual" != e2.position && i2) {
        var n2, s2, a2, o2, r2, l2, d2, c2, u2, g2 = this.DOM.dropdown, h2 = e2.RTL, p2 = i2 === document.body, f2 = i2 === this.DOM.scope, m2 = p2 ? window.pageYOffset : i2.scrollTop, v2 = document.fullscreenElement || document.webkitFullscreenElement || document.documentElement, b2 = v2.clientHeight, y2 = Math.max(v2.clientWidth || 0, window.innerWidth || 0) > 480 ? e2.position : "all", w2 = this.DOM["input" == y2 ? "input" : "scope"];
        if (t2 = t2 || g2.clientHeight, this.state.dropdown.visible) {
          if ("text" == y2 ? (a2 = (n2 = function() {
            var t3 = document.getSelection();
            if (t3.rangeCount) {
              var e3, i3, n3 = t3.getRangeAt(0), s3 = n3.startContainer, a3 = n3.startOffset;
              if (a3 > 0)
                return (i3 = document.createRange()).setStart(s3, a3 - 1), i3.setEnd(s3, a3), { left: (e3 = i3.getBoundingClientRect()).right, top: e3.top, bottom: e3.bottom };
              if (s3.getBoundingClientRect)
                return s3.getBoundingClientRect();
            }
            return { left: -9999, top: -9999 };
          }()).bottom, s2 = n2.top, o2 = n2.left, r2 = "auto") : (l2 = function(t3) {
            var e3 = 0, i3 = 0;
            for (t3 = t3.parentNode; t3 && t3 != v2; )
              e3 += t3.offsetTop || 0, i3 += t3.offsetLeft || 0, t3 = t3.parentNode;
            return { top: e3, left: i3 };
          }(i2), n2 = w2.getBoundingClientRect(), s2 = f2 ? -1 : n2.top - l2.top, a2 = (f2 ? n2.height : n2.bottom - l2.top) - 1, o2 = f2 ? -1 : n2.left - l2.left, r2 = n2.width + "px"), !p2) {
            var T2 = function() {
              for (var t3 = 0, i3 = e2.appendTarget.parentNode; i3; )
                t3 += i3.scrollTop || 0, i3 = i3.parentNode;
              return t3;
            }();
            s2 += T2, a2 += T2;
          }
          var O2;
          s2 = Math.floor(s2), a2 = Math.ceil(a2), c2 = ((d2 = null !== (O2 = e2.placeAbove) && void 0 !== O2 ? O2 : b2 - n2.bottom < t2) ? s2 : a2) + m2, u2 = "left: ".concat(o2 + (h2 && n2.width || 0) + window.pageXOffset, "px;"), g2.style.cssText = "".concat(u2, "; top: ").concat(c2, "px; min-width: ").concat(r2, "; max-width: ").concat(r2), g2.setAttribute("placement", d2 ? "top" : "bottom"), g2.setAttribute("position", y2);
        }
      }
    } }) ? k : {}, Object.getOwnPropertyDescriptors ? Object.defineProperties(C, Object.getOwnPropertyDescriptors(k)) : function(t2, e2) {
      var i2 = Object.keys(t2);
      if (Object.getOwnPropertySymbols) {
        var n2 = Object.getOwnPropertySymbols(t2);
        e2 && (n2 = n2.filter(function(e3) {
          return Object.getOwnPropertyDescriptor(t2, e3).enumerable;
        })), i2.push.apply(i2, n2);
      }
      return i2;
    }(Object(k)).forEach(function(t2) {
      Object.defineProperty(C, t2, Object.getOwnPropertyDescriptor(k, t2));
    }), C), j = "@yaireo/tagify/", V = { empty: "empty", exceed: "number of tags exceeded", pattern: "pattern mismatch", duplicate: "already exists", notAllowed: "not allowed" }, R = { wrapper: function(e2, i2) {
      return '<tags class="'.concat(i2.classNames.namespace, " ").concat(i2.mode ? "".concat(i2.classNames[i2.mode + "Mode"]) : "", " ").concat(e2.className, '"\n                    ').concat(i2.readonly ? "readonly" : "", "\n                    ").concat(i2.disabled ? "disabled" : "", "\n                    ").concat(i2.required ? "required" : "", "\n                    ").concat("select" === i2.mode ? "spellcheck='false'" : "", '\n                    tabIndex="-1">\n            <span ').concat(!i2.readonly && i2.userInput ? "contenteditable" : "", ' tabIndex="0" data-placeholder="').concat(i2.placeholder || t, '" aria-placeholder="').concat(i2.placeholder || "", '"\n                class="').concat(i2.classNames.input, '"\n                role="textbox"\n                aria-autocomplete="both"\n                aria-multiline="').concat("mix" == i2.mode, '"></span>\n                ').concat(t, "\n        </tags>");
    }, tag: function(t2, e2) {
      var i2 = e2.settings;
      return '<tag title="'.concat(t2.title || t2.value, `"
                    contenteditable='false'
                    spellcheck='false'
                    tabIndex="`).concat(i2.a11y.focusableTags ? 0 : -1, '"\n                    class="').concat(i2.classNames.tag, " ").concat(t2.class || "", '"\n                    ').concat(this.getAttributes(t2), `>
            <x title='' tabIndex="`).concat(i2.a11y.focusableTags ? 0 : -1, '" class="').concat(i2.classNames.tagX, `" role='button' aria-label='remove tag'></x>
            <div>
                <span `).concat("select" === i2.mode && i2.userInput ? "contenteditable='true'" : "", ' class="').concat(i2.classNames.tagText, '">').concat(t2[i2.tagTextProp] || t2.value, "</span>\n            </div>\n        </tag>");
    }, dropdown: function(t2) {
      var e2 = t2.dropdown, i2 = "manual" == e2.position;
      return '<div class="'.concat(i2 ? "" : t2.classNames.dropdown, " ").concat(e2.classname, '" role="listbox" aria-labelledby="dropdown" dir="').concat(e2.RTL ? "rtl" : "", `">
                    <div data-selector='tagify-suggestions-wrapper' class="`).concat(t2.classNames.dropdownWrapper, '"></div>\n                </div>');
    }, dropdownContent: function(t2) {
      var e2 = this.settings.templates, i2 = this.state.dropdown.suggestions;
      return "\n            ".concat(e2.dropdownHeader.call(this, i2), "\n            ").concat(t2, "\n            ").concat(e2.dropdownFooter.call(this, i2), "\n        ");
    }, dropdownItem: function(t2) {
      return "<div ".concat(this.getAttributes(t2), "\n                    class='").concat(this.settings.classNames.dropdownItem, " ").concat(t2.class || "", `'
                    tabindex="0"
                    role="option">`).concat(t2.mappedValue || t2.value, "</div>");
    }, dropdownHeader: function(t2) {
      return `<header data-selector='tagify-suggestions-header' class="`.concat(this.settings.classNames.dropdownHeader, '"></header>');
    }, dropdownFooter: function(t2) {
      var e2 = t2.length - this.settings.dropdown.maxItems;
      return e2 > 0 ? `<footer data-selector='tagify-suggestions-footer' class="`.concat(this.settings.classNames.dropdownFooter, '">\n                ').concat(e2, " more items. Refine your search.\n            </footer>") : "";
    }, dropdownItemNoMatch: null };
    function F(t2, e2) {
      (null == e2 || e2 > t2.length) && (e2 = t2.length);
      for (var i2 = 0, n2 = new Array(e2); i2 < e2; i2++)
        n2[i2] = t2[i2];
      return n2;
    }
    function H(t2, e2) {
      return null != e2 && "undefined" != typeof Symbol && e2[Symbol.hasInstance] ? !!e2[Symbol.hasInstance](t2) : t2 instanceof e2;
    }
    function B(t2, e2) {
      return function(t3) {
        if (Array.isArray(t3))
          return t3;
      }(t2) || function(t3, e3) {
        var i2 = null == t3 ? null : "undefined" != typeof Symbol && t3[Symbol.iterator] || t3["@@iterator"];
        if (null != i2) {
          var n2, s2, a2 = [], o2 = true, r2 = false;
          try {
            for (i2 = i2.call(t3); !(o2 = (n2 = i2.next()).done) && (a2.push(n2.value), !e3 || a2.length !== e3); o2 = true)
              ;
          } catch (t4) {
            r2 = true, s2 = t4;
          } finally {
            try {
              o2 || null == i2.return || i2.return();
            } finally {
              if (r2)
                throw s2;
            }
          }
          return a2;
        }
      }(t2, e2) || function(t3, e3) {
        if (!t3)
          return;
        if ("string" == typeof t3)
          return F(t3, e3);
        var i2 = Object.prototype.toString.call(t3).slice(8, -1);
        "Object" === i2 && t3.constructor && (i2 = t3.constructor.name);
        if ("Map" === i2 || "Set" === i2)
          return Array.from(i2);
        if ("Arguments" === i2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i2))
          return F(t3, e3);
      }(t2, e2) || function() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }();
    }
    function W(t2, e2) {
      (null == e2 || e2 > t2.length) && (e2 = t2.length);
      for (var i2 = 0, n2 = new Array(e2); i2 < e2; i2++)
        n2[i2] = t2[i2];
      return n2;
    }
    function U(t2, e2, i2) {
      return e2 in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
    }
    function q(t2, e2) {
      return null != e2 && "undefined" != typeof Symbol && e2[Symbol.hasInstance] ? !!e2[Symbol.hasInstance](t2) : t2 instanceof e2;
    }
    function K(t2, e2) {
      return e2 = null != e2 ? e2 : {}, Object.getOwnPropertyDescriptors ? Object.defineProperties(t2, Object.getOwnPropertyDescriptors(e2)) : function(t3, e3) {
        var i2 = Object.keys(t3);
        if (Object.getOwnPropertySymbols) {
          var n2 = Object.getOwnPropertySymbols(t3);
          e3 && (n2 = n2.filter(function(e4) {
            return Object.getOwnPropertyDescriptor(t3, e4).enumerable;
          })), i2.push.apply(i2, n2);
        }
        return i2;
      }(Object(e2)).forEach(function(i2) {
        Object.defineProperty(t2, i2, Object.getOwnPropertyDescriptor(e2, i2));
      }), t2;
    }
    function z(t2) {
      return function(t3) {
        if (Array.isArray(t3))
          return W(t3);
      }(t2) || function(t3) {
        if ("undefined" != typeof Symbol && null != t3[Symbol.iterator] || null != t3["@@iterator"])
          return Array.from(t3);
      }(t2) || function(t3, e2) {
        if (!t3)
          return;
        if ("string" == typeof t3)
          return W(t3, e2);
        var i2 = Object.prototype.toString.call(t3).slice(8, -1);
        "Object" === i2 && t3.constructor && (i2 = t3.constructor.name);
        if ("Map" === i2 || "Set" === i2)
          return Array.from(i2);
        if ("Arguments" === i2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i2))
          return W(t3, e2);
      }(t2) || function() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }();
    }
    var X = { customBinding: function() {
      var t2 = this;
      this.customEventsList.forEach(function(e2) {
        t2.on(e2, t2.settings.callbacks[e2]);
      });
    }, binding: function() {
      var t2, e2 = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0], i2 = this.settings, n2 = this.events.callbacks, s2 = e2 ? "addEventListener" : "removeEventListener";
      if (!this.state.mainEvents || !e2) {
        for (var a2 in this.state.mainEvents = e2, e2 && !this.listeners.main && (this.events.bindGlobal.call(this), this.settings.isJQueryPlugin && jQuery(this.DOM.originalInput).on("tagify.removeAllTags", this.removeAllTags.bind(this))), t2 = this.listeners.main = this.listeners.main || { keydown: ["input", n2.onKeydown.bind(this)], click: ["scope", n2.onClickScope.bind(this)], dblclick: "select" != i2.mode && ["scope", n2.onDoubleClickScope.bind(this)], paste: ["input", n2.onPaste.bind(this)], drop: ["input", n2.onDrop.bind(this)], compositionstart: ["input", n2.onCompositionStart.bind(this)], compositionend: ["input", n2.onCompositionEnd.bind(this)] })
          t2[a2] && this.DOM[t2[a2][0]][s2](a2, t2[a2][1]);
        clearInterval(this.listeners.main.originalInputValueObserverInterval), this.listeners.main.originalInputValueObserverInterval = setInterval(n2.observeOriginalInputValue.bind(this), 500);
        var o2 = this.listeners.main.inputMutationObserver || new MutationObserver(n2.onInputDOMChange.bind(this));
        o2.disconnect(), "mix" == i2.mode && o2.observe(this.DOM.input, { childList: true });
      }
    }, bindGlobal: function(t2) {
      var e2, i2 = this.events.callbacks, n2 = t2 ? "removeEventListener" : "addEventListener";
      if (this.listeners && (t2 || !this.listeners.global)) {
        this.listeners.global = this.listeners.global || [{ type: this.isIE ? "keydown" : "input", target: this.DOM.input, cb: i2[this.isIE ? "onInputIE" : "onInput"].bind(this) }, { type: "keydown", target: window, cb: i2.onWindowKeyDown.bind(this) }, { type: "focusin", target: this.DOM.scope, cb: i2.onFocusBlur.bind(this) }, { type: "focusout", target: this.DOM.scope, cb: i2.onFocusBlur.bind(this) }, { type: "click", target: document, cb: i2.onClickAnywhere.bind(this), useCapture: true }];
        var s2 = true, a2 = false, o2 = void 0;
        try {
          for (var r2, l2 = this.listeners.global[Symbol.iterator](); !(s2 = (r2 = l2.next()).done); s2 = true)
            (e2 = r2.value).target[n2](e2.type, e2.cb, !!e2.useCapture);
        } catch (t3) {
          a2 = true, o2 = t3;
        } finally {
          try {
            s2 || null == l2.return || l2.return();
          } finally {
            if (a2)
              throw o2;
          }
        }
      }
    }, unbindGlobal: function() {
      this.events.bindGlobal.call(this, true);
    }, callbacks: { onFocusBlur: function(t2) {
      var e2, i2, n2, s2 = b.call(this, t2.target), a2 = v.call(this, t2.target), o2 = "focusin" == t2.type, r2 = "focusout" == t2.type, l2 = null === (e2 = t2.target) || void 0 === e2 ? void 0 : e2.closest(this.settings.classNames.tagTextSelector);
      if (s2 && o2 && !a2)
        return this.toggleFocusClass(this.state.hasFocus = +/* @__PURE__ */ new Date()), l2 ? this.events.callbacks.onEditTagFocus.call(this, s2) : void 0;
      var d2 = this.settings, c2 = t2.target ? this.trim(this.DOM.input.textContent) : "", u2 = null === (n2 = this.value) || void 0 === n2 || null === (i2 = n2[0]) || void 0 === i2 ? void 0 : i2[d2.tagTextProp], g2 = d2.dropdown.enabled >= 0, h2 = { relatedTarget: t2.relatedTarget }, p2 = this.state.actions.selectOption && (g2 || !d2.dropdown.closeOnSelect), f2 = this.state.actions.addNew && g2;
      if (r2) {
        if (t2.relatedTarget === this.DOM.scope)
          return this.dropdown.hide(), void this.DOM.input.focus();
        this.postUpdate();
      }
      if (!p2 && !f2)
        if (this.state.hasFocus = !!o2 && +/* @__PURE__ */ new Date(), this.toggleFocusClass(this.state.hasFocus), "mix" != d2.mode) {
          if (o2) {
            if (!d2.focusable)
              return;
            return this.toggleFocusClass(true), this.trigger("focus", h2), void (0 !== d2.dropdown.enabled || this.state.dropdown.visible || this.dropdown.show(this.value.length ? "" : void 0));
          }
          if (r2 && !a2) {
            if (this.trigger("blur", h2), this.loading(false), "select" == d2.mode) {
              if (this.value.length) {
                var m2 = this.getTagElms()[0];
                c2 = this.trim(m2.textContent);
              }
              u2 === c2 && (c2 = "");
            }
            c2 && !this.state.actions.selectOption && d2.addTagOnBlur && d2.addTagOn.includes("blur") && this.addTags(c2, true);
          }
          this.DOM.input.removeAttribute("style"), this.dropdown.hide();
        } else
          o2 ? this.trigger("focus", h2) : r2 && (this.trigger("blur", h2), this.loading(false), this.dropdown.hide(), this.state.dropdown.visible = void 0, this.setStateSelection());
    }, onCompositionStart: function(t2) {
      this.state.composing = true;
    }, onCompositionEnd: function(t2) {
      this.state.composing = false;
    }, onWindowKeyDown: function(t2) {
      var e2, i2 = document.activeElement, n2 = v.call(this, i2) && this.DOM.scope.contains(document.activeElement), s2 = n2 && i2.hasAttribute("readonly");
      if (n2 && !s2)
        switch (e2 = i2.nextElementSibling, t2.key) {
          case "Backspace":
            this.settings.readonly || (this.removeTags(i2), (e2 || this.DOM.input).focus());
            break;
          case "Enter":
            setTimeout(this.editTag.bind(this), 0, i2);
        }
    }, onKeydown: function(t2) {
      var e2 = this, i2 = this.settings;
      if (!this.state.composing && i2.userInput) {
        "select" == i2.mode && i2.enforceWhitelist && this.value.length && "Tab" != t2.key && t2.preventDefault();
        var n2 = this.trim(t2.target.textContent);
        this.trigger("keydown", { event: t2 }), i2.hooks.beforeKeyDown(t2, { tagify: this }).then(function(s2) {
          if ("mix" == i2.mode) {
            switch (t2.key) {
              case "Left":
              case "ArrowLeft":
                e2.state.actions.ArrowLeft = true;
                break;
              case "Delete":
              case "Backspace":
                if (e2.state.editing)
                  return;
                var a2 = document.getSelection(), o2 = "Delete" == t2.key && a2.anchorOffset == (a2.anchorNode.length || 0), l2 = a2.anchorNode.previousSibling, c2 = 1 == a2.anchorNode.nodeType || !a2.anchorOffset && l2 && 1 == l2.nodeType && a2.anchorNode.previousSibling;
                r(e2.DOM.input.innerHTML);
                var u2, g2, h2, p2 = e2.getTagElms(), m2 = 1 === a2.anchorNode.length && a2.anchorNode.nodeValue == String.fromCharCode(8203);
                if ("edit" == i2.backspace && c2)
                  return u2 = 1 == a2.anchorNode.nodeType ? null : a2.anchorNode.previousElementSibling, setTimeout(e2.editTag.bind(e2), 0, u2), void t2.preventDefault();
                if (f() && q(c2, Element))
                  return h2 = d(c2), c2.hasAttribute("readonly") || c2.remove(), e2.DOM.input.focus(), void setTimeout(function() {
                    T(h2), e2.DOM.input.click();
                  });
                if ("BR" == a2.anchorNode.nodeName)
                  return;
                if ((o2 || c2) && 1 == a2.anchorNode.nodeType ? g2 = 0 == a2.anchorOffset ? o2 ? p2[0] : null : p2[Math.min(p2.length, a2.anchorOffset) - 1] : o2 ? g2 = a2.anchorNode.nextElementSibling : q(c2, Element) && (g2 = c2), 3 == a2.anchorNode.nodeType && !a2.anchorNode.nodeValue && a2.anchorNode.previousElementSibling && t2.preventDefault(), (c2 || o2) && !i2.backspace)
                  return void t2.preventDefault();
                if ("Range" != a2.type && !a2.anchorOffset && a2.anchorNode == e2.DOM.input && "Delete" != t2.key)
                  return void t2.preventDefault();
                if ("Range" != a2.type && g2 && g2.hasAttribute("readonly"))
                  return void T(d(g2));
                "Delete" == t2.key && m2 && w(a2.anchorNode.nextSibling) && e2.removeTags(a2.anchorNode.nextSibling), clearTimeout(L), L = setTimeout(function() {
                  var t3 = document.getSelection();
                  r(e2.DOM.input.innerHTML), !o2 && t3.anchorNode.previousSibling, e2.value = [].map.call(p2, function(t4, i3) {
                    var n3 = w(t4);
                    if (t4.parentNode || n3.readonly)
                      return n3;
                    e2.trigger("remove", { tag: t4, index: i3, data: n3 });
                  }).filter(function(t4) {
                    return t4;
                  });
                }, 20);
            }
            return true;
          }
          var v2 = "manual" == i2.dropdown.position;
          switch (t2.key) {
            case "Backspace":
              "select" == i2.mode && i2.enforceWhitelist && e2.value.length ? e2.removeTags() : e2.state.dropdown.visible && "manual" != i2.dropdown.position || "" != t2.target.textContent && 8203 != n2.charCodeAt(0) || (true === i2.backspace ? e2.removeTags() : "edit" == i2.backspace && setTimeout(e2.editTag.bind(e2), 0));
              break;
            case "Esc":
            case "Escape":
              if (e2.state.dropdown.visible)
                return;
              t2.target.blur();
              break;
            case "Down":
            case "ArrowDown":
              e2.state.dropdown.visible || e2.dropdown.show();
              break;
            case "ArrowRight":
              var b2 = e2.state.inputSuggestion || e2.state.ddItemData;
              if (b2 && i2.autoComplete.rightKey)
                return void e2.addTags([b2], true);
              break;
            case "Tab":
              var y2 = "select" == i2.mode;
              if (!n2 || y2)
                return true;
              t2.preventDefault();
            case "Enter":
              if (e2.state.dropdown.visible && !v2)
                return;
              t2.preventDefault(), setTimeout(function() {
                e2.state.dropdown.visible && !v2 || e2.state.actions.selectOption || !i2.addTagOn.includes(t2.key.toLowerCase()) || e2.addTags(n2, true);
              });
          }
        }).catch(function(t3) {
          return t3;
        });
      }
    }, onInput: function(t2) {
      this.postUpdate();
      var e2 = this.settings;
      if ("mix" == e2.mode)
        return this.events.callbacks.onMixTagsInput.call(this, t2);
      var i2 = this.input.normalize.call(this, void 0, { trim: false }), n2 = i2.length >= e2.dropdown.enabled, s2 = { value: i2, inputElm: this.DOM.input }, a2 = this.validateTag({ value: i2 });
      "select" == e2.mode && this.toggleScopeValidation(a2), s2.isValid = a2, this.state.inputText != i2 && (this.input.set.call(this, i2, false), -1 != i2.search(e2.delimiters) ? this.addTags(i2) && this.input.set.call(this) : e2.dropdown.enabled >= 0 && this.dropdown[n2 ? "show" : "hide"](i2), this.trigger("input", s2));
    }, onMixTagsInput: function(t2) {
      var e2, i2, n2, s2, a2, o2, r2, l2, d2 = this, c2 = this.settings, u2 = this.value.length, h2 = this.getTagElms(), p2 = document.createDocumentFragment(), m2 = window.getSelection().getRangeAt(0), v2 = [].map.call(h2, function(t3) {
        return w(t3).value;
      });
      if ("deleteContentBackward" == t2.inputType && f() && this.events.callbacks.onKeydown.call(this, { target: t2.target, key: "Backspace" }), O(this.getTagElms()), this.value.slice().forEach(function(t3) {
        t3.readonly && !v2.includes(t3.value) && p2.appendChild(d2.createTagElem(t3));
      }), p2.childNodes.length && (m2.insertNode(p2), this.setRangeAtStartEnd(false, p2.lastChild)), h2.length != u2)
        return this.value = [].map.call(this.getTagElms(), function(t3) {
          return w(t3);
        }), void this.update({ withoutChangeEvent: true });
      if (this.hasMaxTags())
        return true;
      if (window.getSelection && (o2 = window.getSelection()).rangeCount > 0 && 3 == o2.anchorNode.nodeType) {
        if ((m2 = o2.getRangeAt(0).cloneRange()).collapse(true), m2.setStart(o2.focusNode, 0), n2 = (e2 = m2.toString().slice(0, m2.endOffset)).split(c2.pattern).length - 1, (i2 = e2.match(c2.pattern)) && (s2 = e2.slice(e2.lastIndexOf(i2[i2.length - 1]))), s2) {
          if (this.state.actions.ArrowLeft = false, this.state.tag = { prefix: s2.match(c2.pattern)[0], value: s2.replace(c2.pattern, "") }, this.state.tag.baseOffset = o2.baseOffset - this.state.tag.value.length, l2 = this.state.tag.value.match(c2.delimiters))
            return this.state.tag.value = this.state.tag.value.replace(c2.delimiters, ""), this.state.tag.delimiters = l2[0], this.addTags(this.state.tag.value, c2.dropdown.clearOnSelect), void this.dropdown.hide();
          a2 = this.state.tag.value.length >= c2.dropdown.enabled;
          try {
            r2 = (r2 = this.state.flaggedTags[this.state.tag.baseOffset]).prefix == this.state.tag.prefix && r2.value[0] == this.state.tag.value[0], this.state.flaggedTags[this.state.tag.baseOffset] && !this.state.tag.value && delete this.state.flaggedTags[this.state.tag.baseOffset];
          } catch (t3) {
          }
          (r2 || n2 < this.state.mixMode.matchedPatternCount) && (a2 = false);
        } else
          this.state.flaggedTags = {};
        this.state.mixMode.matchedPatternCount = n2;
      }
      setTimeout(function() {
        d2.update({ withoutChangeEvent: true }), d2.trigger("input", g({}, d2.state.tag, { textContent: d2.DOM.input.textContent })), d2.state.tag && d2.dropdown[a2 ? "show" : "hide"](d2.state.tag.value);
      }, 10);
    }, onInputIE: function(t2) {
      var e2 = this;
      setTimeout(function() {
        e2.events.callbacks.onInput.call(e2, t2);
      });
    }, observeOriginalInputValue: function() {
      this.DOM.originalInput.parentNode || this.destroy(), this.DOM.originalInput.value != this.DOM.originalInput.tagifyValue && this.loadOriginalValues();
    }, onClickAnywhere: function(t2) {
      t2.target == this.DOM.scope || this.DOM.scope.contains(t2.target) || (this.toggleFocusClass(false), this.state.hasFocus = false, !this.settings.userInput && this.dropdown.hide());
    }, onClickScope: function(t2) {
      var e2 = this.settings, i2 = t2.target.closest("." + e2.classNames.tag), n2 = t2.target === this.DOM.scope, s2 = +/* @__PURE__ */ new Date() - this.state.hasFocus;
      if (n2 && "select" != e2.mode)
        this.DOM.input.focus();
      else {
        if (!t2.target.classList.contains(e2.classNames.tagX))
          return i2 && !this.state.editing ? (this.trigger("click", { tag: i2, index: this.getNodeIndex(i2), data: w(i2), event: t2 }), void (1 !== e2.editTags && 1 !== e2.editTags.clicks && "select" != e2.mode || this.events.callbacks.onDoubleClickScope.call(this, t2))) : void (t2.target == this.DOM.input && ("mix" == e2.mode && this.fixFirefoxLastTagNoCaret(), s2 > 500 || !e2.focusable) ? this.state.dropdown.visible ? this.dropdown.hide() : 0 === e2.dropdown.enabled && "mix" != e2.mode && this.dropdown.show(this.value.length ? "" : void 0) : "select" != e2.mode || 0 !== e2.dropdown.enabled || this.state.dropdown.visible || (this.events.callbacks.onDoubleClickScope.call(this, K(function(t3) {
            for (var e3 = 1; e3 < arguments.length; e3++) {
              var i3 = null != arguments[e3] ? arguments[e3] : {}, n3 = Object.keys(i3);
              "function" == typeof Object.getOwnPropertySymbols && (n3 = n3.concat(Object.getOwnPropertySymbols(i3).filter(function(t4) {
                return Object.getOwnPropertyDescriptor(i3, t4).enumerable;
              }))), n3.forEach(function(e4) {
                U(t3, e4, i3[e4]);
              });
            }
            return t3;
          }({}, t2), { target: this.getTagElms()[0] })), !e2.userInput && this.dropdown.show()));
        this.removeTags(t2.target.parentNode);
      }
    }, onPaste: function(t2) {
      var e2 = this;
      t2.preventDefault();
      var i2, n2, s2, a2 = this.settings;
      if ("select" == a2.mode && a2.enforceWhitelist || !a2.userInput)
        return false;
      a2.readonly || (n2 = t2.clipboardData || window.clipboardData, s2 = n2.getData("Text"), a2.hooks.beforePaste(t2, { tagify: this, pastedText: s2, clipboardData: n2 }).then(function(a3) {
        void 0 === a3 && (a3 = s2), a3 && (e2.injectAtCaret(a3, window.getSelection().getRangeAt(0)), "mix" == e2.settings.mode ? e2.events.callbacks.onMixTagsInput.call(e2, t2) : e2.settings.pasteAsTags ? i2 = e2.addTags(e2.state.inputText + a3, true) : (e2.state.inputText = a3, e2.dropdown.show(a3))), e2.trigger("paste", { event: t2, pastedText: s2, clipboardData: n2, tagsElems: i2 });
      }).catch(function(t3) {
        return t3;
      }));
    }, onDrop: function(t2) {
      t2.preventDefault();
    }, onEditTagInput: function(t2, e2) {
      var i2, n2 = t2.closest("." + this.settings.classNames.tag), s2 = this.getNodeIndex(n2), a2 = w(n2), o2 = this.input.normalize.call(this, t2), r2 = (U(i2 = {}, this.settings.tagTextProp, o2), U(i2, "__tagId", a2.__tagId), i2), l2 = this.validateTag(r2);
      this.editTagChangeDetected(g(a2, r2)) || true !== t2.originalIsValid || (l2 = true), n2.classList.toggle(this.settings.classNames.tagInvalid, true !== l2), a2.__isValid = l2, n2.title = true === l2 ? a2.title || a2.value : l2, o2.length >= this.settings.dropdown.enabled && (this.state.editing && (this.state.editing.value = o2), this.dropdown.show(o2)), this.trigger("edit:input", { tag: n2, index: s2, data: g({}, this.value[s2], { newValue: o2 }), event: e2 });
    }, onEditTagPaste: function(t2, e2) {
      var i2 = (e2.clipboardData || window.clipboardData).getData("Text");
      e2.preventDefault();
      var n2 = y(i2);
      this.setRangeAtStartEnd(false, n2);
    }, onEditTagClick: function(t2, e2) {
      this.events.callbacks.onClickScope.call(this, e2);
    }, onEditTagFocus: function(t2) {
      this.state.editing = { scope: t2, input: t2.querySelector("[contenteditable]") };
    }, onEditTagBlur: function(t2, e2) {
      var i2 = v.call(this, e2.relatedTarget);
      if ("select" == this.settings.mode && i2 && e2.relatedTarget.contains(e2.target))
        this.dropdown.hide();
      else if (this.state.editing && (this.state.hasFocus || this.toggleFocusClass(), this.DOM.scope.contains(t2))) {
        var n2, s2, a2, o2 = this.settings, r2 = t2.closest("." + o2.classNames.tag), l2 = w(r2), d2 = this.input.normalize.call(this, t2), c2 = (U(n2 = {}, o2.tagTextProp, d2), U(n2, "__tagId", l2.__tagId), n2), u2 = l2.__originalData, h2 = this.editTagChangeDetected(g(l2, c2)), p2 = this.validateTag(c2);
        if (d2)
          if (h2) {
            var f2;
            if (s2 = this.hasMaxTags(), a2 = g({}, u2, (U(f2 = {}, o2.tagTextProp, this.trim(d2)), U(f2, "__isValid", p2), f2)), o2.transformTag.call(this, a2, u2), true !== (p2 = (!s2 || true === u2.__isValid) && this.validateTag(a2))) {
              if (this.trigger("invalid", { data: a2, tag: r2, message: p2 }), o2.editTags.keepInvalid)
                return;
              o2.keepInvalidTags ? a2.__isValid = p2 : a2 = u2;
            } else
              o2.keepInvalidTags && (delete a2.title, delete a2["aria-invalid"], delete a2.class);
            this.onEditTagDone(r2, a2);
          } else
            this.onEditTagDone(r2, u2);
        else
          this.onEditTagDone(r2);
      }
    }, onEditTagkeydown: function(t2, e2) {
      if (!this.state.composing)
        switch (this.trigger("edit:keydown", { event: t2 }), t2.key) {
          case "Esc":
          case "Escape":
            this.state.editing = false, !!e2.__tagifyTagData.__originalData.value ? e2.parentNode.replaceChild(e2.__tagifyTagData.__originalHTML, e2) : e2.remove();
            break;
          case "Enter":
          case "Tab":
            t2.preventDefault();
            setTimeout(function() {
              return t2.target.blur();
            }, 0);
        }
    }, onDoubleClickScope: function(t2) {
      var e2, i2, n2 = t2.target.closest("." + this.settings.classNames.tag), s2 = w(n2), a2 = this.settings;
      n2 && false !== s2.editable && (e2 = n2.classList.contains(this.settings.classNames.tagEditing), i2 = n2.hasAttribute("readonly"), a2.readonly || e2 || i2 || !this.settings.editTags || !a2.userInput || this.editTag(n2), this.toggleFocusClass(true), "select" != a2.mode && this.trigger("dblclick", { tag: n2, index: this.getNodeIndex(n2), data: w(n2) }));
    }, onInputDOMChange: function(t2) {
      var e2 = this;
      t2.forEach(function(t3) {
        t3.addedNodes.forEach(function(t4) {
          if ("<div><br></div>" == t4.outerHTML)
            t4.replaceWith(document.createElement("br"));
          else if (1 == t4.nodeType && t4.querySelector(e2.settings.classNames.tagSelector)) {
            var i3, n2 = document.createTextNode("");
            3 == t4.childNodes[0].nodeType && "BR" != t4.previousSibling.nodeName && (n2 = document.createTextNode("\n")), (i3 = t4).replaceWith.apply(i3, z([n2].concat(z(z(t4.childNodes).slice(0, -1))))), T(n2);
          } else if (v.call(e2, t4)) {
            var s2;
            if (3 != (null === (s2 = t4.previousSibling) || void 0 === s2 ? void 0 : s2.nodeType) || t4.previousSibling.textContent || t4.previousSibling.remove(), t4.previousSibling && "BR" == t4.previousSibling.nodeName) {
              t4.previousSibling.replaceWith("\n​");
              for (var a2 = t4.nextSibling, o2 = ""; a2; )
                o2 += a2.textContent, a2 = a2.nextSibling;
              o2.trim() && T(t4.previousSibling);
            } else
              t4.previousSibling && !w(t4.previousSibling) || t4.before("​");
          }
        }), t3.removedNodes.forEach(function(t4) {
          t4 && "BR" == t4.nodeName && v.call(e2, i2) && (e2.removeTags(i2), e2.fixFirefoxLastTagNoCaret());
        });
      });
      var i2 = this.DOM.input.lastChild;
      i2 && "" == i2.nodeValue && i2.remove(), i2 && "BR" == i2.nodeName || this.DOM.input.appendChild(document.createElement("br"));
    } } };
    function J(t2, e2) {
      (null == e2 || e2 > t2.length) && (e2 = t2.length);
      for (var i2 = 0, n2 = new Array(e2); i2 < e2; i2++)
        n2[i2] = t2[i2];
      return n2;
    }
    function G(t2, e2, i2) {
      return e2 in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
    }
    function $2(t2, e2) {
      return null != e2 && "undefined" != typeof Symbol && e2[Symbol.hasInstance] ? !!e2[Symbol.hasInstance](t2) : t2 instanceof e2;
    }
    function Q(t2) {
      for (var e2 = 1; e2 < arguments.length; e2++) {
        var i2 = null != arguments[e2] ? arguments[e2] : {}, n2 = Object.keys(i2);
        "function" == typeof Object.getOwnPropertySymbols && (n2 = n2.concat(Object.getOwnPropertySymbols(i2).filter(function(t3) {
          return Object.getOwnPropertyDescriptor(i2, t3).enumerable;
        }))), n2.forEach(function(e3) {
          G(t2, e3, i2[e3]);
        });
      }
      return t2;
    }
    function Y(t2) {
      return function(t3) {
        if (Array.isArray(t3))
          return J(t3);
      }(t2) || function(t3) {
        if ("undefined" != typeof Symbol && null != t3[Symbol.iterator] || null != t3["@@iterator"])
          return Array.from(t3);
      }(t2) || function(t3, e2) {
        if (!t3)
          return;
        if ("string" == typeof t3)
          return J(t3, e2);
        var i2 = Object.prototype.toString.call(t3).slice(8, -1);
        "Object" === i2 && t3.constructor && (i2 = t3.constructor.name);
        if ("Map" === i2 || "Set" === i2)
          return Array.from(i2);
        if ("Arguments" === i2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i2))
          return J(t3, e2);
      }(t2) || function() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }();
    }
    function Z(t2, e2) {
      if (!t2) {
        n.warn("input element not found", t2);
        var i2 = new Proxy(this, { get: function() {
          return function() {
            return i2;
          };
        } });
        return i2;
      }
      if (t2.__tagify)
        return n.warn("input element is already Tagified - Same instance is returned.", t2), t2.__tagify;
      var s2;
      g(this, function(t3) {
        var e3 = document.createTextNode(""), i3 = {};
        function s3(t4, i4, n2) {
          n2 && i4.split(/\s+/g).forEach(function(i5) {
            return e3[t4 + "EventListener"].call(e3, i5, n2);
          });
        }
        return { removeAllCustomListeners: function() {
          Object.entries(i3).forEach(function(t4) {
            var e4 = B(t4, 2), i4 = e4[0];
            e4[1].forEach(function(t5) {
              return s3("remove", i4, t5);
            });
          }), i3 = {};
        }, off: function(t4, e4) {
          return t4 && (e4 ? s3("remove", t4, e4) : t4.split(/\s+/g).forEach(function(t5) {
            var e5;
            null === (e5 = i3[t5]) || void 0 === e5 || e5.forEach(function(e6) {
              return s3("remove", t5, e6);
            }), delete i3[t5];
          })), this;
        }, on: function(t4, e4) {
          return e4 && "function" == typeof e4 && (t4.split(/\s+/g).forEach(function(t5) {
            Array.isArray(i3[t5]) ? i3[t5].push(e4) : i3[t5] = [e4];
          }), s3("add", t4, e4)), this;
        }, trigger: function(i4, s4, a2) {
          var o2;
          if (a2 = a2 || { cloneData: true }, i4)
            if (t3.settings.isJQueryPlugin)
              "remove" == i4 && (i4 = "removeTag"), jQuery(t3.DOM.originalInput).triggerHandler(i4, [s4]);
            else {
              try {
                var r2 = "object" == typeof s4 ? s4 : { value: s4 };
                if ((r2 = a2.cloneData ? g({}, r2) : r2).tagify = this, s4.event && (r2.event = this.cloneEvent(s4.event)), H(s4, Object))
                  for (var l2 in s4)
                    H(s4[l2], HTMLElement) && (r2[l2] = s4[l2]);
                o2 = new CustomEvent(i4, { detail: r2 });
              } catch (t4) {
                n.warn(t4);
              }
              e3.dispatchEvent(o2);
            }
        } };
      }(this)), this.isFirefox = /firefox|fxios/i.test(navigator.userAgent) && !/seamonkey/i.test(navigator.userAgent), this.isIE = window.document.documentMode, e2 = e2 || {}, this.getPersistedData = (s2 = e2.id, function(t3) {
        var e3, i3 = "/" + t3;
        if (1 == localStorage.getItem(j + s2 + "/v", 1))
          try {
            e3 = JSON.parse(localStorage[j + s2 + i3]);
          } catch (t4) {
          }
        return e3;
      }), this.setPersistedData = function(t3) {
        return t3 ? (localStorage.setItem(j + t3 + "/v", 1), function(e3, i3) {
          var n2 = "/" + i3, s3 = JSON.stringify(e3);
          e3 && i3 && (localStorage.setItem(j + t3 + n2, s3), dispatchEvent(new Event("storage")));
        }) : function() {
        };
      }(e2.id), this.clearPersistedData = /* @__PURE__ */ function(t3) {
        return function(e3) {
          var i3 = j + "/" + t3 + "/";
          if (e3)
            localStorage.removeItem(i3 + e3);
          else
            for (var n2 in localStorage)
              n2.includes(i3) && localStorage.removeItem(n2);
        };
      }(e2.id), this.applySettings(t2, e2), this.state = { inputText: "", editing: false, composing: false, actions: {}, mixMode: {}, dropdown: {}, flaggedTags: {} }, this.value = [], this.listeners = {}, this.DOM = {}, this.build(t2), A.call(this), this.getCSSVars(), this.loadOriginalValues(), this.events.customBinding.call(this), this.events.binding.call(this), t2.autofocus && this.DOM.input.focus(), t2.__tagify = this;
    }
    return Z.prototype = { _dropdown: P, placeCaretAfterNode: T, getSetTagData: w, helpers: { sameStr: s, removeCollectionProp: a, omit: o, isObject: u, parseHTML: l, escapeHTML: c, extend: g, concatWithoutDups: h, getUID: m, isNodeTag: v }, customEventsList: ["change", "add", "remove", "invalid", "input", "paste", "click", "keydown", "focus", "blur", "edit:input", "edit:beforeUpdate", "edit:updated", "edit:start", "edit:keydown", "dropdown:show", "dropdown:hide", "dropdown:select", "dropdown:updated", "dropdown:noMatch", "dropdown:scroll"], dataProps: ["__isValid", "__removed", "__originalData", "__originalHTML", "__tagId"], trim: function(t2) {
      return this.settings.trim && t2 && "string" == typeof t2 ? t2.trim() : t2;
    }, parseHTML: l, templates: R, parseTemplate: function(t2, e2) {
      return l((t2 = this.settings.templates[t2] || t2).apply(this, e2));
    }, set whitelist(t2) {
      var e2 = t2 && Array.isArray(t2);
      this.settings.whitelist = e2 ? t2 : [], this.setPersistedData(e2 ? t2 : [], "whitelist");
    }, get whitelist() {
      return this.settings.whitelist;
    }, set userInput(t2) {
      this.settings.userInput = !!t2, this.setContentEditable(!!t2);
    }, get userInput() {
      return this.settings.userInput;
    }, generateClassSelectors: function(t2) {
      var e2 = function(e3) {
        var i3 = e3;
        Object.defineProperty(t2, i3 + "Selector", { get: function() {
          return "." + this[i3].split(" ")[0];
        } });
      };
      for (var i2 in t2)
        e2(i2);
    }, applySettings: function(t2, e2) {
      var i2, n2;
      x.templates = this.templates;
      var s2 = g({}, x, "mix" == e2.mode ? { dropdown: { position: "text" } } : {}), a2 = this.settings = g({}, s2, e2);
      if (a2.disabled = t2.hasAttribute("disabled"), a2.readonly = a2.readonly || t2.hasAttribute("readonly"), a2.placeholder = c(t2.getAttribute("placeholder") || a2.placeholder || ""), a2.required = t2.hasAttribute("required"), this.generateClassSelectors(a2.classNames), void 0 === a2.dropdown.includeSelectedTags && (a2.dropdown.includeSelectedTags = a2.duplicates), this.isIE && (a2.autoComplete = false), ["whitelist", "blacklist"].forEach(function(e3) {
        var i3 = t2.getAttribute("data-" + e3);
        i3 && $2(i3 = i3.split(a2.delimiters), Array) && (a2[e3] = i3);
      }), "autoComplete" in e2 && !u(e2.autoComplete) && (a2.autoComplete = x.autoComplete, a2.autoComplete.enabled = e2.autoComplete), "mix" == a2.mode && (a2.pattern = a2.pattern || /@/, a2.autoComplete.rightKey = true, a2.delimiters = e2.delimiters || null, a2.tagTextProp && !a2.dropdown.searchKeys.includes(a2.tagTextProp) && a2.dropdown.searchKeys.push(a2.tagTextProp)), t2.pattern)
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
      a2.disabled && (a2.userInput = false), this.TEXTS = Q({}, V, a2.texts || {}), ("select" != a2.mode || (null === (i2 = e2.dropdown) || void 0 === i2 ? void 0 : i2.enabled)) && a2.userInput || (a2.dropdown.enabled = 0), a2.dropdown.appendTarget = (null === (n2 = e2.dropdown) || void 0 === n2 ? void 0 : n2.appendTarget) || document.body;
      var o2 = this.getPersistedData("whitelist");
      Array.isArray(o2) && (this.whitelist = Array.isArray(a2.whitelist) ? h(a2.whitelist, o2) : o2);
    }, getAttributes: function(t2) {
      var e2, i2 = this.getCustomAttributes(t2), n2 = "";
      for (e2 in i2)
        n2 += " " + e2 + (void 0 !== t2[e2] ? '="'.concat(i2[e2], '"') : "");
      return n2;
    }, getCustomAttributes: function(t2) {
      if (!u(t2))
        return "";
      var e2, i2 = {};
      for (e2 in t2)
        "__" != e2.slice(0, 2) && "class" != e2 && t2.hasOwnProperty(e2) && void 0 !== t2[e2] && (i2[e2] = c(t2[e2]));
      return i2;
    }, setStateSelection: function() {
      var t2 = window.getSelection(), e2 = { anchorOffset: t2.anchorOffset, anchorNode: t2.anchorNode, range: t2.getRangeAt && t2.rangeCount && t2.getRangeAt(0) };
      return this.state.selection = e2, e2;
    }, getCSSVars: function() {
      var t2, e2, i2, n2 = getComputedStyle(this.DOM.scope, null);
      this.CSSVars = { tagHideTransition: (t2 = function(t3) {
        if (!t3)
          return {};
        var e3 = (t3 = t3.trim().split(" ")[0]).split(/\d+/g).filter(function(t4) {
          return t4;
        }).pop().trim();
        return { value: +t3.split(e3).filter(function(t4) {
          return t4;
        })[0].trim(), unit: e3 };
      }((i2 = "tag-hide-transition", n2.getPropertyValue("--" + i2))), e2 = t2.value, "s" == t2.unit ? 1e3 * e2 : e2) };
    }, build: function(t2) {
      var e2 = this.DOM, i2 = t2.closest("label");
      this.settings.mixMode.integrated ? (e2.originalInput = null, e2.scope = t2, e2.input = t2) : (e2.originalInput = t2, e2.originalInput_tabIndex = t2.tabIndex, e2.scope = this.parseTemplate("wrapper", [t2, this.settings]), e2.input = e2.scope.querySelector(this.settings.classNames.inputSelector), t2.parentNode.insertBefore(e2.scope, t2), t2.tabIndex = -1), i2 && i2.setAttribute("for", "");
    }, destroy: function() {
      this.events.unbindGlobal.call(this), this.DOM.scope.parentNode.removeChild(this.DOM.scope), this.DOM.originalInput.tabIndex = this.DOM.originalInput_tabIndex, delete this.DOM.originalInput.__tagify, this.dropdown.hide(true), this.removeAllCustomListeners(), clearTimeout(this.dropdownHide__bindEventsTimeout), clearInterval(this.listeners.main.originalInputValueObserverInterval);
    }, loadOriginalValues: function(t2) {
      var e2, i2 = this.settings;
      if (this.state.blockChangeEvent = true, void 0 === t2) {
        var n2 = this.getPersistedData("value");
        t2 = n2 && !this.DOM.originalInput.value ? n2 : i2.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value;
      }
      if (this.removeAllTags(), t2)
        if ("mix" == i2.mode)
          this.parseMixTags(t2), (e2 = this.DOM.input.lastChild) && "BR" == e2.tagName || this.DOM.input.insertAdjacentHTML("beforeend", "<br>");
        else {
          try {
            $2(JSON.parse(t2), Array) && (t2 = JSON.parse(t2));
          } catch (t3) {
          }
          this.addTags(t2, true).forEach(function(t3) {
            return t3 && t3.classList.add(i2.classNames.tagNoAnimation);
          });
        }
      else
        this.postUpdate();
      this.state.lastOriginalValueReported = i2.mixMode.integrated ? "" : this.DOM.originalInput.value;
    }, cloneEvent: function(t2) {
      var e2 = {};
      for (var i2 in t2)
        "path" != i2 && (e2[i2] = t2[i2]);
      return e2;
    }, loading: function(t2) {
      return this.state.isLoading = t2, this.DOM.scope.classList[t2 ? "add" : "remove"](this.settings.classNames.scopeLoading), this;
    }, tagLoading: function(t2, e2) {
      return t2 && t2.classList[e2 ? "add" : "remove"](this.settings.classNames.tagLoading), this;
    }, toggleClass: function(t2, e2) {
      "string" == typeof t2 && this.DOM.scope.classList.toggle(t2, e2);
    }, toggleScopeValidation: function(t2) {
      var e2 = true === t2 || void 0 === t2;
      !this.settings.required && t2 && t2 === this.TEXTS.empty && (e2 = true), this.toggleClass(this.settings.classNames.tagInvalid, !e2), this.DOM.scope.title = e2 ? "" : t2;
    }, toggleFocusClass: function(t2) {
      this.toggleClass(this.settings.classNames.focus, !!t2);
    }, setPlaceholder: function(t2) {
      var e2 = this;
      ["data", "aria"].forEach(function(i2) {
        return e2.DOM.input.setAttribute("".concat(i2, "-placeholder"), t2);
      });
    }, triggerChangeEvent: function() {
      if (!this.settings.mixMode.integrated) {
        var t2 = this.DOM.originalInput, e2 = this.state.lastOriginalValueReported !== t2.value, i2 = new CustomEvent("change", { bubbles: true });
        e2 && (this.state.lastOriginalValueReported = t2.value, i2.simulated = true, t2._valueTracker && t2._valueTracker.setValue(Math.random()), t2.dispatchEvent(i2), this.trigger("change", this.state.lastOriginalValueReported), t2.value = this.state.lastOriginalValueReported);
      }
    }, events: X, fixFirefoxLastTagNoCaret: function() {
    }, setRangeAtStartEnd: function(t2, e2) {
      if (e2) {
        t2 = "number" == typeof t2 ? t2 : !!t2, e2 = e2.lastChild || e2;
        var i2 = document.getSelection();
        if ($2(i2.focusNode, Element) && !this.DOM.input.contains(i2.focusNode))
          return true;
        try {
          i2.rangeCount >= 1 && ["Start", "End"].forEach(function(n2) {
            return i2.getRangeAt(0)["set" + n2](e2, t2 || e2.length);
          });
        } catch (t3) {
          console.warn(t3);
        }
      }
    }, insertAfterTag: function(t2, e2) {
      if (e2 = e2 || this.settings.mixMode.insertAfterTag, t2 && t2.parentNode && e2)
        return e2 = "string" == typeof e2 ? document.createTextNode(e2) : e2, t2.parentNode.insertBefore(e2, t2.nextSibling), e2;
    }, editTagChangeDetected: function(t2) {
      var e2 = t2.__originalData;
      for (var i2 in e2)
        if (!this.dataProps.includes(i2) && t2[i2] != e2[i2])
          return true;
      return false;
    }, getTagTextNode: function(t2) {
      return t2.querySelector(this.settings.classNames.tagTextSelector);
    }, setTagTextNode: function(t2, e2) {
      this.getTagTextNode(t2).innerHTML = c(e2);
    }, editTag: function(t2, e2) {
      var i2 = this;
      t2 = t2 || this.getLastTag(), e2 = e2 || {};
      var s2 = this.settings, a2 = this.getTagTextNode(t2), o2 = this.getNodeIndex(t2), r2 = w(t2), l2 = this.events.callbacks, d2 = true;
      if ("select" != s2.mode && this.dropdown.hide(), a2) {
        if (!$2(r2, Object) || !("editable" in r2) || r2.editable)
          return r2 = w(t2, { __originalData: g({}, r2), __originalHTML: t2.cloneNode(true) }), w(r2.__originalHTML, r2.__originalData), a2.setAttribute("contenteditable", true), t2.classList.add(s2.classNames.tagEditing), a2.addEventListener("click", l2.onEditTagClick.bind(this, t2)), a2.addEventListener("blur", l2.onEditTagBlur.bind(this, this.getTagTextNode(t2))), a2.addEventListener("input", l2.onEditTagInput.bind(this, a2)), a2.addEventListener("paste", l2.onEditTagPaste.bind(this, a2)), a2.addEventListener("keydown", function(e3) {
            return l2.onEditTagkeydown.call(i2, e3, t2);
          }), a2.addEventListener("compositionstart", l2.onCompositionStart.bind(this)), a2.addEventListener("compositionend", l2.onCompositionEnd.bind(this)), e2.skipValidation || (d2 = this.editTagToggleValidity(t2)), a2.originalIsValid = d2, this.trigger("edit:start", { tag: t2, index: o2, data: r2, isValid: d2 }), a2.focus(), this.setRangeAtStartEnd(false, a2), 0 === s2.dropdown.enabled && this.dropdown.show(), this.state.hasFocus = true, this;
      } else
        n.warn("Cannot find element in Tag template: .", s2.classNames.tagTextSelector);
    }, editTagToggleValidity: function(t2, e2) {
      var i2;
      if (e2 = e2 || w(t2))
        return (i2 = !("__isValid" in e2) || true === e2.__isValid) || this.removeTagsFromValue(t2), this.update(), t2.classList.toggle(this.settings.classNames.tagNotAllowed, !i2), e2.__isValid = i2, e2.__isValid;
      n.warn("tag has no data: ", t2, e2);
    }, onEditTagDone: function(t2, e2) {
      t2 = t2 || this.state.editing.scope, e2 = e2 || {};
      var i2, n2, s2 = { tag: t2, index: this.getNodeIndex(t2), previousData: w(t2), data: e2 }, a2 = this.settings;
      this.trigger("edit:beforeUpdate", s2, { cloneData: false }), this.state.editing = false, delete e2.__originalData, delete e2.__originalHTML, t2 && (void 0 !== (n2 = e2[a2.tagTextProp]) ? null === (i2 = (n2 += "").trim) || void 0 === i2 ? void 0 : i2.call(n2) : a2.tagTextProp in e2 ? void 0 : e2.value) ? (t2 = this.replaceTag(t2, e2), this.editTagToggleValidity(t2, e2), a2.a11y.focusableTags ? t2.focus() : T(t2)) : t2 && this.removeTags(t2), this.trigger("edit:updated", s2), this.dropdown.hide(), this.settings.keepInvalidTags && this.reCheckInvalidTags();
    }, replaceTag: function(t2, e2) {
      e2 && "" !== e2.value && void 0 !== e2.value || (e2 = t2.__tagifyTagData), e2.__isValid && 1 != e2.__isValid && g(e2, this.getInvalidTagAttrs(e2, e2.__isValid));
      var i2 = this.createTagElem(e2);
      return t2.parentNode.replaceChild(i2, t2), this.updateValueByDOMTags(), i2;
    }, updateValueByDOMTags: function() {
      var t2 = this;
      this.value.length = 0, [].forEach.call(this.getTagElms(), function(e2) {
        e2.classList.contains(t2.settings.classNames.tagNotAllowed.split(" ")[0]) || t2.value.push(w(e2));
      }), this.update();
    }, injectAtCaret: function(t2, e2) {
      var i2;
      if (!(e2 = e2 || (null === (i2 = this.state.selection) || void 0 === i2 ? void 0 : i2.range)) && t2)
        return this.appendMixTags(t2), this;
      var n2 = y(t2, e2);
      return this.setRangeAtStartEnd(false, n2), this.updateValueByDOMTags(), this.update(), this;
    }, input: { set: function() {
      var t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "", e2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.settings.dropdown.closeOnSelect;
      this.state.inputText = t2, e2 && (this.DOM.input.innerHTML = c("" + t2)), !t2 && i2 && this.dropdown.hide.bind(this), this.input.autocomplete.suggest.call(this), this.input.validate.call(this);
    }, raw: function() {
      return this.DOM.input.textContent;
    }, validate: function() {
      var t2 = !this.state.inputText || true === this.validateTag({ value: this.state.inputText });
      return this.DOM.input.classList.toggle(this.settings.classNames.inputInvalid, !t2), t2;
    }, normalize: function(t2, e2) {
      var i2 = t2 || this.DOM.input, n2 = [];
      i2.childNodes.forEach(function(t3) {
        return 3 == t3.nodeType && n2.push(t3.nodeValue);
      }), n2 = n2.join("\n");
      try {
        n2 = n2.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0));
      } catch (t3) {
      }
      return n2 = n2.replace(/\s/g, " "), (null == e2 ? void 0 : e2.trim) ? this.trim(n2) : n2;
    }, autocomplete: { suggest: function(t2) {
      if (this.settings.autoComplete.enabled) {
        "object" != typeof (t2 = t2 || { value: "" }) && (t2 = { value: t2 });
        var e2 = this.dropdown.getMappedValue(t2);
        if ("number" != typeof e2) {
          var i2 = this.state.inputText.toLowerCase(), n2 = e2.substr(0, this.state.inputText.length).toLowerCase(), s2 = e2.substring(this.state.inputText.length);
          e2 && this.state.inputText && n2 == i2 ? (this.DOM.input.setAttribute("data-suggest", s2), this.state.inputSuggestion = t2) : (this.DOM.input.removeAttribute("data-suggest"), delete this.state.inputSuggestion);
        }
      }
    }, set: function(t2) {
      var e2 = this.DOM.input.getAttribute("data-suggest"), i2 = t2 || (e2 ? this.state.inputText + e2 : null);
      return !!i2 && ("mix" == this.settings.mode ? this.replaceTextWithNode(document.createTextNode(this.state.tag.prefix + i2)) : (this.input.set.call(this, i2), this.setRangeAtStartEnd(false, this.DOM.input)), this.input.autocomplete.suggest.call(this), this.dropdown.hide(), true);
    } } }, getTagIdx: function(t2) {
      return this.value.findIndex(function(e2) {
        return e2.__tagId == (t2 || {}).__tagId;
      });
    }, getNodeIndex: function(t2) {
      var e2 = 0;
      if (t2)
        for (; t2 = t2.previousElementSibling; )
          e2++;
      return e2;
    }, getTagElms: function() {
      for (var t2 = arguments.length, e2 = new Array(t2), i2 = 0; i2 < t2; i2++)
        e2[i2] = arguments[i2];
      var n2 = "." + Y(this.settings.classNames.tag.split(" ")).concat(Y(e2)).join(".");
      return [].slice.call(this.DOM.scope.querySelectorAll(n2));
    }, getLastTag: function() {
      var t2 = this.DOM.scope.querySelectorAll("".concat(this.settings.classNames.tagSelector, ":not(.").concat(this.settings.classNames.tagHide, "):not([readonly])"));
      return t2[t2.length - 1];
    }, isTagDuplicate: function(t2, e2, i2) {
      var n2 = 0;
      if ("select" == this.settings.mode)
        return false;
      var a2 = true, o2 = false, r2 = void 0;
      try {
        for (var l2, d2 = this.value[Symbol.iterator](); !(a2 = (l2 = d2.next()).done); a2 = true) {
          var c2 = l2.value;
          s(this.trim("" + t2), c2.value, e2) && i2 != c2.__tagId && n2++;
        }
      } catch (t3) {
        o2 = true, r2 = t3;
      } finally {
        try {
          a2 || null == d2.return || d2.return();
        } finally {
          if (o2)
            throw r2;
        }
      }
      return n2;
    }, getTagIndexByValue: function(t2) {
      var e2 = this, i2 = [], n2 = this.settings.dropdown.caseSensitive;
      return this.getTagElms().forEach(function(a2, o2) {
        a2.__tagifyTagData && s(e2.trim(a2.__tagifyTagData.value), t2, n2) && i2.push(o2);
      }), i2;
    }, getTagElmByValue: function(t2) {
      var e2 = this.getTagIndexByValue(t2)[0];
      return this.getTagElms()[e2];
    }, flashTag: function(t2) {
      var e2 = this;
      t2 && (t2.classList.add(this.settings.classNames.tagFlash), setTimeout(function() {
        t2.classList.remove(e2.settings.classNames.tagFlash);
      }, 100));
    }, isTagBlacklisted: function(t2) {
      return t2 = this.trim(t2.toLowerCase()), this.settings.blacklist.filter(function(e2) {
        return ("" + e2).toLowerCase() == t2;
      }).length;
    }, isTagWhitelisted: function(t2) {
      return !!this.getWhitelistItem(t2);
    }, getWhitelistItem: function(t2, e2, i2) {
      e2 = e2 || "value";
      var n2, a2 = this.settings;
      return (i2 = i2 || a2.whitelist).some(function(i3) {
        var o2 = "string" == typeof i3 ? i3 : i3[e2] || i3.value;
        if (s(o2, t2, a2.dropdown.caseSensitive, a2.trim))
          return n2 = "string" == typeof i3 ? { value: i3 } : i3, true;
      }), n2 || "value" != e2 || "value" == a2.tagTextProp || (n2 = this.getWhitelistItem(t2, a2.tagTextProp, i2)), n2;
    }, validateTag: function(t2) {
      var e2 = this.settings, i2 = "value" in t2 ? "value" : e2.tagTextProp, n2 = this.trim(t2[i2] + "");
      return (t2[i2] + "").trim() ? "mix" != e2.mode && e2.pattern && $2(e2.pattern, RegExp) && !e2.pattern.test(n2) ? this.TEXTS.pattern : !e2.duplicates && this.isTagDuplicate(n2, e2.dropdown.caseSensitive, t2.__tagId) ? this.TEXTS.duplicate : this.isTagBlacklisted(n2) || e2.enforceWhitelist && !this.isTagWhitelisted(n2) ? this.TEXTS.notAllowed : !e2.validate || e2.validate(t2) : this.TEXTS.empty;
    }, getInvalidTagAttrs: function(t2, e2) {
      return { "aria-invalid": true, class: "".concat(t2.class || "", " ").concat(this.settings.classNames.tagNotAllowed).trim(), title: e2 };
    }, hasMaxTags: function() {
      return this.value.length >= this.settings.maxTags && this.TEXTS.exceed;
    }, setReadonly: function(t2, e2) {
      var i2 = this.settings;
      document.activeElement.blur(), i2[e2 || "readonly"] = t2, this.DOM.scope[(t2 ? "set" : "remove") + "Attribute"](e2 || "readonly", true), this.settings.userInput = true, this.setContentEditable(!t2);
    }, setContentEditable: function(t2) {
      this.DOM.input.contentEditable = t2, this.DOM.input.tabIndex = t2 ? 0 : -1;
    }, setDisabled: function(t2) {
      this.setReadonly(t2, "disabled");
    }, normalizeTags: function(t2) {
      var e2 = this, i2 = this.settings, n2 = i2.whitelist, s2 = i2.delimiters, a2 = i2.mode, o2 = i2.tagTextProp, r2 = [], l2 = !!n2 && $2(n2[0], Object), d2 = Array.isArray(t2), c2 = d2 && t2[0].value, u2 = function(t3) {
        return (t3 + "").split(s2).filter(function(t4) {
          return t4;
        }).map(function(t4) {
          var i3;
          return G(i3 = {}, o2, e2.trim(t4)), G(i3, "value", e2.trim(t4)), i3;
        });
      };
      if ("number" == typeof t2 && (t2 = t2.toString()), "string" == typeof t2) {
        if (!t2.trim())
          return [];
        t2 = u2(t2);
      } else if (d2) {
        var g2;
        t2 = (g2 = []).concat.apply(g2, Y(t2.map(function(t3) {
          return null != t3.value ? t3 : u2(t3);
        })));
      }
      return l2 && !c2 && (t2.forEach(function(t3) {
        var i3 = r2.map(function(t4) {
          return t4.value;
        }), n3 = e2.dropdown.filterListItems.call(e2, t3[o2], { exact: true });
        e2.settings.duplicates || (n3 = n3.filter(function(t4) {
          return !i3.includes(t4.value);
        }));
        var s3 = n3.length > 1 ? e2.getWhitelistItem(t3[o2], o2, n3) : n3[0];
        s3 && $2(s3, Object) ? r2.push(s3) : "mix" != a2 && (null == t3.value && (t3.value = t3[o2]), r2.push(t3));
      }), r2.length && (t2 = r2)), t2;
    }, parseMixTags: function(t2) {
      var e2 = this, i2 = this.settings, n2 = i2.mixTagsInterpolator, s2 = i2.duplicates, a2 = i2.transformTag, o2 = i2.enforceWhitelist, r2 = i2.maxTags, l2 = i2.tagTextProp, d2 = [];
      t2 = t2.split(n2[0]).map(function(t3, i3) {
        var c3, u2, g2, h2 = t3.split(n2[1]), p2 = h2[0], f2 = d2.length == r2;
        try {
          if (p2 == +p2)
            throw Error;
          u2 = JSON.parse(p2);
        } catch (t4) {
          u2 = e2.normalizeTags(p2)[0] || { value: p2 };
        }
        if (a2.call(e2, u2), f2 || !(h2.length > 1) || o2 && !e2.isTagWhitelisted(u2.value) || !s2 && e2.isTagDuplicate(u2.value)) {
          if (t3)
            return i3 ? n2[0] + t3 : t3;
        } else
          u2[c3 = u2[l2] ? l2 : "value"] = e2.trim(u2[c3]), g2 = e2.createTagElem(u2), d2.push(u2), g2.classList.add(e2.settings.classNames.tagNoAnimation), h2[0] = g2.outerHTML, e2.value.push(u2);
        return h2.join("");
      }).join(""), this.DOM.input.innerHTML = t2, this.DOM.input.appendChild(document.createTextNode("")), this.DOM.input.normalize();
      var c2 = this.getTagElms();
      return c2.forEach(function(t3, e3) {
        return w(t3, d2[e3]);
      }), this.update({ withoutChangeEvent: true }), O(c2, this.state.hasFocus), t2;
    }, replaceTextWithNode: function(t2, e2) {
      if (this.state.tag || e2) {
        e2 = e2 || this.state.tag.prefix + this.state.tag.value;
        var i2, n2, s2 = this.state.selection || window.getSelection(), a2 = s2.anchorNode, o2 = this.state.tag.delimiters ? this.state.tag.delimiters.length : 0;
        return a2.splitText(s2.anchorOffset - o2), -1 == (i2 = a2.nodeValue.lastIndexOf(e2)) ? true : (n2 = a2.splitText(i2), t2 && a2.parentNode.replaceChild(t2, n2), true);
      }
    }, prepareNewTagNode: function(t2, e2) {
      e2 = e2 || {};
      var i2 = this.settings, n2 = [], s2 = {}, a2 = Object.assign({}, t2, { value: t2.value + "" });
      if (t2 = Object.assign({}, a2), i2.transformTag.call(this, t2), t2.__isValid = this.hasMaxTags() || this.validateTag(t2), true !== t2.__isValid) {
        if (e2.skipInvalid)
          return;
        if (g(s2, this.getInvalidTagAttrs(t2, t2.__isValid), { __preInvalidData: a2 }), t2.__isValid == this.TEXTS.duplicate && this.flashTag(this.getTagElmByValue(t2.value)), !i2.createInvalidTags)
          return void n2.push(t2.value);
      }
      return "readonly" in t2 && (t2.readonly ? s2["aria-readonly"] = true : delete t2.readonly), { tagElm: this.createTagElem(t2, s2), tagData: t2, aggregatedInvalidInput: n2 };
    }, postProcessNewTagNode: function(t2, e2) {
      var i2 = this, n2 = this.settings, s2 = e2.__isValid;
      s2 && true === s2 ? (this.value.push(e2), this.trigger("add", { tag: t2, index: this.value.length - 1, data: e2 })) : (this.trigger("invalid", { data: e2, index: this.value.length, tag: t2, message: s2 }), n2.keepInvalidTags || setTimeout(function() {
        return i2.removeTags(t2, true);
      }, 1e3)), this.dropdown.position();
    }, selectTag: function(t2, e2) {
      var i2 = this;
      if (!this.settings.enforceWhitelist || this.isTagWhitelisted(e2.value)) {
        this.state.actions.selectOption && setTimeout(function() {
          return i2.setRangeAtStartEnd(false, i2.DOM.input);
        });
        var n2 = this.getLastTag();
        return n2 ? this.replaceTag(n2, e2) : this.appendTag(t2), this.value[0] = e2, this.update(), this.trigger("add", { tag: t2, data: e2 }), [t2];
      }
    }, addEmptyTag: function(t2) {
      var e2 = g({ value: "" }, t2 || {}), i2 = this.createTagElem(e2);
      w(i2, e2), this.appendTag(i2), this.editTag(i2, { skipValidation: true }), this.toggleFocusClass(true);
    }, addTags: function(t2, e2, i2) {
      var n2 = this, s2 = [], a2 = this.settings, o2 = [], r2 = document.createDocumentFragment();
      if (!t2 || 0 == t2.length)
        return s2;
      switch (t2 = this.normalizeTags(t2), a2.mode) {
        case "mix":
          return this.addMixTags(t2);
        case "select":
          e2 = false, this.removeAllTags();
      }
      return this.DOM.input.removeAttribute("style"), t2.forEach(function(t3) {
        var e3 = n2.prepareNewTagNode(t3, { skipInvalid: i2 || a2.skipInvalid });
        if (e3) {
          var l2 = e3.tagElm;
          if (t3 = e3.tagData, o2 = e3.aggregatedInvalidInput, s2.push(l2), "select" == a2.mode)
            return n2.selectTag(l2, t3);
          r2.appendChild(l2), n2.postProcessNewTagNode(l2, t3);
        }
      }), this.appendTag(r2), this.update(), t2.length && e2 && (this.input.set.call(this, a2.createInvalidTags ? "" : o2.join(a2._delimiters)), this.setRangeAtStartEnd(false, this.DOM.input)), a2.dropdown.enabled && this.dropdown.refilter(), s2;
    }, addMixTags: function(t2) {
      var e2 = this;
      if ((t2 = this.normalizeTags(t2))[0].prefix || this.state.tag)
        return this.prefixedTextToTag(t2[0]);
      var i2 = document.createDocumentFragment();
      return t2.forEach(function(t3) {
        var n2 = e2.prepareNewTagNode(t3);
        i2.appendChild(n2.tagElm), e2.insertAfterTag(n2.tagElm), e2.postProcessNewTagNode(n2.tagElm, n2.tagData);
      }), this.appendMixTags(i2), i2.children;
    }, appendMixTags: function(t2) {
      var e2 = !!this.state.selection;
      e2 ? this.injectAtCaret(t2) : (this.DOM.input.focus(), (e2 = this.setStateSelection()).range.setStart(this.DOM.input, e2.range.endOffset), e2.range.setEnd(this.DOM.input, e2.range.endOffset), this.DOM.input.appendChild(t2), this.updateValueByDOMTags(), this.update());
    }, prefixedTextToTag: function(t2) {
      var e2, i2, n2, s2 = this, a2 = this.settings, o2 = null === (e2 = this.state.tag) || void 0 === e2 ? void 0 : e2.delimiters;
      if (t2.prefix = t2.prefix || this.state.tag ? this.state.tag.prefix : (a2.pattern.source || a2.pattern)[0], n2 = this.prepareNewTagNode(t2), i2 = n2.tagElm, this.replaceTextWithNode(i2) || this.DOM.input.appendChild(i2), setTimeout(function() {
        return i2.classList.add(s2.settings.classNames.tagNoAnimation);
      }, 300), this.value.push(n2.tagData), this.update(), !o2) {
        var r2 = this.insertAfterTag(i2) || i2;
        setTimeout(T, 0, r2);
      }
      return this.state.tag = null, this.postProcessNewTagNode(i2, n2.tagData), i2;
    }, appendTag: function(t2) {
      var e2 = this.DOM, i2 = e2.input;
      e2.scope.insertBefore(t2, i2);
    }, createTagElem: function(t2, e2) {
      t2.__tagId = m();
      var i2, n2 = g({}, t2, Q({ value: c(t2.value + "") }, e2));
      return function(t3) {
        for (var e3, i3 = document.createNodeIterator(t3, NodeFilter.SHOW_TEXT, null, false); e3 = i3.nextNode(); )
          e3.textContent.trim() || e3.parentNode.removeChild(e3);
      }(i2 = this.parseTemplate("tag", [n2, this])), w(i2, t2), i2;
    }, reCheckInvalidTags: function() {
      var t2 = this, e2 = this.settings;
      this.getTagElms(e2.classNames.tagNotAllowed).forEach(function(i2, n2) {
        var s2 = w(i2), a2 = t2.hasMaxTags(), o2 = t2.validateTag(s2), r2 = true === o2 && !a2;
        if ("select" == e2.mode && t2.toggleScopeValidation(o2), r2)
          return s2 = s2.__preInvalidData ? s2.__preInvalidData : { value: s2.value }, t2.replaceTag(i2, s2);
        i2.title = a2 || o2;
      });
    }, removeTags: function(t2, e2, i2) {
      var n2, s2 = this, a2 = this.settings;
      if (t2 = t2 && $2(t2, HTMLElement) ? [t2] : $2(t2, Array) ? t2 : t2 ? [t2] : [this.getLastTag()], n2 = t2.reduce(function(t3, e3) {
        e3 && "string" == typeof e3 && (e3 = s2.getTagElmByValue(e3));
        var i3 = w(e3);
        return e3 && i3 && !i3.readonly && t3.push({ node: e3, idx: s2.getTagIdx(i3), data: w(e3, { __removed: true }) }), t3;
      }, []), i2 = "number" == typeof i2 ? i2 : this.CSSVars.tagHideTransition, "select" == a2.mode && (i2 = 0, this.input.set.call(this)), 1 == n2.length && "select" != a2.mode && n2[0].node.classList.contains(a2.classNames.tagNotAllowed) && (e2 = true), n2.length)
        return a2.hooks.beforeRemoveTag(n2, { tagify: this }).then(function() {
          var t3 = function(t4) {
            t4.node.parentNode && (t4.node.parentNode.removeChild(t4.node), e2 ? a2.keepInvalidTags && this.trigger("remove", { tag: t4.node, index: t4.idx }) : (this.trigger("remove", { tag: t4.node, index: t4.idx, data: t4.data }), this.dropdown.refilter(), this.dropdown.position(), this.DOM.input.normalize(), a2.keepInvalidTags && this.reCheckInvalidTags()));
          };
          i2 && i2 > 10 && 1 == n2.length ? (function(e3) {
            e3.node.style.width = parseFloat(window.getComputedStyle(e3.node).width) + "px", document.body.clientTop, e3.node.classList.add(a2.classNames.tagHide), setTimeout(t3.bind(this), i2, e3);
          }).call(s2, n2[0]) : n2.forEach(t3.bind(s2)), e2 || (s2.removeTagsFromValue(n2.map(function(t4) {
            return t4.node;
          })), s2.update(), "select" == a2.mode && a2.userInput && s2.setContentEditable(true));
        }).catch(function(t3) {
        });
    }, removeTagsFromDOM: function() {
      this.getTagElms().forEach(function(t2) {
        return t2.remove();
      });
    }, removeTagsFromValue: function(t2) {
      var e2 = this;
      (t2 = Array.isArray(t2) ? t2 : [t2]).forEach(function(t3) {
        var i2 = w(t3), n2 = e2.getTagIdx(i2);
        n2 > -1 && e2.value.splice(n2, 1);
      });
    }, removeAllTags: function(t2) {
      var e2 = this;
      t2 = t2 || {}, this.value = [], "mix" == this.settings.mode ? this.DOM.input.innerHTML = "" : this.removeTagsFromDOM(), this.dropdown.refilter(), this.dropdown.position(), this.state.dropdown.visible && setTimeout(function() {
        e2.DOM.input.focus();
      }), "select" == this.settings.mode && (this.input.set.call(this), this.settings.userInput && this.setContentEditable(true)), this.update(t2);
    }, postUpdate: function() {
      this.state.blockChangeEvent = false;
      var t2, e2, i2 = this.settings, n2 = i2.classNames, s2 = "mix" == i2.mode ? i2.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value.trim() : this.value.length + this.input.raw.call(this).length;
      (this.toggleClass(n2.hasMaxTags, this.value.length >= i2.maxTags), this.toggleClass(n2.hasNoTags, !this.value.length), this.toggleClass(n2.empty, !s2), "select" == i2.mode) && this.toggleScopeValidation(null === (e2 = this.value) || void 0 === e2 || null === (t2 = e2[0]) || void 0 === t2 ? void 0 : t2.__isValid);
    }, setOriginalInputValue: function(t2) {
      var e2 = this.DOM.originalInput;
      this.settings.mixMode.integrated || (e2.value = t2, e2.tagifyValue = e2.value, this.setPersistedData(t2, "value"));
    }, update: function(t2) {
      clearTimeout(this.debouncedUpdateTimeout), this.debouncedUpdateTimeout = setTimeout((function() {
        var e2 = this.getInputValue();
        this.setOriginalInputValue(e2), this.settings.onChangeAfterBlur && (t2 || {}).withoutChangeEvent || this.state.blockChangeEvent || this.triggerChangeEvent();
        this.postUpdate();
      }).bind(this), 100);
    }, getInputValue: function() {
      var t2 = this.getCleanValue();
      return "mix" == this.settings.mode ? this.getMixedTagsAsString(t2) : t2.length ? this.settings.originalInputValueFormat ? this.settings.originalInputValueFormat(t2) : JSON.stringify(t2) : "";
    }, getCleanValue: function(t2) {
      return a(t2 || this.value, this.dataProps);
    }, getMixedTagsAsString: function() {
      var t2 = "", e2 = this, i2 = this.settings, n2 = i2.originalInputValueFormat || JSON.stringify, s2 = i2.mixTagsInterpolator;
      return function i3(a2) {
        a2.childNodes.forEach(function(a3) {
          if (1 == a3.nodeType) {
            var r2 = w(a3);
            if ("BR" == a3.tagName && (t2 += "\r\n"), r2 && v.call(e2, a3)) {
              if (r2.__removed)
                return;
              t2 += s2[0] + n2(o(r2, e2.dataProps)) + s2[1];
            } else
              a3.getAttribute("style") || ["B", "I", "U"].includes(a3.tagName) ? t2 += a3.textContent : "DIV" != a3.tagName && "P" != a3.tagName || (t2 += "\r\n", i3(a3));
          } else
            t2 += a3.textContent;
        });
      }(this.DOM.input), t2;
    } }, Z.prototype.removeTag = Z.prototype.removeTags, Z;
  });
})(tagify_min);
var tagify_minExports = tagify_min.exports;
const Tagify = /* @__PURE__ */ getDefaultExportFromCjs(tagify_minExports);
class AbbrewActorSheet extends ActorSheet {
  constructor() {
    super(...arguments);
    __publicField(this, "skillSectionDisplay", {});
    /* -------------------------------------------- */
    __publicField(this, "updateObjectValueByKey", (obj1, obj2) => {
      var destination = Object.assign({}, obj1);
      Object.keys(obj2).forEach((k) => {
        if (k in destination && k in obj2) {
          destination[k] = obj2[k];
        }
      });
      return destination;
    });
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "actor"],
      width: 750,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "skills"
        }
      ]
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
    const actorData = context.data;
    context.system = actorData.system;
    context.flags = actorData.flags;
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }
    context.rollData = context.actor.getRollData();
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );
    context.config = CONFIG.ABBREW;
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
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    const gear = [];
    const features = [];
    const skills = { background: [], basic: [], path: [], resource: [], temporary: [], untyped: [] };
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
    const anatomy = [];
    const armour = [];
    const weapons = [];
    const equippedWeapons = [];
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === "item") {
        gear.push(i);
      } else if (i.type === "feature") {
        features.push(i);
      } else if (i.type === "skill") {
        switch (i.system.skillType) {
          case "background":
            skills.background.push(i);
            break;
          case "basic":
            skills.basic.push(i);
            break;
          case "path":
            skills.path.push(i);
            break;
          case "resource":
            skills.resource.push(i);
            break;
          case "temporary":
            skills.temporary.push(i);
            break;
          default:
            skills.untyped.push(i);
        }
      } else if (i.type === "anatomy") {
        anatomy.push(i);
      } else if (i.type === "armour") {
        armour.push(i);
      } else if (i.type === "weapon") {
        weapons.push(i);
        if (["held1H", "held2H"].includes(i.system.equipState)) {
          equippedWeapons.push(i);
        }
      } else if (i.type === "spell") {
        if (i.system.spellLevel != void 0) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.skillSections = this.updateObjectValueByKey(this.getSkillSectionDisplays(CONFIG.ABBREW.skillTypes, skills), this.skillSectionDisplay);
    context.skills = skills;
    context.anatomy = anatomy;
    context.armour = armour;
    context.weapons = weapons;
    context.equippedWeapons = equippedWeapons;
  }
  /* -------------------------------------------- */
  getSkillSectionDisplays(skillTypes, skills) {
    return Object.fromEntries(this.getSkillSectionKeys(skillTypes).map((s) => {
      return { "type": s, "display": skills[s].length > 0 ? "grid" : "none" };
    }).map((x) => [x.type, x.display]));
  }
  /* -------------------------------------------- */
  getSkillSectionKeys(skillTypes) {
    return Object.keys(skillTypes);
  }
  /* -------------------------------------------- */
  _activateTraits(html) {
    const traits = html[0].querySelector('input[name="system.traits"]');
    const traitsSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: false,
      // <- Should duplicate tags be allowed or not
      // whitelist: [.../* Object.values( */CONFIG.ABBREW.traits/* ) */.map(trait => game.i18n.localize(trait.name))]
      whitelist: [.../* Object.values( */
      CONFIG.ABBREW.traits.map((trait) => ({
        ...trait,
        value: game.i18n.localize(trait.value)
      }))]
    };
    if (traits) {
      new Tagify(traits, traitsSettings);
    }
  }
  /* -------------------------------------------- */
  _activateFatalWounds(html) {
    const fatalWounds = html[0].querySelector('input[name="system.defense.fatalWounds"]');
    const fatalWoundsSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: false,
      // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.wounds).map((wound) => game.i18n.localize(wound.name))]
    };
    if (fatalWounds) {
      new Tagify(fatalWounds, fatalWoundsSettings);
    }
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".item-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });
    html.on("click", ".skill-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".skill");
      const skill = this.actor.items.get(li.data("skillId"));
      skill.sheet.render(true);
    });
    html.on("click", ".skill-activate", this._onSkillActivate.bind(this));
    if (!this.isEditable)
      return;
    html.on("click", ".item-create", this._onItemCreate.bind(this));
    html.on("click", ".item-delete", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    html.on("click", ".skill-delete", (ev) => {
      const li = $(ev.currentTarget).parents(".skill");
      const skill = this.actor.items.get(li.data("skillId"));
      skill.delete();
      li.slideUp(200, () => this.render(false));
    });
    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document2 = row.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document2);
    });
    html.on("change", ".item-select", this._onItemChange.bind(this));
    html.on("change", '.item input[type="checkbox"]', this._onItemChange.bind(this));
    html.on("click", ".rollable", this._onRoll.bind(this));
    html.on("click", ".attack-damage-button", async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, "attack");
    });
    html.on("click", ".attack-feint-button", async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, "feint");
    });
    html.on("click", ".attack-strong-button", async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, "strong");
    });
    html.on("click", ".attack-finisher-button", async (event) => {
      const t = event.currentTarget;
      await this._onAttackDamageAction(t, "finisher");
    });
    html.on("click", ".skill-header", this._onToggleSkillHeader.bind(this));
    html.on("click", ".wound", this._onWoundClick.bind(this));
    html.on("contextmenu", ".wound", this._onWoundRightClick.bind(this));
    this._activateFatalWounds(html);
    this._activateTraits(html);
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
  async _onItemChange(event) {
    const target = event.target;
    const itemId = target.closest(".item").dataset.itemId;
    const itemValuePath = target.name;
    const item = this.actor.items.get(itemId);
    const value = this._getItemInputValue(target);
    const updates = {};
    updates[itemValuePath] = value;
    await item.update(updates);
  }
  _getItemInputValue(target) {
    switch (target.type) {
      case "checkbox":
        return target.checked;
      default:
        return target.value;
    }
  }
  async _onSkillActivate(event) {
    event.preventDefault();
    const target = event.target.closest(".skill");
    const id = target.dataset.skillId;
    const skill = this.actor.items.get(id).system;
    if (skill.activatable && skill.action.activationType === "standalone") {
      await activateSkill(this.actor, skill);
    }
  }
  _onToggleSkillHeader(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const skillSection = target.nextElementSibling;
    if (skillSection.children.length === 0 || skillSection.style.display === "grid" || skillSection.style.display === "") {
      this.skillSectionDisplay[target.dataset.skillSection] = "none";
      skillSection.style.display = "none";
    } else {
      this.skillSectionDisplay[target.dataset.skillSection] = "grid";
      skillSection.style.display = "grid";
    }
  }
  _onWoundClick(event) {
    this.handleWoundClick(event, 1);
  }
  _onWoundRightClick(event) {
    this.handleWoundClick(event, -1);
  }
  handleWoundClick(event, modification) {
    const woundType = event.currentTarget.dataset.woundType;
    updateActorWounds(this.actor, mergeActorWounds(this.actor, [{ type: woundType, value: modification }]));
  }
  async _onAttackDamageAction(target, attackMode) {
    const itemId = target.closest("li.item").dataset.itemId;
    const attackProfileId = target.closest("li .attack-profile").dataset.attackProfileId;
    const item = this.actor.items.get(itemId);
    const attackProfile = item.system.attackProfiles[attackProfileId];
    const actions = attackMode === "strong" ? item.system.exertActionCost : item.system.actionCost;
    if (!await this.actor.canActorUseActions(actions)) {
      return;
    }
    const roll = new Roll(item.system.formula, item.actor);
    const result = await roll.evaluate();
    const token = this.actor.token;
    const attributeMultiplier = attackMode === "strong" ? Math.max(1, item.system.handsSupplied) : 1;
    const damage = attackProfile.damage.map((d) => {
      let attributeModifier = 0;
      if (d.attributeModifier) {
        attributeModifier = attributeMultiplier * this.actor.system.attributes[d.attributeModifier].value;
      }
      const finalDamage = attributeModifier + d.value;
      return { damageType: d.type, value: finalDamage };
    });
    const resultDice = result.dice[0].results.map((die) => {
      let baseClasses = "roll die d10";
      if (die.success) {
        baseClasses = baseClasses.concat(" ", "success");
      }
      if (die.exploded) {
        baseClasses = baseClasses.concat(" ", "exploded");
      }
      return { result: die.result, classes: baseClasses };
    });
    const totalSuccesses = result.dice[0].results.reduce((total, r) => {
      if (r.success) {
        total += 1;
      }
      return total;
    }, 0);
    const showAttack = ["attack", "feint", "finisher"].includes(attackMode);
    const isFeint = attackMode === "feint";
    const showParry = game.user.targets.some((t) => t.actor.doesActorHaveSkillFlag("Parry"));
    const isStrongAttack = attackMode === "strong";
    const showFinisher = attackMode === "finisher" || totalSuccesses > 0;
    const isFinisher = attackMode === "finisher";
    const templateData = {
      attackProfile,
      totalSuccesses,
      resultDice,
      damage,
      actor: this.actor,
      item: this.item,
      tokenId: (token == null ? void 0 : token.uuid) || null,
      showAttack,
      showFinisher,
      isStrongAttack,
      isFinisher,
      showParry
    };
    const html = await renderTemplate("systems/abbrew/templates/chat/attack-card.hbs", templateData);
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;
    result.toMessage({
      speaker,
      rollMode,
      flavor: label,
      content: html,
      flags: { data: { totalSuccesses, damage, isFeint, isStrongAttack, attackProfile, attackingActor: this.actor } }
    });
    return result;
  }
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name,
      type,
      system: data
    };
    delete itemData.system["type"];
    return await Item.create(itemData, { parent: this.actor });
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    console.log("actor roll");
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item)
          return item.roll();
      }
    }
    if (dataset.roll) {
      let label = dataset.label ? `[attribute] ${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode")
      });
      return roll;
    }
  }
}
class AbbrewItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
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
    const context = super.getData();
    const itemData = context.data;
    context.rollData = this.item.getRollData();
    context.system = itemData.system;
    context.actions = this.prepareActions(itemData.system);
    context.flags = itemData.flags;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.config = CONFIG.ABBREW;
    return context;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable)
      return;
    html.on(
      "click",
      ".effect-control",
      (ev) => onManageActiveEffect(ev, this.item)
    );
    html.find(".damage-reduction-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onDamageReductionAction(t, t.dataset.action);
    });
    html.find(".damage-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onDamageAction(t, t.dataset.action);
    });
    html.find(".attack-profile-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onAttackProfileAction(t, t.dataset.action);
    });
    html.find(".skill-action-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onSkillActionAction(t, t.dataset.action);
    });
    html.find(".skill-action-resource-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onSkillActionResourceRequirementAction(t, t.dataset.action);
    });
    html.find(".skill-action-modifier-wound-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onSkillActionModifierWoundAction(t, t.dataset.action);
    });
    html.find(".skill-action-modifier-damage-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onSkillActionModifierDamageAction(t, t.dataset.action);
    });
    html.find(".skill-configuration-section :input").prop("disabled", !this.item.system.configurable);
    this._activateArmourPoints(html);
    this._activateAnatomyParts(html);
    this._activateSkillFlags(html);
  }
  prepareActions(system) {
    let actions = system.actions;
    return actions;
  }
  _activateArmourPoints(html) {
    const armourPoints = html[0].querySelector('input[name="system.armourPoints"]');
    const armourPointsSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,
      // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.armourPoints.points).map((key2) => game.i18n.localize(key2))]
    };
    if (armourPoints) {
      new Tagify(armourPoints, armourPointsSettings);
    }
  }
  _activateAnatomyParts(html) {
    const anatomyParts = html[0].querySelector('input[name="system.parts"]');
    const anatomyPartsSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,
      // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.armourPoints.points).map((key2) => game.i18n.localize(key2))]
    };
    if (anatomyParts) {
      new Tagify(anatomyParts, anatomyPartsSettings);
    }
  }
  _activateSkillFlags(html) {
    const skillFlags = html[0].querySelector('input[name="system.skillFlags"]');
    const skillFlagSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,
      // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.skillFlags).map((key2) => game.i18n.localize(key2))]
    };
    if (skillFlags) {
      new Tagify(skillFlags, skillFlagSettings);
    }
  }
  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onDamageReductionAction(target, action) {
    switch (action) {
      case "add-damage-reduction":
        return this.addDamageReduction();
      case "remove-damage-reduction":
        return this.removeDamageReduction(target);
    }
  }
  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onDamageAction(target, action) {
    switch (action) {
      case "add-damage":
        return this.addDamage(target);
      case "remove-damage":
        return this.removeDamage(target);
    }
  }
  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onAttackProfileAction(target, action) {
    switch (action) {
      case "add-attack-profile":
        return this.addAttackProfile();
      case "remove-attack-profile":
        return this.removeAttackProfile(target);
    }
  }
  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onSkillActionAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case "add-skill-action":
          return this.addSkillAction();
        case "remove-skill-action":
          return this.removeSkillAction(target);
      }
    }
  }
  /**
    * Handle one of the add or remove damage reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionResourceRequirementAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case "add-skill-action-resource-requirement":
          return this.addSkillActionResourceRequirement(target);
        case "remove-skill-action-resource-requirement":
          return this.removeSkillActionResourceRequirement(target);
      }
    }
  }
  /**
    * Handle one of the add or remove wound reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionModifierWoundAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case "add-skill-action-modifier-wound":
          return this.addSkillActionModifierWound(target);
        case "remove-skill-action-modifier-wound":
          return this.removeSkillActionModifierWound(target);
      }
    }
  }
  addSkillActionModifierWound(target) {
    let action = foundry.utils.deepClone(this.item.system.action);
    action.modifiers.wounds.self = [...action.modifiers.wounds.self, {}];
    return this.item.update({ "system.action": action });
  }
  removeSkillActionModifierWound(target) {
    const id = target.closest("li").dataset.id;
    const action = foundry.utils.deepClone(this.item.system.action);
    action.modifiers.wounds.self.splice(Number(id), 1);
    return this.item.update({ "system.action": action });
  }
  /**
    * Handle one of the add or remove damage reduction buttons.
    * @param {Element} target  Button or context menu entry that triggered this action.
    * @param {string} action   Action being triggered.
    * @returns {Promise|void}
    */
  _onSkillActionModifierDamageAction(target, action) {
    if (this.item.system.configurable) {
      switch (action) {
        case "add-skill-action-modifier-damage":
          return this.addSkillActionModifierDamage(target);
        case "remove-skill-action-modifier-damage":
          return this.removeSkillActionModifierDamage(target);
      }
    }
  }
  addSkillActionModifierDamage(target) {
    const actionId = target.closest(".action").dataset.id;
    let actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].modifiers.damage = [...actions[actionId].modifiers.damage, {}];
    return this.item.update({ "system.actions": actions });
  }
  removeSkillActionModifierDamage(target) {
    const id = target.closest("li").dataset.id;
    const actionId = target.closest(".action").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].modifiers.damage.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }
  addSkillActionResourceRequirement(target) {
    const actionId = target.closest(".action").dataset.id;
    let actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].requirements.resources = [...actions[actionId].requirements.resources, {}];
    return this.item.update({ "system.actions": actions });
  }
  removeSkillActionResourceRequirement(target) {
    const id = target.closest("li").dataset.id;
    const actionId = target.closest(".action").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions[actionId].requirements.resources.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }
  addSkillAction() {
    const actions = this.item.system.actions;
    return this.item.update({ "system.actions": [...actions, {}] });
  }
  removeSkillAction(target) {
    const id = target.closest("li").dataset.id;
    const actions = foundry.utils.deepClone(this.item.system.actions);
    actions.splice(Number(id), 1);
    return this.item.update({ "system.actions": actions });
  }
  addAttackProfile() {
    const attackProfiles = this.item.system.attackProfiles;
    return this.item.update({ "system.attackProfiles": [...attackProfiles, {}] });
  }
  removeAttackProfile(target) {
    const id = target.closest("li").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    attackProfiles.splice(Number(id), 1);
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }
  addDamageReduction() {
    const protection = this.item.system.defense.protection;
    return this.item.update({ "system.defense.protection": [...protection, {}] });
  }
  removeDamageReduction(target) {
    const id = target.closest("li").dataset.id;
    const defense = foundry.utils.deepClone(this.item.system.defense);
    defense.protection.splice(Number(id), 1);
    return this.item.update({ "system.defense.protection": defense.protection });
  }
  addDamage(target) {
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    const damage = attackProfiles[attackProfileId].damage;
    attackProfiles[attackProfileId].damage = [...damage, {}];
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }
  removeDamage(target) {
    const damageId = target.closest("li").dataset.id;
    const attackProfileId = target.closest(".attack-profile").dataset.id;
    const attackProfiles = foundry.utils.deepClone(this.item.system.attackProfiles);
    attackProfiles[attackProfileId].damage.splice(Number(damageId), 1);
    return this.item.update({ "system.attackProfiles": attackProfiles });
  }
}
const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor partials.
    "systems/abbrew/templates/actor/parts/actor-features.hbs",
    "systems/abbrew/templates/actor/parts/actor-items.hbs",
    "systems/abbrew/templates/actor/parts/actor-spells.hbs",
    "systems/abbrew/templates/actor/parts/actor-effects.hbs",
    "systems/abbrew/templates/actor/parts/actor-skills.hbs",
    "systems/abbrew/templates/actor/parts/actor-anatomy.hbs",
    "systems/abbrew/templates/actor/parts/actor-armour.hbs",
    "systems/abbrew/templates/actor/parts/actor-weapons.hbs",
    "systems/abbrew/templates/actor/parts/actor-defenses.hbs",
    // Item partials.
    "systems/abbrew/templates/item/parts/item-effects.hbs",
    "systems/abbrew/templates/item/parts/item-defenses.hbs",
    "systems/abbrew/templates/item/parts/item-damage.hbs",
    "systems/abbrew/templates/item/parts/item-equipstate.hbs",
    // Skill partials.
    "systems/abbrew/templates/item/parts/skill-type.hbs",
    "systems/abbrew/templates/item/parts/skill-actions.hbs",
    "systems/abbrew/templates/item/parts/skill-damage.hbs",
    // Chat Cards.
    "systems/abbrew/templates/chat/attack-card.hbs",
    "systems/abbrew/templates/chat/finisher-card.hbs",
    "systems/abbrew/templates/chat/lost-resolve-card.hbs",
    "systems/abbrew/templates/chat/attack-result-card.hbs"
  ]);
};
const ABBREW = {};
ABBREW.attributes = {
  str: "ABBREW.Attribute.Str.long",
  dex: "ABBREW.Attribute.Dex.long",
  agi: "ABBREW.Attribute.Agi.long",
  con: "ABBREW.Attribute.Con.long",
  int: "ABBREW.Attribute.Int.long",
  wit: "ABBREW.Attribute.Wit.long",
  vis: "ABBREW.Attribute.Vis.long",
  wil: "ABBREW.Attribute.Wil.long"
};
ABBREW.attributeAbbreviations = {
  str: "ABBREW.Attribute.Str.abbr",
  dex: "ABBREW.Attribute.Dex.abbr",
  agi: "ABBREW.Attribute.Agi.abbr",
  con: "ABBREW.Attribute.Con.abbr",
  int: "ABBREW.Attribute.Int.abbr",
  wis: "ABBREW.Attribute.Wis.abbr",
  cha: "ABBREW.Attribute.Cha.abbr",
  vis: "ABBREW.Attribute.Vis.abbr",
  wil: "ABBREW.Attribute.Wil.abbr"
};
ABBREW.HasRequirement = "ABBREW.HasRequirement";
ABBREW.SkillAttributeIncrease = "ABBREW.AttributeIncrease";
ABBREW.skillActivationType = "ABBREW.SkillActivationType";
ABBREW.skillActivationTypes = {
  standalone: "ABBREW.SkillActivationTypes.standalone",
  synergy: "ABBREW.SkillActivationTypes.synergy"
};
ABBREW.EquippedWeapon = "ABBREW.EquippedWeapon";
ABBREW.Damage = "ABBREW.Damage";
ABBREW.operator = "ABBREW.Operator";
ABBREW.operators = {
  equal: "ABBREW.Operators.equal",
  add: "ABBREW.Operators.add"
};
ABBREW.Defense = {
  guard: "ABBREW.Defense.guard"
};
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
};
ABBREW.concepts = {
  physical: "ABBREW.Concepts.physical",
  crushing: "ABBREW.Resistances.crushing",
  piercing: "ABBREW.Resistances.piercing",
  slashing: "ABBREW.Resistances.slashing"
};
ABBREW.facing = {
  front: "ABBREW.Facing.front",
  left: "ABBREW.Facing.left",
  right: "ABBREW.Facing.right",
  back: "ABBREW.Facing.back"
};
ABBREW.attackTypes = {
  arc: "ABBREW.AttackTypes.arc",
  thrust: "ABBREW.AttackTypes.thrust",
  static: "ABBREW.AttackTypes.static"
};
ABBREW.equipState = {
  held1H: "ABBREW.EquipState.heldOne",
  held2H: "ABBREW.EquipState.heldTwo",
  worn: "ABBREW.EquipState.worn",
  stowed: "ABBREW.EquipState.stowed",
  dropped: "ABBREW.EquipState.dropped"
};
ABBREW.wornEquipState = {
  worn: "ABBREW.EquipState.worn",
  stowed: "ABBREW.EquipState.stowed",
  dropped: "ABBREW.EquipState.dropped"
};
ABBREW.skillTypes = {
  basic: "ABBREW.SkillTypes.basic",
  path: "ABBREW.SkillTypes.path",
  resource: "ABBREW.SkillTypes.resource",
  temporary: "ABBREW.SkillTypes.temporary",
  untyped: "ABBREW.SkillTypes.untyped",
  background: "ABBREW.SkillTypes.background"
};
ABBREW.activationTypes = {
  passive: "ABBREW.ActivationTypes.passive",
  active: "ABBREW.ActivationTypes.actve"
};
ABBREW.actionCosts = {
  passive: "ABBREW.ActionCosts.passive",
  one: "ABBREW.ActionCosts.one",
  two: "ABBREW.ActionCosts.two",
  three: "ABBREW.ActionCosts.three",
  reaction: "ABBREW.ActionCosts.reaction",
  other: "ABBREW.ActionCosts.other"
};
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
};
ABBREW.conditions = {
  dead: {
    name: "ABBREW.EFFECT.Condition.Dead.name",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    description: "ABBREW.EFFECT.Condition.Dead.description",
    statuses: ["dead", "defeated"]
  },
  defeated: {
    name: "ABBREW.EFFECT.Condition.Defeated.name",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    description: "ABBREW.EFFECT.Condition.Defeated.description",
    statuses: ["defeated"]
  },
  guardBreak: {
    name: "ABBREW.EFFECT.Condition.GuardBreak.name",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg",
    description: "ABBREW.EFFECT.Condition.GuardBreak.description",
    statuses: ["offGuard"]
  },
  offGuard: {
    name: "ABBREW.EFFECT.Condition.OffGuard.name",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg",
    description: "ABBREW.EFFECT.Condition.OffGuard.description",
    statuses: ["offGuard"]
  }
};
ABBREW.statusEffects = {
  dead: {
    name: "ABBREW.EFFECT.Status.dead",
    img: "systems/abbrew/assets/icons/statuses/dead.svg",
    order: 2,
    statuses: ["defeated"]
  },
  defeated: {
    name: "ABBREW.EFFECT.Status.defeated",
    img: "systems/abbrew/assets/icons/statuses/defeated.svg",
    special: "DEFEATED",
    order: 1
  },
  guardBreak: {
    name: "ABBREW.EFFECT.Status.guardBreak",
    img: "systems/abbrew/assets/icons/statuses/guardBreak.svg"
  },
  offGuard: {
    name: "ABBREW.EFFECT.Status.offGuard",
    img: "systems/abbrew/assets/icons/statuses/offGuard.svg"
  }
};
ABBREW.equipTypes = {
  none: "ABBREW.EquipTypes.none",
  held: "ABBREW.EquipTypes.held",
  worn: "ABBREW.EquipTypes.worn"
};
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
};
ABBREW.traits = [
  { key: "bleedImmunity", value: "ABBREW.Traits.WoundImmunities.bleedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "bleed" },
  { key: "burningImmunity", value: "ABBREW.Traits.WoundImmunities.burningImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "burning" },
  { key: "fatigueImmunity", value: "ABBREW.Traits.WoundImmunities.fatigueImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "fatigue" },
  { key: "dreadImmunity", value: "ABBREW.Traits.WoundImmunities.dreadImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "dread" },
  { key: "enragedImmunity", value: "ABBREW.Traits.WoundImmunities.enragedImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "enraged" },
  { key: "instabilityImmunity", value: "ABBREW.Traits.WoundImmunities.instabilityImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "instability" },
  { key: "sinImmunity", value: "ABBREW.Traits.WoundImmunities.sinImmunity", feature: "wound", subFeature: "lingeringWound", effect: "immunity", data: "sin" }
];
ABBREW.skillFlags = {
  shieldTraining: "ABBREW.SkillFlags.shieldTraining",
  overpower: "ABBREW.SkillFlags.overpower",
  parry: "ABBREW.SkillFlags.parry",
  feint: "ABBREW.SkillFlags.feint"
};
class AbbrewActorBase extends foundry.abstract.TypeDataModel {
  get traitsData() {
    return this.traits !== "" ? JSON.parse(this.traits) : [];
  }
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};
    schema.traits = new fields.StringField({ required: true, blank: true });
    schema.actions = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 5 });
    schema.wounds = new fields.ArrayField(
      new fields.SchemaField({
        type: new fields.StringField({ required: true }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, max: 100 })
      })
    );
    schema.defense = new fields.SchemaField({
      guard: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        label: new fields.StringField({ required: true, blank: true })
      }),
      protection: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ required: true, blank: true }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          label: new fields.StringField({ required: true, blank: true })
        })
      ),
      inflexibility: new fields.SchemaField({
        raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 10, max: 10 }),
        resistance: new fields.SchemaField({
          raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
        })
      }),
      risk: new fields.SchemaField({
        raw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 100 }),
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 10, max: 10 })
      }),
      resolve: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        base: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        max: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 20 }),
        label: new fields.StringField({ required: true, blank: true })
      }),
      fatalWounds: new fields.StringField({ required: true, blank: true })
    });
    schema.biography = new fields.StringField({ required: true, blank: true });
    schema.movement = new fields.SchemaField({
      baseSpeed: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    });
    schema.meta = new fields.SchemaField({
      tier: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1, max: 10 })
      })
    });
    schema.attributes = new fields.SchemaField(Object.keys(CONFIG.ABBREW.attributes).reduce((obj, attribute) => {
      obj[attribute] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 }),
        tier: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 }),
        rank: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        label: new fields.StringField({ required: true, blank: true })
      });
      return obj;
    }, {}));
    schema.momentum = new fields.NumberField({ ...requiredInteger, initial: 0 });
    return schema;
  }
  // Prior to Active Effects
  prepareBaseData() {
    for (const key2 in this.attributes) {
      this.attributes[key2].value = 0 + this.parent.items.filter((i) => i.type === "skill" && i.system.skillType === "background" && i.system.attributeIncrease === key2).length;
      this.attributes[key2].rank = this.attributes[key2].value;
    }
    this.defense.risk.value = Math.floor(this.defense.risk.raw / 10);
    this.defense.resolve.max = 2 + Math.floor((this._getMaxFromPhysicalAttributes() + this._getMaxFromMentalAttributes()) / 2);
  }
  _getMaxFromPhysicalAttributes() {
    return this._getMaxFromAttributes(["str", "con", "dex", "agi"]);
  }
  _getMaxFromMentalAttributes() {
    return this._getMaxFromAttributes(["int", "wil", "vis", "wit"]);
  }
  _getMaxFromAttributes(attributes) {
    return Object.keys(this.attributes).filter((a) => attributes.includes(a)).reduce((result, attribute) => Math.max(result, this.attributes[attribute].value), 0);
  }
  // Post Active Effects
  prepareDerivedData() {
    for (const key2 in this.attributes) {
      const rankBonus = this.attributes[key2].rank;
      this.attributes[key2].label = game.i18n.localize(CONFIG.ABBREW.attributes[key2]) ?? key2;
      this.attributes[key2].rank = rankBonus + this.parent.items.filter((i) => i.type === "skill" && i.system.skillType === "path" && i.system.attributeRankIncrease === key2).length;
      this.attributes[key2].tier = 1 + Math.floor(this.attributes[key2].rank / 10);
    }
    for (const key2 in this.defense.damageTypes) {
    }
    const anatomy = this._prepareAnatomy();
    this._prepareMovement(anatomy);
    this._prepareDefenses();
    this._prepareResolve();
  }
  _prepareAnatomy() {
    const res = this.parent.items.filter((i) => i.type == "anatomy").reduce((result, a) => {
      const values = a.system;
      result.hands += values.hands;
      result.speed += values.speed;
      result.parts = result.parts.concat(JSON.parse(values.parts).map((a2) => a2.value));
      return result;
    }, { hands: 0, speed: 0, parts: [] });
    return res;
  }
  _prepareMovement(anatomy) {
    this.movement.baseSpeed = this.attributes.agi.value * anatomy.speed;
  }
  _prepareDefenses() {
    const armour = this.parent.items.filter((i) => i.type === "armour");
    const anatomy = this.parent.items.filter((i) => i.type === "anatomy");
    const wornArmour = this._getAppliedArmour(armour);
    this._prepareDamageReduction(wornArmour, anatomy);
    this._prepareGuard(wornArmour, anatomy);
    this._prepareInflexibility(wornArmour);
  }
  _getAppliedArmour(armour) {
    const wornArmour = armour.filter((a) => ["worn", "none"].includes(a.system.equipState)).filter((a) => a.system.equipState === "worn");
    const heldArmour = armour.filter((a) => a.system.equipType === "held").filter((a) => a.system.equipState.startsWith("held"));
    return [...wornArmour, ...heldArmour];
  }
  _prepareResolve() {
    const currentResolve = this.defense.resolve.value;
    if (currentResolve > this.defense.resolve.max) {
      this.defense.resolve.value = this.defense.resolve.max;
    }
  }
  _prepareDamageReduction(wornArmour, anatomy) {
    const armour = wornArmour.filter((a) => !a.system.isSundered);
    const armourProtection = armour.map((a) => a.system.defense.protection).flat(1);
    const anatomyProtection = anatomy.map((a) => a.system.defense.protection).flat(1);
    const protection = [...armourProtection, ...anatomyProtection];
    const flatDR = protection.reduce(
      (result, dr) => {
        const drType = dr.type;
        if (Object.keys(result).includes(drType)) {
          result[drType].value += dr.value;
          result[drType].resistance += dr.resistance;
          result[drType].immunity += dr.immunity;
          result[drType].weakness += dr.weakness;
        } else {
          result[drType] = { type: dr.type, value: dr.value, resistance: dr.resistance, immunity: dr.immunity, weakness: dr.weakness, label: dr.label };
        }
        return result;
      },
      {}
    );
    this.defense.protection.length = 0;
    Object.values(flatDR).map((v) => this.defense.protection.push(v));
  }
  _prepareGuard(wornArmour, anatomy) {
    const armour = wornArmour.filter((a) => !a.system.isSundered);
    this.defense.guard.base = this.attributes["wit"].value;
    this.defense.guard.label = game.i18n.localize(CONFIG.ABBREW.Defense.guard) ?? key;
    const guardBonus = armour.map((a) => a.system.defense.guard).reduce((a, b) => a + b, 0);
    this.defense.guard.max = this.defense.guard.base + guardBonus;
    if (this.defense.guard.value > this.defense.guard.max) {
      this.defense.guard.value = this.defense.guard.max;
    }
  }
  _prepareInflexibility(wornArmour) {
    const armour = wornArmour.filter((a) => !a.system.isSundered);
    const armourInflexibility = armour.map((a) => a.system.defense.inflexibility).reduce((a, b) => a + b, 0);
    const wornArmourInflexibility = wornArmour.map((a) => a.system.defense.inflexibility).reduce((a, b) => a + b, 0);
    const weapons = this.parent.items.filter((i) => i.type === "weapon").filter((a) => a.system.equipType === "held").filter((a) => a.system.equipState.startsWith("held"));
    const otherInflexibility = Math.max(0, weapons.reduce((result, w) => result += w.system.weapon.size * 2, 0) - this.attributes["str"].value);
    this.defense.inflexibility.resistance.raw = armourInflexibility;
    this.defense.inflexibility.raw = Math.floor((0 + wornArmourInflexibility + otherInflexibility) / 2);
    this.defense.inflexibility.resistance.value = Math.floor(armourInflexibility / 10);
  }
  getRollData() {
    let data = {};
    if (this.attributes) {
      for (let [k, v] of Object.entries(this.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    data.tier = this.meta.tier.value;
    return data;
  }
}
class AbbrewCharacter extends AbbrewActorBase {
  static defineSchema() {
    foundry.data.fields;
    const schema = super.defineSchema();
    return schema;
  }
  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }
  // Post Active Effects
  prepareDerivedData() {
    super.prepareDerivedData();
  }
  getRollData() {
    const data = super.getRollData();
    return data;
  }
}
class AbbrewNPC extends AbbrewActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();
    schema.cr = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    schema.xp = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    return schema;
  }
  prepareDerivedData() {
    this.xp = this.cr * this.cr * 100;
  }
}
class AbbrewItemBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = {};
    const fields = foundry.data.fields;
    schema.description = new fields.StringField({ required: true, blank: true });
    schema.traits = new fields.StringField({ required: true, blank: true });
    return schema;
  }
  // Prior to Active Effects
  prepareBaseData() {
  }
  // Post Active Effects
  prepareDerivedData() {
  }
  /**
  * Migrate source data from some prior format into a new specification.
  * The source parameter is either original data retrieved from disk or provided by an update operation.
  * @inheritDoc
  */
  static migrateData(source) {
    return super.migrateData(source);
  }
}
let AbbrewItem$1 = class AbbrewItem extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();
    schema.quantity = new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 });
    schema.weight = new fields.NumberField({ required: true, nullable: false, initial: 0, min: 0 });
    schema.roll = new fields.SchemaField({
      diceNum: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 }),
      diceSize: new fields.StringField({ initial: "d20" }),
      diceBonus: new fields.StringField({ initial: "+@str.mod+ceil(@lvl / 2)" })
    });
    schema.formula = new fields.StringField({ blank: true });
    return schema;
  }
  prepareDerivedData() {
    const roll = this.roll;
    this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`;
  }
};
class AbbrewPhysicalItem extends AbbrewItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.equipType = new fields.StringField({ required: true, blank: true });
    schema.armourPoints = new fields.StringField({ required: true, blank: true });
    schema.handsRequired = new fields.StringField({ required: true, blank: true });
    schema.equipState = new fields.StringField({ required: true, blank: false, initial: "stowed" });
    schema.handsSupplied = new fields.NumberField({ ...requiredInteger, initial: 0 });
    schema.actionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
    schema.exertActionCost = new fields.NumberField({ ...requiredInteger, initial: 0 });
    schema.validEquipStates = new fields.ArrayField(
      new fields.SchemaField({
        label: new fields.StringField({ required: true, blank: true }),
        value: new fields.StringField({ required: true, blank: true })
      })
    );
    return schema;
  }
  // Prior to Active Effects
  prepareBaseData() {
    var _a;
    switch (this.equipType) {
      case "none":
        this.clearHeldDetails();
        this.clearWornDetails();
        break;
      case "held":
        this.clearWornDetails();
        break;
      case "worn":
        this.clearHeldDetails();
        break;
    }
    const baseEquipStates = Object.entries(CONFIG.ABBREW.wornEquipState).map((s) => ({ value: s[0], label: s[1] }));
    const validHands = ((_a = CONFIG.ABBREW.hands[this.handsRequired]) == null ? void 0 : _a.states) ?? [];
    const additionalEquipStates = validHands.map((s) => ({ value: s, label: CONFIG.ABBREW.equipState[s] }));
    this.validEquipStates = [...additionalEquipStates, ...baseEquipStates];
    this.handsSupplied = getNumericParts(this.equipState);
    this.actionCost = 0 + this.handsSupplied;
    this.exertActionCost = 1 + this.handsSupplied;
  }
  clearHeldDetails() {
    this.hands = 0;
  }
  clearWornDetails() {
    this.armourPoints = "[]";
  }
  // Post Active Effects
  prepareDerivedData() {
  }
  /**
  * Migrate source data from some prior format into a new specification.
  * The source parameter is either original data retrieved from disk or provided by an update operation.
  * @inheritDoc
  */
  static migrateData(source) {
    return super.migrateData(source);
  }
}
class AbbrewFeature extends AbbrewItemBase {
}
class AbbrewSpell extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    schema.spellLevel = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 1, max: 9 });
    return schema;
  }
}
class AbbrewSkill extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const blankString = { required: true, blank: true };
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.skillFlags = new fields.StringField({ ...blankString });
    schema.configurable = new fields.BooleanField({ required: true });
    schema.activatable = new fields.BooleanField({ required: true, label: "ABBREW.Activatable" });
    schema.action = new fields.SchemaField({
      activationType: new fields.StringField({ ...blankString }),
      actionCost: new fields.StringField({ ...blankString }),
      actionImage: new fields.StringField({ ...blankString }),
      modifiers: new fields.SchemaField({
        damage: new fields.SchemaField({
          self: new fields.ArrayField(
            new fields.SchemaField({
              value: new fields.StringField({ ...blankString }),
              type: new fields.StringField({ ...blankString }),
              operator: new fields.StringField({ ...blankString })
            })
          ),
          target: new fields.ArrayField(
            new fields.SchemaField({
              value: new fields.StringField({ ...blankString }),
              type: new fields.StringField({ ...blankString }),
              operator: new fields.StringField({ ...blankString })
            })
          )
        }),
        guard: new fields.SchemaField({
          self: new fields.SchemaField({
            value: new fields.StringField({ ...blankString }),
            operator: new fields.StringField({ ...blankString })
          }),
          target: new fields.SchemaField({
            value: new fields.StringField({ ...blankString }),
            operator: new fields.StringField({ ...blankString })
          })
        }),
        successes: new fields.NumberField({ ...requiredInteger, initial: 0 }),
        risk: new fields.SchemaField({
          self: new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            operator: new fields.StringField({ ...blankString })
          }),
          target: new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            operator: new fields.StringField({ ...blankString })
          })
        }),
        wounds: new fields.SchemaField({
          self: new fields.ArrayField(
            new fields.SchemaField({
              type: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              operator: new fields.StringField({ ...blankString })
            })
          ),
          target: new fields.ArrayField(
            new fields.SchemaField({
              type: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              operator: new fields.StringField({ ...blankString })
            })
          )
        }),
        resolve: new fields.SchemaField({
          self: new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            operator: new fields.StringField({ ...blankString })
          }),
          target: new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            operator: new fields.StringField({ ...blankString })
          })
        }),
        resources: new fields.ArrayField(
          new fields.SchemaField({
            self: new fields.SchemaField({
              name: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              operator: new fields.StringField({ ...blankString })
            }),
            target: new fields.SchemaField({
              name: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              operator: new fields.StringField({ ...blankString })
            })
          })
        ),
        concepts: new fields.SchemaField({
          self: new fields.ArrayField(
            new fields.SchemaField({
              type: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              comparator: new fields.StringField({ ...blankString }),
              operator: new fields.StringField({ ...blankString })
            })
          ),
          target: new fields.ArrayField(
            new fields.SchemaField({
              type: new fields.StringField({ ...blankString }),
              value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
              comparator: new fields.StringField({ ...blankString }),
              operator: new fields.StringField({ ...blankString })
            })
          )
        })
      }),
      description: new fields.StringField({ ...blankString })
    });
    schema.skillType = new fields.StringField({ ...blankString });
    schema.path = new fields.SchemaField({
      value: new fields.StringField({ ...blankString }),
      archetype: new fields.StringField({ ...blankString })
    });
    schema.attributeIncrease = new fields.StringField({ ...blankString });
    schema.attributeIncreaseLong = new fields.StringField({ ...blankString });
    schema.attributeRankIncrease = new fields.StringField({ ...blankString });
    return schema;
  }
  // Post Active Effects
  prepareDerivedData() {
    if (this.attributeIncrease) {
      this.attributeIncreaseLong = game.i18n.localize(CONFIG.ABBREW.attributes[this.attributeIncrease]);
    }
    if (this.action.actionCost) {
      this.action.actionImage = this.getActionImageName(this.action.actionCost);
    }
  }
  getActionImageName(cost) {
    if (cost === "0" || cost > 5) {
      return "fa";
    }
    return "" + cost + "a";
  }
}
class AbbrewRevealedItem {
  static addRevealedItemSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.revealed = new fields.SchemaField({
      isRevealed: new fields.BooleanField({}),
      difficulty: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      tier: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 })
    });
  }
}
class AbbrewArmour extends AbbrewPhysicalItem {
  static defineSchema() {
    const schema = super.defineSchema();
    const fields = foundry.data.fields;
    this.addDefenseSchema(schema);
    AbbrewRevealedItem.addRevealedItemSchema(schema);
    schema.isSundered = new fields.BooleanField({ required: true, nullable: false, initial: false });
    return schema;
  }
  static addDefenseSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.defense = new fields.SchemaField({
      guard: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      inflexibility: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      protection: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ required: true, blank: true }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          resistance: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          weakness: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          immunity: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
          label: new fields.StringField({ required: true, blank: true })
        })
      )
    });
  }
  prepareDerivedData() {
    this.roll;
  }
}
class AbbrewAnatomy extends AbbrewPhysicalItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();
    schema.parts = new fields.StringField({ required: true, blank: true });
    schema.isBroken = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isDismembered = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.hands = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.speed = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    AbbrewRevealedItem.addRevealedItemSchema(schema);
    AbbrewArmour.addDefenseSchema(schema);
    schema.naturalWeapons = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        id: new fields.StringField({ required: true, blank: true }),
        image: new fields.StringField({ required: true, blank: true })
      })
    );
    return schema;
  }
  // TODO: Add revealed button
  // TODO: NPC sheet and player view that shows revealed armour / anatomy
  prepareDerivedData() {
    this.roll;
  }
}
class AbbrewAttackBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = super.defineSchema();
    AbbrewAttackBase.addAttackSchema(schema);
    return schema;
  }
  static addAttackSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.attackProfiles = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        attackType: new fields.StringField({ required: true, blank: true }),
        damage: new fields.ArrayField(
          new fields.SchemaField({
            type: new fields.StringField({ required: true, blank: true }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            attributeModifier: new fields.StringField({ required: true, blank: true })
          })
        ),
        finisherLimit: new fields.NumberField({ ...requiredInteger, initial: 10, min: 1 }),
        // TODO: Should the number of actions required for attack/strong be hands and hands + 1?
        hasStrongAttack: new fields.BooleanField({ required: true, nullable: false, initial: true })
      })
    );
  }
  prepareDerivedData() {
  }
}
class AbbrewWeapon extends AbbrewPhysicalItem {
  static defineSchema() {
    const schema = super.defineSchema();
    AbbrewWeapon.addWeaponSchema(schema);
    return schema;
  }
  static addWeaponSchema(schema) {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.weapon = new fields.SchemaField({
      size: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 9 })
    });
    schema.isFeintTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isOverpowerTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    schema.isParryTrained = new fields.BooleanField({ required: true, nullable: false, initial: false });
    AbbrewAttackBase.addAttackSchema(schema);
  }
  // Prior to Active Effects
  prepareBaseData() {
    super.prepareBaseData();
  }
  // Post Active Effects
  prepareDerivedData() {
    this.formula = `1d10x10cs10`;
    this.isFeintTrained = this.doesParentActorHaveSkillFlag("Feint");
    this.isOverpowerTrained = this.doesParentActorHaveSkillFlag("Overpower");
  }
  doesParentActorHaveSkillFlag(trait) {
    var _a, _b;
    return ((_b = (_a = this == null ? void 0 : this.parent) == null ? void 0 : _a.actor) == null ? void 0 : _b.doesActorHaveSkillFlag(trait)) ?? false;
  }
}
class AbbrewWound extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const blankString = { required: true, blank: true };
    const requiredInteger = { required: true, nullable: false, integer: true };
    schema.wound = new fields.SchemaField({
      type: new fields.StringField({ ...blankString }),
      value: new fields.NumberField({ ...requiredInteger, initial: 0 })
    });
    return schema;
  }
}
class AbbrewSkillDeck extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    schema.skills = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        skillType: new fields.StringField({ required: true, blank: true }),
        id: new fields.StringField({ required: true, blank: true }),
        image: new fields.StringField({ required: true, blank: true })
      })
    );
    return schema;
  }
  // Post Active Effects
  prepareDerivedData() {
    super.prepareDerivedData();
  }
}
function addAttributesToSchema(schema) {
  const fields = foundry.data.fields;
  const requiredInteger = { required: true, nullable: false, integer: true };
  schema.attributes = new fields.SchemaField(Object.keys(CONFIG.ABBREW.attributes).reduce((obj, attribute) => {
    obj[attribute] = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 2 }),
      label: new fields.StringField({ required: true, blank: true }),
      isEnabled: new fields.BooleanField({ required: true, nullable: false, initial: false })
    });
    return obj;
  }, {}));
}
function prepareDerivedAttributeData(obj) {
  for (const key2 in obj.attributes) {
    obj.attributes[key2].label = game.i18n.localize(CONFIG.ABBREW.attributes[key2]) ?? key2;
  }
}
class AbbrewBackground extends AbbrewSkillDeck {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    addAttributesToSchema(schema);
    schema.creatureForm = new fields.SchemaField({
      name: new fields.StringField({ required: true, blank: true }),
      id: new fields.StringField({ required: true, blank: true }),
      image: new fields.StringField({ required: true, blank: true })
    });
    return schema;
  }
  // Post Active Effects
  prepareDerivedData() {
    super.prepareDerivedData();
    prepareDerivedAttributeData(this);
  }
}
class AbbrewCreatureForm extends AbbrewItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    schema.anatomy = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: true }),
        id: new fields.StringField({ required: true, blank: true }),
        image: new fields.StringField({ required: true, blank: true })
      })
    );
    return schema;
  }
}
const FINISHERS = {
  "bludgeoning": {
    1: { "type": "bludgeoning", "wounds": [{ "type": "physical", "value": 1 }], "text": "Target is wounded" },
    2: { "type": "bludgeoning", "wounds": [{ "type": "physical", "value": 2 }], "text": "Target is wounded" },
    4: { "type": "bludgeoning", "wounds": [{ "type": "physical", "value": 3 }], "text": "Target is wounded" },
    8: { "type": "bludgeoning", "wounds": [{ "type": "physical", "value": 5 }], "text": "Target limb is broken" }
  },
  "piercing": {
    1: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 1 }], "text": "Target bleeds lesser" },
    2: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 2 }], "text": "Target bleeds moderate" },
    4: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 3 }], "text": "Target bleeds greater" },
    8: { "type": "piercing", "wounds": [{ "type": "bleed", "value": 5 }], "text": "Target bleeds critically" }
  },
  "slashing": {
    1: { "type": "slashing", "wounds": [{ "type": "physical", "value": 1 }], "text": "Target is cut" },
    2: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 1 }], "text": "Target bleeds lesser" },
    4: { "type": "slashing", "wounds": [{ "type": "bleed", "value": 2 }], "text": "Target bleeds moderate" },
    8: { "type": "slashing", "wounds": [{ "type": "physical", "value": 4 }], "text": "Target loses a limb" }
  },
  "physical": {
    1: { "type": "physical", "wounds": [{ "type": "physical", "value": 1 }], "text": "Target is wounded" },
    2: { "type": "physical", "wounds": [{ "type": "physical", "value": 2 }], "text": "Target is wounded" },
    4: { "type": "physical", "wounds": [{ "type": "physical", "value": 3 }], "text": "Target is wounded" },
    8: { "type": "physical", "wounds": [{ "type": "physical", "value": 4 }], "text": "Target is wounded" }
  }
};
class AbbrewActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData();
  }
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
  }
  /**
   * @override
   * Augment the actor source data with additional dynamic data that isn't 
   * handled by the actor's DataModel. Data calculated in this step should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actorData = this;
    actorData.flags.abbrew || {};
  }
  /**
   * 
   * @override
   * Augment the actor's default getRollData() method by appending the data object
   * generated by the its DataModel's getRollData(), or null. This polymorphic 
   * approach is useful when you have actors & items that share a parent Document, 
   * but have slightly different data preparation needs.
   */
  getRollData() {
    var _a, _b;
    return { ...super.getRollData(), ...((_b = (_a = this.system).getRollData) == null ? void 0 : _b.call(_a)) ?? null };
  }
  async takeDamage(rolls, data, action) {
    Hooks.call("actorTakesDamage", this);
    let guard = this.system.defense.guard.value;
    let risk = this.system.defense.risk.raw;
    const inflexibility = this.system.defense.inflexibility.raw;
    let damage = this.applyModifiersToDamage(rolls, data, action);
    const updateRisk = this.calculateRisk(damage, guard, risk, inflexibility, data.isFeint, data.isStrongAttack, action);
    let overFlow = updateRisk > 100 ? updateRisk - 100 : 0;
    const updates = { "system.defense.guard.value": await this.calculateGuard(damage + overFlow, guard, data.isFeint, data.isStrongAttack, action), "system.defense.risk.raw": updateRisk };
    await this.update(updates);
    await this.renderAttackResultCard(data, action);
    return this;
  }
  async takeFinisher(rolls, data) {
    if (data.totalSuccesses < 1 && !this.statuses.has("offGuard")) {
      await this.sendFinisherToChat();
      return;
    }
    await this.takeDamage(rolls, data);
    const risk = this.system.defense.risk.raw;
    const totalRisk = this.applyModifiersToRisk(rolls, data);
    const availableFinishers = this.getAvailableFinishersForDamageType(data);
    const finisherCost = this.getFinisherCost(availableFinishers, totalRisk, data.attackProfile);
    const finisher = this.getFinisher(availableFinishers, finisherCost);
    await this.sendFinisherToChat(finisher, finisherCost);
    if (finisher) {
      return await this.applyFinisher(risk, finisher, finisherCost);
    }
  }
  applyModifiersToRisk(rolls, data) {
    let successes = 0;
    successes += data.totalSuccesses;
    successes += this.system.defense.risk.value;
    successes -= this.system.defense.inflexibility.resistance.value;
    successes += data.damage.map((d) => this.system.defense.protection.find((w) => w.type === d.damageType)).reduce((result, p) => result += (p == null ? void 0 : p.weakness) ?? 0, 0);
    successes -= data.damage.map((d) => this.system.defense.protection.find((w) => w.type === d.damageType)).reduce((result, p) => result += (p == null ? void 0 : p.resistance) ?? 0, 0);
    return successes;
  }
  getAvailableFinishersForDamageType(data) {
    return data.damage[0].damageType in FINISHERS ? FINISHERS[data.damage[0].damageType] : FINISHERS["physical"];
  }
  getFinisherCost(availableFinishers, risk, attackProfile) {
    const viableRisk = Math.min(risk, attackProfile.finisherLimit);
    const keys = Object.keys(availableFinishers);
    const cost = keys.filter((value) => value <= viableRisk).pop();
    if (cost) {
      return cost;
    }
    return 0;
  }
  getFinisher(availableFinishers, finisherKey) {
    return availableFinishers[finisherKey];
  }
  // TODO: Move to another module?
  async sendFinisherToChat(finisher, finisherCost) {
    var _a;
    const templateData = {
      finisherCost,
      finisher,
      actor: this,
      tokenId: ((_a = this.token) == null ? void 0 : _a.uuid) || null
    };
    const html = await renderTemplate("systems/abbrew/templates/chat/finisher-card.hbs", templateData);
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const label = finisher ? `${finisher.name}` : "No available finisher";
    ChatMessage.create({
      speaker,
      // rollMode: rollMode,
      flavor: label,
      content: html,
      flags: { data: { finisher, finisherCost } }
    });
  }
  async applyFinisher(risk, finisher, finisherCost) {
    const updates = { "system.wounds": mergeActorWounds(this, finisher.wounds), "system.defense.risk.raw": this.reduceRiskForFinisher(risk, finisherCost) };
    await this.update(updates);
    return this;
  }
  reduceRiskForFinisher(risk, finisherCost) {
    return risk - finisherCost * 10;
  }
  applyModifiersToDamage(rolls, data) {
    let rollSuccesses = data.totalSuccesses;
    return data.damage.reduce((result, d) => {
      rolls[0].dice[0].results[0].result ?? 0;
      const damageTypeSuccesses = (
        /* firstRoll > dodge ? */
        rollSuccesses
      );
      if (damageTypeSuccesses < 0) {
        return result;
      }
      const dmg = (
        /* damageTypeSuccesses == 0 ? Math.max(0, d.value - protection.value) : */
        d.value
      );
      return result += dmg;
    }, 0);
  }
  async calculateGuard(damage, guard, isFeint, isStrongAttack, action) {
    return guard + this.calculateGuardIncrease(damage, guard, isFeint, isStrongAttack, action);
  }
  calculateGuardIncrease(damage, guard, isFeint, isStrongAttack, action) {
    if (this.noneResult(isFeint, action)) {
      return 0;
    }
    if (isStrongAttack) {
      return 0 - damage;
    }
    if (this.attackerGainsAdvantage(isFeint, action)) {
      return 0 - damage;
    }
    if (this.defenderGainsAdvantage(isFeint, action)) {
      return 0;
    }
    return 0 - damage;
  }
  calculateRisk(damage, guard, risk, inflexibility, isFeint, isStrongAttack, action) {
    return risk + this.calculateRiskIncrease(damage, guard, risk, inflexibility, isFeint, isStrongAttack, action);
  }
  calculateRiskIncrease(damage, guard, risk, inflexibility, isFeint, isStrongAttack, action) {
    if (this.noneResult(isFeint, action)) {
      return 0;
    }
    if (isStrongAttack) {
      return damage + inflexibility;
    }
    if (this.attackerGainsAdvantage(isFeint, action)) {
      return 2 * (damage + inflexibility);
    }
    if (this.defenderGainsAdvantage(isFeint, action)) {
      return 0;
    }
    return damage + inflexibility;
  }
  defenderGainsAdvantage(isFeint, action) {
    return isFeint === false && action === "parry";
  }
  attackerGainsAdvantage(isFeint, action) {
    return isFeint === true && action === "parry";
  }
  noneResult(isFeint, action) {
    return isFeint === true && action === "damage";
  }
  async renderAttackResultCard(data, action) {
    var _a;
    const attackerAdvantage = this.attackerGainsAdvantage(data.isFeint, action);
    const defenderAdvantage = this.defenderGainsAdvantage(data.isFeint, action);
    const noneResult = this.noneResult(data.isFeint, action);
    const templateData = {
      attackerAdvantage,
      defenderAdvantage,
      noneResult,
      actor: this,
      defendingActor: this,
      attackingActor: data.attackingActor,
      tokenId: ((_a = this.token) == null ? void 0 : _a.uuid) || null
    };
    const html = await renderTemplate("systems/abbrew/templates/chat/attack-result-card.hbs", templateData);
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    ChatMessage.create({
      speaker,
      // rollMode: rollMode,
      // flavor: label,
      content: html,
      flags: {
        /* data: { finisher, finisherCost } */
      }
    });
  }
  getActorWornArmour() {
    const armour = this.items.filter((i) => i.type === "armour");
    return armour.filter((a) => a.system.equipState === "worn");
  }
  getActorHeldItems() {
    return this.items.filter((a) => a.system.equipType === "held").filter((a) => a.system.equipState.startsWith("held"));
  }
  getActorAnatomy() {
    return this.items.filter((i) => i.type === "anatomy");
  }
  doesActorHaveSkillFlag(trait) {
    return this.items.filter((i) => i.system.skillFlags).flatMap((i) => JSON.parse(i.system.skillFlags)).map((st) => st.value).includes(trait) ?? false;
  }
  async acceptWound(type, value) {
    const updates = { "system.wounds": mergeActorWounds(this, [{ type, value }]) };
    await this.update(updates);
    return this;
  }
  async acceptBackground(background) {
    const name = background.name;
    const image = background.img;
    const description = background.system.description;
    const attributeIncreases = Object.entries(background.system.attributes).filter((atr) => atr[1].value > 0).reduce((result, attribute) => result.concat(Array(attribute[1].value).fill(attribute[0])), []);
    for (const index in attributeIncreases) {
      const system = {
        description,
        attributeIncrease: attributeIncreases[index],
        skillType: "background"
      };
      const itemData = {
        name,
        img: image,
        type: "skill",
        system
      };
      await Item.create(itemData, { parent: this });
    }
  }
  async acceptCreatureForm(creatureForm) {
    const anatomy = creatureForm.system.anatomy.map((a) => game.items.get(a.id));
    for (const index in anatomy) {
      await Item.create(anatomy[index], { parent: this });
      const weapons = anatomy[index].system.naturalWeapons.map((w) => game.items.get(w.id));
      for (const weaponIndex in weapons) {
        await Item.create(weapons[weaponIndex], { parent: this });
      }
    }
  }
  async acceptSkillDeck(skillDeck) {
    const skills = skillDeck.system.skills.map((s) => game.items.get(s.id));
    for (const index in skills) {
      await Item.create(skills[index], { parent: this });
    }
  }
  async acceptAnatomy(anatomy) {
    const naturalWeapons = anatomy.system.naturalWeapons.map((w) => game.items.get(w.id));
    for (const index in naturalWeapons) {
      await Item.create(naturalWeapons[index], { parent: this });
    }
  }
  async canActorUseActions(actions) {
    let remainingActions = this.system.actions;
    if (actions > remainingActions) {
      ui.notifications.info("You do not have enough actions to do that.");
      return false;
    }
    await this.update({ "system.actions": remainingActions -= actions });
    return true;
  }
}
class AbbrewItem2 extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
  }
  _preUpdate(changed, options, userId) {
    if (doesNestedFieldExist(changed, "system.equipState") && changed.system.equipState === "worn" && this.type === "armour") {
      if (!this.isWornEquipStateChangePossible()) {
        ui.notifications.info("You are already wearing too many items, try stowing some");
        this.actor.sheet.render();
        return false;
      }
    }
    if (doesNestedFieldExist(changed, "system.equipState") && changed.system.equipState.startsWith("held")) {
      if (!this.isHeldEquipStateChangePossible(changed.system.equipState)) {
        ui.notifications.info("You are already holding too many items, try stowing some");
        this.actor.sheet.render();
        return false;
      }
    }
    super._preUpdate(changed, options, userId);
  }
  // TODO: Drop items when not enough hands
  isWornEquipStateChangePossible() {
    const armourPoints = JSON.parse(this.system.armourPoints).map((ap) => ap.value);
    const usedArmourPoints = this.actor.getActorWornArmour().flatMap((a) => JSON.parse(a.system.armourPoints).map((ap) => ap.value));
    const actorArmourPoints = this.actor.getActorAnatomy().flatMap((a) => JSON.parse(a.system.parts).map((ap) => ap.value));
    const availableArmourPoints = arrayDifference(actorArmourPoints, usedArmourPoints);
    if (!armourPoints.every((ap) => availableArmourPoints.includes(ap))) {
      return false;
    }
    let requiredArmourPoints = availableArmourPoints.filter((ap) => armourPoints.includes(ap));
    const allRequiredAvailable = armourPoints.reduce((result, a) => {
      if (requiredArmourPoints.length > 0 && requiredArmourPoints.includes(a)) {
        const index = requiredArmourPoints.indexOf(a);
        if (index > -1) {
          requiredArmourPoints.splice(index, 1);
        } else {
          return false;
        }
      } else {
        result = false;
      }
      return result;
    }, true);
    return allRequiredAvailable;
  }
  isHeldEquipStateChangePossible(equipState) {
    const actorHands = this.actor.getActorAnatomy().reduce((result, a) => result += a.system.hands, 0);
    const equippedHeldItemHands = this.actor.getActorHeldItems().filter((i) => i._id !== this._id).reduce((result, a) => result += getNumericParts(a.system.equipState), 0);
    const requiredHands = equippedHeldItemHands + getNumericParts(equipState);
    return actorHands >= requiredHands;
  }
  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    const rollData = { ...super.getRollData() };
    if (!this.actor)
      return rollData;
    rollData.actor = this.actor.getRollData();
    return rollData;
  }
  static chatListeners(html) {
    html.on("click", ".card-buttons button[data-action]", this._onChatCardAction.bind(this));
  }
  static async _onChatCardAction(event) {
    console.log("chat");
    const button = event.currentTarget;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;
    game.actors.get(card.dataset.actorId);
    game.items.get(card.dataset.itemId);
    switch (action) {
      case "damage":
        await this._onAcceptDamageAction(message.rolls, message.flags.data, action);
        break;
      case "strong":
        await this._onAcceptDamageAction(message.rolls, message.flags.data, action);
        break;
      case "parry":
        await this._onAcceptDamageAction(message.rolls, message.flags.data, action);
        break;
      case "finisher":
        await this._onAcceptFinisherAction(message.rolls, message.flags.data, action);
        break;
    }
  }
  static async _onAcceptDamageAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      return;
    }
    const actor = tokens[0].actor;
    if (action === "parry" && !actor.doesActorHaveSkillFlag("Parry")) {
      ui.notifications.info("You have not trained enough to be able to parry.");
      return;
    }
    const actions = action === "parry" ? 1 : 0;
    if (actions > 0 && !await actor.canActorUseActions(actions)) {
      return;
    }
    await actor.takeDamage(rolls, data, action);
  }
  static async _onAcceptFinisherAction(rolls, data, action) {
    const tokens = canvas.tokens.controlled.filter((token) => token.actor);
    if (tokens.length === 0) {
      return;
    }
    await tokens[0].actor.takeFinisher(rolls, data);
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
      console.log("general roll");
    }
  }
}
function registerSystemSettings() {
  game.settings.register("abbrew", "announceTurnStart", {
    name: "SETTINGS.AnnounceTurnStart.Name",
    hint: "SETTINGS.AnnounceTurnStart.Hint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });
}
class AbbrewCreatureFormSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
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
    const context = super.getData();
    const itemData = context.data;
    context.rollData = this.item.getRollData();
    context.system = itemData.system;
    context.flags = itemData.flags;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.config = CONFIG.ABBREW;
    return context;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable)
      return;
    html.on(
      "click",
      ".effect-control",
      (event) => onManageActiveEffect(event, this.item)
    );
    html.on("dragover", (event) => {
      event.preventDefault();
    });
    html.on("click", ".anatomy-delete", async (ev) => {
      const li = $(ev.currentTarget).parents(".creature-form-anatomy");
      if (li.data("id") || li.data("id") === 0) {
        const anatomy = this.item.system.anatomy;
        anatomy.splice(li.data("id"), 1);
        await this.item.update({ "system.anatomy": anatomy });
      }
    });
    html.on("drop", async (event) => {
      if (!this.item.testUserPermission(game.user, "OWNER")) {
        return;
      }
      const droppedData = event.originalEvent.dataTransfer.getData("text");
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const itemId = eventJson.uuid.split(".").pop();
        const item = game.items.get(itemId);
        if (item.type === "anatomy") {
          const storedAnatomy = this.item.system.anatomy;
          const newAnatomy = [...storedAnatomy, { name: item.name, id: itemId, image: item.img }];
          await this.item.update({ "system.anatomy": newAnatomy });
        }
      }
    });
  }
}
class AbbrewSkillDeckSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
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
    const context = super.getData();
    const itemData = context.data;
    context.rollData = this.item.getRollData();
    context.system = itemData.system;
    context.flags = itemData.flags;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.config = CONFIG.ABBREW;
    return context;
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable)
      return;
    html.on(
      "click",
      ".effect-control",
      (event) => onManageActiveEffect(event, this.item)
    );
    html.on("dragover", (event) => {
      event.preventDefault();
    });
    html.on("click", ".skill-delete", async (ev) => {
      const li = $(ev.currentTarget).parents(".skill-deck-skill");
      if (li.data("id") || li.data("id") === 0) {
        const skills = this.item.system.skills;
        skills.splice(li.data("id"), 1);
        await this.item.update({ "system.skills": skills });
      }
    });
    html.on("click", ".creature-form-delete", async (ev) => {
      await this.item.update({ "system.creatureForm": { name: "", id: "", image: "" } });
    });
    html.on("drop", async (event) => {
      if (!this.item.testUserPermission(game.user, "OWNER")) {
        return;
      }
      const droppedData = event.originalEvent.dataTransfer.getData("text");
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const itemId = eventJson.uuid.split(".").pop();
        const item = game.items.get(itemId);
        if (item.type === "skill") {
          const storedSkills = this.item.system.skills;
          const updateSkills = [...storedSkills, { name: item.name, id: itemId, image: item.img, skillType: item.system.skillType }];
          await this.item.update({ "system.skills": updateSkills });
        } else if (item.type === "creatureForm") {
          await this.item.update({ "system.creatureForm": { name: item.name, id: itemId, image: item.img } });
        }
      }
    });
  }
}
class AbbrewAnatomySheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["abbrew", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
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
    const context = super.getData();
    const itemData = context.data;
    context.rollData = this.item.getRollData();
    context.system = itemData.system;
    context.flags = itemData.flags;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.config = CONFIG.ABBREW;
    return context;
  }
  /* -------------------------------------------- */
  _activateAnatomyParts(html) {
    const anatomyParts = html[0].querySelector('input[name="system.parts"]');
    const anatomyPartsSettings = {
      dropdown: {
        maxItems: 20,
        // <- mixumum allowed rendered suggestions
        classname: "tags-look",
        // <- custom classname for this dropdown, so it could be targeted
        enabled: 0,
        // <- show suggestions on focus
        closeOnSelect: false,
        // <- do not hide the suggestions dropdown once an item has been selected
        includeSelectedTags: true
        // <- Should the suggestions list Include already-selected tags (after filtering)
      },
      userInput: false,
      // <- Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the disabled attribute on the original input element. To update this after initialization use the setter tagify.userInput
      duplicates: true,
      // <- Should duplicate tags be allowed or not
      whitelist: [...Object.values(CONFIG.ABBREW.armourPoints.points).map((key2) => game.i18n.localize(key2))]
    };
    if (anatomyParts) {
      new Tagify(anatomyParts, anatomyPartsSettings);
    }
  }
  /**
   * Handle one of the add or remove damage reduction buttons.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onDamageReductionAction(target, action) {
    switch (action) {
      case "add-damage-reduction":
        return this.addDamageReduction();
      case "remove-damage-reduction":
        return this.removeDamageReduction(target);
    }
  }
  addDamageReduction() {
    const protection = this.item.system.defense.protection;
    return this.item.update({ "system.defense.protection": [...protection, {}] });
  }
  removeDamageReduction(target) {
    const id = target.closest("li").dataset.id;
    const defense = foundry.utils.deepClone(this.item.system.defense);
    defense.protection.splice(Number(id), 1);
    return this.item.update({ "system.defense.protection": defense.protection });
  }
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable)
      return;
    html.on(
      "click",
      ".effect-control",
      (ev) => onManageActiveEffect(ev, this.item)
    );
    html.find(".damage-reduction-control").click((event) => {
      const t = event.currentTarget;
      if (t.dataset.action)
        this._onDamageReductionAction(t, t.dataset.action);
    });
    this._activateAnatomyParts(html);
    html.on("dragover", (event) => {
      event.preventDefault();
    });
    html.on("drop", async (event) => {
      if (!this.item.testUserPermission(game.user, "OWNER")) {
        return;
      }
      const droppedData = event.originalEvent.dataTransfer.getData("text");
      const eventJson = JSON.parse(droppedData);
      if (eventJson && eventJson.type === "Item") {
        const itemId = eventJson.uuid.split(".").pop();
        const item = game.items.get(itemId);
        if (item.type === "weapon") {
          const storedWeapons = this.item.system.naturalWeapons;
          const updateWeapons = [...storedWeapons, { name: item.name, id: itemId, image: item.img }];
          await this.item.update({ "system.naturalWeapons": updateWeapons });
        }
      }
    });
  }
}
Hooks.once("init", function() {
  game.abbrew = {
    AbbrewActor,
    AbbrewItem: AbbrewItem2,
    rollItemMacro
  };
  CONFIG.ABBREW = ABBREW;
  addWoundUtilities();
  CONFIG.Combat.initiative = {
    formula: "1d10 + @attributes.agi.value + @attributes.wit.value",
    decimals: 2
  };
  CONFIG.Actor.documentClass = AbbrewActor;
  CONFIG.Actor.dataModels = {
    character: AbbrewCharacter,
    npc: AbbrewNPC
  };
  CONFIG.Item.documentClass = AbbrewItem2;
  CONFIG.Item.dataModels = {
    item: AbbrewItem$1,
    feature: AbbrewFeature,
    spell: AbbrewSpell,
    skill: AbbrewSkill,
    anatomy: AbbrewAnatomy,
    armour: AbbrewArmour,
    weapon: AbbrewWeapon,
    wound: AbbrewWound,
    background: AbbrewBackground,
    skillDeck: AbbrewSkillDeck,
    creatureForm: AbbrewCreatureForm
  };
  registerSystemSettings();
  CONFIG.ActiveEffect.legacyTransferral = false;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("abbrew", AbbrewActorSheet, {
    makeDefault: true,
    label: "ABBREW.SheetLabels.Actor"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("abbrew", AbbrewItemSheet, {
    types: ["item", "feature", "spell", "skill", "armour", "weapon", "wound"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Item"
  });
  Items.registerSheet("abbrew", AbbrewCreatureFormSheet, {
    types: ["creatureForm"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.CreatureForm"
  });
  Items.registerSheet("abbrew", AbbrewSkillDeckSheet, {
    types: ["skillDeck", "background"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.SkillDeck"
  });
  Items.registerSheet("abbrew", AbbrewAnatomySheet, {
    types: ["anatomy"],
    makeDefault: true,
    label: "ABBREW.SheetLabels.Anatomy"
  });
  _configureStatusEffects();
  return preloadHandlebarsTemplates();
});
function _configureStatusEffects() {
  const addEffect = (effects, { special, ...data }) => {
    data = foundry.utils.deepClone(data);
    data._id = staticID(`abbrew${data.id}`);
    data.img = data.icon ?? data.img;
    delete data.icon;
    effects.push(data);
    if (special)
      CONFIG.specialStatusEffects[special] = data.id;
  };
  CONFIG.statusEffects = Object.entries(CONFIG.ABBREW.statusEffects).reduce((arr, [id, data]) => {
    const original = CONFIG.statusEffects.find((s) => s.id === id);
    addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
    return arr;
  }, []);
}
function addWoundUtilities() {
  const wounds = foundry.utils.deepClone(CONFIG.ABBREW.wounds);
  CONFIG.ABBREW.lingeringWoundTypes = Object.entries(wounds).filter((w) => w[1].lingeringWounds.length > 0).map((w) => w[0]);
  CONFIG.ABBREW.woundToLingeringWounds = Object.entries(wounds).filter((w) => w[1].lingeringWounds.length > 0).reduce((result, wound) => {
    result[wound[0]] = wound[1].lingeringWounds;
    return result;
  }, {});
}
Handlebars.registerHelper("toLowerCase", function(str) {
  return str.toLowerCase();
});
Handlebars.registerHelper("eq", function(arg1, arg2) {
  return arg1 === arg2;
});
Handlebars.registerHelper("pos", function(arg1) {
  return arg1 > 0;
});
Handlebars.registerHelper("getProperty", function(parent, child) {
  const preparedChild = child.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0)
      return "";
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
  return parent[preparedChild];
});
Handlebars.registerHelper("empty", function(collection) {
  if (!collection) {
    return false;
  }
  return collection.length === 0;
});
Handlebars.registerHelper("json", function(context) {
  return JSON.stringify(context, void 0, 2);
});
Handlebars.registerHelper("gm", function(opts) {
  if (game.users.current === game.users.activeGM) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});
Hooks.once("ready", function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
Hooks.on("combatStart", async (combat, updateData, updateOptions) => {
});
Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
});
Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
});
Hooks.on("combatTurnChange", async (combat, prior, current) => {
  var _a;
  if (combat.previous.round === 0 && combat.previous.turn === null) {
    const combatants = combat.combatants.toObject();
    await handleCombatStart(combatants);
  }
  if (canvas.tokens.get(current.tokenId).actor.isOwner) {
    await handleTurnStart(prior, current, (_a = canvas.tokens.get(prior.tokenId)) == null ? void 0 : _a.actor, canvas.tokens.get(current.tokenId).actor);
  }
});
Hooks.on("updateToken", (document2, changed, options, userId) => {
});
Hooks.on("applyActiveEffect", applyCustomEffects);
Hooks.on("renderChatLog", (app, html, data) => {
  AbbrewItem2.chatListeners(html);
});
Hooks.on("updateActor", async (actor, updates, options, userId) => {
  if (userId != game.user.id) {
    return;
  }
  if (doesNestedFieldExist(updates, "system.defense.guard.value")) {
    await handleActorGuardConditions(actor);
  }
  if (doesNestedFieldExist(updates, "system.wounds") || doesNestedFieldExist(updates, "system.defense.resolve")) {
    await handleActorWoundConditions(actor);
  }
});
Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
  console.log(data);
  if (data.type === "Item") {
    const id = data.uuid.split(".").pop();
    const item = game.items.get(id);
    if (item) {
      switch (item.type) {
        case "wound":
          await handleActorWoundDrop(actor, item);
          break;
        case "background":
          await handleActorBackgroundDrop(actor, item);
          break;
        case "skillDeck":
          await handleActorSkillDeckDrop(actor, item);
          break;
        case "creatureForm":
          await handleActorCreatureFormDrop(actor, item);
          break;
        case "anatomy":
          await handleActorAnatomyDrop(actor, item);
          break;
      }
    }
  }
});
async function handleActorWoundDrop(actor, item) {
  const wound = item.system.wound;
  await actor.acceptWound(wound.type, wound.value);
}
async function handleActorBackgroundDrop(actor, background) {
  await actor.acceptBackground(background);
  await actor.acceptSkillDeck(background);
  if (background.system.creatureForm.id) {
    const creatureForm = game.items.get(background.system.creatureForm.id);
    await actor.acceptCreatureForm(creatureForm);
  }
}
async function handleActorSkillDeckDrop(actor, skillDeck) {
  await actor.acceptSkillDeck(skillDeck);
}
async function handleActorCreatureFormDrop(actor, creatureform) {
  await actor.acceptCreatureForm(creatureform);
}
async function handleActorAnatomyDrop(actor, anatomy) {
  await actor.acceptAnatomy(anatomy);
}
async function createItemMacro(data, slot) {
  if (data.type !== "Item")
    return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  }
  const item = await Item.fromDropData(data);
  const command = `game.abbrew.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
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
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }
    item.roll();
  });
}
function applyCustomEffects(actor, change) {
  console.log("CUSTOM");
}
//# sourceMappingURL=abbrew.mjs.map
