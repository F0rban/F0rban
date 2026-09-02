# Visual bible — Tesson

Principe : **la page est un mur.** Ce qui est clair est du biscuit (terre non
émaillée), ce qui est coloré est de l'émail, ce qui sépare est un joint. Aucune
ombre portée, aucun dégradé décoratif : les seuls dégradés sont ceux de l'émail
et ils ont une raison physique (bombé, reflet, arête).

## 1. Palette

| Token | Valeur | Rôle |
|---|---|---|
| `--biscuit` | `#EFE8DB` | fond des sections claires |
| `--biscuit-2` | `#E5DCCB` | section Émaux, voile « cru » des carreaux |
| `--lait` | `#F7F2E8` | texte sur émail et sur tenmoku, bouton clair |
| `--joint` | `#C9BDA8` | filets et joints sur fond clair |
| `--joint-sombre` | `#120E0B` | joints des murs émaillés |
| `--encre` | `#1B1411` | texte courant, bouton sombre, fond tenmoku |
| `--encre-2` | `#5E564C` | texte secondaire sur biscuit (5,9:1) |
| `--lait-2` | `#B9B0A4` | texte secondaire sur tenmoku (8,5:1) |

Émaux (HSL, posés sur les conteneurs) : Vert Gottéron `176 62% 17%` (signature),
Céladon `152 20% 60%`, Lait `40 36% 91%`, Ocre brûlé `22 66% 39%`, Bleu Sarine
`222 56% 33%`, Engobe rose `14 44% 71%`, Cendre `56 6% 54%`, Tenmoku `18 32% 9%`.

Règle : **le texte ne se pose que sur le biscuit, le tenmoku ou le Vert
Gottéron.** Les autres émaux sont de la matière, jamais un fond de lecture.
Preuve : `node tools/contrast-check.mjs` (tous les couples ≥ 4,5:1, testés sur
le carreau le plus clair possible).

## 2. Typographie

- **Fraunces** (variable) — le verbe. Display `wght 460, opsz 144, SOFT 100`
  (SOFT à 100 : les empattements s'arrondissent comme un émail arrondit une
  arête). Titres `wght 440, opsz 96`. Noms d'émaux `opsz 72`, l'émail choisi
  passe `WONK 1`.
- **Instrument Sans** (variable) — le courant, la navigation, les
  spécifications (`tabular-nums`). Eyebrows en capitales espacées `.16em`.
- Échelle fluide : display `clamp(3.2rem, 0.9rem + 8.3vw, 10.5rem)`, titre
  `clamp(2.1rem, 1.25rem + 3.4vw, 4.6rem)`, courant 17–19 px, petit 15 px,
  label 12 px.

## 3. Le carreau

Trois couches CSS par carreau, toutes physiques :
1. reflet diffus d'une source en haut à gauche — position (`--hx`, `--hy`) et
   éclat (`--g`) propres à chaque carreau, décalés par la lumière globale
   (`--lx`, `--ly`, écrits par le curseur) ;
2. arête supérieure qui prend la lumière rasante (dégradé linéaire de 18 %) ;
3. bombé : plus clair au centre, plus dense et plus saturé sur les bords, plus
   un liseré interne clair/sombre (`box-shadow: inset`).

Plus une tuile de grain (PNG 256 px, `soft-light`) par mur, jamais par carreau.
Écarts par carreau : teinte ±3,5°, saturation ±4 %, clarté ±3,5 % ; 8 % de
« fonds de four » à écart double. Rayon 1,5 px. Joint 2–4 px.

## 4. Espace et rythme

Conteneur 1400 px, marges `clamp(1.25rem, 4vw, 4.5rem)`, grille 12 colonnes.
Sections `clamp(6rem, 13vw, 12rem)`. Rythme des fonds : émail → biscuit →
biscuit-2 → tenmoku → biscuit → émail → tenmoku. Chaque section a un seul
visuel fort ; le texte ne dépasse pas 60 caractères de mesure.

## 5. Composants

- **Bouton** : un carreau plein (radius 2 px), flèche qui glisse de 4 px au
  survol, fond qui passe au Vert Gottéron. Jamais d'ombre.
- **Entête** : transparente sur le mur (texte lait, sans CTA), se pose sur le
  biscuit une fois le hero passé (flou, filet joint, CTA qui apparaît), passe
  en tenmoku sur les sections sombres.
- **Nuancier** : liste typographique de boutons radio natifs ; le nom de
  l'émail est le bouton. L'émail choisi : pastille à l'échelle, nom décalé,
  filet à droite.
- **Fiche** : liste de définitions à deux colonnes, filets joint.
- **Étapes** : quatre colonnes sur un joint, chacune illustrée par un état de
  la matière (nuancier, carreau trempé aux deux tiers, carreau cuit, carreaux
  posés à joint clair).

## 6. Motion

Doctrine : **rien ne bondit, tout cuit ou glisse.** Easing
`cubic-bezier(.65,0,.35,1)`, micro-interactions `cubic-bezier(.33,1,.68,1)`.

- Chargement : les carreaux du hero naissent en biscuit et prennent leur émail
  en diagonale (26 ms par rang, 1 100 ms chacun) ; les trois lignes du titre
  montent dans leur masque (500/620/740 ms) ; le pied de hero suit en fondu.
- Curseur : reflets décalés de ±7 % et lampe douce (`screen`) sur le mur —
  pointeur fin seulement, une écriture par frame.
- Scroll : Lenis (`lerp .1`), parallaxe du mur du hero à 0,28, reveals de
  22 px en 800 ms, une seule fois.
- Nuancier : recuisson — 240 ms de biscuit, puis le nouvel émail en diagonale
  (45 ms par rang).
- `prefers-reduced-motion` : tout est visible d'emblée, scroll natif, lampe et
  parallaxe désactivées. Le site ne perd rien, il ne bouge plus.
