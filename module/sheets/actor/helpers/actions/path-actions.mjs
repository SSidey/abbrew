import { openSkillBrowser } from "../../../helpers/browser-actions.mjs";

export async function _onDisplayPathAction(event, target) {
    switch (event.button) {
        case 0:
            await displayPath(event, target);
            return;
        case 2:
            await openSkillBrowser(event, target);
            return;
    }
}

export async function displayPath(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const path = await game.packs.get("abbrew.paths").getDocument(target.dataset.sourceId);
    path.sheet.render(true);
}