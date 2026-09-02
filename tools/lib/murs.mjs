/**
 * murs.mjs — génération déterministe des murs de carreaux de Tesson.
 *
 * Un mur est une suite de carreaux `<i>` ; chaque carreau porte de petits
 * écarts (teinte, saturation, clarté, position et intensité du reflet) autour
 * de l'émail de son mur. Ces écarts imitent ce que produisent réellement un
 * émaillage à la main et une place dans le four : la plupart des carreaux se
 * ressemblent, quelques-uns (« fond de four ») s'écartent franchement.
 *
 * Le carreau ne connaît que ses écarts ; l'émail de base (--gh/--gs/--gl) est
 * posé sur le conteneur par le CSS — ou par le JS quand l'émail change.
 * Module ES pur, zéro dépendance, utilisé par tools/genere-murs.mjs et testé
 * dans tests/murs.test.mjs.
 */

/** mulberry32 — PRNG 32 bits, rapide et reproductible. */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bruit centré ∈ [-0,5 ; 0,5], en cloche (somme de trois tirages). */
export function cloche(rand) {
  return (rand() + rand() + rand()) / 3 - 0.5;
}

const arrondi = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Un carreau : ses écarts à l'émail du mur.
 * @param {() => number} rand
 * @param {number} variation  amplitude relative (1 = émaillage courant)
 */
export function carreau(rand, variation = 1) {
  const fondDeFour = rand() < 0.08;
  const amp = variation * (fondDeFour ? 2.2 : 1);
  return {
    dh: arrondi(cloche(rand) * 7 * amp), // ±3,5° de teinte (±7,7° fond de four)
    ds: arrondi(cloche(rand) * 8 * amp), // ±4 % de saturation
    dl: arrondi(cloche(rand) * 7 * amp), // ±3,5 % de clarté
    hx: Math.round(26 + rand() * 16), // reflet : 26–42 % depuis la gauche
    hy: Math.round(18 + rand() * 18), // reflet : 18–36 % depuis le haut
    g: arrondi(0.14 + rand() * 0.16, 2), // intensité du reflet
  };
}

export function styleCarreau(c) {
  return `--dh:${c.dh};--ds:${c.ds}%;--dl:${c.dl}%;--hx:${c.hx}%;--hy:${c.hy}%;--g:${c.g}`;
}

/**
 * HTML d'un mur.
 * @param {object} o
 * @param {number} o.n          nombre de carreaux entiers (motif droit) ou de
 *                              positions (motif décalé : les demi-carreaux
 *                              s'ajoutent en bord de rangée)
 * @param {number} o.seed
 * @param {number} [o.variation=1]
 * @param {"droit"|"decale"} [o.motif="droit"]
 * @param {number} [o.cols]     colonnes (obligatoire pour le motif décalé)
 * @param {number[]} [o.alt]    index (0-based) des rangées émaillées dans
 *                              l'émail alternatif du mur (class="alt")
 */
export function htmlMur({ n, seed, variation = 1, motif = "droit", cols, alt = [] }) {
  const rand = prng(seed);
  const out = [];
  const tuile = (classes = []) => {
    const cls = classes.length ? ` class="${classes.join(" ")}"` : "";
    return `<i${cls} style="${styleCarreau(carreau(rand, variation))}"></i>`;
  };

  if (motif === "decale") {
    if (!cols) throw new Error("motif décalé : `cols` requis");
    const rangees = Math.ceil(n / cols);
    for (let r = 0; r < rangees; r++) {
      const estAlt = alt.includes(r);
      const base = estAlt ? ["alt"] : [];
      if (r % 2 === 1) {
        out.push(tuile([...base, "demi"]));
        for (let c = 0; c < cols - 1; c++) out.push(tuile(base));
        out.push(tuile([...base, "demi"]));
      } else {
        for (let c = 0; c < cols; c++) out.push(tuile(base));
      }
    }
    return out.join("");
  }

  for (let i = 0; i < n; i++) {
    const r = cols ? Math.floor(i / cols) : -1;
    out.push(tuile(alt.includes(r) ? ["alt"] : []));
  }
  return out.join("");
}

/**
 * Réseau de craquelures (tressaillage) d'un émail, en SVG.
 * Deux réseaux superposés — mailles larges puis mailles fines — de points
 * chahutés reliés par des segments à peine courbes ; une partie des arêtes
 * est omise (une craquelure a des impasses). Chaque réseau est tracé deux
 * fois : l'ombre de la fissure, puis son arête éclairée, décalée d'un demi-trait.
 */
export function svgCraquele({ seed = 1841, couches = [[7, 1], [17, 0.55]], sautes = 0.2 } = {}) {
  const rand = prng(seed);
  const reseau = (taille) => {
    const pts = [];
    for (let i = 0; i <= taille; i++) {
      pts.push([]);
      for (let j = 0; j <= taille; j++) {
        const bord = i === 0 || j === 0 || i === taille || j === taille;
        const jit = bord ? 0 : 0.46;
        pts[i].push([
          ((i + (rand() - 0.5) * 2 * jit) / taille) * 100,
          ((j + (rand() - 0.5) * 2 * jit) / taille) * 100,
        ]);
      }
    }
    const segs = [];
    const arc = (a, b) => {
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const k = (rand() - 0.5) * 0.12 * len;
      const cx = mx + (-dy / len) * k;
      const cy = my + (dx / len) * k;
      return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    };
    for (let i = 0; i <= taille; i++) {
      for (let j = 0; j <= taille; j++) {
        const bordI = i === 0 || i === taille;
        const bordJ = j === 0 || j === taille;
        if (i < taille && !bordJ && rand() > sautes) segs.push(arc(pts[i][j], pts[i + 1][j]));
        if (j < taille && !bordI && rand() > sautes) segs.push(arc(pts[i][j], pts[i][j + 1]));
      }
    }
    return segs.join("");
  };
  const traces = couches
    .map(([taille, op]) => {
      const d = reseau(taille);
      return (
        `<path d="${d}" fill="none" stroke="#000" stroke-opacity="${(0.17 * op).toFixed(3)}" stroke-width="${(0.3 * op + 0.08).toFixed(2)}" stroke-linecap="round" transform="translate(.18 .18)"/>` +
        `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${(0.21 * op).toFixed(3)}" stroke-width="${(0.22 * op + 0.06).toFixed(2)}" stroke-linecap="round" transform="translate(-.1 -.1)"/>`
      );
    })
    .join("");
  const trous = [];
  for (let k = 0; k < 7; k++) {
    trous.push(`<circle cx="${(8 + rand() * 84).toFixed(1)}" cy="${(8 + rand() * 84).toFixed(1)}" r="${(0.25 + rand() * 0.3).toFixed(2)}"/>`);
  }
  return (
    `<svg class="craquele" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    traces +
    `<g fill="#000" fill-opacity=".28">${trous.join("")}</g>` +
    `</svg>`
  );
}
