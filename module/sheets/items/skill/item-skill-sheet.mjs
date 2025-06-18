import { AbbrewItemBaseSheet } from '../generic/item-base-sheet.mjs';
import { renderItemSheet } from '../helpers/actions/render-sheet-actions.mjs';
import { damageControlAction } from './actions/skill-damage-actions.mjs';
import { DragDropMixin } from '../../helpers/drag-drop-mixin.mjs';
import { _onEffectControl } from '../../actor/helpers/actions/effect-actions.mjs';
import { skillActionModifierWoundAction } from './actions/skill-wound-actions.mjs';
import { skillActionResourceRequirementAction } from './actions/skill-resource-requirement-action.mjs';
import { attackProfileAction } from './actions/skill-attack-profile-actions.mjs';
import { skillActionModifierResourceAction } from './actions/skill-resource.mjs';
import { detectionModeControlAction } from './actions/skill-detection-mode-actions.mjs';
import { modifierControlAction } from './actions/skill-modifier-builder-field-actions.mjs';
import { asyncValueAction } from './actions/skill-async-value-control-action.mjs';
import { deleteSkillCollectionSkill } from './actions/skill-skill-collection-actions.mjs';
import { skillCollectionDrop, skillTagifyDrop } from './drops/skill-drops.mjs';
import { SkillTagsMixin } from './tags/skill-tags.mjs';
import { activeEffectAction } from '../helpers/actions/effect-actions.mjs';
import { protectionModificationAction } from './actions/skill-protection-modification-action.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AbbrewSkillSheet extends SkillTagsMixin(DragDropMixin(AbbrewItemBaseSheet)) {

    TRAITS_WHITELIST = [...CONFIG.ABBREW.traits.map(trait => ({
        ...trait,
        value: game.i18n.localize(trait.value)
    }))];

    static DEFAULT_OPTIONS = {
        position: {
            width: 600
        },
        dragDrop: [
            { dragSelector: null, dropSelector: "ol.skill-deck-skills", callbacks: { drop: skillCollectionDrop } },
            { dragSelector: null, dropSelector: "tags", callbacks: { drop: skillTagifyDrop } },
        ],
        actions: {
            damageControl: damageControlAction,
            deleteSkill: deleteSkillCollectionSkill,
            renderItemSheet: renderItemSheet,
            effectControl: activeEffectAction,
            skillActionModifierWoundAction: skillActionModifierWoundAction,
            skillActionResourceRequirementAction: skillActionResourceRequirementAction,
            skillAttackProfileAction: attackProfileAction,
            skillActionModifierResourceAction: skillActionModifierResourceAction,
            detectionModeControl: detectionModeControlAction,
            modifierControlAction: modifierControlAction,
            asyncValueControlAction: asyncValueAction,
            onProtectionModificationAction: protectionModificationAction
        }
    }

    static PARTS = {
        header: {
            template: "systems/abbrew/templates/item/item/parts/item-header.hbs"
        },
        tabs: {
            // Foundry-provided generic template
            template: "templates/generic/tab-navigation.hbs",
        },
        description: {
            template: "systems/abbrew/templates/item/skill/tabs/skill-description.hbs",
            scrollable: [""]
        },
        attributes: {
            template: "systems/abbrew/templates/item/skill/tabs/skill-attributes.hbs",
            scrollable: [""]
        },
        effects: {
            template: "systems/abbrew/templates/item/skill/tabs/skill-effects.hbs",
            scrollable: [""]
        }
    }

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", icon: "fa-solid fa-book" },
                { id: "attributes", icon: "fa-solid fa-square-poll-vertical" },
                { id: "effects", icon: "fa-solid fa-wand-magic-sparkles" }
            ],
            initial: "description",
            labelPrefix: "SHEET.ITEM.TABS"
        }
    }

    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.enrichedFinisherDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.item.system.action.attackProfile.finisher.description,
            {
                secrets: this.document.isOwner,
                documents: true,
                links: true,
                embeds: true,
                rolls: true,
                rollData: this.item.getRollData()
            }
        );

        context.lightFields = context.system.schema.fields.light.fields;
        context.colorationTechniques = foundry.canvas.rendering.shaders.AdaptiveLightingShader.SHADER_TECHNIQUES;
        context.lightAnimations = CONFIG.Canvas.lightAnimations;
        context.gridUnits = game.canvas.grid.units;
        context.datasets = {
            skillDrop: {
                dropType: "skill"
            }
        }

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        if (!this.isEditable) return;

        this.activateSkillTags();
        this.bindDragDrops();
    }

    tagify
}
