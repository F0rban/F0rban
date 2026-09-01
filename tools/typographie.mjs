/**
 * typographie.mjs — Micro-typographie française, appliquée par script.
 *
 * Règles (copy.md, conventions) :
 * - espace fine insécable (U+202F) avant ; ! ? et à l'intérieur des « » ;
 * - espace insécable (U+00A0) avant : et entre nombre et unité (900 €, 13 h 34) ;
 * - fine insécable comme séparateur de milliers (18 000) ;
 * - apostrophe typographique (') partout dans le texte.
 *
 * Ne touche que les nœuds texte (jamais les balises, scripts, styles, SVG)
 * et les attributs data-glose (contenu des infobulles). Idempotent.
 *
 * Usage : node tools/typographie.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RACINE = new URL("..", import.meta.url).pathname;
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

const FINE = " "; // espace fine insécable
const INSEC = " "; // espace insécable

const UNITES = "(?:€|%|HT\\b|TTC\\b|h\\b|H\\b|min\\b|MIN\\b|s\\b|S\\b|m\\b|M\\b|cm\\b|CM\\b|km\\b|KM\\b|mm\\b|MM\\b|°C|ans\\b|ANS\\b|GIORNATE\\b|giornate\\b|jours?\\b|JOURS?\\b|mois\\b|MOIS\\b|SÉRIES\\b|séries\\b|NIVEAUX\\b|RAIS\\b)";

function applique(texte) {
  let t = texte;
  // Apostrophe typographique entre deux lettres (ou lettre + entité).
  t = t.replace(/([\p{L}])'(?=[\p{L}&])/gu, "$1’");
  // Ponctuation haute : fine insécable avant ; ! ?
  t = t.replace(/ ([;!?])/g, `${FINE}$1`);
  // Deux-points : insécable avant.
  t = t.replace(/ :/g, `${INSEC}:`);
  // Guillemets français : fines à l'intérieur.
  t = t.replace(/« /g, `«${FINE}`);
  t = t.replace(/ »/g, `${FINE}»`);
  // Milliers : 18 000 → fine (chiffre + espace + exactement 3 chiffres).
  t = t.replace(/(\d) (\d{3})(?!\d)/g, `$1${FINE}$2`);
  // Nombre + unité : insécable (deux passes pour 13 h 34 → 13 h 34).
  const nombreUnite = new RegExp(`(\\d) (?=${UNITES})`, "g");
  t = t.replace(nombreUnite, `$1${INSEC}`);
  t = t.replace(/(\d[ ](?:h|H)) (\d)/g, `$1${INSEC}$2`);
  return t;
}

let pagesModifiees = 0;
for (const page of PAGES) {
  const chemin = join(RACINE, page);
  let html;
  try {
    html = readFileSync(chemin, "utf8");
  } catch {
    continue;
  }
  const avant = html;

  // Attributs data-glose (texte des infobulles).
  html = html.replace(/data-glose="([^"]*)"/g, (_, v) => `data-glose="${applique(v)}"`);

  // Nœuds texte : on segmente sur les balises, on saute script/style/svg.
  const morceaux = html.split(/(<[^>]*>)/);
  let brut = 0; // profondeur de zones à ne pas toucher
  const sortie = morceaux.map((m) => {
    if (m.startsWith("<")) {
      const nom = m.match(/^<\/?\s*([a-zA-Z0-9-]+)/)?.[1]?.toLowerCase();
      if (["script", "style", "svg"].includes(nom)) {
        if (m.startsWith("</")) brut = Math.max(0, brut - 1);
        else if (!m.endsWith("/>")) brut += 1;
      }
      return m;
    }
    return brut > 0 ? m : applique(m);
  });
  html = sortie.join("");

  if (html !== avant) {
    writeFileSync(chemin, html);
    pagesModifiees++;
  }
}
console.log(`Typographie appliquée : ${pagesModifiees} page(s) modifiée(s).`);
