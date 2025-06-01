/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/abbrew/templates/actor/parts/actor-features.hbs',
    'systems/abbrew/templates/actor/parts/actor-items.hbs',
    'systems/abbrew/templates/actor/parts/actor-spells.hbs',
    'systems/abbrew/templates/actor/parts/actor-effects.hbs',
    'systems/abbrew/templates/actor/parts/actor-skills.hbs',
    'systems/abbrew/templates/actor/parts/actor-anatomy.hbs',
    'systems/abbrew/templates/actor/parts/actor-armour.hbs',
    'systems/abbrew/templates/actor/parts/actor-gear.hbs',
    'systems/abbrew/templates/actor/parts/actor-ammunition.hbs',
    'systems/abbrew/templates/actor/parts/actor-weapons.hbs',
    'systems/abbrew/templates/actor/parts/actor-weapon-attacks.hbs',
    'systems/abbrew/templates/actor/parts/actor-defenses.hbs',
    'systems/abbrew/templates/actor/parts/actor-resources.hbs',
    'systems/abbrew/templates/actor/parts/actor-skill-card.hbs',
    'systems/abbrew/templates/actor/parts/actor-equipment.hbs',
    'systems/abbrew/templates/actor/parts/actor-storage.hbs',
    'systems/abbrew/templates/actor/parts/actor-concepts.hbs',
    // Item partials.
    'systems/abbrew/templates/item/parts/item-effects.hbs',
    'systems/abbrew/templates/item/parts/item-defenses.hbs',
    'systems/abbrew/templates/item/parts/item-damage.hbs',
    'systems/abbrew/templates/item/parts/item-equipstate.hbs',
    'systems/abbrew/templates/item/parts/item-traits.hbs',
    'systems/abbrew/templates/item/parts/item-physical-header.hbs',
    'systems/abbrew/templates/item/parts/item-storage.hbs',
    'systems/abbrew/templates/item/parts/item-equip-state-changes.hbs',
    // Skill partials.
    'systems/abbrew/templates/item/parts/skill-type.hbs',
    'systems/abbrew/templates/item/parts/skill-actions.hbs',
    'systems/abbrew/templates/item/parts/skill-damage.hbs',
    'systems/abbrew/templates/item/parts/skill-light.hbs',
    'systems/abbrew/templates/item/parts/modifier-builder-field.hbs',
    // Chat Cards.
    'systems/abbrew/templates/chat/skill-card.hbs',
    'systems/abbrew/templates/chat/finisher-card.hbs',
    'systems/abbrew/templates/chat/lost-resolve-card.hbs',
    'systems/abbrew/templates/chat/attack-result-card.hbs',
    'systems/abbrew/templates/chat/notification-card.hbs',
    // Effect Template
    'systems/abbrew/templates/effect/active-effect.hbs'
  ]);
};
