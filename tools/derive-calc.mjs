/**
 * derive-calc.mjs — Calcul de {{DERIVE_MAX}} pour le récit fondateur.
 *
 * Question : un cadran vertical déclinant à 44°58′ N a été calculé avec une
 * déclinaison de mur estimée à 4° près de travers. Quelle dérive de lecture
 * (en minutes) sur l'année, dans la plage d'usage 8 h – 17 h SOLAIRES ?
 *
 * Deux modèles physiques, tous deux exacts, sont calculés :
 *  A. CADRAN RIGIDE (fidèle au récit de 1841) : lignes ET style construits sur
 *     la déclinaison erronée — tout l'instrument est tourné de 4° d'azimut,
 *     le style n'est plus exactement polaire.
 *  B. STYLE RECALÉ (variante restaurateur) : style remis exactement sur l'axe
 *     du monde, seul le tracé peint reste faux.
 *
 * Exécution : node derive-calc.mjs
 */

import { deriveLecture, erreurLecture, declinaisonSoleil } from "../assets/js/gnomonique.js";

const LAT = 44.9667; // 44°58′ N
const ERREUR = 4; // degrés d'erreur sur la déclinaison du mur
const ANNEE = 2026;
const MURS = [-30, -20, -10, 0, 10, 20, 30]; // déclinaisons réelles plausibles (° , + ouest)
const OPTIONS = { annee: ANNEE, pasJours: 1, pasHeures: 0.25, plageHeures: [8, 17] };

const f = (x) => (x >= 0 ? "+" : "") + x.toFixed(1);

function scenario(declMur, signeErreur, styleRecale) {
  const d = deriveLecture(LAT, declMur, signeErreur * ERREUR, { ...OPTIONS, styleRecale });
  const minAbs = d.echantillons.reduce((m, e) => Math.min(m, Math.abs(e.erreur)), Infinity);
  return { declMur, signeErreur, ...d, minAbs };
}

console.log("Dérive de lecture — φ = 44°58′ N, erreur d'estimation ±4°, 8 h–17 h solaires, année " + ANNEE);
console.log("(erreur en minutes ; + = le cadran est en avance sur l'heure solaire vraie)\n");

for (const [nom, styleRecale] of [
  ["MODÈLE A — cadran rigide (tracé + style construits sur la déclinaison fausse)", false],
  ["MODÈLE B — style recalé polaire (seul le tracé est faux)", true],
]) {
  console.log(nom);
  console.log("mur d (°) | erreur | min signé | max signé | |min| | |max| | pire (jour, h solaire)");
  let globalMaxAbs = 0;
  let globalMinAbs = Infinity;
  for (const declMur of MURS) {
    for (const signe of [+1, -1]) {
      const s = scenario(declMur, signe, styleRecale);
      globalMaxAbs = Math.max(globalMaxAbs, s.maxAbs);
      globalMinAbs = Math.min(globalMinAbs, s.minAbs);
      console.log(
        `${String(declMur).padStart(8)} | ${signe > 0 ? "  +4°" : "  −4°"} | ${f(s.min).padStart(9)} | ${f(s.max).padStart(9)} | ${s.minAbs.toFixed(1).padStart(5)} | ${s.maxAbs.toFixed(1).padStart(5)} | j${s.pire.jour}, ${s.pire.heureSolaire} h`
      );
    }
  }
  console.log(`→ sur toutes les orientations testées : |erreur| de ${globalMinAbs.toFixed(1)} à ${globalMaxAbs.toFixed(1)} min\n`);
}

/* Recoupement analytique indépendant (modèle A, au midi vrai) :
 * une erreur d'azimut Δd équivaut à décaler le Soleil de Δd en azimut ;
 * au midi vrai dA/dH = cos δ / sin(φ−δ), d'où ΔH ≈ Δd·sin(φ−δ)/cos δ. */
console.log("Recoupement analytique (modèle A, midi vrai, mur d = 10°) :");
for (const [saison, delta] of [["solstice d'hiver", -23.437], ["équinoxe", 0], ["solstice d'été", 23.437]]) {
  const simule = erreurLecture(LAT, 10, 10 + ERREUR, delta, 0);
  const analytique = 4 * ERREUR * Math.sin(((LAT - delta) * Math.PI) / 180) / Math.cos((delta * Math.PI) / 180);
  console.log(`  ${saison.padEnd(18)} : simulé ${simule.toFixed(2)} min, analytique ${analytique.toFixed(2)} min`);
}

/* Synthèse pour le cas nominal du récit (mur déclinant ~10° ouest, +4°). */
const nominal = scenario(10, +1, false);
const profilMidi = [];
for (const [saison, mois, jour] of [["hiver", 0, 15], ["équinoxe", 2, 20], ["été", 5, 21]]) {
  const delta = declinaisonSoleil(new Date(Date.UTC(ANNEE, mois, jour, 12)));
  profilMidi.push(`${saison} ${erreurLecture(LAT, 10, 14, delta, 0).toFixed(1)} min`);
}
console.log("\nSYNTHÈSE (cas nominal : mur ~10° ouest, estimé 14°, modèle A) :");
console.log(`  Dérive au midi vrai selon la saison : ${profilMidi.join(" · ")}`);
console.log(`  Sur l'année, 8 h–17 h solaires : |erreur| de ${nominal.minAbs.toFixed(1)} à ${nominal.maxAbs.toFixed(1)} min`);
console.log(`  {{DERIVE_MAX}} = ${Math.round(nominal.maxAbs)} minutes (maximum atteint au cœur de l'hiver, autour du midi vrai)`);
console.log(
  "\nPhrase honnête : « Quatre degrés d'erreur sur la déclinaison du mur ne donnent pas une erreur fixe :" +
    "\nle cadran ment toujours dans le même sens, d'environ six minutes au midi d'été jusqu'à seize minutes" +
    "\nau midi d'hiver — et si l'on recale le style sans repeindre le tracé, l'erreur s'annule à midi mais" +
    "\natteint encore une dizaine de minutes en début et fin de journée. »"
);
