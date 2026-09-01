// grain-tile.mjs — génère la tuile de grain d'enduit (PNG précalculé, zéro dépendance)
// Usage : node grain-tile.mjs  →  grain-256.png + grain-256.datauri.txt
// Recette : bruit blanc seedé + 2 octaves de bruit de valeur (granulométrie de l'enduit taloché),
// encodé en niveaux de gris + alpha. L'opacité est portée par le canal alpha : la tuile se pose
// telle quelle sur n'importe quel fond (chaux OU nuit) via deux calques mix-blend-mode.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 256;          // tuile 256×256 — assez grande pour ne pas « carreler » à l'œil
const ALPHA_MAX = 26;      // ~10 % d'opacité max par grain (0–255) — le CSS n'en rajoute pas
const SEED = 1841;         // année du cadran fondateur — reproductibilité totale

// PRNG mulberry32 (seedé, déterministe)
const rng = (s => () => {
  s |= 0; s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
})(SEED);

// Bruit de valeur tuilable : grille de gradients bouclée sur SIZE
const grid = (cell) => {
  const n = SIZE / cell, g = [];
  for (let i = 0; i < n * n; i++) g.push(rng());
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = x / cell, gy = y / cell;
    const x0 = Math.floor(gx) % n, y0 = Math.floor(gy) % n;
    const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
    const fx = sm(gx % 1), fy = sm(gy % 1);
    const v = (a, b) => g[b * n + a];
    return (v(x0, y0) * (1 - fx) + v(x1, y0) * fx) * (1 - fy)
         + (v(x0, y1) * (1 - fx) + v(x1, y1) * fx) * fy;
  };
};
const oct1 = grid(8);   // gros grain — sable de l'intonaco
const oct2 = grid(32);  // nuages larges — passes de taloche

// Pixels : gris ± aléatoire, alpha = intensité du grain
const raw = Buffer.alloc(SIZE * (1 + SIZE * 2)); // filtre 0 + (gris, alpha) par pixel
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filtre "None"
  for (let x = 0; x < SIZE; x++) {
    const white = rng();                              // grain fin (80 %)
    const value = 0.8 * white + 0.15 * oct1(x, y) + 0.05 * oct2(x, y);
    // Seuil : seuls ~55 % des pixels portent un grain — un enduit n'est pas saturé de bruit.
    // Alpha quantifié sur 3 niveaux (0 / ½ / max) et pixel muet mis à zéro complet :
    // indispensable au poids (l'alpha continu + gris aléatoire triplent le PNG sans gain visuel).
    const a = Math.abs(value - 0.5) * 2;
    if (a < 0.45) { raw[p++] = 0; raw[p++] = 0; }
    else {
      raw[p++] = value > 0.5 ? 255 : 0;               // grain clair OU sombre (bi-ton, jamais gris moyen)
      raw[p++] = a > 0.72 ? ALPHA_MAX : (ALPHA_MAX >> 1);
    }
  }
}

// Encodage PNG minimal (gris+alpha, bit depth 8, color type 4)
const crcT = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc = b => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
const chunk = (type, data) => {
  const t = Buffer.from(type), len = Buffer.alloc(4), c = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 4; // 8 bits, gris + alpha
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync('grain-256.png', png);
writeFileSync('grain-256.datauri.txt', `data:image/png;base64,${png.toString('base64')}`);
console.log(`grain-256.png : ${png.length} octets (${(png.length / 1024).toFixed(1)} Ko)`);
