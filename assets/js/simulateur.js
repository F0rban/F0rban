/**
 * simulateur.js — Le Curseur de déclinaison (page Savoir-faire).
 *
 * L'anecdote fondatrice, prouvée en dix secondes : on fausse la déclinaison
 * supposée du mur de 0 à 4°, et la courbe montre la dérive de lecture réelle,
 * mois par mois. Tout est calculé par erreurLecture() du moteur gnomonique —
 * jamais une règle de trois codée en dur (la dérive n'est pas exactement
 * linéaire, et c'est précisément le propos).
 *
 * Modèle : cadran rigide (tracé + style construits sur la déclinaison fausse),
 * fidèle au cadran de 1841 du récit. Latitude de Molines, mur plein sud —
 * le résultat est quasi insensible à l'orientation réelle du mur (±0,05 min
 * de −30° à +30°, cf. docs/gnomonique-spec.md).
 */
import { erreurLecture, declinaisonSoleil, equationDuTemps } from "./gnomonique.js";

const bloc = document.querySelector("#simulateur");
if (bloc) initialise(bloc);

/* Étiquette du geste 4 : le midi vrai du jour à Molines, heure légale. */
const eMidi = document.querySelector("[data-live='midi-vrai']");
if (eMidi) {
  const LON = 6.8503;
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  const minutesUTC = 720 - 4 * LON - equationDuTemps(d);
  d.setUTCHours(0, Math.round(minutesUTC), 0, 0);
  // timeZone explicite : le midi vrai de Molines s'affiche en heure de
  // Molines, pas dans le fuseau du visiteur.
  const h = d.toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " H ");
  eMidi.textContent = `MIDI VRAI — ${h} (HEURE LÉGALE) CE JOUR À MOLINES`;
}

function initialise(bloc) {
  const LAT = 44.6885;
  const DECL_MUR = 0;
  const ANNEE = new Date().getFullYear();

  const curseur = bloc.querySelector("#curseur-erreur");
  const eErreur = bloc.querySelector("[data-live='erreur']");
  const eLive = bloc.querySelector("[data-live='derive']");
  const eMax = bloc.querySelector("[data-live='derive-max']");
  const svg = bloc.querySelector("#simulateur-svg");

  /* Géométrie du graphe */
  const W = 560, H = 300, MG = 44, MD = 16, MH = 18, MB = 40;
  const X0 = MG, X1 = W - MD, Y0 = MH, Y1 = H - MB;
  const Y_MAX = 18; // minutes — stable quel que soit le curseur (max réel : 16,2)

  const MOIS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN",
    "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];

  const x = (jour) => X0 + ((jour - 1) / 364) * (X1 - X0);
  const y = (min) => Y1 - (Math.min(min, Y_MAX) / Y_MAX) * (Y1 - Y0);

  /* Échantillonnage : pas de 4 jours, déclinaison solaire mise en cache. */
  const JOURS = [];
  for (let j = 1; j <= 365; j += 4) JOURS.push(j);
  if (JOURS[JOURS.length - 1] !== 365) JOURS.push(365);
  const DELTAS = JOURS.map((j) =>
    declinaisonSoleil(new Date(Date.UTC(ANNEE, 0, j, 12)))
  );
  const HEURES = [];
  for (let h = 8; h <= 17; h += 0.5) HEURES.push(h);

  let donnees = [];

  function calcule(erreurDeg) {
    donnees = JOURS.map((jour, i) => {
      const delta = DELTAS[i];
      let midi = null, mini = Infinity, maxi = 0;
      for (const h of HEURES) {
        const e = erreurLecture(LAT, DECL_MUR, DECL_MUR + erreurDeg, delta, 15 * (h - 12));
        if (e === null) continue;
        const a = Math.abs(e);
        if (a < mini) mini = a;
        if (a > maxi) maxi = a;
        if (h === 12) midi = a;
      }
      if (midi === null) midi = (mini + maxi) / 2;
      if (!isFinite(mini)) { mini = 0; maxi = 0; midi = 0; }
      return { jour, midi, mini, maxi };
    });
  }

  /* Tracé statique : axes, mois, graduations — construit une fois. */
  function axes() {
    let g = `<g stroke="#7A756B" stroke-width="0.75">`;
    g += `<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}"/>`;
    g += `<line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}"/>`;
    for (let m = 0; m < 12; m++) {
      const xm = x(1 + m * 30.4);
      g += `<line x1="${xm.toFixed(1)}" y1="${Y1}" x2="${xm.toFixed(1)}" y2="${Y1 + 4}"/>`;
    }
    for (let min = 0; min <= Y_MAX; min += 6) {
      g += `<line x1="${X0 - 4}" y1="${y(min).toFixed(1)}" x2="${X0}" y2="${y(min).toFixed(1)}"/>`;
    }
    g += `</g><g class="svg-mono" font-size="9" fill="#5C5648">`;
    for (let m = 0; m < 12; m += 2) {
      g += `<text x="${x(1 + m * 30.4).toFixed(1)}" y="${Y1 + 16}">${MOIS[m]}</text>`;
    }
    for (let min = 0; min <= Y_MAX; min += 6) {
      g += `<text x="${X0 - 8}" y="${(y(min) + 3).toFixed(1)}" text-anchor="end">${min}</text>`;
    }
    g += `<text x="${X0 - 30}" y="${Y0 - 4}">MIN</text></g>`;
    return g;
  }

  const calqueAxes = axes();

  function dessine() {
    // Bande : dérive min→max sur la plage 8 h–17 h solaires.
    let bande = "";
    const haut = donnees.map((d) => `${x(d.jour).toFixed(1)},${y(d.maxi).toFixed(1)}`);
    const bas = [...donnees].reverse().map((d) => `${x(d.jour).toFixed(1)},${y(d.mini).toFixed(1)}`);
    bande = `<polygon points="${haut.join(" ")} ${bas.join(" ")}" fill="#C8951F" opacity="0.18"/>`;

    // Courbe : dérive au midi vrai (le trait que l'œil suit).
    const courbe = donnees
      .map((d, i) => `${i ? "L" : "M"}${x(d.jour).toFixed(1)} ${y(d.midi).toFixed(1)}`)
      .join("");

    svg.innerHTML = `${calqueAxes}${bande}<path d="${courbe}" stroke="#A63D2F" stroke-width="1.5" fill="none"/><g id="sim-repere" opacity="0"><line y1="${Y0}" y2="${Y1}" stroke="#35566B" stroke-width="0.75" stroke-dasharray="2 5"/><circle r="3.5" fill="#A63D2F"/></g>`;
  }

  function metAJour() {
    const e = parseFloat(curseur.value);
    calcule(e);
    dessine();
    const maxAnnee = Math.max(...donnees.map((d) => d.maxi));
    if (eErreur) eErreur.textContent = `ERREUR DE DÉCLINAISON — ${e.toFixed(1).replace(".", ",")}°`;
    if (eMax) eMax.textContent = `DÉRIVE MAXIMALE SUR L'ANNÉE — ${maxAnnee.toFixed(1).replace(".", ",")} MIN`;
    if (eLive) eLive.textContent = "DÉRIVE DE LECTURE — SURVOLEZ LA COURBE";
    svg.setAttribute(
      "aria-label",
      `Dérive de lecture pour ${e.toFixed(1)} degré d'erreur de déclinaison : ` +
      `jusqu'à ${maxAnnee.toFixed(1)} minutes selon la saison, sur la plage de 8 à 17 heures solaires.`
    );
    // Le lecteur d'écran entend la conséquence, pas seulement le réglage.
    curseur.setAttribute(
      "aria-valuetext",
      `${e.toFixed(1).replace(".", ",")} degré d'erreur — dérive maximale ${maxAnnee.toFixed(1).replace(".", ",")} minutes sur l'année`
    );
  }

  /* Survol : la valeur au jour pointé. Le rect est mis en cache à l'entrée
     du pointeur (les écritures d'attributs qui suivent invalideraient le
     layout : un getBoundingClientRect par événement forcerait un reflow),
     et le traitement est throttlé au rythme des frames. */
  let rectCache = null;
  let survolAttente = false;
  svg.addEventListener("pointerenter", () => { rectCache = svg.getBoundingClientRect(); });
  window.addEventListener("resize", () => { rectCache = null; }, { passive: true });
  window.addEventListener("scroll", () => { rectCache = null; }, { passive: true });
  svg.addEventListener("pointermove", (ev) => {
    if (survolAttente) return;
    survolAttente = true;
    requestAnimationFrame(() => { survolAttente = false; });
    const r = rectCache || (rectCache = svg.getBoundingClientRect());
    const px = ((ev.clientX - r.left) / r.width) * W;
    if (px < X0 || px > X1 || !donnees.length) return;
    const jour = 1 + ((px - X0) / (X1 - X0)) * 364;
    let plusProche = donnees[0];
    for (const d of donnees) {
      if (Math.abs(d.jour - jour) < Math.abs(plusProche.jour - jour)) plusProche = d;
    }
    const repere = svg.querySelector("#sim-repere");
    if (repere) {
      const xd = x(plusProche.jour).toFixed(1);
      repere.setAttribute("opacity", "1");
      const ligne = repere.querySelector("line");
      ligne.setAttribute("x1", xd);
      ligne.setAttribute("x2", xd);
      const point = repere.querySelector("circle");
      point.setAttribute("cx", xd);
      point.setAttribute("cy", y(plusProche.midi).toFixed(1));
    }
    if (eLive) {
      const date = new Date(Date.UTC(ANNEE, 0, plusProche.jour));
      const mois = MOIS[date.getUTCMonth()];
      eLive.textContent =
        `DÉRIVE DE LECTURE — ${plusProche.midi.toFixed(1).replace(".", ",")} MIN AU MIDI VRAI ` +
        `(${plusProche.mini.toFixed(1).replace(".", ",")}–${plusProche.maxi.toFixed(1).replace(".", ",")} SUR LA JOURNÉE) · ${date.getUTCDate()} ${mois}`;
    }
  });
  svg.addEventListener("pointerleave", () => {
    svg.querySelector("#sim-repere")?.setAttribute("opacity", "0");
    if (eLive) eLive.textContent = "DÉRIVE DE LECTURE — SURVOLEZ LA COURBE";
  });

  /* L'instrument répond, il ne « joue » pas : recalcul direct, rAF-throttlé. */
  let enAttente = false;
  curseur.addEventListener("input", () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      metAJour();
      enAttente = false;
    });
  });

  metAJour();
}
