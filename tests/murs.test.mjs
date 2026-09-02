/**
 * murs.test.mjs — le générateur de murs est déterministe et reste dans ses
 * bornes (les écarts d'un carreau ne doivent jamais casser le contraste ni
 * sortir l'émail de sa famille). Exécution : npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { prng, carreau, htmlMur, svgCraquele } from "../tools/lib/murs.mjs";

test("prng : même graine, même suite ; graines différentes, suites différentes", () => {
  const a = prng(17), b = prng(17), c = prng(18);
  const sa = Array.from({ length: 8 }, a);
  const sb = Array.from({ length: 8 }, b);
  const sc = Array.from({ length: 8 }, c);
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  for (const v of sa) assert.ok(v >= 0 && v < 1);
});

test("carreau : écarts bornés, même en fond de four", () => {
  const rand = prng(3);
  for (let i = 0; i < 5000; i++) {
    const c = carreau(rand);
    assert.ok(Math.abs(c.dh) <= 3.5 * 2.2, `dh ${c.dh}`);
    assert.ok(Math.abs(c.ds) <= 4 * 2.2, `ds ${c.ds}`);
    assert.ok(Math.abs(c.dl) <= 3.5 * 2.2, `dl ${c.dl}`);
    assert.ok(c.hx >= 26 && c.hx <= 42, `hx ${c.hx}`);
    assert.ok(c.hy >= 18 && c.hy <= 36, `hy ${c.hy}`);
    assert.ok(c.g >= 0.14 && c.g <= 0.3, `g ${c.g}`);
  }
});

test("carreau : la plupart des carreaux restent proches de l'émail (cloche)", () => {
  const rand = prng(11);
  let proches = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (Math.abs(carreau(rand).dl) <= 1.5) proches++;
  assert.ok(proches / N > 0.6, `${((proches / N) * 100).toFixed(0)} % de carreaux à ±1,5 % de clarté`);
});

test("htmlMur droit : n carreaux, idempotent", () => {
  const a = htmlMur({ n: 120, seed: 17 });
  const b = htmlMur({ n: 120, seed: 17 });
  assert.equal(a, b);
  assert.equal((a.match(/<i /g) || []).length, 120);
  assert.ok(!a.includes("demi"));
});

test("htmlMur décalé : demi-carreaux aux bords des rangées impaires", () => {
  const html = htmlMur({ n: 40, seed: 5, cols: 10, motif: "decale" });
  const rangees = 4;
  const demis = (html.match(/class="demi"/g) || []).length;
  assert.equal(demis, (rangees / 2) * 2);
  // 2 rangées pleines de 10 + 2 rangées de 9 entiers + 2 demis
  assert.equal((html.match(/<i/g) || []).length, 20 + 2 * (9 + 2));
  assert.throws(() => htmlMur({ n: 10, seed: 1, motif: "decale" }));
});

test("htmlMur : bande alternative sur les rangées demandées", () => {
  const html = htmlMur({ n: 30, seed: 9, cols: 10, alt: [1] });
  const tuiles = html.split("</i>").filter(Boolean);
  assert.equal(tuiles.length, 30);
  tuiles.forEach((t, i) => {
    const attendu = i >= 10 && i < 20;
    assert.equal(t.includes('class="alt"'), attendu, `carreau ${i}`);
  });
});

test("svgCraquele : SVG déterministe avec réseau et piqûres", () => {
  const a = svgCraquele({ seed: 1841 });
  assert.equal(a, svgCraquele({ seed: 1841 }));
  assert.ok(a.startsWith("<svg") && a.endsWith("</svg>"));
  assert.ok(a.includes('aria-hidden="true"'));
  assert.ok((a.match(/Q/g) || []).length > 400, "assez d'arcs (deux réseaux)");
  assert.equal((a.match(/<path/g) || []).length, 4, "deux réseaux × (ombre + arête)");
  assert.equal((a.match(/<circle/g) || []).length, 7);
  assert.notEqual(a, svgCraquele({ seed: 2 }));
});
