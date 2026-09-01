/**
 * gnomonique.mjs — Moteur gnomonique de l'Atelier Méridienne.
 *
 * Module ES pur, zéro dépendance. Toutes les entrées/sorties publiques sont en DEGRÉS.
 * Les équations solaires suivent l'approximation basse précision de Meeus
 * (Astronomical Algorithms, 2e éd., ch. 25 et 28) telle que reprise par le
 * NOAA Solar Calculator. La géométrie du cadran vertical déclinant est dérivée
 * vectoriellement (voir gnomonique-spec.md) et recoupée avec les formules
 * classiques (Savoie, « La Gnomonique »).
 *
 * CONVENTIONS DE SIGNES (contractuelles, voir gnomonique-spec.md §2) :
 * - Latitude φ : positive au nord. Domaine des fonctions de cadran : 0 < φ < 90.
 * - Longitude λ : positive à l'EST de Greenwich (Molines-en-Queyras ≈ +6,85°).
 * - Déclinaison gnomonique du mur d : angle entre la normale extérieure du mur
 *   et le SUD, positif vers l'OUEST. d = 0 : mur plein sud. Domaine : |d| < 90.
 * - Angle horaire du Soleil H : 0 au midi vrai, POSITIF l'après-midi (ouest),
 *   15° par heure. H = 15 × (heure solaire vraie − 12).
 * - Azimut du Soleil A : depuis le NORD, horaire (0 = N, 90 = E, 180 = S, 270 = O).
 *   azimutSud : depuis le sud, positif vers l'ouest (A − 180).
 * - Hauteur h : au-dessus de l'horizon, géométrique (réfraction ignorée).
 * - Équation du temps E : en MINUTES, positive quand le Soleil vrai est EN AVANCE
 *   sur le temps moyen (cadran en avance sur la montre). Début novembre ≈ +16 min,
 *   mi-février ≈ −14 min.
 * - Repère du tracé mural (2D) : origine au pied du style, x positif vers la
 *   DROITE de l'observateur qui fait face au mur (côté est pour un mur plein sud),
 *   y positif vers le BAS (compatible SVG). Les angles de lignes horaires sont
 *   mesurés depuis la verticale descendante (ligne de midi), positifs vers +x :
 *   heures du matin négatives (à gauche), après-midi positives (à droite).
 *
 * Précision : déclinaison solaire ≈ ±0,01°, équation du temps ≈ quelques secondes
 * sur 1950–2050 — très en deçà de la finesse de lecture d'un cadran peint.
 */

const RAD = Math.PI / 180;
const rad = (x) => x * RAD;
const deg = (x) => x / RAD;
const { sin, cos, tan, asin, atan2, hypot } = Math;

/** Obliquité moyenne de l'écliptique (degrés), valeur d'époque courante — utilisée
 *  comme déclinaison solaire des solstices dans les tracés par défaut. */
export const OBLIQUITE = 23.437;

/* ------------------------------------------------------------------ */
/* Outils internes : temps, vecteurs, repères                          */
/* ------------------------------------------------------------------ */

/** Siècles juliens écoulés depuis J2000.0 (TT ≈ UTC ici, écart négligeable). */
function siecleJulien(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525;
}

/** Éléments solaires intermédiaires (Meeus ch. 25 / NOAA). Angles en degrés. */
function elementsSolaires(T) {
  // Longitude moyenne géométrique du Soleil.
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  // Anomalie moyenne.
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  // Excentricité de l'orbite terrestre.
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  // Équation du centre.
  const C =
    sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    sin(rad(2 * M)) * (0.019993 - 0.000101 * T) +
    sin(rad(3 * M)) * 0.000289;
  // Longitude vraie puis apparente (nutation + aberration).
  const omega = 125.04 - 1934.136 * T;
  const lambdaApp = L0 + C - 0.00569 - 0.00478 * sin(rad(omega));
  // Obliquité moyenne puis corrigée.
  const sec = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813));
  const eps0 = 23 + (26 + sec / 60) / 60;
  const eps = eps0 + 0.00256 * cos(rad(omega));
  return { L0, M, e, lambdaApp, eps };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * Repère orthonormé du mur dans le repère local (Est, Nord, Zénith).
 * n : normale extérieure ; eX : horizontale du mur, vers la droite de
 * l'observateur face au mur ; eY : verticale descendante.
 * @param {number} declMur Déclinaison gnomonique du mur (°, + vers l'ouest).
 */
function reperesMur(declMur) {
  const d = rad(declMur);
  return {
    n: [-sin(d), -cos(d), 0],
    eX: [cos(d), -sin(d), 0],
    eY: [0, 0, -1],
  };
}

/** Vecteur unitaire (Est, Nord, Zénith) pointant VERS le Soleil. */
function vecteurSoleil(hauteur, azimutSud) {
  const h = rad(hauteur);
  const A = rad(azimutSud);
  return [-cos(h) * sin(A), -cos(h) * cos(A), sin(h)];
}

/** Direction sortante du style polaire (axe du monde), repère (E, N, Zénith). */
function stylePolaireSortant(latitude) {
  const phi = rad(latitude);
  return [0, -cos(phi), -sin(phi)];
}

function verifieDomaineCadran(latitude, declMur) {
  if (!(latitude > 0 && latitude < 90)) {
    throw new RangeError(`latitude ${latitude}° hors domaine (0° < φ < 90°, hémisphère nord)`);
  }
  if (!(declMur > -90 && declMur < 90)) {
    throw new RangeError(`declMur ${declMur}° hors domaine (|d| < 90°, mur regardant vers le sud au sens large)`);
  }
}

/* ------------------------------------------------------------------ */
/* Astronomie solaire                                                  */
/* ------------------------------------------------------------------ */

/**
 * Déclinaison du Soleil δ.
 * @param {Date} date Instant (objet Date, temps universel interne).
 * @returns {number} Déclinaison en degrés (+ été boréal, − hiver ; |δ| ≤ 23,44°).
 */
export function declinaisonSoleil(date) {
  const { lambdaApp, eps } = elementsSolaires(siecleJulien(date));
  return deg(asin(sin(rad(eps)) * sin(rad(lambdaApp))));
}

/**
 * Équation du temps E = temps solaire vrai − temps solaire moyen.
 * @param {Date} date Instant.
 * @returns {number} Minutes ; positive quand le cadran est en avance sur la montre.
 */
export function equationDuTemps(date) {
  const { L0, M, e, eps } = elementsSolaires(siecleJulien(date));
  const y = tan(rad(eps) / 2) ** 2;
  const E =
    y * sin(2 * rad(L0)) -
    2 * e * sin(rad(M)) +
    4 * e * y * sin(rad(M)) * cos(2 * rad(L0)) -
    0.5 * y * y * sin(4 * rad(L0)) -
    1.25 * e * e * sin(2 * rad(M));
  return 4 * deg(E);
}

/**
 * Heure solaire vraie au méridien du lieu.
 * HSV = heure UTC + λ/15 + E/60 (λ en degrés, positive à l'est).
 * L'« heure légale » entre par l'objet Date lui-même (un instant absolu).
 * @param {Date} date Instant.
 * @param {number} longitude Longitude du lieu (°, + est).
 * @returns {number} Heure décimale dans [0, 24) ; 12 = midi vrai.
 */
export function heureSolaireVraie(date, longitude) {
  const minutesUTC =
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60000;
  const tsv = minutesUTC + 4 * longitude + equationDuTemps(date);
  return (((tsv % 1440) + 1440) % 1440) / 60;
}

/**
 * Hauteur et azimut du Soleil pour un angle horaire donné (sans date) —
 * utile pour les courses simulées (« course simulée — solstice d'été »).
 * @param {number} latitude φ (°).
 * @param {number} declinaison δ du Soleil (°).
 * @param {number} angleHoraire H (°, + après-midi).
 * @returns {{hauteur:number, azimut:number, azimutSud:number}}
 */
export function positionDepuisAngleHoraire(latitude, declinaison, angleHoraire) {
  const phi = rad(latitude);
  const delta = rad(declinaison);
  const H = rad(angleHoraire);
  const hauteur = deg(asin(sin(phi) * sin(delta) + cos(phi) * cos(delta) * cos(H)));
  const azimutSud = deg(
    atan2(cos(delta) * sin(H), sin(phi) * cos(delta) * cos(H) - cos(phi) * sin(delta))
  );
  return { hauteur, azimut: ((azimutSud + 180) % 360 + 360) % 360, azimutSud };
}

/**
 * Position du Soleil à un instant et en un lieu donnés.
 * @param {Date} date Instant.
 * @param {number} latitude φ (°, + nord).
 * @param {number} longitude λ (°, + est).
 * @returns {{hauteur:number, azimut:number, azimutSud:number, angleHoraire:number,
 *           declinaison:number, equationTemps:number, heureSolaire:number}}
 *   hauteur : géométrique (réfraction ignorée) ; azimut : depuis le nord, horaire.
 */
export function positionSoleil(date, latitude, longitude) {
  const declinaison = declinaisonSoleil(date);
  const equationTemps = equationDuTemps(date);
  const heureSolaire = heureSolaireVraie(date, longitude);
  const angleHoraire = 15 * (heureSolaire - 12); // ∈ [−180, 180)
  const pos = positionDepuisAngleHoraire(latitude, declinaison, angleHoraire);
  return { ...pos, angleHoraire, declinaison, equationTemps, heureSolaire };
}

/* ------------------------------------------------------------------ */
/* Géométrie du cadran vertical déclinant                              */
/* ------------------------------------------------------------------ */

/**
 * Constantes du cadran vertical déclinant (style polaire).
 * Formules classiques, vérifiées par la dérivation vectorielle du module :
 *   sin(hauteurStyle) = cos φ · cos d
 *   tan(sousStylaire) = sin d / tan φ
 *   tan(H₀)           = tan d / sin φ   (angle horaire de la sous-stylaire)
 * @param {number} latitude φ (°), 0 < φ < 90.
 * @param {number} declMur d (°, + ouest), |d| < 90.
 * @returns {{hauteurStyle:number, sousStylaire:number, angleHoraireSousStylaire:number,
 *           heureSousStylaire:number, directionSousStylaire:{x:number,y:number}}}
 *   hauteurStyle : angle du style polaire avec le plan du mur ;
 *   sousStylaire : angle de la sous-stylaire avec la verticale descendante,
 *   positif vers +x (côté opposé à la déclinaison du mur pour l'ombre).
 */
export function geometrieCadran(latitude, declMur) {
  verifieDomaineCadran(latitude, declMur);
  const phi = rad(latitude);
  const d = rad(declMur);
  const hauteurStyle = deg(asin(cos(phi) * cos(d)));
  const sx = cos(phi) * sin(d);
  const sy = sin(phi);
  const norme = hypot(sx, sy);
  const sousStylaire = deg(atan2(sx, sy));
  const angleHoraireSousStylaire = deg(atan2(sin(d), cos(d) * sin(phi)));
  return {
    hauteurStyle,
    sousStylaire,
    angleHoraireSousStylaire,
    heureSousStylaire: 12 + angleHoraireSousStylaire / 15,
    directionSousStylaire: { x: sx / norme, y: sy / norme },
  };
}

/**
 * Direction (non normalisée) de la ligne horaire d'angle horaire H sur le mur,
 * dans le repère du tracé (x droite, y bas). Dérivation vectorielle :
 *   (x, y) = (cos φ · sin H,  cos d · cos H + sin φ · sin d · sin H)
 * Pour d = 0 on retrouve tan Z = cos φ · tan H (cadran vertical plein sud).
 */
function directionLigneHoraire(phi, d, H) {
  return [cos(phi) * sin(H), cos(d) * cos(H) + sin(phi) * sin(d) * sin(H)];
}

/**
 * Lignes horaires du cadran vertical déclinant.
 * @param {number} latitude φ (°).
 * @param {number} declMur d (°, + ouest).
 * @param {number[]} heures Heures SOLAIRES vraies (décimales, 12 = midi vrai).
 * @returns {Array<{heure:number, angleHoraire:number, angle:number,
 *           direction:{x:number,y:number}, recoitSoleil:boolean}>}
 *   angle : depuis la verticale descendante, positif vers +x, dans (−180°, 180°] ;
 *   direction : demi-droite de l'ombre depuis le pied du style (unitaire) ;
 *   recoitSoleil : vrai si le Soleil peut éclairer le mur à cette heure au moins
 *   un jour de l'année (testé aux solstices, à l'équinoxe et à ±15° de déclinaison).
 */
export function lignesHoraires(latitude, declMur, heures) {
  verifieDomaineCadran(latitude, declMur);
  const phi = rad(latitude);
  const d = rad(declMur);
  const { n, eX, eY } = reperesMur(declMur);
  const q = stylePolaireSortant(latitude);

  return heures.map((heure) => {
    const angleHoraire = 15 * (heure - 12);
    const H = rad(angleHoraire);
    let [x, y] = directionLigneHoraire(phi, d, H);

    // Oriente la demi-droite dans le sens de l'ombre physique, si le mur est
    // éclairé à cette heure pour au moins une déclinaison solaire de l'année.
    let recoitSoleil = false;
    for (const ds of [OBLIQUITE, 15, 0, -15, -OBLIQUITE]) {
      const p = positionDepuisAngleHoraire(latitude, ds, angleHoraire);
      if (p.hauteur <= 0) continue;
      const s = vecteurSoleil(p.hauteur, p.azimutSud);
      const ci = dot(s, n);
      if (ci <= 1e-9) continue;
      recoitSoleil = true;
      const w = sub(q, scale(s, dot(q, n) / ci)); // ombre du style polaire
      if (dot(w, eX) * x + dot(w, eY) * y < 0) {
        x = -x;
        y = -y;
      }
      break;
    }
    if (!recoitSoleil && (y < 0 || (y === 0 && x < 0))) {
      x = -x;
      y = -y;
    }
    const norme = hypot(x, y);
    return {
      heure,
      angleHoraire,
      angle: deg(atan2(x, y)),
      direction: { x: x / norme, y: y / norme },
      recoitSoleil,
    };
  });
}

/**
 * Ombres portées à un instant réel : style droit (tige perpendiculaire au mur,
 * porte-nodus) et style polaire (lecture de l'heure).
 * Formules fermées équivalentes (a = azimutSud − d) :
 *   ombre du bout du style droit : x = L·tan a, y = L·tan h / cos a
 *   condition d'éclairement : h > 0 et cos h · cos a > 0.
 * @param {Date} date Instant.
 * @param {number} latitude φ (°).
 * @param {number} longitude λ (°, + est).
 * @param {number} declMur d (°, + ouest).
 * @param {number} [longueurStyle=1] Longueur L du style droit (unité libre).
 * @returns {{visible:boolean, cosIncidence:number, soleil:object,
 *           styleDroit:?{x:number,y:number,longueur:number},
 *           stylePolaire:?{angle:number, direction:{x:number,y:number}}}}
 *   visible : Soleil au-dessus de l'horizon ET devant le mur ; sinon ombres null.
 */
export function ombreStyle(date, latitude, longitude, declMur, longueurStyle = 1) {
  verifieDomaineCadran(latitude, declMur);
  const soleil = positionSoleil(date, latitude, longitude);
  const { n, eX, eY } = reperesMur(declMur);
  const s = vecteurSoleil(soleil.hauteur, soleil.azimutSud);
  const cosIncidence = dot(s, n);
  const visible = soleil.hauteur > 0 && cosIncidence > 1e-9;
  if (!visible) {
    return { visible, cosIncidence, soleil, styleDroit: null, stylePolaire: null };
  }
  // Bout du style droit : P = L·n ; ombre = P − (P·n / s·n)·s, dans le plan du mur.
  const P = scale(n, longueurStyle);
  const o = sub(P, scale(s, longueurStyle / cosIncidence));
  const x = dot(o, eX);
  const y = dot(o, eY);
  // Ombre du style polaire : demi-droite depuis le pied du style.
  const q = stylePolaireSortant(latitude);
  const w = sub(q, scale(s, dot(q, n) / cosIncidence));
  const wx = dot(w, eX);
  const wy = dot(w, eY);
  const nw = hypot(wx, wy);
  return {
    visible,
    cosIncidence,
    soleil,
    styleDroit: { x, y, longueur: hypot(x, y) },
    stylePolaire: { angle: deg(atan2(wx, wy)), direction: { x: wx / nw, y: wy / nw } },
  };
}

/**
 * Analemme : positions du Soleil (et ombre du nodus si declMur fourni) à heure
 * LÉGALE fixe, échantillonnées sur une année civile.
 * @param {number} latitude φ (°).
 * @param {number} longitude λ (°, + est).
 * @param {number} heureLegale Heure légale décimale (ex. 13 pour 13 h).
 * @param {object} [options]
 * @param {number} [options.fuseau=1] Décalage du fuseau en heures (UTC+1 = heure
 *   légale française d'HIVER, constante toute l'année : l'heure d'été couperait
 *   l'analemme en deux branches, on l'ignore volontairement).
 * @param {number} [options.annee] Année civile (défaut : année UTC courante).
 * @param {number} [options.pasJours=5] Pas d'échantillonnage en jours.
 * @param {?number} [options.declMur=null] Si fourni, ajoute l'ombre du bout du
 *   style droit sur ce mur (repère du tracé, x droite / y bas).
 * @param {number} [options.longueurStyle=1] Longueur du style droit.
 * @returns {Array<{date:Date, jour:number, hauteur:number, azimut:number,
 *           azimutSud:number, declinaison:number, equationTemps:number,
 *           heureSolaire:number, visible:boolean, ombre:?{x:number,y:number}}>}
 */
export function analemme(latitude, longitude, heureLegale, options = {}) {
  const {
    fuseau = 1,
    annee = new Date().getUTCFullYear(),
    pasJours = 5,
    declMur = null,
    longueurStyle = 1,
  } = options;
  if (declMur !== null) verifieDomaineCadran(latitude, declMur);
  const reperes = declMur !== null ? reperesMur(declMur) : null;
  const debut = Date.UTC(annee, 0, 1);
  const nbJours = (Date.UTC(annee + 1, 0, 1) - debut) / 86400000;
  const points = [];
  for (let j = 0; j < nbJours; j += pasJours) {
    const date = new Date(debut + j * 86400000 + (heureLegale - fuseau) * 3600000);
    const p = positionSoleil(date, latitude, longitude);
    const point = {
      date,
      jour: j + 1,
      hauteur: p.hauteur,
      azimut: p.azimut,
      azimutSud: p.azimutSud,
      declinaison: p.declinaison,
      equationTemps: p.equationTemps,
      heureSolaire: p.heureSolaire,
      visible: p.hauteur > 0,
      ombre: null,
    };
    if (reperes) {
      const s = vecteurSoleil(p.hauteur, p.azimutSud);
      const ci = dot(s, reperes.n);
      point.visible = p.hauteur > 0 && ci > 1e-9;
      if (point.visible) {
        const P = scale(reperes.n, longueurStyle);
        const o = sub(P, scale(s, longueurStyle / ci));
        point.ombre = { x: dot(o, reperes.eX), y: dot(o, reperes.eY) };
      }
    }
    points.push(point);
  }
  return points;
}

/**
 * Arcs diurnes de déclinaison : trace de l'ombre du nodus (bout du style droit)
 * pour des déclinaisons solaires données. À δ = 0 (équinoxes) l'arc est une
 * droite exacte ; aux solstices (±23,44°) ce sont les deux hyperboles extrêmes.
 * @param {number} latitude φ (°).
 * @param {number} declMur d (°, + ouest).
 * @param {number[]} [declinaisons=[−23.437, 0, 23.437]] Déclinaisons solaires (°).
 * @param {object} [options]
 * @param {number} [options.pasAngleHoraire=2] Pas en degrés d'angle horaire.
 * @param {number[]} [options.plageAngleHoraire=[-120,120]] Plage de H (°).
 * @param {number} [options.longueurStyle=1] Longueur du style droit.
 * @param {number} [options.incidenceMinDeg=1] Incidence rasante exclue (°) —
 *   l'ombre file à l'infini quand le Soleil rase le mur.
 * @param {number} [options.hauteurMinDeg=0] Hauteur solaire minimale (°).
 * @returns {Array<{declinaison:number, points:Array<{angleHoraire:number,
 *           heureSolaire:number, hauteur:number, x:number, y:number}>}>}
 */
export function arcsDeclinaison(
  latitude,
  declMur,
  declinaisons = [-OBLIQUITE, 0, OBLIQUITE],
  options = {}
) {
  verifieDomaineCadran(latitude, declMur);
  const {
    pasAngleHoraire = 2,
    plageAngleHoraire = [-120, 120],
    longueurStyle = 1,
    incidenceMinDeg = 1,
    hauteurMinDeg = 0,
  } = options;
  const { n, eX, eY } = reperesMur(declMur);
  const incidenceMin = sin(rad(incidenceMinDeg));
  return declinaisons.map((declinaison) => {
    const points = [];
    for (
      let H = plageAngleHoraire[0];
      H <= plageAngleHoraire[1] + 1e-9;
      H += pasAngleHoraire
    ) {
      const p = positionDepuisAngleHoraire(latitude, declinaison, H);
      if (p.hauteur <= hauteurMinDeg) continue;
      const s = vecteurSoleil(p.hauteur, p.azimutSud);
      const ci = dot(s, n);
      if (ci <= incidenceMin) continue;
      const P = scale(n, longueurStyle);
      const o = sub(P, scale(s, longueurStyle / ci));
      points.push({
        angleHoraire: H,
        heureSolaire: 12 + H / 15,
        hauteur: p.hauteur,
        x: dot(o, eX),
        y: dot(o, eY),
      });
    }
    return { declinaison, points };
  });
}

/* ------------------------------------------------------------------ */
/* Erreur d'estimation de la déclinaison du mur (récit fondateur)      */
/* ------------------------------------------------------------------ */

/**
 * Erreur de lecture instantanée d'un cadran TRACÉ ET STYLÉ pour une déclinaison
 * de mur estimée declMurEstime, mais posé sur un mur qui décline réellement de
 * declMurReel. Le cadran entier (lignes + style) est rigide : tout est tourné
 * de l'erreur d'azimut ; le style n'est donc plus exactement polaire.
 * @param {number} latitude φ (°).
 * @param {number} declMurReel d réel du mur (°, + ouest).
 * @param {number} declMurEstime d utilisé pour le tracé (°, + ouest).
 * @param {number} declinaisonSoleilDeg δ du jour (°).
 * @param {number} angleHoraire H vrai (°, + après-midi).
 * @param {object} [options]
 * @param {number} [options.hauteurMinDeg=0.5] Soleil trop bas : lecture exclue.
 * @param {number} [options.incidenceMinDeg=3] Incidence rasante : cadran illisible.
 * @param {boolean} [options.styleRecale=false] Variante « restaurateur » : le
 *   style a été RECALÉ exactement polaire (réglé sur l'axe du monde), seul le
 *   TRACÉ reste calculé pour la mauvaise déclinaison. L'erreur s'annule alors
 *   au midi vrai (les deux lignes de midi sont verticales) et ne dépend plus
 *   de la saison, seulement de l'heure.
 * @returns {?number} Erreur en MINUTES (lue − vraie ; + = cadran en avance),
 *   ou null si le cadran n'est pas lisible à cet instant.
 */
export function erreurLecture(
  latitude,
  declMurReel,
  declMurEstime,
  declinaisonSoleilDeg,
  angleHoraire,
  options = {}
) {
  verifieDomaineCadran(latitude, declMurReel);
  verifieDomaineCadran(latitude, declMurEstime);
  const { hauteurMinDeg = 0.5, incidenceMinDeg = 3, styleRecale = false } = options;
  const phi = rad(latitude);
  const dEst = rad(declMurEstime);
  const { n, eX, eY } = reperesMur(declMurReel);

  const p = positionDepuisAngleHoraire(latitude, declinaisonSoleilDeg, angleHoraire);
  if (p.hauteur <= hauteurMinDeg) return null;
  const s = vecteurSoleil(p.hauteur, p.azimutSud);
  const ci = dot(s, n);
  if (ci <= sin(rad(incidenceMinDeg))) return null;

  // Style physique. Cadran rigide (défaut) : composantes du style DE CONCEPTION
  // exprimées dans le repère du mur réel (le poseur suit la géométrie prévue) ;
  // le style n'est alors plus exactement polaire. Variante styleRecale : le
  // style est exactement sur l'axe du monde, seul le tracé est faux.
  let q;
  if (styleRecale) {
    q = stylePolaireSortant(latitude);
  } else {
    q = [0, 0, 0];
    const comp = [cos(phi) * cos(dEst), cos(phi) * sin(dEst), sin(phi)]; // (n, eX, eY)
    for (let i = 0; i < 3; i++) {
      q[i] = n[i] * comp[0] + eX[i] * comp[1] + eY[i] * comp[2];
    }
  }
  // Ombre du style physique sur le mur réel.
  const w = sub(q, scale(s, dot(q, n) / ci));
  const theta = atan2(dot(w, eX), dot(w, eY));

  // Heure indiquée : inversion de la formule des lignes horaires de conception
  // tan H = sin θ · cos d / (cos φ · cos θ − sin φ · sin d · sin θ).
  let Hlu = deg(
    atan2(sin(theta) * cos(dEst), cos(phi) * cos(theta) - sin(phi) * sin(dEst) * sin(theta))
  );
  while (Hlu - angleHoraire > 90) Hlu -= 180;
  while (angleHoraire - Hlu > 90) Hlu += 180;
  return (Hlu - angleHoraire) * 4; // 1° d'angle horaire = 4 minutes
}

/**
 * Dérive de lecture sur une année pour une erreur d'estimation de la déclinaison
 * du mur (le « Curseur de déclinaison » de la page Savoir-faire).
 * @param {number} latitude φ (°).
 * @param {number} declMurReel d réel du mur (°, + ouest).
 * @param {number} erreurEstimation Erreur d'estimation (°) : le tracé a été
 *   calculé pour d = declMurReel + erreurEstimation (+ = estimé trop à l'ouest).
 * @param {object} [options]
 * @param {number} [options.annee] Année civile (défaut : courante).
 * @param {number} [options.pasJours=3] Pas en jours.
 * @param {number[]} [options.plageHeures=[8,17]] Plage d'heures SOLAIRES lues.
 * @param {number} [options.pasHeures=0.25] Pas en heures.
 * @param {number} [options.hauteurMinDeg=0.5] Cf. erreurLecture.
 * @param {number} [options.incidenceMinDeg=3] Cf. erreurLecture.
 * @param {boolean} [options.styleRecale=false] Cf. erreurLecture.
 * @returns {{min:number, max:number, maxAbs:number, moyenneAbs:number,
 *           nombre:number, pire:{jour:number, heureSolaire:number, erreur:number},
 *           echantillons:Array<{jour:number, heureSolaire:number, erreur:number}>}}
 *   min/max : erreurs signées extrêmes (minutes) sur le domaine lisible.
 */
export function deriveLecture(latitude, declMurReel, erreurEstimation, options = {}) {
  const {
    annee = new Date().getUTCFullYear(),
    pasJours = 3,
    plageHeures = [8, 17],
    pasHeures = 0.25,
    hauteurMinDeg = 0.5,
    incidenceMinDeg = 3,
    styleRecale = false,
  } = options;
  const declMurEstime = declMurReel + erreurEstimation;
  const debut = Date.UTC(annee, 0, 1, 12);
  const nbJours = (Date.UTC(annee + 1, 0, 1) - Date.UTC(annee, 0, 1)) / 86400000;
  const echantillons = [];
  let min = Infinity;
  let max = -Infinity;
  let sommeAbs = 0;
  let pire = null;
  for (let j = 0; j < nbJours; j += pasJours) {
    const delta = declinaisonSoleil(new Date(debut + j * 86400000));
    for (let heure = plageHeures[0]; heure <= plageHeures[1] + 1e-9; heure += pasHeures) {
      const H = 15 * (heure - 12);
      const erreur = erreurLecture(latitude, declMurReel, declMurEstime, delta, H, {
        hauteurMinDeg,
        incidenceMinDeg,
        styleRecale,
      });
      if (erreur === null) continue;
      const ech = { jour: j + 1, heureSolaire: heure, erreur };
      echantillons.push(ech);
      if (erreur < min) min = erreur;
      if (erreur > max) max = erreur;
      sommeAbs += Math.abs(erreur);
      if (!pire || Math.abs(erreur) > Math.abs(pire.erreur)) pire = ech;
    }
  }
  const nombre = echantillons.length;
  return {
    min,
    max,
    maxAbs: Math.max(Math.abs(min), Math.abs(max)),
    moyenneAbs: nombre ? sommeAbs / nombre : NaN,
    nombre,
    pire,
    echantillons,
  };
}
