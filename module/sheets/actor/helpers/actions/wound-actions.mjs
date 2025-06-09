export async function _onChangeWoundValue(event, target) {
    const woundType = target.dataset.woundType;
    const modifier = event.button === 2 ? -1 : 1;
    updateActorWounds(this.actor, mergeActorWounds(this.actor, [{ type: woundType, value: modifier }]));
}