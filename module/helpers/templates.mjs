/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return foundry.applications.handlebars.loadTemplates([
    // Actor partials.
    "systems/abbrew/templates/actor/parts/actor-features.hbs",
    "systems/abbrew/templates/actor/parts/actor-items.hbs",
    "systems/abbrew/templates/actor/parts/actor-spells.hbs",
    "systems/abbrew/templates/actor/parts/actor-effects.hbs",
    "systems/abbrew/templates/actor/parts/actor-skills.hbs",
    "systems/abbrew/templates/actor/parts/actor-anatomy.hbs",
    "systems/abbrew/templates/actor/parts/actor-armour.hbs",
    "systems/abbrew/templates/actor/parts/actor-gear.hbs",
    "systems/abbrew/templates/actor/parts/actor-ammunition.hbs",
    "systems/abbrew/templates/actor/parts/actor-weapons.hbs",
    "systems/abbrew/templates/actor/parts/actor-weapon-attacks.hbs",
    "systems/abbrew/templates/actor/parts/actor-defenses.hbs",
    "systems/abbrew/templates/actor/parts/actor-resources.hbs",
    "systems/abbrew/templates/actor/parts/actor-skill-card.hbs",
    "systems/abbrew/templates/actor/parts/actor-equipment.hbs",
    "systems/abbrew/templates/actor/parts/actor-storage.hbs",
    "systems/abbrew/templates/actor/parts/actor-concepts.hbs",
    "systems/abbrew/templates/actor/parts/actor-speed.hbs",
    "systems/abbrew/templates/actor/parts/actor-visible.hbs",
    "systems/abbrew/templates/actor/parts/actor-visible-item.hbs",
    "systems/abbrew/templates/actor/parts/actor-visible-item-internal.hbs",
    // Item partials.
    "systems/abbrew/templates/item/item/parts/item-description.hbs",
    "systems/abbrew/templates/item/item/templates/item-effects.hbs",
    "systems/abbrew/templates/item/item/templates/item-defenses.hbs",
    "systems/abbrew/templates/item/item/templates/item-damage.hbs",
    "systems/abbrew/templates/item/item/templates/item-equipstate.hbs",
    "systems/abbrew/templates/item/item/templates/item-traits.hbs",
    "systems/abbrew/templates/item/physical/parts/item-physical-header.hbs",
    "systems/abbrew/templates/item/item/templates/item-equip-state-changes.hbs",
    // Ammunition partials.
    "systems/abbrew/templates/item/ammunition/parts/ammunition-attributes.hbs",
    // Anatomy partials.
    "systems/abbrew/templates/item/anatomy/parts/anatomy-attributes.hbs",
    // Archetype partials.
    "systems/abbrew/templates/item/archetype/parts/archetype-requirements.hbs",
    // Background partials.
    "systems/abbrew/templates/item/background/parts/background-attributes.hbs",
    // Creature-Form partials.
    "systems/abbrew/templates/item/creature-form/parts/creature-form-attributes.hbs",
    // Enhancement partials.
    "systems/abbrew/templates/item/enhancement/parts/enhancement-attributes.hbs",
    // Path partials.
    "systems/abbrew/templates/item/path/parts/path-description.hbs",
    // Physical Item partials.
    "systems/abbrew/templates/item/physical/parts/item-physical-skills.hbs",
    "systems/abbrew/templates/item/physical/parts/item-physical-storage.hbs",
    "systems/abbrew/templates/item/item/parts/item-reveal-skills.hbs",
    // Skill partials.
    "systems/abbrew/templates/item/skill/parts/skill-description.hbs",
    // Skill Deck partials.
    "systems/abbrew/templates/item/skill-deck/parts/skill-deck-attributes.hbs",
    "systems/abbrew/templates/item/skill/parts/skill-attributes.hbs",
    "systems/abbrew/templates/item/skill/parts/skill-effects.hbs",
    "systems/abbrew/templates/item/skill/templates/skill-type.hbs",
    "systems/abbrew/templates/item/skill/templates/skill-actions.hbs",
    "systems/abbrew/templates/item/skill/templates/skill-damage.hbs",
    "systems/abbrew/templates/item/skill/templates/skill-light.hbs",
    "systems/abbrew/templates/item/skill/templates/modifier-builder-field.hbs",
    // Weapon partials.
    "systems/abbrew/templates/item/weapon/parts/weapon-attack-profiles.hbs",
    // Wound partials.
    "systems/abbrew/templates/item/wound/parts/wound-attributes.hbs",
    // Chat Cards.
    "systems/abbrew/templates/chat/skill-card.hbs",
    "systems/abbrew/templates/chat/finisher-card.hbs",
    "systems/abbrew/templates/chat/lost-resolve-card.hbs",
    "systems/abbrew/templates/chat/attack-result-card.hbs",
    "systems/abbrew/templates/chat/notification-card.hbs",
    // Browser Template
    "systems/abbrew/templates/browser/browser.hbs"
  ]);
};
