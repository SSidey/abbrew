import { Browser } from "../browser.mjs";

export async function openBrowser() {
    const browser = await new Browser().render(true);
}