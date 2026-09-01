/**
 * genere-og.mjs — Génère les images Open Graph (1200×630) de chaque page.
 *
 * Un gabarit HTML fidèle à la DA (chaux, Fraunces, mono, cadran héros en
 * vignette) est rendu par Chromium et capturé en PNG dans assets/og/.
 * Ces PNG ne sont jamais chargés par les pages elles-mêmes : ils ne pèsent
 * que sur les partages sociaux.
 *
 * Prérequis : le site servi sur http://127.0.0.1:4200 (npm run dev -- -p 4200).
 * Usage : node tools/genere-og.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:4200";
const RACINE = new URL("..", import.meta.url).pathname;
mkdirSync(`${RACINE}assets/og`, { recursive: true });

const PAGES = [
  { slug: "accueil", titre: "Nous peignons l'heure vraie.", sous: "CADRANS SOLAIRES MURAUX · CALCULÉS & PEINTS A FRESCO" },
  { slug: "savoir-faire", titre: "Relever, tracer, peindre, régler.", sous: "QUATRE GESTES · GNOMONIQUE & FRESQUE" },
  { slug: "creations", titre: "Cinq murs, cinq cadrans.", sous: "PLANCHES · DEVISES · TRACÉS CALCULÉS" },
  { slug: "atelier", titre: "Tout est parti d'une erreur de quatre degrés.", sous: "MOLINES-EN-QUEYRAS · DEPUIS 2014" },
  { slug: "methode-tarifs", titre: "Commander un cadran, pas à pas.", sous: "MÉTHODE · DÉLAIS · PRIX AFFICHÉS" },
  { slug: "contact", titre: "Parlez-nous de votre mur.", sous: "ÉTUDE GNOMONIQUE — À PARTIR DE 900 € HT" },
];

const cadran = readFileSync(`${RACINE}assets/img/generated/cadran-hero.svg.html`, "utf8");

const gabarit = (p) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="${BASE}/assets/css/fonts.css">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #F5F0E6 url(${BASE}/assets/textures/grain-256.png) repeat 0 0 / 256px;
    font-family: "Fraunces", Georgia, serif; color: #1C1A17; }
  .cadre { position: absolute; inset: 22px; border: 1.5px solid #35566B; }
  .cadre2 { position: absolute; inset: 30px; border: 0.75px solid #7A756B; }
  .contenu { position: absolute; inset: 0; padding: 84px; display: flex;
    flex-direction: column; justify-content: space-between; }
  .marque { font-size: 30px; font-weight: 560;
    font-variation-settings: "opsz" 40, "SOFT" 0, "WONK" 1; }
  .mono { font-family: "Spline Sans Mono", monospace; font-size: 17px;
    letter-spacing: 0.14em; color: #5C5648; }
  h1 { font-size: ${p.titre.length > 34 ? 64 : 76}px; font-weight: 560; line-height: 1.02;
    letter-spacing: -0.015em; font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 1;
    max-width: 640px; position: relative; z-index: 2; }
  .vignette { position: absolute; right: -110px; top: 40px; width: 660px; opacity: 0.9; }
  .vignette svg { width: 100%; height: auto; }
  .svg-romain text { font-family: "Fraunces", serif; font-variant-caps: all-small-caps; }
  .svg-mono { font-family: "Spline Sans Mono", monospace; }
</style></head>
<body>
  <div class="cadre"></div><div class="cadre2"></div>
  <div class="vignette">${cadran}</div>
  <div class="contenu">
    <div><div class="marque">Atelier Méridienne</div>
    <div class="mono">GNOMONIQUE &amp; FRESQUE — QUEYRAS</div></div>
    <div><h1>${p.titre}</h1>
    <div class="mono" style="margin-top:26px">${p.sous}</div></div>
  </div>
</body></html>`;

const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({
  viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1,
})).newPage();

for (const p of PAGES) {
  const tmp = `${RACINE}assets/og/.og-${p.slug}.html`;
  writeFileSync(tmp, gabarit(p));
  await page.goto(`${BASE}/assets/og/.og-${p.slug}.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${RACINE}assets/og/og-${p.slug}.png` });
  console.log(`og-${p.slug}.png`);
}
await navigateur.close();

// Nettoyage des gabarits temporaires.
const { unlinkSync } = await import("node:fs");
for (const p of PAGES) unlinkSync(`${RACINE}assets/og/.og-${p.slug}.html`);
console.log("Images OG générées dans assets/og/");
