/**
 * genere-svg.mjs — Génère les SVG gnomoniques du site à partir du moteur.
 *
 * Tout tracé visible (lignes horaires, arcs de déclinaison, analemmes, ombre)
 * est CALCULÉ par assets/js/gnomonique.js — jamais dessiné à main levée.
 * Le vocabulaire graphique suit docs/brand/visual-bible.md §5 (planche gnomonique) :
 * 3 épaisseurs de traits, terminaisons butt, épure apparente, rosace au compas,
 * cadre double, cartouche mono, deux accents maximum par planche.
 *
 * Sorties (snippets HTML à inliner, pas des fichiers <img>) :
 *   assets/img/generated/cadran-hero.svg.html
 *   assets/img/generated/planche-{1..5}.svg.html
 *   assets/img/generated/analemme-footer.svg.html
 *
 * Usage : node tools/genere-svg.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import {
  OBLIQUITE,
  geometrieCadran,
  lignesHoraires,
  arcsDeclinaison,
  analemme,
  equationDuTemps,
} from "../assets/js/gnomonique.js";

const OUT = new URL("../assets/img/generated/", import.meta.url);
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* Palette (tokens jour — une planche est un document imprimé)         */
/* ------------------------------------------------------------------ */
const C = {
  bistre: "#1C1A17",
  ocre: "#C8951F",
  ocreEncre: "#715208",
  sang: "#A63D2F",
  bleu: "#35566B",
  gris: "#7A756B",
  chauxCreuse: "#EDE6D6",
};

/* ------------------------------------------------------------------ */
/* Petits utilitaires géométriques                                     */
/* ------------------------------------------------------------------ */
const r1 = (x) => Math.round(x * 10) / 10;

/** Intersection de la demi-droite (cx,cy)+t·(dx,dy) avec le rectangle
 *  [x0,x1]×[y0,y1] — renvoie le point de sortie (t maximal admissible). */
function clipRay(cx, cy, dx, dy, x0, y0, x1, y1) {
  let t = Infinity;
  if (dx > 1e-12) t = Math.min(t, (x1 - cx) / dx);
  if (dx < -1e-12) t = Math.min(t, (x0 - cx) / dx);
  if (dy > 1e-12) t = Math.min(t, (y1 - cy) / dy);
  if (dy < -1e-12) t = Math.min(t, (y0 - cy) / dy);
  if (!isFinite(t) || t <= 0) return null;
  return { x: cx + t * dx, y: cy + t * dy, t };
}

const ROMAIN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

function polyline(points, attrs) {
  const d = points.map((p, i) => `${i ? "L" : "M"}${r1(p.x)} ${r1(p.y)}`).join("");
  return `<path d="${d}" ${attrs}/>`;
}

/** Chocard queyrassin stylisé — 3 traits (aile-corps-aile), signature de marge. */
function chocard(x, y, s = 1, couleur = C.bistre) {
  return `<path d="M${x} ${y}q${8 * s}-${7 * s} ${14 * s} 0q${6 * s}-${7 * s} ${14 * s} 0" stroke="${couleur}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
}

/** Rosace au compas : pétales pairs en arcs de report, pastille sang au centre. */
function rosace(cx, cy, r = 13, petales = 6, couleur = C.sang) {
  let p = "";
  for (let i = 0; i < petales; i++) {
    const a = (i * 2 * Math.PI) / petales;
    const x1 = cx + r * Math.cos(a);
    const y1 = cy + r * Math.sin(a);
    const a2 = ((i + 1) * 2 * Math.PI) / petales;
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    p += `<path d="M${r1(x1)} ${r1(y1)}A${r} ${r} 0 0 1 ${r1(x2)} ${r1(y2)}" stroke="${couleur}" stroke-width="1.5" fill="none"/>`;
  }
  p += `<circle cx="${cx}" cy="${cy}" r="3" fill="${couleur}"/>`;
  return p;
}

/** Soleil à N rais (motif queyrassin du XIXe), tout en traits « peints ». */
function soleilRais(cx, cy, r = 16, rais = 16, couleur = C.ocre) {
  let p = `<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" stroke="${couleur}" stroke-width="1.5" fill="none"/>`;
  for (let i = 0; i < rais; i++) {
    const a = (i * 2 * Math.PI) / rais;
    const rr = i % 2 ? r : r * 0.75;
    p += `<line x1="${r1(cx + Math.cos(a) * r * 0.55)}" y1="${r1(cy + Math.sin(a) * r * 0.55)}" x2="${r1(cx + Math.cos(a) * rr)}" y2="${r1(cy + Math.sin(a) * rr)}" stroke="${couleur}" stroke-width="1.5" stroke-linecap="butt"/>`;
  }
  return p;
}

/** Frise dents-de-loup horizontale entre x0 et x1 à la hauteur y. */
function dentsDeLoup(x0, x1, y, h = 7, pas = 14, couleur = C.sang) {
  let d = "";
  for (let x = x0; x + pas <= x1 + 0.5; x += pas) {
    d += `M${r1(x)} ${y}L${r1(x + pas / 2)} ${y - h}L${r1(x + pas)} ${y}`;
  }
  return `<path d="${d}" stroke="${couleur}" stroke-width="1.5" fill="none" stroke-linejoin="miter"/>`;
}

/* ------------------------------------------------------------------ */
/* Cœur : dessin d'un cadran (héros ou planche) depuis le moteur       */
/* ------------------------------------------------------------------ */

/**
 * Construit les tracés gnomoniques d'un cadran dans une boîte donnée.
 * Toutes les géométries sortent du moteur ; ici on ne fait que projeter/cliper.
 */
function traceCadran({
  lat, declMur, heures, demies = false, centre, box, echelleNodus,
  analemmeHeureLegale = null, arcs = true, numeralStyle = "flat",
  couleurChiffres = C.bistre, tailleChiffres = 15,
}) {
  const [bx0, by0, bx1, by1] = box;
  const { sousStylaire } = geometrieCadran(lat, declMur);
  const lignes = lignesHoraires(lat, declMur, heures);
  const eclairees = lignes.filter((l) => l.recoitSoleil);

  let g = "";

  // Épure : cercle de report + sous-stylaire + horizontale (preuve du calcul).
  const rReport = Math.min(bx1 - centre.x, centre.x - bx0, by1 - centre.y) * 0.72;
  g += `<g stroke="${C.gris}" stroke-width="0.75" stroke-dasharray="2 5" fill="none">`;
  g += `<circle cx="${centre.x}" cy="${centre.y}" r="${r1(rReport)}"/>`;
  g += `<line x1="${bx0}" y1="${centre.y}" x2="${bx1}" y2="${centre.y}"/>`;
  const ss = clipRay(centre.x, centre.y, Math.sin((sousStylaire * Math.PI) / 180), Math.cos((sousStylaire * Math.PI) / 180), bx0, by0, bx1, by1);
  if (ss) g += `<line x1="${centre.x}" y1="${centre.y}" x2="${r1(ss.x)}" y2="${r1(ss.y)}"/>`;
  g += `</g>`;

  // Lignes horaires pleines (tracé 1.5, butt) + chiffres romains.
  g += `<g stroke="${C.bleu}" stroke-width="1.5" stroke-linecap="butt" fill="none">`;
  const bouts = [];
  for (const l of eclairees) {
    const hit = clipRay(centre.x, centre.y, l.direction.x, l.direction.y, bx0, by0, bx1, by1);
    if (!hit) continue;
    const gap = tailleChiffres + 7; // place du chiffre au bout de la ligne
    const t2 = Math.max(hit.t - gap, hit.t * 0.5);
    g += `<line x1="${centre.x}" y1="${centre.y}" x2="${r1(centre.x + l.direction.x * t2)}" y2="${r1(centre.y + l.direction.y * t2)}"/>`;
    bouts.push({ l, hit });
  }
  // Demi-heures : traits courts de construction entre les pleines.
  if (demies) {
    const hDemies = [];
    for (let h = Math.min(...heures) + 0.5; h < Math.max(...heures); h += 1) hDemies.push(h);
    for (const l of lignesHoraires(lat, declMur, hDemies)) {
      if (!l.recoitSoleil) continue;
      const hit = clipRay(centre.x, centre.y, l.direction.x, l.direction.y, bx0, by0, bx1, by1);
      if (!hit) continue;
      g += `<line x1="${r1(centre.x + l.direction.x * hit.t * 0.82)}" y1="${r1(centre.y + l.direction.y * hit.t * 0.82)}" x2="${r1(centre.x + l.direction.x * (hit.t - tailleChiffres - 7))}" y2="${r1(centre.y + l.direction.y * (hit.t - tailleChiffres - 7))}" stroke-width="0.75"/>`;
    }
  }
  g += `</g>`;

  // Chiffres romains au bout des lignes (petites capitales via CSS .romain).
  // Anti-collision : près de midi les lignes se resserrent — on rentre un chiffre
  // sur deux le long de sa propre ligne quand deux voisins seraient à moins de 30 px.
  g += `<g font-size="${tailleChiffres}" fill="${couleurChiffres}" text-anchor="middle" class="svg-romain">`;
  let prec = null;
  for (const { l, hit } of bouts) {
    let recul = tailleChiffres * 0.55;
    let x = hit.x - l.direction.x * recul;
    let y = hit.y - l.direction.y * recul;
    if (prec && Math.hypot(x - prec.x, y - prec.y) < tailleChiffres * 2.1 && !prec.rentre) {
      recul += tailleChiffres * 1.55;
      x = hit.x - l.direction.x * recul;
      y = hit.y - l.direction.y * recul;
      prec = { x, y, rentre: true };
    } else {
      prec = { x, y, rentre: false };
    }
    const rot = numeralStyle === "perp" ? ` transform="rotate(${r1(l.angle)},${r1(x)},${r1(y)})"` : "";
    g += `<text x="${r1(x)}" y="${r1(y + tailleChiffres * 0.35)}"${rot}>${ROMAIN[Math.round(l.heure)]}</text>`;
  }
  g += `</g>`;

  // Arcs diurnes de déclinaison (solstices = hyperboles, équinoxe = droite).
  if (arcs) {
    g += `<g stroke="${C.gris}" stroke-width="0.75" fill="none">`;
    for (const arc of arcsDeclinaison(lat, declMur, [-OBLIQUITE, 0, OBLIQUITE], {
      pasAngleHoraire: 3, longueurStyle: echelleNodus,
    })) {
      const pts = arc.points
        .map((p) => ({ x: centre.x + p.x, y: centre.y + p.y }))
        .filter((p) => p.x > bx0 && p.x < bx1 && p.y > by0 && p.y < by1);
      if (pts.length > 2) g += polyline(pts, `stroke-dasharray="${arc.declinaison === 0 ? "none" : "4 3"}"`);
    }
    g += `</g>`;
  }

  // Analemme (courbe en huit réelle, heure légale d'hiver fixe).
  if (analemmeHeureLegale !== null) {
    const pts = analemme(lat, 6.85, analemmeHeureLegale, {
      fuseau: 1, annee: 2026, pasJours: 4, declMur, longueurStyle: echelleNodus,
    })
      .filter((p) => p.visible && p.ombre)
      .map((p) => ({ x: centre.x + p.ombre.x, y: centre.y + p.ombre.y }))
      .filter((p) => p.x > bx0 && p.x < bx1 && p.y > by0 && p.y < by1);
    if (pts.length > 4) g += polyline([...pts, pts[0]], `stroke="${C.sang}" stroke-width="1.5" fill="none" stroke-linejoin="round"`);
  }

  return { g, lignes, eclairees };
}

/* ------------------------------------------------------------------ */
/* 1. LE CADRAN VIVANT — héros de l'accueil                            */
/* ------------------------------------------------------------------ */
const HERO = { lat: 44.6885, lon: 6.8503, declMur: -14 }; // 14° EST — le mur de l'atelier (hypothèse fictive)

function genereHero() {
  const W = 760, H = 600;
  const centre = { x: 396, y: 178 };
  const box = [64, 56, W - 64, H - 92];
  const heures = [];
  for (let h = 4; h <= 20; h++) heures.push(h);

  const { g, eclairees } = traceCadran({
    lat: HERO.lat, declMur: HERO.declMur, heures,
    centre, box, echelleNodus: 96, analemmeHeureLegale: 13,
    tailleChiffres: 17,
  });

  const premiere = Math.min(...eclairees.map((l) => l.heure));
  const derniere = Math.max(...eclairees.map((l) => l.heure));
  console.log(`HÉROS — mur ${HERO.declMur}° (est<0) : heures éclairées ${ROMAIN[premiere]}–${ROMAIN[derniere]}`);

  // Longueur de l'ombre : jusqu'au bord bas de la boîte.
  const lOmbre = box[3] - centre.y - 26;

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cadran-titre cadran-desc" fill="none" class="cadran-svg" data-lat="${HERO.lat}" data-lon="${HERO.lon}" data-decl-mur="${HERO.declMur}">
  <title id="cadran-titre">Le Cadran Vivant — cadran solaire vertical déclinant de 14° vers l'est, calculé pour Molines-en-Queyras</title>
  <desc id="cadran-desc">Tracé gnomonique complet : lignes horaires de ${ROMAIN[premiere]} à ${ROMAIN[derniere]} heures, arcs des solstices et de l'équinoxe, analemme de midi. L'ombre dorée du style indique l'heure solaire vraie, calculée dans votre navigateur.</desc>
  <!-- cadre double de planche -->
  <rect x="18" y="14" width="${W - 36}" height="${H - 28}" stroke="${C.bleu}" stroke-width="1.5"/>
  <rect x="26" y="22" width="${W - 52}" height="${H - 44}" stroke="${C.gris}" stroke-width="0.75"/>
  ${g}
  <!-- ombre du style : SEUL élément animé, pivote au pied du gnomon (rosace).
       Dessinée à la verticale = ligne de midi vrai ; cadran.js la met à l'heure. -->
  <g id="cadran-ombre" style="transform-origin:${centre.x}px ${centre.y}px" data-longueur="${lOmbre}">
    <line x1="${centre.x}" y1="${centre.y}" x2="${centre.x}" y2="${centre.y + lOmbre}" stroke="${C.ocre}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
    <circle cx="${centre.x}" cy="${centre.y + lOmbre}" r="4" fill="${C.ocre}"/>
  </g>
  <!-- nuit : point du jour sur l'analemme (rempli par cadran.js) -->
  <circle id="cadran-point-nuit" r="5" fill="${C.sang}" opacity="0" cx="${centre.x}" cy="${centre.y + 60}"/>
  ${rosace(centre.x, centre.y)}
  ${chocard(88, 78, 1.1)}${chocard(132, 64, 0.8)}
  <text x="${W - 40}" y="${H - 40}" text-anchor="end" font-size="11" fill="${C.gris}" class="svg-mono">44°41′N 6°51′E · DÉCL. 14° EST · TRACÉ CALCULÉ</text>
</svg>`;
  writeFileSync(new URL("cadran-hero.svg.html", OUT), svg);
}

/* ------------------------------------------------------------------ */
/* 2. LES CINQ PLANCHES — page Créations                               */
/* ------------------------------------------------------------------ */
const PLANCHES = [
  {
    n: 1, id: "veilleur-arvieux", titre: "Planche I — Le Veilleur d'Arvieux",
    desc: "Cadran déclinant de 18° vers l'est sur pignon de grange : éventail de VI à XVI heures, soleil à seize rais, chiffres au sang de bœuf.",
    lat: 44.7667, declMur: -18, heures: [6, 16], demies: false,
    analemme: null, couleurChiffres: C.sang, deco: "soleil",
    devise: "Sine sole sileo.", cartouche: ["PL. I — ARVIEUX", "44°46′N · DÉCL. 18° EST", "A FRESCO · 6 GIORNATE"],
  },
  {
    n: 2, id: "grand-declinant", titre: "Planche II — Le Grand Déclinant",
    desc: "Grand cadran d'après-midi sur façade déclinant de 41° vers l'ouest : éventail déporté de X à XIX heures, demies, analemme sur la ligne de quatorze heures, frise bleue.",
    lat: 44.7, declMur: 41, heures: [10, 19], demies: true,
    analemme: 15, couleurChiffres: C.bistre, deco: "frise-bleue",
    devise: "Sol omnibus lucet.", cartouche: ["PL. II — SAINT-VÉRAN", "44°42′N · DÉCL. 41° OUEST", "A FRESCO · 11 GIORNATE"],
  },
  {
    n: 3, id: "heure-apprendre", titre: "Planche III — L'Heure d'apprendre",
    desc: "Cadran d'école quasi méridional, déclinant de 6° vers l'ouest : heures pleines et demies de VII à XVII, analemme de midi, table de l'équation du temps sous la corniche.",
    lat: 44.6667, declMur: 6, heures: [7, 17], demies: true,
    analemme: 13, couleurChiffres: C.bistre, deco: "table-eqt", grandsChiffres: true,
    devise: "Disce dum lucet.", cartouche: ["PL. III — CEILLAC", "44°40′N · DÉCL. 6° OUEST", "A FRESCO · 8 GIORNATE"],
  },
  {
    n: 4, id: "heures-sereines", titre: "Planche IV — Les Heures Sereines",
    desc: "Cadran sobre d'une maison de famille, déclinant de 4° vers l'est : douze lignes de VI à XVII heures, analemme de midi en pointillé, chiffres bistre sur chaux nue.",
    lat: 44.75, declMur: -4, heures: [6, 17], demies: false,
    analemme: 13, couleurChiffres: C.bistre, deco: "aucun",
    devise: "Horas non numero nisi serenas.", cartouche: ["PL. IV — CHÂTEAU-VILLE-VIEILLE", "44°45′N · DÉCL. 4° EST", "A FRESCO · 4 GIORNATE"],
  },
  {
    n: 5, id: "chapelle-deux-traces", titre: "Planche V — La Chapelle aux deux tracés",
    desc: "Relevé de restauration du cadran de 1843 : tracé restauré de VII à XVI heures, tracé ancien abandonné en surimpression ocre, lacune réintégrée a tratteggio.",
    lat: 44.8, declMur: -11, heures: [7, 16], demies: false,
    analemme: null, couleurChiffres: C.sang, deco: "tratteggio", ancien: -19,
    devise: "Ultima latet.", cartouche: ["PL. V — ABRIÈS · CADRAN DE 1843", "44°48′N · DÉCL. 11° EST", "RESTAURATION · TRATTEGGIO"],
  },
];

function generePlanche(p) {
  const W = 480, H = 380;
  // Le centre glisse à l'opposé du déport de l'éventail pour remplir la planche.
  const heures = [];
  for (let h = p.heures[0]; h <= p.heures[1]; h++) heures.push(h);
  const lignesProbe = lignesHoraires(p.lat, p.declMur, heures).filter((l) => l.recoitSoleil);
  const dxMoyen = lignesProbe.reduce((s, l) => s + l.direction.x, 0) / lignesProbe.length;
  const centre = { x: r1(240 - dxMoyen * 120), y: 108 };
  const box = [40, 44, W - 40, H - 96];

  const { g, eclairees } = traceCadran({
    lat: p.lat, declMur: p.declMur, heures, demies: p.demies,
    centre, box, echelleNodus: 62, analemmeHeureLegale: p.analemme,
    couleurChiffres: p.couleurChiffres,
    tailleChiffres: p.grandsChiffres ? 16 : 13,
  });

  const premiere = ROMAIN[Math.min(...eclairees.map((l) => l.heure))];
  const derniere = ROMAIN[Math.max(...eclairees.map((l) => l.heure))];
  console.log(`PLANCHE ${p.n} (${p.id}) — d=${p.declMur}° : heures éclairées ${premiere}–${derniere} (spec : ${ROMAIN[p.heures[0]]}–${ROMAIN[p.heures[1]]})`);

  let deco = "";
  if (p.deco === "soleil") deco = soleilRais(84, 84, 17);
  if (p.deco === "frise-bleue") deco = dentsDeLoup(48, W - 48, 42, 9, 24, C.bleu);
  if (p.deco === "table-eqt") {
    // Table de l'équation du temps sous la corniche : 12 ticks mensuels réels.
    let t = `<g stroke="${C.bleu}" stroke-width="0.75">`;
    for (let m = 0; m < 12; m++) {
      const e = equationDuTemps(new Date(Date.UTC(2026, m, 15, 12)));
      const x = 70 + m * 29;
      t += `<line x1="${x}" y1="40" x2="${x}" y2="${r1(40 - e * 0.7)}"/>`;
    }
    t += `<line x1="62" y1="40" x2="${70 + 11 * 29 + 8}" y2="40"/></g>`;
    deco = t;
  }
  if (p.deco === "tratteggio") {
    let t = `<g stroke="${C.sang}" stroke-width="0.75" opacity="0.55">`;
    for (let x = 0; x <= 44; x += 3) t += `<line x1="${318 + x}" y1="196" x2="${318 + x}" y2="${232 + (x % 9)}"/>`;
    t += `</g>`;
    deco = t;
  }

  // Tracé ancien abandonné (restauration) : mêmes heures, autre déclinaison, ocre pâle.
  let ancien = "";
  if (p.ancien !== undefined) {
    ancien = `<g stroke="${C.ocre}" stroke-width="0.75" stroke-dasharray="5 4" opacity="0.6">`;
    for (const l of lignesHoraires(p.lat, p.ancien, heures)) {
      if (!l.recoitSoleil) continue;
      const hit = clipRay(centre.x, centre.y, l.direction.x, l.direction.y, box[0], box[1], box[2], box[3]);
      if (!hit) continue;
      ancien += `<line x1="${centre.x}" y1="${centre.y}" x2="${r1(centre.x + l.direction.x * hit.t * 0.6)}" y2="${r1(centre.y + l.direction.y * hit.t * 0.6)}"/>`;
    }
    ancien += `</g>`;
  }

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="p${p.n}-t p${p.n}-d" fill="none" class="planche-svg">
  <title id="p${p.n}-t">${p.titre}</title>
  <desc id="p${p.n}-d">${p.desc}</desc>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" stroke="${C.bleu}" stroke-width="1.5"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" stroke="${C.gris}" stroke-width="0.75"/>
  ${deco}
  ${ancien}
  ${g}
  ${rosace(centre.x, centre.y, 11)}
  ${p.n % 2 ? chocard(W - 96, 60, 0.8) + chocard(W - 66, 50, 0.6) : chocard(52, 58, 0.8)}
  <g class="svg-mono" font-size="8.5" fill="${C.bistre}" text-anchor="end">
    ${p.cartouche.map((l, i) => `<text x="${W - 26}" y="${H - 46 + i * 12}">${l}</text>`).join("\n    ")}
  </g>
</svg>`;
  writeFileSync(new URL(`planche-${p.n}.svg.html`, OUT), svg);
}

/* ------------------------------------------------------------------ */
/* 3. Analemme décorative du footer (mur nocturne)                     */
/* ------------------------------------------------------------------ */
function genereAnalemmeFooter() {
  const pts = analemme(44.6885, 6.8503, 13, { fuseau: 1, annee: 2026, pasJours: 4 })
    .filter((p) => p.hauteur > 0)
    .map((p) => ({ x: 90 + p.azimutSud * 3.4, y: 150 - p.hauteur * 1.7 }));
  const svg = `<svg viewBox="0 0 180 160" aria-hidden="true" fill="none" class="analemme-footer">
  ${polyline([...pts, pts[0]], `stroke="#B08A3E" stroke-width="1.5" stroke-linejoin="round" opacity="0.8"`)}
  <line x1="12" y1="150" x2="168" y2="150" stroke="#4A7086" stroke-width="0.75"/>
  <circle cx="${r1(pts[0].x)}" cy="${r1(pts[0].y)}" r="3" fill="#DC7B66"/>
</svg>`;
  writeFileSync(new URL("analemme-footer.svg.html", OUT), svg);
}

genereHero();
for (const p of PLANCHES) generePlanche(p);
genereAnalemmeFooter();
console.log("SVG générés dans assets/img/generated/");
