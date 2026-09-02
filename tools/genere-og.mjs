/**
 * genere-og.mjs — rend l'image Open Graph (1200×630) dans assets/img/og.jpg.
 * Le gabarit réutilise la feuille de style du site : un mur Vert Gottéron
 * généré par le même module que la page, le titre en Fraunces.
 * Prérequis : site servi (npm run dev). Usage : node tools/genere-og.mjs [baseURL]
 */
import { writeFileSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { htmlMur } from "./lib/murs.mjs";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:4173";
const RACINE = new URL("..", import.meta.url).pathname;

const gabarit = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="${BASE}/assets/css/fonts.css">
<link rel="stylesheet" href="${BASE}/assets/css/styles.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  .cadre { position: relative; width: 1200px; height: 630px; isolation: isolate; color: var(--lait); }
  .mur-og { position: absolute; inset: 0; z-index: -1; --carreau: 100px; --joint-l: 3px; }
  .cadre::before { content: ""; position: absolute; inset: 0; z-index: -1;
    background: linear-gradient(to top, rgba(10,8,6,.45), rgba(10,8,6,.1) 45%, transparent 70%); }
  .contenu { position: absolute; inset: 0; padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
  .marque { font-size: 34px; }
  h1 { font-size: 112px; line-height: .9; max-width: 11ch; }
  .sous { margin-top: 26px; font-size: 22px; letter-spacing: .12em; text-transform: uppercase; opacity: .85; }
</style></head><body>
<div class="cadre">
  <div class="mur mur-libre mur-og" data-email="gotteron">${htmlMur({ n: 84, seed: 17 })}</div>
  <div class="contenu">
    <div class="marque">Tesson</div>
    <div><h1 class="display">Aucun carreau ne ressemble au suivant.</h1>
    <div class="sous">Carreaux de grès émaillés à la main · Fribourg</div></div>
  </div>
</div>
</body></html>`;

const tmp = `${RACINE}assets/img/.og.html`;
writeFileSync(tmp, gabarit);
const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await page.goto(`${BASE}/assets/img/.og.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${RACINE}assets/img/og.jpg`, type: "jpeg", quality: 84 });
await navigateur.close();
unlinkSync(tmp);
console.log("assets/img/og.jpg générée");
