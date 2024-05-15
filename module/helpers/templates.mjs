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
    'systems/abbrew/templates/actor/parts/actor-weapons.hbs',
    'systems/abbrew/templates/actor/parts/actor-defenses.hbs',
    // Item partials.
    'systems/abbrew/templates/item/parts/item-effects.hbs',
    'systems/abbrew/templates/item/parts/item-defenses.hbs',
    'systems/abbrew/templates/item/parts/item-damage.hbs',
    'systems/abbrew/templates/item/parts/skill-type.hbs',
    'systems/abbrew/templates/item/parts/skill-actions.hbs',
    'systems/abbrew/templates/item/parts/skill-damage.hbs',
    // Chat Cards.
    'systems/abbrew/templates/chat/attack-card.hbs',
  ]);
};
