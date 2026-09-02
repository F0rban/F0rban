# Tesson

**Site vitrine one page — pièce de portfolio. Entreprise fictive.**

> Aucun carreau ne ressemble au suivant.

Tesson est une manufacture imaginaire de **carreaux de grès émaillés à la
main**, installée en Basse-Ville de Fribourg. L'entreprise, ses émaux, ses
chantiers et ses prix n'existent pas ; le métier (émaillage, cuisson en
réduction à 1 280 °C, tressaillage, calepinage) est réel.

**Le parti pris : pas une photo.** Les visuels du site — le mur du hero, le
carreau spécimen et sa craquelure, le nuancier, les trois réalisations, la
planche d'essai de la méthode — sont dessinés par le code. Chaque carreau
reçoit ses propres écarts de teinte, de saturation, de clarté et de reflet,
tirés d'un générateur déterministe : le site montre littéralement ce qu'il
affirme. Recolorer un mur revient à changer trois variables CSS ; les
carreaux font le reste.

## Démarrer

```bash
npm run dev          # sert le site sur http://localhost:4173
npm test             # tests du générateur de murs (node --test)
npm run build        # régénère les murs et la craquelure dans index.html
```

Aucune étape de build obligatoire : HTML, CSS et JS sont servis tels quels.
`npm run build` n'est nécessaire qu'après modification des marqueurs
`<!-- mur:… -->` ou du générateur (`tools/lib/murs.mjs`) — il est idempotent.

## Structure

```
index.html               la page (murs injectés entre marqueurs, statiques)
404.html                 page d'erreur (chemins absolus)
assets/
├── css/styles.css       design system : tokens, murs, sections, motion
├── css/fonts.css        Fraunces + Instrument Sans, auto-hébergées
├── js/main.js           cuisson du hero, lumière, Lenis, entête, nuancier, menu
├── fonts/               deux woff2 variables (sous-ensemble latin)
├── img/                 favicon, image Open Graph générée
├── textures/            tuile de grain (PNG précalculée, seed 1841)
└── vendor/              lenis.min.js (scroll lissé, version figée)
tools/
├── lib/murs.mjs         générateur : PRNG, carreaux, murs, craquelure
├── genere-murs.mjs      injecte les murs dans index.html
├── genere-og.mjs        rend assets/img/og.jpg via Chromium
├── contrast-check.mjs   preuve WCAG des couples texte/fond utilisés
├── regression.mjs       suite navigateur (Playwright) : états, a11y, débordements
├── shoot.mjs            captures desktop + mobile
└── grain-tile.mjs       régénère la tuile de grain
tests/murs.test.mjs      déterminisme et bornes du générateur
docs/                    concept et visual bible
```

## Comment un mur est fait

Un mur est un conteneur `.mur` qui porte son émail en HSL (`--gh`, `--gs`,
`--gl`) et une grille de `<i>` vides. Chaque `<i>` porte ses écarts
(`--dh`, `--ds`, `--dl`), la position de son reflet (`--hx`, `--hy`) et son
éclat (`--g`). Le CSS compose trois couches par carreau — reflet diffus,
arête éclairée, bombé de l'émail — plus une tuile de grain par mur. Les murs
sont générés une fois pour toutes dans le HTML : la page fonctionne sans
JavaScript et sans décalage de mise en page.

Le JS n'ajoute que du comportement : la cuisson du mur au chargement (les
carreaux naissent en biscuit et prennent leur émail en diagonale), la lumière
qui suit le curseur (une écriture de variable par frame, sur `:root`), la
recuisson du mur d'aperçu quand on change d'émail, l'entête qui se pose une
fois le mur passé.

## Vérifications

```bash
npm test                                   # 7 tests du générateur
node tools/contrast-check.mjs              # tous les couples passent (AA)
node tools/regression.mjs                  # site servi requis, « TOUT PASSE »
node tools/shoot.mjs http://127.0.0.1:4173 captures ""
```

## Éthique de la fiction

- Aucun faux label, aucune certification, aucun témoignage, aucune
  statistique. Les trois « murs » sont des récits plausibles, sans client
  nommé.
- Le pied de page dit que la manufacture est fictive et que les murs sont
  dessinés par le code ; la page est en `noindex` (commentaire explicatif dans
  le `<head>`), le domaine n'est pas déposé.
- Aucun formulaire : le CTA est un `mailto:` vers une adresse fictive.

## Accessibilité & performance

- Contrastes prouvés par calcul, textes semi-transparents compris,
  carreau le plus clair compris (`tools/contrast-check.mjs`).
- Navigation clavier complète : skip-link, nuancier en boutons radio natifs
  (flèches), menu mobile en `<dialog>` (Échap, retour du focus).
- `prefers-reduced-motion` : aucune transition, scroll natif, tout visible
  d'emblée — le site reste entier, il ne bouge simplement plus.
- Zéro requête tierce, zéro cookie. Deux fontes (≈150 Ko), Lenis (24 Ko),
  une tuile de grain (20 Ko). Le HTML porte les murs (≈120 Ko bruts, très
  compressibles : `gzip` le ramène à ≈22 Ko).
