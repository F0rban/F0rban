/**
 * regression.mjs — suite de non-régression navigateur (Playwright, Chromium).
 * Vérifie ce qu'une capture ne montre pas : cuisson du mur, entête qui se pose,
 * recuisson du nuancier (souris et clavier), menu mobile, skip-link, reduced
 * motion, débordements, structure accessible, zéro erreur console.
 *
 * Prérequis : site servi (npm run dev → http://127.0.0.1:4173).
 * Usage : node tools/regression.mjs [baseURL]
 */
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:4173";
const b = await chromium.launch();
const erreurs = [];
const ok = (nom, cond, detail = "") => {
  console.log(`${cond ? "✓" : "✗ ÉCHEC"} ${nom}${detail ? ` — ${detail}` : ""}`);
  if (!cond) erreurs.push(nom);
};
const page = async (opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  const console_ = [];
  p.on("console", (m) => { if (m.type() === "error") console_.push(m.text()); });
  p.on("pageerror", (e) => console_.push(String(e)));
  await p.goto(BASE, { waitUntil: "networkidle" });
  return { p, ctx, console_ };
};

/* 1. Cuisson du hero, fontes, entête */
{
  const { p, ctx, console_ } = await page();
  await p.waitForTimeout(2600);
  ok("le mur du hero est cuit", await p.evaluate(() => document.querySelector(".mur-hero").classList.contains("est-cuit")));
  ok("chaque carreau du hero a son délai", await p.evaluate(() => [...document.querySelectorAll(".mur-hero i")].every((i) => i.style.getPropertyValue("--d") !== "")));
  ok("titre entré (lignes visibles)", await p.evaluate(() => getComputedStyle(document.querySelector(".hero h1 .ligne > span")).transform === "none"));
  ok("fontes chargées", await p.evaluate(() => document.fonts.check('1em "Fraunces"') && document.fonts.check('1em "Instrument Sans"')));
  ok("CTA d'entête masqué sur le hero", await p.evaluate(() => getComputedStyle(document.querySelector(".entete-cta")).visibility === "hidden"));
  await p.evaluate(() => document.querySelector("#manifeste").scrollIntoView());
  await p.waitForTimeout(700);
  ok("entête posée après le mur", await p.evaluate(() => document.querySelector(".entete").classList.contains("est-posee")));
  ok("CTA d'entête visible une fois posée", await p.evaluate(() => getComputedStyle(document.querySelector(".entete-cta")).visibility === "visible"));
  await p.evaluate(() => window.scrollTo(0, document.querySelector("#murs").offsetTop + 200));
  await p.waitForTimeout(700);
  ok("entête sombre sur la section Murs", await p.evaluate(() => document.querySelector(".entete").classList.contains("est-sombre")));
  ok("zéro erreur console (desktop)", console_.length === 0, console_.join(" | ").slice(0, 200));
  await ctx.close();
}

/* 2. Nuancier : souris et clavier, recuisson */
{
  const { p, ctx } = await page();
  await p.evaluate(() => document.querySelector("#emaux").scrollIntoView());
  await p.waitForTimeout(400);
  await p.click(".pastille:has(input[value=celadon])");
  const cru = await p.evaluate(() => document.querySelector(".mur-apercu").classList.contains("est-cru"));
  ok("recuisson : le mur repasse par le biscuit", cru);
  await p.waitForTimeout(1600);
  const e = await p.evaluate(() => ({
    email: document.querySelector(".mur-apercu").dataset.email,
    gh: document.querySelector(".mur-apercu").style.getPropertyValue("--gh"),
    nom: document.querySelector("[data-email-nom]").textContent,
    cru: document.querySelector(".mur-apercu").classList.contains("est-cru"),
  }));
  ok("Céladon appliqué au mur d'aperçu", e.email === "celadon" && e.gh === "152" && e.nom === "Céladon" && !e.cru, JSON.stringify(e));
  await p.focus("input[value=celadon]");
  await p.keyboard.press("ArrowDown");
  await p.waitForTimeout(1600);
  ok("clavier : flèche → émail suivant (Lait)", await p.evaluate(() => document.querySelector(".mur-apercu").dataset.email === "lait"));
  await ctx.close();
}

/* 3. Skip-link et ancres */
{
  const { p, ctx } = await page();
  await p.keyboard.press("Tab");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  ok("skip-link → focus sur #contenu", await p.evaluate(() => document.activeElement.id === "contenu"));
  await p.click('.nav a[href="#methode"]');
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ hash: location.hash, top: document.querySelector("#methode").getBoundingClientRect().top }));
  ok("ancre de navigation : hash + section amenée juste sous l'entête", r.hash === "#methode" && r.top > 50 && r.top < 80, JSON.stringify(r));
  await ctx.close();
}

/* 4. Menu mobile */
{
  const { p, ctx } = await page({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.click(".entete .bouton-menu");
  await p.waitForTimeout(200);
  ok("menu mobile ouvert", await p.evaluate(() => document.querySelector(".menu-mobile").open));
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok("Échap ferme le menu et rend le focus au bouton", await p.evaluate(() => !document.querySelector(".menu-mobile").open && document.activeElement.classList.contains("bouton-menu")));
  await p.click(".entete .bouton-menu");
  await p.click('.menu-mobile a[href="#murs"]');
  await p.waitForTimeout(1500);
  ok("lien du menu : fermeture + navigation", await p.evaluate(() => !document.querySelector(".menu-mobile").open && location.hash === "#murs"));
  await ctx.close();
}

/* 5. Reduced motion : tout est visible immédiatement */
{
  const { p, ctx } = await page({ reducedMotion: "reduce" });
  await p.waitForTimeout(300);
  const e = await p.evaluate(() => ({
    titre: getComputedStyle(document.querySelector(".hero h1 .ligne > span")).transform,
    reveal: getComputedStyle(document.querySelector("[data-reveal]")).opacity,
    carreau: getComputedStyle(document.querySelector(".mur-hero i"), "::after").opacity,
  }));
  ok("reduced motion : titre, reveals et carreaux visibles sans attendre", e.titre === "none" && e.reveal === "1" && e.carreau === "0", JSON.stringify(e));
  await ctx.close();
}

/* 6. Débordements horizontaux */
{
  let deborde = 0;
  for (const largeur of [360, 390, 768, 1024, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: largeur, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: "networkidle" });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(300);
    const sw = await p.evaluate(() => document.scrollingElement.scrollWidth);
    if (sw > largeur) { deborde++; ok(`débordement à ${largeur}px`, false, `scrollWidth=${sw}`); }
    await ctx.close();
  }
  ok("aucun débordement horizontal (6 largeurs)", deborde === 0);
}

/* 7. Structure accessible */
{
  const { p, ctx } = await page();
  const s = await p.evaluate(() => {
    const h1 = document.querySelectorAll("h1");
    const sections = [...document.querySelectorAll("section[aria-labelledby]")];
    const labels = sections.every((sec) => document.getElementById(sec.getAttribute("aria-labelledby"))?.matches("h1, h2"));
    const murs = [...document.querySelectorAll(".mur")].every((m) => m.getAttribute("aria-hidden") === "true");
    const ancres = [...document.querySelectorAll('a[href^="#"]')].every((a) => document.querySelector(a.getAttribute("href")));
    const radios = document.querySelectorAll("input[name=email]").length;
    const legend = !!document.querySelector("#nuancier-emaux legend");
    return { h1: h1.length, h1Texte: h1[0]?.textContent.replace(/\s+/g, " ").trim(), labels, murs, ancres, radios, legend, lang: document.documentElement.lang };
  });
  ok("un seul h1, texte attendu", s.h1 === 1 && s.h1Texte === "Aucun carreau ne ressemble au suivant.", s.h1Texte);
  ok("chaque section est nommée par son titre", s.labels);
  ok("les murs sont décoratifs (aria-hidden)", s.murs);
  ok("toutes les ancres pointent vers une cible", s.ancres);
  ok("nuancier : 8 boutons radio sous une légende", s.radios === 8 && s.legend);
  ok("lang=fr", s.lang === "fr");
  await ctx.close();
}

/* 8. Console mobile + 404 */
{
  const { p, ctx, console_ } = await page({ viewport: { width: 390, height: 844 } });
  await p.waitForTimeout(800);
  await p.goto(`${BASE}/404.html`, { waitUntil: "networkidle" });
  ok("zéro erreur console (mobile + 404)", console_.length === 0, console_.join(" | ").slice(0, 200));
  await ctx.close();
}

await b.close();
console.log(erreurs.length ? `\n${erreurs.length} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(erreurs.length ? 1 : 0);
