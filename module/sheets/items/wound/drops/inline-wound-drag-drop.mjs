import { getSafeJson } from "../../../../helpers/utils.mjs";

export async function onInlineWoundDragStart(event) {
    const el = event.currentTarget;
    if ('link' in event.target.dataset) return;

    // Extract the data you need
    let dragData = {
        type: "Wound",
        wound: {
            type: el.dataset.woundType,
            value: el.dataset.woundValue
        }
    };


    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
}