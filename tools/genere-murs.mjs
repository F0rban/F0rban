/**
 * genere-murs.mjs — injecte les murs de carreaux et la craquelure dans index.html.
 *
 * Les murs sont générés une fois pour toutes (HTML statique) : la page
 * fonctionne sans JavaScript, sans décalage de mise en page, et le JS ne fait
 * qu'animer. Les marqueurs portent leurs paramètres ; les graines fixes rendent
 * le script idempotent (rejouable sans diff).
 *
 *   <!-- mur:hero n=300 seed=17 -->…<!-- /mur:hero -->
 *   <!-- mur:comptoir n=48 seed=31 cols=12 motif=decale variation=1.2 -->…
 *   <!-- mur:salle n=70 seed=45 cols=10 alt=3 -->…
 *   <!-- svg:craquele seed=1841 -->…<!-- /svg:craquele -->
 *
 * Usage : node tools/genere-murs.mjs   (ou npm run build)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { htmlMur, svgCraquele } from "./lib/murs.mjs";

const fichier = new URL("../index.html", import.meta.url);
let html = readFileSync(fichier, "utf8");
let injections = 0;

const parseParams = (chaine) => {
  const p = {};
  for (const m of chaine.matchAll(/(\w+)=([^\s]+)/g)) {
    const [, k, v] = m;
    p[k] = k === "alt" ? v.split(",").map(Number) : /^[\d.]+$/.test(v) ? Number(v) : v;
  }
  return p;
};

html = html.replace(
  /(<!-- mur:([\w-]+)([^>]*?)-->)([\s\S]*?)(<!-- \/mur:\2 -->)/g,
  (_, ouverture, nom, params, __, fermeture) => {
    injections++;
    return `${ouverture}${htmlMur(parseParams(params))}${fermeture}`;
  }
);

html = html.replace(
  /(<!-- svg:craquele([^>]*?)-->)([\s\S]*?)(<!-- \/svg:craquele -->)/g,
  (_, ouverture, params, __, fermeture) => {
    injections++;
    return `${ouverture}${svgCraquele(parseParams(params))}${fermeture}`;
  }
);

writeFileSync(fichier, html);
console.log(`${injections} injection(s) dans index.html`);
