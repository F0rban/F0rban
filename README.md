# Atelier Méridienne

**Site vitrine fictif — projet d'étude en design & développement web.**

> Nous peignons l'heure vraie.

Atelier Méridienne est un atelier imaginaire de **gnomonique et de fresque
murale** à Molines-en-Queyras (Hautes-Alpes) : conception, calcul, peinture
a fresco et restauration de cadrans solaires muraux. L'entreprise, ses
fondateurs et ses réalisations n'existent pas ; le Queyras, ses cadrans
peints et le métier, eux, sont réels.

**L'argument central du site : le site EST un instrument.** Le cadran de la
page d'accueil est un vrai cadran vertical déclinant, calculé dans le
navigateur par un moteur gnomonique maison (équations Meeus/NOAA, géométrie
vectorielle du cadran déclinant, 27 tests automatisés). L'ombre dorée que
vous voyez est à sa vraie place pour l'instant, le lieu et le mur. Les cinq
planches de la page Créations sont dessinées par le même moteur : les heures
annoncées dans les textes et les heures tracées coïncident par construction.

## Démarrer

```bash
npm run dev        # sert le site sur http://localhost:4173
npm test           # 27 tests du moteur gnomonique (node --test)
```

Aucune étape de build : le site est du HTML/CSS/JS statique servi tel quel.
Les seules dépendances runtime (GSAP, ScrollTrigger, Lenis) sont vendorisées
dans `assets/vendor/`, les fontes (Fraunces variable, Spline Sans Mono) sont
auto-hébergées dans `assets/fonts/`.

## Structure

```
/                        pages (répertoires-slug : /savoir-faire/, /creations/…)
├── assets/
│   ├── css/             fonts.css (auto-hébergement) + styles.css (design system)
│   ├── js/              gnomonique.js (moteur), main.js, cadran.js, simulateur.js
│   ├── vendor/          gsap, ScrollTrigger, lenis (minifiés, versions figées)
│   ├── fonts/           woff2 variables auto-hébergés
│   ├── img/generated/   SVG générés par le moteur (cadran héros, 5 planches)
│   ├── textures/        grain d'enduit (tuile PNG précalculée, seed 1841)
│   └── og/              images Open Graph 1200×630 (générées)
├── docs/                specs : concept, visual bible, SEO, moteur gnomonique
├── tests/               tests du moteur (node:test)
└── tools/               générateurs & outillage (voir ci-dessous)
```

## Outillage (`tools/`)

| Script | Rôle |
|---|---|
| `genere-svg.mjs` | dessine le cadran héros, les 5 planches et l'analemme du footer **avec le moteur** ; vérifie que les heures tracées correspondent aux specs des textes |
| `injecte-svg.mjs` | injecte les SVG générés dans les pages (marqueurs `<!-- svg:nom -->`), idempotent |
| `typographie.mjs` | micro-typographie française (insécables, apostrophes) appliquée par script, idempotent |
| `genere-og.mjs` | rend les images OG via Chromium (site servi en local requis) |
| `contrast-check.mjs` | preuve WCAG de la palette (tous les couples autorisés) |
| `grain-tile.mjs` | régénère la tuile de grain d'enduit (reproductible, seed 1841) |
| `derive-calc.mjs` | le calcul du récit fondateur : 4° d'erreur → dérive de 6,4 à 16,2 min |
| `shoot.mjs` | captures d'écran desktop + mobile de toutes les pages |

Chaîne de régénération après modification du moteur ou des planches :

```bash
node tools/genere-svg.mjs && node tools/injecte-svg.mjs && node tools/typographie.mjs
```

## Documentation

- `docs/brand/concept.md` — le concept lock (positionnement, ton, éthique de la fiction)
- `docs/brand/visual-bible.md` — palette prouvée WCAG, typographie, espace, motion, style SVG
- `docs/brand/prompts-images.md` — kit de prompts IA (Midjourney/Flux) pour une éventuelle production photo, aligné sur la DA
- `docs/gnomonique-spec.md` — les équations, conventions de signes, sources
- `docs/seo.md` — stratégie, balisage, JSON-LD, stratégie noindex
- `docs/architecture.md` — décisions techniques et guide contributeur

## Éthique de la fiction

- Aucun faux label, aucune certification, aucune statistique inventée,
  aucun témoignage nommé.
- Mention « Site fictif — projet d'étude » dans le footer et sur la page
  Contact ; page `/mentions/` dédiée.
- `meta robots noindex` sur toutes les pages (commentaire explicatif dans
  chaque `<head>`) : un faux artisan ne doit pas polluer les résultats
  locaux du vrai Queyras. Le dispositif de retrait est documenté.
- Le numéro de téléphone utilise la tranche 04 65 71 réservée par l'ARCEP
  aux œuvres de fiction.
- Le formulaire de contact n'envoie rien : aucune donnée ne quitte le
  navigateur (et la page le dit).

## Accessibilité & performance

- Palette validée par calcul (WCAG 2.1 AA) — voir `tools/contrast-check.mjs`
  et `docs/brand/visual-bible.md` §1.
- `prefers-reduced-motion` : scroll natif, ombres figées à 15 h solaires,
  les instruments restent fonctionnels.
- Zéro requête tierce, zéro cookie, zéro traceur. SVG héros inline rendu
  sans JavaScript (le JS ne fait qu'orienter l'ombre à l'heure réelle).
- Fontes préchargées avec `font-display: swap` ; grain servi en fichier
  (jamais de feTurbulence live) ; animations en transform/clip-path
  uniquement, une écriture de variable par frame.
