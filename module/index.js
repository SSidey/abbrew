// only required for dev
// in prod, foundry loads index.js, which is compiled by vite/rollup
// in dev, foundry loads index.js, this file, which loads abbrew.mjs

window.global = window;
import * as ABBREW from "./abbrew.mjs";