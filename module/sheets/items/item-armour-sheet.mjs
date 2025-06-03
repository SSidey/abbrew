import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../../helpers/effects.mjs';
import Tagify from '@yaireo/tagify'
import { renderSheetForStoredItem } from '../../helpers/utils.mjs';
import { applyEnhancement, handleEnhancement, shouldHandleEnhancement } from '../../helpers/enhancements/enhancement-application.mjs';
import { AbbrewEquipmentSheet } from './item-equipment-sheet.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewArmourSheet extends AbbrewEquipmentSheet { }
