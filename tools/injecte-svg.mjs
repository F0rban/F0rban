/**
 * injecte-svg.mjs — Injecte les SVG générés dans les pages HTML.
 *
 * Les pages contiennent des marqueurs par paires :
 *   <!-- svg:cadran-hero -->…<!-- /svg:cadran-hero -->
 * Le contenu entre les marqueurs est remplacé par le fichier
 * assets/img/generated/<nom>.svg.html. Idempotent : rejouable après chaque
 * `node tools/genere-svg.mjs` sans toucher au reste de la page.
 *
 * Usage : node tools/injecte-svg.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RACINE = new URL("..", import.meta.url).pathname;
const GENERES = join(RACINE, "assets/img/generated");

const PAGES = [
  "index.html",
  "savoir-faire/index.html",
  "creations/index.html",
  "atelier/index.html",
  "methode-tarifs/index.html",
  "contact/index.html",
  "mentions/index.html",
  "404.html",
];

const snippets = {};
for (const f of readdirSync(GENERES)) {
  if (f.endsWith(".svg.html")) {
    snippets[f.replace(".svg.html", "")] = readFileSync(join(GENERES, f), "utf8").trim();
  }
}

let total = 0;
for (const page of PAGES) {
  const chemin = join(RACINE, page);
  let html;
  try {
    html = readFileSync(chemin, "utf8");
  } catch {
    continue; // page pas encore écrite
  }
  let modifie = false;
  html = html.replace(
    /(<!-- svg:([a-z0-9-]+) -->)([\s\S]*?)(<!-- \/svg:\2 -->)/g,
    (tout, ouvre, nom, _ancien, ferme) => {
      if (!snippets[nom]) {
        console.warn(`⚠ ${page} : snippet inconnu « ${nom} »`);
        return tout;
      }
      modifie = true;
      total++;
      return `${ouvre}\n${snippets[nom]}\n${ferme}`;
    }
  );
  if (modifie) writeFileSync(chemin, html);
}
console.log(`${total} injection(s) SVG effectuée(s).`);
