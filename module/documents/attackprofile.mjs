import { d10Roll } from "../helpers/dice.mjs";

export class AbbrewAttackProfile {
  id;
  abilityModifier;
  damageBase;
  isWeapon;
  weapon = {
    requirements,
    reach,
    minimumEffectiveReach,
    focused,
    penetration,
    traits,
    handsSupplied,
    handsRequired,
    traitsArray,
    damageType,
    attackType,
  };
  isMagic;
  magic = {
    mentalRange
  };

  constructor(id, abilityModifier, damageBase, isWeapon, weapon,) {
    id
    abilityModifier
    damageBase
    isWeapon
    weapon
    isMagic
    magic
  }

  async use(actor) {    
    // Ensure the options object is ready
    options = foundry.utils.mergeObject({
      configureDialog: true,
      createMessage: true,
      "flags.abbrew.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
    }, options);

    const card = await this.displayCard(options);

    return card;
  }

}