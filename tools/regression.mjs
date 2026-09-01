/**
 * regression.mjs — Suite de non-régression navigateur (Playwright).
 * Rejoue les scénarios des constats d'audit corrigés : instrument jour/nuit,
 * repli lat/lon, skip-link, validation du formulaire, débordements, a11y.
 * Prérequis : site servi sur http://127.0.0.1:4200. Usage : node tools/regression.mjs
 */
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const b = await chromium.launch();
const erreurs = [];
const ok = (nom, cond, detail="") => { console.log((cond ? "✓" : "✗ ÉCHEC"), nom, detail); if (!cond) erreurs.push(nom); };

{
  const p = await (await b.newContext()).newPage();
  await p.goto("http://127.0.0.1:4200/", { waitUntil: "networkidle" });
  await p.click("#calculer-mon-ciel");
  await p.waitForTimeout(9000); // timeout géoloc 8 s → repli
  const visible = await p.evaluate(() => !document.querySelector("#repli-manuel").hidden);
  ok("repli visible après échec géoloc", visible);
  if (visible) {
    await p.fill("#champ-lieu", "abc");
    await p.press("#champ-lieu", "Enter");
    await p.fill("#champ-lieu", "45, 6.5");
    await p.press("#champ-lieu", "Enter");
    await p.waitForTimeout(300);
    const lieu = await p.textContent("[data-live='lieu']");
    ok("re-soumission valide après invalide", lieu.includes("LE LIEU CHOISI"), lieu.trim().slice(0,60));
  }
  await p.context().close();
}
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date("2026-09-01T16:30:00Z") });
  await p.goto("http://127.0.0.1:4200/", { waitUntil: "networkidle" });
  await p.clock.runFor(1600);
  const e = await p.evaluate(() => ({
    heure: document.querySelector("[data-live='heure-vraie']").textContent,
    bascule: document.querySelector("#bascule-nuit").hidden,
  }));
  ok("soleil derrière le mur : motif exact", e.heure.includes("SOLEIL DERRIÈRE LE MUR"), e.heure.slice(0,70));
  ok("bascule nuit masquée le jour", e.bascule === true);
  await ctx.close();
}
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date("2026-09-01T22:30:00Z") });
  await p.goto("http://127.0.0.1:4200/", { waitUntil: "networkidle" });
  await p.clock.runFor(1600);
  ok("bascule visible la nuit", await p.evaluate(() => !document.querySelector("#bascule-nuit").hidden));
  await p.click("#bascule-nuit");
  const nuit = await p.evaluate(() => ({
    classe: document.querySelector(".cadran-cadre").classList.contains("est-nuit"),
    point: document.querySelector("#cadran-point-nuit").getAttribute("opacity"),
    label: document.querySelector("#bascule-nuit").textContent,
  }));
  ok("vue nocturne active", nuit.classe && nuit.point === "1" && nuit.label.includes("Revenir"), JSON.stringify(nuit));
  await p.click("#bascule-nuit");
  ok("retour au midi vrai propre", await p.evaluate(() =>
    !document.querySelector(".cadran-cadre").classList.contains("est-nuit") &&
    document.querySelector("#cadran-point-nuit").getAttribute("opacity") === "0"));
  await ctx.close();
}
{
  const p = await (await b.newContext()).newPage();
  await p.goto("http://127.0.0.1:4200/", { waitUntil: "networkidle" });
  await p.keyboard.press("Tab");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  const e = await p.evaluate(() => ({ actif: document.activeElement.id, hash: location.hash }));
  ok("skip-link → focus #contenu + hash", e.actif === "contenu" && e.hash === "#contenu", JSON.stringify(e));
  await p.context().close();
}
{
  const p = await (await b.newContext()).newPage();
  await p.goto("http://127.0.0.1:4200/contact/", { waitUntil: "networkidle" });
  await p.fill("#champ-nom", "   ");
  await p.fill("#champ-email", "a@b.fr");
  await p.fill("#champ-localisation", "Molines");
  await p.fill("#champ-message", "Bonjour, un pignon.");
  await p.check("#champ-consentement");
  await p.click("button[type=submit]");
  const e = await p.evaluate(() => ({
    succes: !document.querySelector("#form-succes").hidden,
    nomInvalide: document.querySelector("#champ-nom").getAttribute("aria-invalid"),
    describedby: document.querySelector("#champ-nom").getAttribute("aria-describedby"),
  }));
  ok("espaces seuls refusés", e.succes === false && e.nomInvalide === "true", JSON.stringify(e));
  ok("aria-describedby présent", e.describedby === "err-nom");
  await p.fill("#champ-nom", "Jeanne Arnaud");
  await p.click("button[type=submit]");
  ok("soumission valide → succès", await p.evaluate(() => !document.querySelector("#form-succes").hidden));
  await p.context().close();
}
let deborde = 0;
for (const largeur of [360, 390, 768, 1024, 1440]) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: 800 } });
  const p = await ctx.newPage();
  for (const page of ["", "savoir-faire/", "creations/", "atelier/", "methode-tarifs/", "contact/", "404.html"]) {
    await p.goto(`http://127.0.0.1:4200/${page}`, { waitUntil: "networkidle" });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(200);
    const sw = await p.evaluate(() => document.scrollingElement.scrollWidth);
    if (sw > largeur) { deborde++; ok(`overflow ${page || "/"} @${largeur}`, false, `scrollWidth=${sw}`); }
  }
  await ctx.close();
}
ok("aucun débordement horizontal (35 combinaisons)", deborde === 0);
{
  const p = await (await b.newContext()).newPage();
  await p.goto("http://127.0.0.1:4200/", { waitUntil: "networkidle" });
  const snap = await p.accessibility.snapshot();
  const h1s = [];
  (function marche(n) { if (n.role === "heading" && n.level === 1) h1s.push(n.name); (n.children||[]).forEach(marche); })(snap);
  ok("H1 non dupliqué", h1s[0] === "Nous peignons l’heure vraie.", JSON.stringify(h1s));
  await p.context().close();
}
{
  const p = await (await b.newContext()).newPage();
  const consoleErr = [];
  p.on("pageerror", (e) => consoleErr.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") consoleErr.push(m.text()); });
  for (const page of ["", "savoir-faire/", "creations/", "atelier/", "methode-tarifs/", "contact/", "mentions/", "404.html"]) {
    await p.goto(`http://127.0.0.1:4200/${page}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
  }
  ok("zéro erreur console (8 pages)", consoleErr.length === 0, consoleErr.join(" | ").slice(0, 200));
  await p.context().close();
}
await b.close();
console.log(erreurs.length ? `\n${erreurs.length} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(erreurs.length ? 1 : 0);
