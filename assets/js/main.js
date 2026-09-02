/**
 * main.js — comportements de la page Tesson.
 *
 * Tout est amélioration progressive : sans JavaScript, les murs sont cuits,
 * le contenu est visible, les ancres fonctionnent. Ici on ajoute :
 *   1. la cuisson du mur du hero (les carreaux prennent leur émail en diagonale) ;
 *   2. la lumière : reflets et lampe suivent le curseur (une écriture par frame) ;
 *   3. le scroll lissé (Lenis, vendorisé) et la parallaxe du mur ;
 *   4. l'entête qui se pose une fois le mur passé, et la section courante ;
 *   5. le nuancier : changer d'émail recuit le mur d'aperçu ;
 *   6. le menu mobile.
 * Pas de reveal au défilement : le contenu est là quand on arrive dessus.
 */

const reduitLeMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointeurFin = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const racine = document.documentElement;
const hero = document.querySelector(".hero");
const murHero = document.querySelector(".mur-hero");

/* ------------------------------------------------------------------ */
/* 1. Cuisson du mur du hero                                           */
/* ------------------------------------------------------------------ */
if (murHero) {
  const carreaux = murHero.querySelectorAll("i");
  const compteColonnes = () => getComputedStyle(murHero).gridTemplateColumns.split(" ").length || 1;
  const poseDelais = () => {
    const cols = compteColonnes();
    carreaux.forEach((c, i) => {
      const r = Math.floor(i / cols);
      const k = i % cols;
      // Diagonale depuis le coin haut-gauche, légèrement chahutée : un four
      // ne cuit jamais tout à fait uniformément.
      c.style.setProperty("--d", String(r + k + ((i * 7) % 3)));
    });
  };
  poseDelais();
  // L'état « cru » doit avoir été calculé une fois avant le changement de
  // classe, sinon le navigateur ne voit aucune transition à jouer.
  const premierCarreau = carreaux[0];
  if (premierCarreau) void getComputedStyle(premierCarreau, "::after").opacity;
  hero.querySelectorAll("h1 .ligne > span").forEach((s) => void getComputedStyle(s).transform);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    murHero.classList.add("est-cuit");
    hero.classList.add("est-entre");
  }));
  let timerRedim;
  window.addEventListener("resize", () => {
    clearTimeout(timerRedim);
    timerRedim = setTimeout(poseDelais, 200);
  });
}

/* ------------------------------------------------------------------ */
/* 2. Lumière : reflets (--lx/--ly) et lampe (--mx/--my)               */
/* ------------------------------------------------------------------ */
if (pointeurFin && !reduitLeMouvement && hero) {
  let cible = null;
  let prevu = false;
  const applique = () => {
    prevu = false;
    if (!cible) return;
    const { x, y } = cible;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    racine.style.setProperty("--lx", `${((x / w - 0.5) * 14).toFixed(2)}%`);
    racine.style.setProperty("--ly", `${((y / h - 0.5) * 10).toFixed(2)}%`);
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${(x - r.left).toFixed(0)}px`);
    hero.style.setProperty("--my", `${(y - r.top).toFixed(0)}px`);
  };
  window.addEventListener("pointermove", (e) => {
    cible = { x: e.clientX, y: e.clientY };
    if (!prevu) { prevu = true; requestAnimationFrame(applique); }
  }, { passive: true });
  hero.addEventListener("pointerenter", () => hero.classList.add("a-lampe"));
  hero.addEventListener("pointerleave", () => hero.classList.remove("a-lampe"));
}

/* ------------------------------------------------------------------ */
/* 3. Scroll lissé + parallaxe du mur                                  */
/* ------------------------------------------------------------------ */
let lenis = null;
if (!reduitLeMouvement && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1 });
  requestAnimationFrame(function raf(t) {
    lenis.raf(t);
    requestAnimationFrame(raf);
  });
}

const surScroll = (y) => {
  if (murHero && !reduitLeMouvement) {
    const limite = hero.offsetHeight;
    if (y <= limite) murHero.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`;
  }
  poseEntete(y);
};

if (lenis) {
  lenis.on("scroll", (e) => surScroll(e.scroll));
} else {
  let prevu = false;
  window.addEventListener("scroll", () => {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => { prevu = false; surScroll(window.scrollY); });
  }, { passive: true });
}

/* Ancres : lissage Lenis, mais le contrat natif est préservé (hash + focus).
   Le décalage sous l'entête vient du seul `scroll-margin-top` des sections,
   que Lenis lit comme le navigateur. */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id === "#") return;
    const cible = document.querySelector(id);
    if (!cible) return;
    e.preventDefault();
    document.querySelector(".menu-mobile[open]")?.close();
    if (lenis) lenis.scrollTo(cible);
    else cible.scrollIntoView({ behavior: reduitLeMouvement ? "auto" : "smooth" });
    if (!cible.hasAttribute("tabindex")) cible.setAttribute("tabindex", "-1");
    cible.focus({ preventScroll: true });
    history.pushState(null, "", id);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Entête : posée après le mur, sombre sur les sections sombres     */
/* ------------------------------------------------------------------ */
const entete = document.querySelector(".entete");
const sectionsSombres = [...document.querySelectorAll(".murs, .appel, .pied")];
function poseEntete(y) {
  if (!entete || !hero) return;
  const posee = y > hero.offsetHeight - 120;
  entete.classList.toggle("est-posee", posee);
  if (posee) {
    const h = entete.offsetHeight;
    const sombre = sectionsSombres.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= h && r.bottom > h;
    });
    entete.classList.toggle("est-sombre", sombre);
  } else {
    entete.classList.remove("est-sombre");
  }
}
poseEntete(window.scrollY);

/* Section courante dans la navigation */
const liensNav = [...document.querySelectorAll(".nav a")];
if (liensNav.length && "IntersectionObserver" in window) {
  const parId = new Map(liensNav.map((a) => [a.getAttribute("href").slice(1), a]));
  const visibles = new Map();
  const io = new IntersectionObserver((entrees) => {
    for (const e of entrees) visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
    let meilleur = null;
    for (const [id, ratio] of visibles) if (ratio > 0 && (!meilleur || ratio > visibles.get(meilleur))) meilleur = id;
    liensNav.forEach((a) => a.removeAttribute("aria-current"));
    if (meilleur) parId.get(meilleur)?.setAttribute("aria-current", "true");
  }, { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.2, 0.5, 0.8] });
  for (const id of parId.keys()) {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  }
}

/* ------------------------------------------------------------------ */
/* 5. Nuancier : l'émail choisi recolore le mur d'aperçu               */
/* ------------------------------------------------------------------ */
const nuancier = document.querySelector("#nuancier-emaux");
const murApercu = document.querySelector(".mur-apercu");
if (nuancier && murApercu) {
  const nom = document.querySelector("[data-email-nom]");
  const code = document.querySelector("[data-email-code]");
  const desc = document.querySelector("[data-email-desc]");
  const carreaux = murApercu.querySelectorAll("i");
  const poseDelais = () => {
    const cols = getComputedStyle(murApercu).gridTemplateColumns.split(" ").length / 2 || 1;
    carreaux.forEach((c, i) => c.style.setProperty("--d", String(Math.floor(i / cols) + (i % cols))));
  };
  poseDelais();
  window.addEventListener("resize", poseDelais);

  let timer = null;
  const applique = (input) => {
    murApercu.dataset.email = input.value;
    murApercu.style.setProperty("--gh", input.dataset.h);
    murApercu.style.setProperty("--gs", `${input.dataset.s}%`);
    murApercu.style.setProperty("--gl", `${input.dataset.l}%`);
    const label = input.closest(".pastille");
    if (nom) nom.textContent = label.querySelector(".pastille-nom").textContent;
    if (code) code.textContent = label.querySelector(".pastille-code").textContent;
    if (desc) desc.textContent = input.dataset.desc || "";
  };
  nuancier.addEventListener("change", (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "email") return;
    if (reduitLeMouvement) { applique(input); return; }
    // Recuisson : le mur redevient cru, change d'émail, puis recuit en diagonale.
    clearTimeout(timer);
    murApercu.classList.add("est-cru");
    timer = setTimeout(() => {
      applique(input);
      requestAnimationFrame(() => murApercu.classList.remove("est-cru"));
    }, 260);
  });
}

/* ------------------------------------------------------------------ */
/* 6. Menu mobile                                                      */
/* ------------------------------------------------------------------ */
const boutonMenu = document.querySelector(".entete .bouton-menu");
const menu = document.querySelector(".menu-mobile");
if (boutonMenu && menu) {
  boutonMenu.addEventListener("click", () => {
    menu.showModal();
    lenis?.stop();
  });
  menu.addEventListener("close", () => {
    lenis?.start();
    boutonMenu.focus();
  });
  menu.querySelector("[data-fermer]")?.addEventListener("click", () => menu.close());
}

/* ------------------------------------------------------------------ */
/* Année du pied                                                       */
/* ------------------------------------------------------------------ */
document.querySelectorAll("[data-annee]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
