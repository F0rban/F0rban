/**
 * main.js — bootstrap commun à toutes les pages.
 *
 * Rôles : scroll lissé (Lenis), variable globale --sun-angle pilotée au scroll
 * (UNE écriture par frame, gsap.quickSetter), reveals au clip-path oblique,
 * navigation mobile, infobulles du glossaire, formulaire de contact.
 *
 * Doctrine motion (visual-bible §8) : rien ne bondit, tout pivote ou glisse
 * comme une ombre. prefers-reduced-motion : scroll natif, ombres figées à +31°,
 * les instruments restent fonctionnels.
 *
 * Dépendance globale (vendorisée, chargée avant ce module) : window.Lenis.
 * (GSAP a été retiré : Lenis seul suffit à lisser le scroll et à écrire
 * --sun-angle — 46 Ko gzip économisés par page.)
 */

const reduitLeMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Scroll lissé + ombre solaire globale                                */
/* ------------------------------------------------------------------ */
if (!reduitLeMouvement && window.Lenis) {
  const lenis = new window.Lenis({ lerp: 0.095 });
  requestAnimationFrame(function raf(t) {
    lenis.raf(t);
    requestAnimationFrame(raf);
  });

  // Le scroll EST la journée : -52° en haut de page (matin), +52° au footer
  // (couchant). Le lissage vient de Lenis lui-même (e.scroll est la valeur
  // interpolée) : une seule écriture par frame de scroll, sur :root.
  const racine = document.documentElement;
  lenis.on("scroll", (e) => {
    const limite = e.limit || 1;
    racine.style.setProperty("--sun-angle", String(-52 + 104 * Math.min(1, e.scroll / limite)));
  });

  // Liens d'ancre internes : Lenis garde le lissage, mais on préserve le
  // contrat natif — le hash change et le focus suit (skip-link compris).
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const cible = document.querySelector(a.getAttribute("href"));
      if (!cible) return;
      e.preventDefault();
      lenis.scrollTo(cible, { offset: -80 });
      if (!cible.hasAttribute("tabindex")) cible.setAttribute("tabindex", "-1");
      cible.focus({ preventScroll: true });
      history.pushState(null, "", a.getAttribute("href"));
    });
  });
}

/* ------------------------------------------------------------------ */
/* Reveals — l'ombre se retire (clip-path oblique, CSS fait le tween)  */
/* ------------------------------------------------------------------ */
const revelables = document.querySelectorAll("[data-reveal]");
if (revelables.length) {
  const io = new IntersectionObserver(
    (entrees) => {
      for (const e of entrees) {
        if (e.isIntersecting) {
          e.target.classList.add("est-revele");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
  );
  revelables.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* Navigation mobile — le contrevent                                   */
/* ------------------------------------------------------------------ */
const boutonMenu = document.querySelector(".bouton-menu");
const navMobile = document.querySelector(".nav-mobile");
if (boutonMenu && navMobile) {
  boutonMenu.addEventListener("click", () => navMobile.showModal());
  navMobile.querySelector(".nav-mobile-fermer")?.addEventListener("click", () => navMobile.close());
  navMobile.addEventListener("click", (e) => {
    // Clic sur le fond du dialog (hors contenu) ou sur un lien : on ferme.
    if (e.target === navMobile || e.target.closest("a")) navMobile.close();
  });
}

/* ------------------------------------------------------------------ */
/* Glossaire inline — une seule infobulle partagée, hover ET focus     */
/* ------------------------------------------------------------------ */
const gloses = document.querySelectorAll("[data-glose]");
if (gloses.length) {
  const bulle = document.createElement("div");
  bulle.className = "infobulle";
  bulle.id = "infobulle-glossaire";
  bulle.setAttribute("role", "tooltip");
  document.body.appendChild(bulle);
  let cibleCourante = null;
  let timerFermeture = null;

  const montre = (el) => {
    clearTimeout(timerFermeture);
    cibleCourante = el;
    const terme = el.getAttribute("data-terme") || el.textContent.trim();
    bulle.innerHTML = "";
    const label = document.createElement("span");
    label.className = "mono-label";
    label.textContent = terme;
    bulle.appendChild(label);
    bulle.appendChild(document.createTextNode(el.getAttribute("data-glose")));
    const r = el.getBoundingClientRect();
    bulle.style.left = "0px";
    bulle.style.top = "0px";
    bulle.classList.add("est-visible");
    const b = bulle.getBoundingClientRect();
    let x = r.left + window.scrollX;
    x = Math.min(x, window.scrollX + document.documentElement.clientWidth - b.width - 12);
    const y = r.bottom + window.scrollY + 8;
    bulle.style.left = `${Math.max(x, window.scrollX + 12)}px`;
    bulle.style.top = `${y}px`;
    el.setAttribute("aria-describedby", "infobulle-glossaire");
  };
  const cache = () => {
    bulle.classList.remove("est-visible");
    cibleCourante?.removeAttribute("aria-describedby");
    cibleCourante = null;
  };
  // WCAG 1.4.13 : la bulle doit être survolable — fermeture différée,
  // annulée si le pointeur entre dans la bulle.
  const cacheDoucement = () => {
    clearTimeout(timerFermeture);
    timerFermeture = setTimeout(cache, 180);
  };
  bulle.addEventListener("mouseenter", () => clearTimeout(timerFermeture));
  bulle.addEventListener("mouseleave", cacheDoucement);

  const tactile = window.matchMedia("(hover: none)").matches;
  gloses.forEach((el) => {
    if (el.tagName !== "A" && el.tabIndex < 0) el.tabIndex = 0;
    el.classList.add("glose");
    el.addEventListener("mouseenter", () => montre(el));
    el.addEventListener("mouseleave", cacheDoucement);
    el.addEventListener("focus", () => montre(el));
    el.addEventListener("blur", cacheDoucement);
    if (tactile) {
      // Écran tactile : premier tap = glose (on retient la navigation),
      // second tap = suivre le lien éventuel.
      el.addEventListener("click", (e) => {
        if (cibleCourante !== el) {
          e.preventDefault();
          montre(el);
        }
      });
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cache();
  });
  window.addEventListener("scroll", () => { if (cibleCourante) cache(); }, { passive: true });
}

/* ------------------------------------------------------------------ */
/* Année courante du footer                                            */
/* ------------------------------------------------------------------ */
document.querySelectorAll("[data-annee]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

/* ------------------------------------------------------------------ */
/* Formulaire de contact — démonstration honnête (rien n'est envoyé)   */
/* ------------------------------------------------------------------ */
const form = document.querySelector("#form-etude");
if (form) {
  const valide = (champ) => {
    const bloc = champ.closest(".champ");
    if (!bloc) return true;
    let ok = champ.checkValidity();
    // required accepte des espaces : un champ texte requis vide de sens est invalide.
    if (ok && champ.required && typeof champ.value === "string" && champ.value.trim() === "") ok = false;
    if (champ.id === "champ-message" && champ.value.trim().length > 0 && champ.value.trim().length < 2) ok = false;
    bloc.classList.toggle("est-invalide", !ok);
    champ.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  };

  form.querySelectorAll("input, select, textarea").forEach((champ) => {
    champ.addEventListener("blur", () => valide(champ));
    champ.addEventListener("input", () => {
      if (champ.closest(".champ")?.classList.contains("est-invalide")) valide(champ);
    });
  });

  // Message doux si le mur est orienté nord (jamais bloquant).
  const orientation = form.querySelector("#champ-orientation");
  const noteNord = form.querySelector("#note-nord");
  if (orientation && noteNord) {
    orientation.addEventListener("change", () => {
      noteNord.hidden = orientation.value !== "nord";
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let toutValide = true;
    form.querySelectorAll("input, select, textarea").forEach((champ) => {
      if (!valide(champ)) toutValide = false;
    });
    if (!toutValide) {
      form.querySelector(".champ.est-invalide input, .champ.est-invalide select, .champ.est-invalide textarea")?.focus();
      return;
    }
    // Site fictif : aucune donnée ne quitte le navigateur. On montre l'état
    // de succès tel qu'il serait — c'est un prototype de parcours, pas un envoi.
    form.hidden = true;
    const succes = document.querySelector("#form-succes");
    if (succes) {
      succes.hidden = false;
      succes.focus();
    }
  });
}
