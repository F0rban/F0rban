/**
 * gnomonique.test.mjs — Tests du moteur gnomonique (node:test, zéro dépendance).
 * Exécution : node --test gnomonique.test.mjs   (ou node gnomonique.test.mjs)
 *
 * Les valeurs de référence viennent des éphémérides usuelles (NOAA/Meeus) :
 * équation du temps ≈ −14,2 min vers le 11–12 février, ≈ +16,4 min vers le
 * 3 novembre ; déclinaison ±23,44° aux solstices, 0° aux équinoxes.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  OBLIQUITE,
  declinaisonSoleil,
  equationDuTemps,
  heureSolaireVraie,
  positionSoleil,
  positionDepuisAngleHoraire,
  geometrieCadran,
  lignesHoraires,
  ombreStyle,
  analemme,
  arcsDeclinaison,
  erreurLecture,
  deriveLecture,
} from "../assets/js/gnomonique.js";

const LAT = 44.9667; // 44°58′ N (Molines-en-Queyras)
const LON = 6.85; // 6°51′ E

/** Instant UTC dont l'heure solaire vraie vaut `heure` au méridien `longitude`. */
function instantSolaire(annee, mois, jour, heure, longitude) {
  let date = new Date(Date.UTC(annee, mois - 1, jour, 12));
  for (let i = 0; i < 4; i++) {
    let dh = heure - heureSolaireVraie(date, longitude);
    if (dh > 12) dh -= 24;
    if (dh < -12) dh += 24;
    date = new Date(date.getTime() + dh * 3600000);
  }
  return date;
}

/* ------------------------------------------------------------------ */
test("équation du temps : creux de mi-février ≈ −14 min", () => {
  const e = equationDuTemps(new Date(Date.UTC(2026, 1, 12, 12)));
  assert.ok(e > -14.8 && e < -13.6, `attendu ≈ −14,2 min, obtenu ${e.toFixed(2)}`);
});

test("équation du temps : pic de début novembre ≈ +16 min", () => {
  const e = equationDuTemps(new Date(Date.UTC(2026, 10, 3, 12)));
  assert.ok(e > 15.8 && e < 16.9, `attendu ≈ +16,4 min, obtenu ${e.toFixed(2)}`);
});

test("équation du temps : quasi nulle aux quatre annulations classiques", () => {
  for (const [mois, jour] of [[4, 15], [6, 14], [9, 1], [12, 25]]) {
    const e = equationDuTemps(new Date(Date.UTC(2026, mois - 1, jour, 12)));
    assert.ok(Math.abs(e) < 1.2, `${jour}/${mois} : |E| = ${e.toFixed(2)} min`);
  }
});

test("équation du temps : extrêmes annuels dans les fourchettes NOAA", () => {
  let min = Infinity, max = -Infinity;
  for (let j = 0; j < 365; j++) {
    const e = equationDuTemps(new Date(Date.UTC(2026, 0, 1, 12) + j * 86400000));
    min = Math.min(min, e);
    max = Math.max(max, e);
  }
  assert.ok(min > -14.8 && min < -13.9, `min annuel ${min.toFixed(2)}`);
  assert.ok(max > 16.0 && max < 16.8, `max annuel ${max.toFixed(2)}`);
});

test("déclinaison solaire : solstices ≈ ±23,44°, bornée par l'obliquité", () => {
  const ete = declinaisonSoleil(new Date(Date.UTC(2026, 5, 21, 9)));
  const hiver = declinaisonSoleil(new Date(Date.UTC(2026, 11, 21, 20)));
  assert.ok(Math.abs(ete - 23.44) < 0.05, `solstice d'été : ${ete.toFixed(3)}°`);
  assert.ok(Math.abs(hiver + 23.44) < 0.05, `solstice d'hiver : ${hiver.toFixed(3)}°`);
  for (let j = 0; j < 365; j++) {
    const d = declinaisonSoleil(new Date(Date.UTC(2026, 0, 1) + j * 86400000));
    assert.ok(Math.abs(d) <= 23.45, `jour ${j} : |δ| = ${Math.abs(d).toFixed(3)}°`);
  }
});

test("déclinaison solaire : nulle aux équinoxes 2026", () => {
  const mars = declinaisonSoleil(new Date(Date.UTC(2026, 2, 20, 15)));
  const sept = declinaisonSoleil(new Date(Date.UTC(2026, 8, 23, 0)));
  assert.ok(Math.abs(mars) < 0.1, `équinoxe de mars : ${mars.toFixed(3)}°`);
  assert.ok(Math.abs(sept) < 0.1, `équinoxe de septembre : ${sept.toFixed(3)}°`);
});

test("heure solaire vraie : linéaire en longitude (15° = 1 h), Greenwich = UTC + E", () => {
  const date = new Date(Date.UTC(2026, 3, 10, 10, 30));
  const h0 = heureSolaireVraie(date, 0);
  const h15 = heureSolaireVraie(date, 15);
  assert.ok(Math.abs((((h15 - h0) % 24) + 24) % 24 - 1) < 1e-12);
  const utc = 10.5;
  const attendu = utc + equationDuTemps(date) / 60;
  assert.ok(Math.abs(h0 - attendu) < 1e-12);
});

test("Soleil plein sud (azimut 180°) au midi vrai, hauteur = 90° − φ + δ", () => {
  for (const [mois, jour] of [[2, 12], [5, 1], [6, 21], [11, 3], [12, 21]]) {
    const midi = instantSolaire(2026, mois, jour, 12, LON);
    const p = positionSoleil(midi, LAT, LON);
    assert.ok(Math.abs(p.heureSolaire - 12) < 1e-6);
    assert.ok(Math.abs(p.azimut - 180) < 0.01, `${jour}/${mois} : azimut ${p.azimut.toFixed(4)}°`);
    const attendu = 90 - LAT + p.declinaison;
    assert.ok(Math.abs(p.hauteur - attendu) < 1e-3, `${jour}/${mois} : h = ${p.hauteur.toFixed(3)}° vs ${attendu.toFixed(3)}°`);
  }
});

test("azimut : côté est le matin, côté ouest l'après-midi", () => {
  const matin = positionSoleil(instantSolaire(2026, 6, 21, 9, LON), LAT, LON);
  const soir = positionSoleil(instantSolaire(2026, 6, 21, 15, LON), LAT, LON);
  assert.ok(matin.azimut > 0 && matin.azimut < 180, `matin : ${matin.azimut.toFixed(1)}°`);
  assert.ok(soir.azimut > 180 && soir.azimut < 360, `soir : ${soir.azimut.toFixed(1)}°`);
  assert.ok(Math.abs(matin.hauteur - soir.hauteur) < 0.35, "hauteurs quasi symétriques à ±3 h du midi vrai");
});

test("cadran plein sud : lignes horaires symétriques autour de midi, tan Z = cos φ · tan H", () => {
  const heures = [6, 7, 8, 9, 10, 10.5, 11, 12, 13, 13.5, 14, 15, 16, 17, 18];
  const lignes = lignesHoraires(LAT, 0, heures);
  const parHeure = new Map(lignes.map((l) => [l.heure, l]));
  assert.ok(Math.abs(parHeure.get(12).angle) < 1e-9, "ligne de midi verticale");
  for (const t of [1, 1.5, 2, 3, 4, 5, 6]) {
    const a = parHeure.get(12 + t).angle;
    const b = parHeure.get(12 - t).angle;
    assert.ok(Math.abs(a + b) < 1e-9, `12±${t} h : ${a.toFixed(6)} vs ${b.toFixed(6)}`);
  }
  for (const heure of [9, 10.5, 14, 15, 16]) {
    const H = (15 * (heure - 12) * Math.PI) / 180;
    const attendu = (Math.atan(Math.cos((LAT * Math.PI) / 180) * Math.tan(H)) * 180) / Math.PI;
    assert.ok(Math.abs(parHeure.get(heure).angle - attendu) < 1e-9, `heure ${heure}`);
  }
  assert.ok(Math.abs(parHeure.get(6).angle + 90) < 1e-9, "6 h solaires : horizontale côté matin");
  assert.ok(Math.abs(parHeure.get(18).angle - 90) < 1e-9, "18 h solaires : horizontale côté soir");
});

test("ligne de midi verticale pour tout mur déclinant", () => {
  for (const d of [-40, -15, 0, 10, 25, 60]) {
    const [midi] = lignesHoraires(LAT, d, [12]);
    assert.ok(Math.abs(midi.angle) < 1e-9, `d = ${d}° : angle midi = ${midi.angle}`);
  }
});

test("cadran déclinant : formules classiques (hauteur du style, sous-stylaire, H₀)", () => {
  const phi = (LAT * Math.PI) / 180;
  for (const dDeg of [-30, -10, 0, 15, 25, 45]) {
    const d = (dDeg * Math.PI) / 180;
    const g = geometrieCadran(LAT, dDeg);
    assert.ok(Math.abs(Math.sin((g.hauteurStyle * Math.PI) / 180) - Math.cos(phi) * Math.cos(d)) < 1e-12, `sin(hauteurStyle), d=${dDeg}`);
    assert.ok(Math.abs(Math.tan((g.sousStylaire * Math.PI) / 180) - Math.sin(d) / Math.tan(phi)) < 1e-12, `tan(sous-stylaire), d=${dDeg}`);
    assert.ok(Math.abs(Math.tan((g.angleHoraireSousStylaire * Math.PI) / 180) - Math.tan(d) / Math.sin(phi)) < 1e-12, `tan(H₀), d=${dDeg}`);
  }
  const sud = geometrieCadran(LAT, 0);
  assert.ok(Math.abs(sud.sousStylaire) < 1e-12 && Math.abs(sud.angleHoraireSousStylaire) < 1e-12, "plein sud : sous-stylaire confondue avec la ligne de midi");
  assert.ok(Math.abs(sud.hauteurStyle - (90 - LAT)) < 1e-9, "plein sud : hauteur du style = colatitude");
});

test("cadran déclinant : la sous-stylaire est une ligne du faisceau horaire (H = H₀)", () => {
  for (const d of [-25, 12, 35]) {
    const g = geometrieCadran(LAT, d);
    const [ligne] = lignesHoraires(LAT, d, [g.heureSousStylaire]);
    assert.ok(Math.abs(ligne.angle - g.sousStylaire) < 1e-9, `d = ${d}° : ${ligne.angle} vs ${g.sousStylaire}`);
  }
});

test("ombre réelle du style polaire alignée sur la ligne horaire de l'heure solaire", () => {
  for (const [d, mois, jour, heure] of [[0, 6, 21, 15], [20, 4, 10, 14], [-15, 8, 5, 10]]) {
    const date = instantSolaire(2026, mois, jour, heure, LON);
    const o = ombreStyle(date, LAT, LON, d);
    assert.ok(o.visible, `cadran d=${d}° éclairé le ${jour}/${mois} à ${heure} h solaires`);
    const [ligne] = lignesHoraires(LAT, d, [o.soleil.heureSolaire]);
    assert.ok(Math.abs(o.stylePolaire.angle - ligne.angle) < 1e-6, `d=${d}° : ombre ${o.stylePolaire.angle.toFixed(6)}° vs ligne ${ligne.angle.toFixed(6)}°`);
  }
});

test("ombre du style droit : au midi vrai d'un mur plein sud, verticale, longueur L·tan h", () => {
  const midi = instantSolaire(2026, 6, 21, 12, LON);
  const o = ombreStyle(midi, LAT, LON, 0, 2);
  assert.ok(o.visible);
  assert.ok(Math.abs(o.styleDroit.x) < 1e-4, `x = ${o.styleDroit.x}`);
  const attendu = 2 * Math.tan((o.soleil.hauteur * Math.PI) / 180);
  assert.ok(Math.abs(o.styleDroit.y - attendu) < 1e-6, "y = L·tan h");
  assert.ok(o.styleDroit.y > 0, "l'ombre descend (y vers le bas)");
});

test("ombre invisible : nuit, et Soleil derrière le mur", () => {
  const nuit = ombreStyle(new Date(Date.UTC(2026, 5, 21, 0, 30)), LAT, LON, 0);
  assert.equal(nuit.visible, false);
  assert.equal(nuit.styleDroit, null);
  // 7 h solaires : Soleil au nord-est, derrière un mur déclinant 40° ouest.
  const matin = instantSolaire(2026, 6, 21, 7, LON);
  const dos = ombreStyle(matin, LAT, LON, 40);
  assert.equal(dos.visible, false);
});

test("équinoxe : l'ombre du nodus trace une droite exacte (arc de déclinaison δ = 0)", () => {
  const [arc] = arcsDeclinaison(LAT, 17, [0], { pasAngleHoraire: 5 });
  assert.ok(arc.points.length >= 10, `points sur l'arc : ${arc.points.length}`);
  const a = arc.points[0];
  const b = arc.points[arc.points.length - 1];
  const norme = Math.hypot(b.x - a.x, b.y - a.y);
  for (const p of arc.points) {
    const ecart = Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / norme;
    assert.ok(ecart < 1e-9, `écart à la droite équinoxiale : ${ecart}`);
  }
});

test("arcs solsticiaux : hiver sous l'équinoxiale, été au-dessus (mur plein sud, midi)", () => {
  const arcs = arcsDeclinaison(LAT, 0, [-OBLIQUITE, 0, OBLIQUITE]);
  const aMidi = (arc) => arc.points.find((p) => Math.abs(p.angleHoraire) < 1e-9);
  const hiver = aMidi(arcs[0]);
  const equinoxe = aMidi(arcs[1]);
  const ete = aMidi(arcs[2]);
  assert.ok(hiver && equinoxe && ete, "les trois arcs passent par midi");
  // Soleil bas en hiver → ombre du nodus haute sur le mur (y petit) et l'inverse en été.
  assert.ok(hiver.y < equinoxe.y && equinoxe.y < ete.y, `ordre des y à midi : ${hiver.y.toFixed(3)} < ${equinoxe.y.toFixed(3)} < ${ete.y.toFixed(3)}`);
});

test("analemme : une année complète, équation du temps et déclinaison bornées", () => {
  const points = analemme(LAT, LON, 13, { annee: 2026, pasJours: 5, declMur: 0 });
  assert.ok(points.length >= 73, `points : ${points.length}`);
  let eMin = Infinity, eMax = -Infinity, visibles = 0;
  for (const p of points) {
    assert.ok(Number.isFinite(p.hauteur) && Number.isFinite(p.azimut));
    assert.ok(Math.abs(p.declinaison) <= 23.45);
    eMin = Math.min(eMin, p.equationTemps);
    eMax = Math.max(eMax, p.equationTemps);
    if (p.visible) {
      visibles++;
      assert.ok(p.ombre && Number.isFinite(p.ombre.x) && Number.isFinite(p.ombre.y));
    }
  }
  assert.ok(eMin > -14.8 && eMin < -13.5 && eMax > 15.8 && eMax < 16.8, `E ∈ [${eMin.toFixed(1)}, ${eMax.toFixed(1)}]`);
  assert.ok(visibles > 50, `points visibles à 13 h légales : ${visibles}`);
});

test("lignes horaires : drapeau recoitSoleil cohérent avec l'orientation du mur", () => {
  // Mur déclinant 40° ouest : jamais de soleil à 7 h solaires, toujours à 15 h.
  const [matin, apresMidi] = lignesHoraires(LAT, 40, [7, 15]);
  assert.equal(matin.recoitSoleil, false);
  assert.equal(apresMidi.recoitSoleil, true);
  // Mur plein sud : midi toujours éclairé, minuit jamais.
  const [minuit, midi] = lignesHoraires(LAT, 0, [0, 12]);
  assert.equal(minuit.recoitSoleil, false);
  assert.equal(midi.recoitSoleil, true);
});

test("erreurLecture : nulle quand la déclinaison du mur est exacte", () => {
  for (const d of [0, 12, -20]) {
    for (const [ds, H] of [[23.437, 30], [0, -30], [-23.437, 15]]) {
      const e = erreurLecture(LAT, d, d, ds, H);
      if (e !== null) assert.ok(Math.abs(e) < 1e-9, `d=${d}, δ=${ds}, H=${H} : ${e}`);
    }
  }
});

test("erreurLecture : antisymétrique au premier ordre, ordre de grandeur en minutes", () => {
  const plus = erreurLecture(LAT, 10, 14, 0, 45);
  const moins = erreurLecture(LAT, 10, 6, 0, 45);
  assert.ok(plus !== null && moins !== null);
  assert.ok(Math.abs(plus + moins) < 0.35 * Math.abs(plus), "±4° d'erreur → dérives quasi opposées");
  assert.ok(Math.abs(plus) > 1 && Math.abs(plus) < 30, `dérive plausible : ${plus.toFixed(1)} min`);
});

test("deriveLecture (cadran rigide) : 4° d'erreur → 6 à 16 min, toujours du même côté, pire en hiver", () => {
  const d = deriveLecture(LAT, 10, 4, { annee: 2026, pasJours: 6, pasHeures: 0.5 });
  assert.ok(d.nombre > 500, `échantillons lisibles : ${d.nombre}`);
  // Le cadran rigide (tracé ET style faux) ment toujours dans le même sens :
  // l'erreur ne s'annule jamais sur l'année.
  assert.ok(d.min * d.max > 0, `signe constant attendu : min ${d.min.toFixed(1)}, max ${d.max.toFixed(1)}`);
  assert.ok(d.maxAbs > 14 && d.maxAbs < 18, `dérive max ≈ 16 min : ${d.maxAbs.toFixed(1)}`);
  const minAbs = Math.min(...d.echantillons.map((e) => Math.abs(e.erreur)));
  assert.ok(minAbs > 5 && minAbs < 8, `dérive min ≈ 6,4 min : ${minAbs.toFixed(2)}`);
  assert.ok(d.pire.jour < 60 || d.pire.jour > 300, `pire dérive en hiver (jour ${d.pire.jour})`);
});

test("erreurLecture (cadran rigide) au midi vrai : recoupe l'estimation analytique ΔH ≈ Δd·sin(φ−δ)/cos δ", () => {
  // Une erreur d'azimut Δd équivaut à un Soleil décalé de Δd en azimut ;
  // au midi vrai dA/dH = cos δ / sin(φ−δ), donc ΔH ≈ Δd·sin(φ−δ)/cos δ.
  for (const delta of [-23.437, 0, 23.437]) {
    const err = erreurLecture(LAT, 10, 14, delta, 0);
    const attendu = 4 * ((4 * Math.sin(((LAT - delta) * Math.PI) / 180)) / Math.cos((delta * Math.PI) / 180));
    assert.ok(err !== null);
    assert.ok(Math.abs(Math.abs(err) - attendu) < 0.05 * attendu, `δ=${delta} : simulé ${err.toFixed(2)} min vs analytique ${attendu.toFixed(2)} min`);
  }
});

test("erreurLecture (variante style recalé polaire) : nulle au midi vrai, croît vers les extrêmes", () => {
  const midi = erreurLecture(LAT, 10, 14, -23.437, 0, { styleRecale: true });
  assert.ok(midi !== null && Math.abs(midi) < 1e-9, `midi : ${midi}`);
  const matin = erreurLecture(LAT, 10, 14, 0, -60, { styleRecale: true });
  const soir = erreurLecture(LAT, 10, 14, 0, 75, { styleRecale: true });
  assert.ok(matin !== null && soir !== null);
  assert.ok(Math.abs(matin) > 5 && Math.abs(matin) < 14, `8 h : ${matin.toFixed(1)} min`);
  assert.ok(Math.abs(soir) > 5 && Math.abs(soir) < 14, `17 h : ${soir.toFixed(1)} min`);
  // Sans saison : la même heure donne la même erreur été comme hiver.
  const ete = erreurLecture(LAT, 10, 14, 23.437, -45, { styleRecale: true });
  const hiver = erreurLecture(LAT, 10, 14, -20, -45, { styleRecale: true });
  assert.ok(ete !== null && hiver !== null && Math.abs(ete - hiver) < 1e-9, "erreur indépendante de la déclinaison solaire");
});

test("garde-fous : domaines invalides rejetés", () => {
  assert.throws(() => geometrieCadran(-10, 0), RangeError);
  assert.throws(() => geometrieCadran(LAT, 120), RangeError);
  assert.throws(() => lignesHoraires(0, 0, [12]), RangeError);
});

test("positionDepuisAngleHoraire : H = 0 → plein sud si δ < φ", () => {
  const p = positionDepuisAngleHoraire(LAT, 20, 0);
  assert.ok(Math.abs(p.azimutSud) < 1e-9 && Math.abs(p.azimut - 180) < 1e-9);
  assert.ok(Math.abs(p.hauteur - (90 - LAT + 20)) < 1e-9);
});
