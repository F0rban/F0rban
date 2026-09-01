/**
 * cadran.js — Le Cadran Vivant (héros de l'accueil).
 *
 * Le SVG est généré au build (tools/genere-svg.mjs) et rendu COMPLET sans
 * JavaScript : tracé, chiffres, ombre à la ligne de midi. Ce module ne fait
 * qu'orienter l'ombre à l'heure réelle et tenir les étiquettes à jour.
 *
 * Contrat de vérité (concept lock) :
 * - Le héros affiche l'heure solaire VRAIE réelle, calculée dans le navigateur
 *   par le même moteur que les planches (assets/js/gnomonique.js).
 * - S'il fait nuit au lieu calculé, on sert le midi vrai SIMULÉ du jour,
 *   étiqueté comme tel — jamais un écran d'absence. La vue « ciel de cette
 *   nuit » (analemme) est une bascule opt-in, dans la même boîte.
 * - Géolocalisation : uniquement au clic sur « Calculer pour mon ciel ».
 *   La position ne quitte pas le navigateur.
 */
import {
  ombreStyle,
  equationDuTemps,
  heureSolaireVraie,
  analemme,
} from "./gnomonique.js";

const svg = document.querySelector(".cadran-svg");
if (svg) initialise(svg);

function initialise(svg) {
  const ombre = svg.querySelector("#cadran-ombre");
  const pointNuit = svg.querySelector("#cadran-point-nuit");
  const cadre = svg.closest(".cadran-cadre");
  const declMur = Number(svg.dataset.declMur);

  const lieu = {
    lat: Number(svg.dataset.lat),
    lon: Number(svg.dataset.lon),
    nom: "MOLINES-EN-QUEYRAS",
  };

  const eHeure = document.querySelector("[data-live='heure-vraie']");
  const eEqt = document.querySelector("[data-live='eqt']");
  const eEtat = document.querySelector("[data-live='etat']");
  const eLieu = document.querySelector("[data-live='lieu']");
  const basculeNuit = document.querySelector("#bascule-nuit");
  const centre = { x: 396, y: 178 }; // pied du style (rosace), cf. générateur

  let vueNuit = false;

  /* Écritures DOM gardées : pas de mutation si le texte n'a pas changé. */
  const ecrit = (el, s) => {
    if (el && el.textContent !== s) el.textContent = s;
  };

  const formatHeure = (h) => {
    const H = Math.floor(h);
    const M = Math.floor((h - H) * 60);
    const S = Math.floor((((h - H) * 60) - M) * 60);
    return `${H} H ${String(M).padStart(2, "0")} MIN ${String(S).padStart(2, "0")} S`;
  };

  /** Instant du midi vrai du jour au lieu courant (à la minute près). */
  const midiVraiDuJour = (maintenant) => {
    const d = new Date(maintenant);
    // minutes UTC du midi vrai : 720 − 4λ − E (E évalué au voisinage de midi).
    d.setUTCHours(12, 0, 0, 0);
    const minutes = 720 - 4 * lieu.lon - equationDuTemps(d);
    d.setUTCHours(0, Math.round(minutes), 0, 0);
    return d;
  };

  /* Sortie de la vue nocturne — appelée à la bascule ET quand le jour
     revient (lever de soleil, changement de lieu) pour ne jamais rester
     coincé sur une analemme de nuit en plein jour. */
  function quitteVueNuit() {
    if (!vueNuit) return;
    vueNuit = false;
    cadre?.classList.remove("est-nuit");
    svg.classList.remove("vue-nuit");
    pointNuit?.setAttribute("opacity", "0");
    const eAnalemme = document.querySelector("[data-live='analemme']");
    if (eAnalemme) eAnalemme.hidden = true;
    if (basculeNuit) basculeNuit.textContent = "Voir le ciel de cette nuit";
  }

  function metAJour() {
    if (document.hidden) return; // onglet caché : l'instrument attend.
    const maintenant = new Date();
    const reel = ombreStyle(maintenant, lieu.lat, lieu.lon, declMur);
    const eqt = reel.soleil.equationTemps;
    const signe = eqt >= 0 ? "+" : "−";
    // Arrondi en secondes totales d'abord — jamais de « 3 MIN 60 S ».
    const totalSec = Math.round(Math.abs(eqt) * 60);
    const eqtMin = Math.floor(totalSec / 60);
    const eqtSec = totalSec % 60;
    ecrit(eEqt, `ÉQUATION DU TEMPS — ${signe}${eqtMin} MIN ${String(eqtSec).padStart(2, "0")} S`);

    if (reel.visible) {
      // Jour : l'ombre à sa vraie place. L'ombre ne ment pas.
      // Convention moteur : angle positif = à droite de la ligne de midi (+x).
      // CSS rotate() positif est horaire à l'écran (y vers le bas) et enverrait
      // une ligne descendante vers la GAUCHE : on inverse le signe.
      quitteVueNuit();
      ombre.style.transform = `rotate(${(-reel.stylePolaire.angle).toFixed(3)}deg)`;
      ecrit(eHeure, `HEURE VRAIE — ${formatHeure(reel.soleil.heureSolaire)}`);
      ecrit(eEtat, "OMBRE RÉELLE — CALCULÉE POUR CET INSTANT");
      if (basculeNuit) basculeNuit.hidden = true;
      return "jour";
    }

    // Le soleil est levé mais derrière le mur, OU il fait vraiment nuit :
    // dans les deux cas, midi vrai simulé — mais on ne propose « le ciel de
    // cette nuit » qu'à la vraie nuit.
    const vraieNuit = reel.soleil.hauteur <= 0;
    if (!vraieNuit) quitteVueNuit();
    const midi = midiVraiDuJour(maintenant);
    const simule = ombreStyle(midi, lieu.lat, lieu.lon, declMur);
    if (simule.visible) {
      ombre.style.transform = `rotate(${(-simule.stylePolaire.angle).toFixed(3)}deg)`;
    } else {
      ombre.style.transform = "rotate(0deg)";
    }
    const hv = heureSolaireVraie(maintenant, lieu.lon);
    const motif = vraieNuit ? "IL FAIT NUIT" : "SOLEIL DERRIÈRE LE MUR";
    ecrit(eHeure, `HEURE VRAIE — ${formatHeure(hv)} (${motif})`);
    const dateStr = maintenant.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }).toUpperCase();
    ecrit(eEtat, `MIDI VRAI SIMULÉ — ${dateStr}`);
    if (basculeNuit) basculeNuit.hidden = !vraieNuit && !vueNuit;
    return "nuit";
  }

  /* Vue nocturne opt-in : l'analemme comme instrument, jamais une absence. */
  function metAJourPointNuit() {
    if (!pointNuit) return;
    const debut = Date.UTC(new Date().getUTCFullYear(), 0, 1);
    const jour = Math.floor((Date.now() - debut) / 86400000) + 1;
    const points = analemme(lieu.lat, lieu.lon, 13, {
      fuseau: 1,
      annee: new Date().getUTCFullYear(),
      pasJours: 1,
      declMur,
      longueurStyle: 96, // même échelle de nodus que le générateur du héros
    });
    const p = points[Math.min(jour - 1, points.length - 1)];
    if (p && p.ombre) {
      pointNuit.setAttribute("cx", (centre.x + p.ombre.x).toFixed(1));
      pointNuit.setAttribute("cy", (centre.y + p.ombre.y).toFixed(1));
      pointNuit.setAttribute("opacity", "1");
    }
  }

  if (basculeNuit && cadre) {
    const eAnalemme = document.querySelector("[data-live='analemme']");
    basculeNuit.addEventListener("click", () => {
      if (vueNuit) {
        quitteVueNuit();
        return;
      }
      vueNuit = true;
      cadre.classList.add("est-nuit");
      svg.classList.add("vue-nuit");
      metAJourPointNuit();
      const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" }).toUpperCase();
      if (eAnalemme) {
        eAnalemme.hidden = false;
        eAnalemme.textContent = `ANALEMME — POSITION DU ${dateStr} · HEURE D'HIVER`;
      }
      basculeNuit.textContent = "Revenir au midi vrai";
    });
  }

  /* Géolocalisation opt-in — rien n'est envoyé, rien n'est gardé. */
  const boutonCiel = document.querySelector("#calculer-mon-ciel");
  const replisManuel = document.querySelector("#repli-manuel");
  const champLieu = document.querySelector("#champ-lieu");

  const adopteLieu = (lat, lon, nom) => {
    lieu.lat = lat;
    lieu.lon = lon;
    lieu.nom = nom;
    if (eLieu) {
      const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
      const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "O"}`;
      eLieu.textContent = `CALCULÉ POUR ${nom} — ${latStr} ${lonStr}`;
    }
    metAJour();
  };

  if (boutonCiel) {
    boutonCiel.addEventListener("click", () => {
      if (!navigator.geolocation) {
        replisManuel?.removeAttribute("hidden");
        return;
      }
      boutonCiel.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          boutonCiel.disabled = false;
          const { latitude, longitude } = pos.coords;
          if (latitude <= 0 || latitude >= 90) {
            // Domaine du moteur : hémisphère nord — on le dit élégamment.
            if (eLieu) eLieu.textContent = "SOUS D'AUTRES CIEUX — LE MOTEUR NE COUVRE QUE L'HÉMISPHÈRE NORD. MOLINES VEILLE.";
            return;
          }
          adopteLieu(latitude, longitude, "VOTRE CIEL");
        },
        () => {
          boutonCiel.disabled = false;
          replisManuel?.removeAttribute("hidden");
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    });
  }

  if (champLieu) {
    const formRepli = champLieu.closest("form");
    // Toute la validation est faite ici : la validation native ne doit pas
    // bloquer une re-soumission après une saisie corrigée.
    formRepli?.setAttribute("novalidate", "");
    champLieu.addEventListener("input", () => champLieu.setCustomValidity(""));
    formRepli?.addEventListener("submit", (e) => {
      e.preventDefault();
      const m = champLieu.value.match(/(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/);
      if (!m) {
        champLieu.setCustomValidity("Format attendu : latitude, longitude — par exemple 44,69, 6,85");
        champLieu.reportValidity();
        return;
      }
      champLieu.setCustomValidity("");
      const lat = parseFloat(m[1].replace(",", "."));
      const lon = parseFloat(m[2].replace(",", "."));
      if (lat <= 0 || lat >= 90) {
        champLieu.setCustomValidity("Le moteur ne couvre que l'hémisphère nord (0° < latitude < 90°).");
        champLieu.reportValidity();
        return;
      }
      adopteLieu(lat, lon, "LE LIEU CHOISI");
    });
  }

  /* L'instrument bat la seconde. Reduced-motion : il bat toujours —
     réduire le mouvement ne débranche jamais un instrument. */
  metAJour();
  setInterval(metAJour, 1000);
}
