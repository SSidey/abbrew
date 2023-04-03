/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
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
    "systems/abbrew/templates/chat/damage-roll.hbs"
  ]);
};
