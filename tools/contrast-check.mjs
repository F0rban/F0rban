/**
 * contrast-check.mjs — preuve WCAG 2.1 de la palette de Tesson.
 * Calcule le ratio de luminance relative de chaque couple texte/fond réellement
 * utilisé par la page, y compris les textes semi-transparents (composés sur
 * leur fond) et les textes posés sur l'émail Vert Gottéron (testés sur la
 * variante la plus claire qu'un carreau puisse atteindre).
 * Usage : node tools/contrast-check.mjs   (code de sortie 1 si un couple échoue)
 */
const hex2rgb = (h) => {
  const m = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
};
const hsl2rgb = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
};
const compose = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (rgb) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
const fmt = (r) => (Math.floor(r * 100) / 100).toFixed(2);

let echecs = 0;
const check = (label, fg, bg, need = 4.5) => {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) echecs++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${fmt(r)}:1  (min ${need})  ${label}`);
};

const biscuit = hex2rgb("#EFE8DB");
const biscuit2 = hex2rgb("#E5DCCB");
const lait = hex2rgb("#F7F2E8");
const encre = hex2rgb("#1B1411");
const encre2 = hex2rgb("#5E564C");
const tenmoku = hex2rgb("#1B1411");
const lait2 = hex2rgb("#B9B0A4");
const gotteron = hsl2rgb(176, 62, 17);
// Carreau le plus clair possible : fond de four (+7,7 %) + bombé (+4 %).
const gotteronClair = hsl2rgb(176, 62, 17 + 7.7 + 4);
const ocre = hsl2rgb(22, 66, 39);
const sarineClair = hsl2rgb(220, 42, 32 + 7.7 * 1.1 + 5);
const scrimHero = compose([10 / 255, 8 / 255, 6 / 255], 0.42, gotteronClair);

console.log("— Fond biscuit —");
check("encre / biscuit (courant)", encre, biscuit);
check("encre-2 / biscuit (secondaire, fiche, méthode)", encre2, biscuit);
check("encre / biscuit-2 (section émaux)", encre, biscuit2);
check("encre-2 / biscuit-2 (codes, légende)", encre2, biscuit2);
check("numéros d'étape Vert Gottéron / biscuit (≥ 24 px)", gotteron, biscuit, 3);
console.log("\n— Fond tenmoku (murs, pied) —");
check("lait / tenmoku (courant)", lait, tenmoku);
check("lait-2 / tenmoku (spécifications, pied)", lait2, tenmoku);
console.log("\n— Sur l'émail Vert Gottéron (hero, appel) — carreau le plus clair —");
check("lait / gottéron clair (titre, courant)", lait, gotteronClair);
check("eyebrow lait / gottéron clair (12 px capitales)", lait, gotteronClair);
check("cartel lait à 78 % / gottéron clair + pénombre (12 px)", compose(lait, 0.78, scrimHero), scrimHero);
console.log("\n— Sur l'émail Bleu Sarine (appel) — carreau le plus clair, sans la pénombre —");
check("lait / sarine clair (titre, courant)", lait, sarineClair);
check("appel-alt lait / sarine clair (15 px)", lait, sarineClair);
check("eyebrow à 82 % / gottéron clair (information : réglage abandonné)", compose(lait, 0.82, gotteronClair), gotteronClair, 0);
console.log("\n— Boutons —");
check("lait sur encre (CTA sections claires)", lait, encre);
check("encre sur lait (CTA hero, appel)", encre, lait);
check("lait sur Vert Gottéron (CTA survolé)", lait, gotteron);
console.log("\n— Contrôle : couples volontairement non utilisés pour du texte —");
check("lait sur ocre brûlé (information : pas de texte posé dessus)", lait, ocre);

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUS LES COUPLES PASSENT");
process.exit(echecs ? 1 : 0);
