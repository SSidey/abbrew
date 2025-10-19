import { getSafeJson } from "../../helpers/utils.mjs";
import { Browser } from "../browsers/browser.mjs";
import { PathBrowser } from "../browsers/path-browser.mjs";
import { SkillBrowser } from "../browsers/skill-browser.mjs";

export async function openBrowser() {
    event.preventDefault();
    event.stopPropagation();
    const browser = await new Browser().render(true);
}

export async function openPathBrowser(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const roles = new Set(getSafeJson(target.dataset.roles, []).map(r => r.label));
    const restrictedRoles = new Set(getSafeJson(target.dataset.restrictions, []).map(r => r.label));
    const browser = await new PathBrowser(roles, restrictedRoles).render(true);
}

export async function openSkillBrowser(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const pathId = target.closest(".archetype-path.path-chosen").dataset.sourceId;
    const path = await game.packs.get("abbrew.paths").getDocument(pathId);
    const roles = getSafeJson(path.system.roles, []).map(r => r.label);
    const skills = await game.packs.get("abbrew.playerskills").getDocuments();
    const validSkills = skills.filter(s => s.system.path.value.id === pathId || (s.system.path.value.id === "abbrewpuniversal" && new Set(roles).isSupersetOf(new Set(s.system.roles.parsed))));
    const browser = await new SkillBrowser(validSkills, roles, pathId).render(true);
}