# VISUAL BIBLE — Atelier Méridienne
*Directeur artistique — document d'exécution. Conforme au concept lock. Tout écart se discute avec le DC avant code.*

Principe directeur : **le site est un mur de chaux au soleil.** Tout ce qui est clair est enduit, tout ce qui est sombre est peint, tout ce qui est doré est éclairé. L'interface ne « design » rien : elle trace, elle peint, elle laisse l'ombre tourner.

---

## 1. Fondations — palette validée WCAG

### 1.1 Méthode de validation
Ratios calculés avec la formule de luminance relative WCAG 2.1 (sRGB linéarisé, L = 0.2126R + 0.7152G + 0.0722B, ratio = (L1+0.05)/(L2+0.05)). Script : `contrast-check.mjs` (dans ce dossier), exécuté sous Node 22. **Résultats bruts collés en 1.4.** Seuils : 4,5:1 texte courant ; 3,0:1 texte ≥ 24 px (ou 18,66 px gras) et composants UI (bordures d'input, pictos porteurs de sens).

### 1.2 Tokens — thème jour (défaut)

| Token | Valeur | Rôle | Contraste vérifié |
|---|---|---|---|
| `--chaux` | `#F5F0E6` | Fond principal (l'enduit) | — |
| `--chaux-creuse` | `#EDE6D6` | Surface secondaire : cartes-planches, fonds de tableaux, code | — |
| `--bistre` | `#1C1A17` | Texte courant, titres, footer/fond nocturne de sections | 15,28:1 sur chaux · 13,96:1 sur chaux-creuse |
| `--ocre-lumiere` | `#C8951F` | **DÉCORATIF SEULEMENT** : traits de soleil, ombres SVG, aplats, marqueurs | 2,37:1 — jamais du texte, jamais un picto porteur de sens seul |
| `--ocre-encre` | **`#715208`** ← **valeur finale tranchée** | CTA, liens, `dfn`, chiffres romains interactifs | **6,34:1** sur chaux · 5,79:1 sur chaux-creuse · texte chaux sur aplat ocre-encre : 6,34:1 |
| `--sang` | `#A63D2F` | Chiffres peints, accents, erreurs de formulaire | 5,55:1 sur chaux · 5,07:1 sur chaux-creuse → **AA en texte tel quel, aucune déclinaison foncée nécessaire** |
| `--sang-encre` | `#8F3325` | Réserve (6,92:1) : uniquement si un futur fond intermédiaire fait passer `--sang` sous 4,5 | 6,92:1 |
| `--bleu-charrette` | `#35566B` | Filets, frises, liens secondaires, légendes bleues | 6,86:1 sur chaux · 6,26:1 sur chaux-creuse → **AA texte tel quel, pas de déclinaison** |
| `--gris-ombre` | `#7A756B` | **Décoratif seulement** (hachures, graduations mortes) — **échec confirmé : 4,03:1** | jamais de texte |
| `--encre-seconde` | `#5C5648` | Textes secondaires, légendes, placeholders | 6,42:1 sur chaux · 5,86:1 sur chaux-creuse |

Choix de `--ocre-encre` : `#715208` plutôt que `#8A6410` (4,72:1, marge trop faible — un enduit texturé sous le texte grignote le contraste réel) et plutôt que `#6B4E07` (6,80:1 mais tire vers l'olive). `#715208` garde le doré, marge confortable, et l'aplat CTA passe dans les deux sens.

**Règle des deux accents (lock)** : par écran, jamais plus de deux parmi {ocre, sang, bleu}. L'ocre = ce qui reçoit la lumière ; le sang = ce qui est peint ; le bleu = ce qui est tracé.

### 1.3 Tokens — thème nuit

| Token | Valeur | Rôle | Contraste vérifié (fond `--nuit`) |
|---|---|---|---|
| `--nuit` | `#14161A` | Fond | — |
| `--nuit-elevee` | `#1C1F25` | Cartes, surfaces | chaux dessus : 14,53:1 |
| texte courant | `#F5F0E6` (chaux) | | 15,94:1 |
| `--ocre-desat` | `#B08A3E` | Décoratif nuit (traits, ombres) | (5,65:1 — passerait, mais reste décoratif par cohérence) |
| `--ocre-nuit` | `#D4AF5E` | CTA/liens nuit | **8,70:1** · 7,93:1 sur nuit-élevée |
| `--sang-nuit` | `#DC7B66` | Accents peints nuit | 6,09:1 · 5,55:1 sur nuit-élevée |
| `--bleu-nuit` | `#8FB0C4` | Liens secondaires nuit | 7,91:1 · 7,21:1 sur nuit-élevée |
| `--bleu-nuit-filet` | `#4A7086` | Filets/bordures UI nuit (`#35566B` échoue à 2,32:1) | 3,40:1 ≥ 3,0 UI |
| `--encre-seconde-nuit` | `#B5AE9F` | Textes secondaires nuit | 8,21:1 · 7,48:1 sur nuit-élevée |

Le thème nuit sert : les sections nocturnes (bascule « voir le ciel de cette nuit »), le footer, et `prefers-color-scheme: dark` si le site l'honore (décision DC : oui pour le footer et le hero nocturne, non pour le reste — le site EST un mur de chaux, on ne repeint pas la façade la nuit).

### 1.4 Sortie du script (preuve, `node contrast-check.mjs`)

```
— JOUR (fond chaux #F5F0E6) —
PASS  15.28:1  (min 4.5)  bistre / chaux (texte courant)  #1C1A17 sur #F5F0E6
PASS  4.72:1   (min 4.5)  candidat ocre-encre #8A6410
PASS  5.72:1   (min 4.5)  candidat ocre-encre #7A5808
PASS  6.80:1   (min 4.5)  candidat ocre-encre #6B4E07
PASS  6.34:1   (min 4.5)  candidat ocre-encre #715208   ← RETENU
PASS  5.55:1   (min 4.5)  sang #A63D2F (texte)
PASS  6.92:1   (min 4.5)  sang-encre réserve #8F3325
PASS  6.86:1   (min 4.5)  bleu-charrette #35566B (texte)
FAIL  4.03:1   (min 4.5)  gris-ombre #7A756B → décoratif confirmé
PASS  6.42:1   (min 4.5)  texte secondaire #5C5648
FAIL  2.37:1   (min 4.5)  ocre-lumiere #C8951F → décoratif confirmé
— CTA plein —
PASS  6.34:1  chaux sur ocre-encre #715208 · PASS 15.28:1 chaux sur bistre
PASS  6.42:1  bistre sur ocre-lumiere #C8951F (badge « heure vraie » du hero)
— NUIT (fond #14161A) —
PASS  15.94:1 chaux · PASS 8.70:1 ocre-nuit #D4AF5E · PASS 6.09:1 sang-nuit #DC7B66
PASS  7.91:1  bleu-nuit #8FB0C4 · PASS 8.21:1 secondaire nuit #B5AE9F
FAIL  2.32:1  bleu-charrette #35566B en filet nuit → remplacé par #4A7086 (PASS 3.40:1 UI)
— Surfaces secondaires (chaux-creuse #EDE6D6 / nuit-élevée #1C1F25) —
PASS 13.96 bistre · PASS 5.79 ocre-encre · PASS 5.07 sang · PASS 6.26 bleu-charrette
PASS 5.86 encre-seconde · PASS 14.53 chaux · PASS 7.93 ocre-nuit · PASS 5.55 sang-nuit
PASS 7.21 bleu-nuit · PASS 7.48 secondaire-nuit
```

Tout couple non listé ici est **interdit** sans repasser par le script.

---

## 2. Typographie

Fraunces variable (le verbe, la fresque) + Spline Sans Mono (le chiffré, le relevé). Le contraste signature devise/relevé se joue à chaque page.

### 2.1 Échelle fluide (clamp, racine 16 px, viewport 360→1440)

```css
:root {
  --t-display:  clamp(2.75rem, 1.29rem + 6.48vw, 7.125rem);  /* 44→114px  h1 monumental */
  --t-titre:    clamp(2rem,    1.33rem + 2.96vw, 4rem);       /* 32→64px   h2 */
  --t-soustitre:clamp(1.5rem,  1.25rem + 1.11vw, 2.25rem);    /* 24→36px   h3 */
  --t-devise:   clamp(1.375rem,1.17rem + 0.93vw, 2rem);       /* 22→32px   devises peintes */
  --t-courant:  clamp(1.0625rem,1.04rem + 0.12vw, 1.145rem);  /* 17→18.3px corps */
  --t-petit:    0.9375rem;                                    /* 15px      légendes — fixe */
  --t-mono-data:clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem); /* 14→15px   données mono */
  --t-mono-label: 0.75rem;                                    /* 12px      labels mono — fixe */
}
```

Rapport d'échelle ≈ 1,333 (quarte juste) en desktop, resserré en mobile par les clamps. Les deux tailles mono du bas ne fluidifient presque pas : un relevé se lit à taille d'instrument.

### 2.2 Styles nommés (les seuls autorisés — pas de style orphelin)

| Style | Fonte & réglages | Casse / interlettrage | Usage |
|---|---|---|---|
| **display** | Fraunces `wght 560, opsz 144, SOFT 0, WONK 1` | Bas de casse à l'initiale près, `letter-spacing: -0.015em`, `line-height: 0.98` | h1 de page, un par page. WONK on : les caractères penchés = l'ombre qui n'est jamais droite |
| **titre** | Fraunces `wght 540, opsz 72, SOFT 0, WONK 0` | `-0.01em`, lh 1.05 | h2 de section |
| **devise** | Fraunces italique `wght 480, opsz 40, SOFT 50, WONK 0` | Bas de casse, `0`, lh 1.25 | Devises de cadrans, exergues. SOFT 50 : l'italique adouci = le pinceau, pas la plume |
| **courant** | Fraunces `wght 400, opsz 14, SOFT 0, WONK 0` | lh 1.6, `letter-spacing: 0.002em` | Corps de texte. Mesure : voir §3 |
| **romain** | Fraunces `font-variant-caps: all-small-caps`, `font-variant-numeric: normal` + `font-feature-settings "c2sc"` si utile | `letter-spacing: 0.08em` | Chiffres romains d'heures (Ⅶ…Ⅴ en capitales latines VII…V, petites caps) |
| **mono-label** | Spline Sans Mono `wght 500` | **CAPITALES**, `letter-spacing: 0.14em` | Labels d'interface, eyebrows, mentions (« COURSE SIMULÉE — SOLSTICE D'ÉTÉ »), th de tableaux |
| **mono-data** | Spline Sans Mono `wght 400`, `font-variant-numeric: tabular-nums` | Casse mixte, `0.01em` | Coordonnées, azimuts, prix, heures, specs. Tabular-nums obligatoire : les chiffres s'alignent comme sur une planche |

Règles : jamais de gras Fraunces > 600 (ça bouche à l'impression comme sur écran). Jamais d'italique en mono. `opsz` toujours explicite (`font-optical-sizing: none` + valeur), sinon le navigateur interpole au hasard des clamps. Chargement : deux fichiers variables woff2 self-hébergés, `font-display: swap`, fallback `Georgia, serif` et `ui-monospace, monospace` avec `size-adjust` mesuré au dev.

---

## 3. Espace

- **Grille** : 12 colonnes, gouttière `clamp(16px, 2.5vw, 32px)`, conteneur max **1200 px** + marges `clamp(20px, 5vw, 72px)`. Le contenu texte ne s'étale jamais : il occupe des colonnes précises (courant : 6–7 col desktop ; planches : 5+7 ou 7+5, jamais centré-flottant).
- **Mesure** : courant `max-width: 62ch` ; devise 38ch ; légendes mono 48ch.
- **Rythme vertical** : unité de base **8 px**. Espacements nommés : `--esp-1: 8px`, `--esp-2: 16px`, `--esp-3: 24px`, `--esp-4: 40px`, `--esp-5: 64px`, `--esp-6: 104px`, `--esp-7: clamp(112px, 16vh, 168px)` (entre sections). Suite ~Fibonacci : le rythme respire sans être mécanique.
- **Breakpoints** : 640 / 900 / 1200. Trois seulement. En dessous de 640 : une colonne, planches SVG pleine largeur, tableaux en scroll horizontal interne (`overflow-x: auto`).
- **Radius : 0 partout. TRANCHÉ.** Un cadran est tracé à la règle sur un mur ; rien n'est arrondi dans l'atelier sauf ce qui est un cercle entier (rosaces, points de gnomon, pastilles d'heures : `border-radius: 50%` autorisé pour les cercles parfaits uniquement). Aucune valeur intermédiaire, jamais.
- **Filets** : trois épaisseurs. `--filet-fin: 1px` (séparateurs, tableaux, hachures) ; `--filet-trace: 1.5px` (traits SVG principaux, bordures de cartes) ; `--filet-peint: 3px` (soulignés actifs, barre du CTA, frise sang). Couleur par défaut `--bleu-charrette` (jour) / `--bleu-nuit-filet` (nuit). Un filet horizontal pleine largeur sépare chaque section : c'est la ligne d'horizon du document.

---

## 4. Le système d'ombre solaire — `--sun-angle`

**Sémantique** : angle horaire apparent de l'ombre sur un mur vertical, en degrés. `0deg` = ombre verticale du midi vrai. Négatif = matin (ombre penchée à l'ouest du gnomon), positif = après-midi.

- **Plage** : `-52deg → +52deg` (course plausible d'un déclinant sud aux latitudes du Queyras au solstice d'été, cohérente avec l'étiquette « course simulée — solstice d'été »). Le hero seul est piloté par l'heure réelle via `gnomonique.js`, hors scroll.
- **Mapping scroll** : linéaire sur la hauteur de page, `--sun-angle = -52 + 104 × progression`, progression = scroll lissé par Lenis (lerp 0.09–0.1) via un seul `ScrollTrigger` global (scrub) qui écrit la variable sur `:root` avec `gsap.quickSetter`. **Une seule écriture par frame**, jamais un ScrollTrigger par élément. En haut de page il est matin, au footer le soleil se couche : le scroll EST la journée.
- **Éléments pivotants — 5–6 MAX par page, inventaire obligatoire en tête de fichier CSS de chaque page** (commentaire `/* PIVOTS: … */`). Candidats types : (1) l'ombre du style du cadran héros, (2) l'ombre portée du titre display (pseudo-élément), (3) une ombre de filet long, (4) l'ombre de la carte-planche active, (5) un gnomon décoratif de marge. Tout le reste est **statique**.
- **Technique — uniquement des transforms** :
  - SVG : le trait d'ombre est un `<line>`/`<path>` dans le SVG, `transform: rotate(var(--sun-angle))`, `transform-origin` **au pied du gnomon** (point d'ancrage visible, coordonnées explicites, `transform-box: fill-box` si besoin).
  - HTML : pseudo-élément `::after` peint en `--ocre-lumiere` (jour) à opacité 0.35, `transform: skewX(calc(var(--sun-angle) * -0.55)) scaleY(…)`, `transform-origin: bottom left` (le pied de l'élément = le mur).
  - `will-change: transform` sur ces 5–6 éléments seulement.
- **INTERDITS (lock)** : box-shadow animé, filter/drop-shadow animé, feTurbulence live, toute écriture de `--sun-angle` sur un élément non inventorié.
- **Reduced motion** : `--sun-angle` figé à **+31deg** (≈ 15 h solaires, ombre expressive), aucune liaison au scroll.
- **Étiquette** : toute zone où l'ombre est scroll-pilotée porte la mention mono-label « COURSE SIMULÉE — SOLSTICE D'ÉTÉ », persistante, jamais en tooltip seul.

---

## 5. Style d'illustration SVG « planche gnomonique »

L'objectif : cinq cadrans fictifs différents, une seule main. La main est celle d'un géomètre qui a appris à peindre — la construction reste visible sous le décor.

### 5.1 Règles de la main (toutes obligatoires)

1. **Traits** : trois épaisseurs seulement, alignées sur les filets — construction `0.75` (`--gris-ombre`, lignes d'épure, cercles de report), tracé `1.5` (`--bleu-charrette`, lignes horaires, cadre), peint `3` (`--sang` ou `--ocre-lumiere`, contours de décor). `vector-effect: non-scaling-stroke` partout : la planche se redimensionne, la main non.
2. **Terminaisons** : `stroke-linecap="butt"` pour toute ligne de construction et ligne horaire (un trait tiré à la règle s'arrête net) ; `round` uniquement pour les tracés « peints ». `stroke-linejoin="miter"` par défaut.
3. **Lignes de construction apparentes** : chaque planche garde au moins un cercle de report et deux droites d'épure en pointillé `stroke-dasharray="2 5"` — la preuve du calcul reste sous la peinture.
4. **Hachures** : ombres et matières en hachures parallèles à **45°, pas de 6 px**, trait 0.75, via `<pattern>` réutilisé (`id="hachure45"`). Jamais de dégradé SVG. Une variante croisée (`hachure45 + 135°`) pour les ombres profondes, c'est tout.
5. **Aplats granuleux** : les aplats (`--ocre-lumiere`, `--sang` à 12–18 % d'opacité) sont recouverts par la tuile de grain de la page (le PNG en fond de page suffit — **aucun filtre SVG**). Si un aplat doit granuler seul : `fill` + le même `<pattern>` de points espacés (pas de turbulence).
6. **Oiseaux queyrassins** : silhouette de chocard à 3 traits maximum (aile-corps-aile), trait « peint » 3, `--bistre`, toujours par paire ou trio, jamais plus, jamais centrés. Ce sont des signatures de marge, pas des illustrations.
7. **Frises** : bandeau haut ou bas, motif répété par `<pattern>` ou `<use>` : dents-de-loup (triangles), damier deux tons, ou vague simple. Deux couleurs max, dont jamais plus d'un accent.
8. **Rosaces** : construites au compas visible — pétales = arcs de cercles de report, nombre pair (6 ou 8), centre = pastille pleine `--sang` r=3. La rosace marque le pied du style (le transform-origin de l'ombre, §4).
9. **Chiffres romains** : en `<text>` Fraunces petites capitales (style **romain**, §2.2), jamais vectorisés (accessibilité + poids), posés perpendiculairement à leur ligne horaire ou à plat — un seul choix par planche.
10. **Devise** : chaque planche porte SA devise en style **devise** (Fraunces italique), dans un cartouche rectangulaire filet 1.5 — jamais en arc de cercle (trop « logo »).
11. **Marges de planche** : cadre double (filet 1.5 + filet 0.75 espacés de 6 px), cartouche mono-data en bas à droite : n° de planche, coordonnées, déclinaison du mur fictif. Fond `--chaux-creuse`.
12. **Interdits** : dégradés, ombres portées SVG (`filter`), plus de deux accents, toute perspective — la planche est frontale, orthogonale, comme un relevé.

### 5.2 Vocabulaire — extrait de code canonique

```svg
<svg viewBox="0 0 480 360" role="img" aria-labelledby="p1t" fill="none">
  <title id="p1t">Planche I — cadran déclinant sud-ouest, ferme fictive</title>
  <defs>
    <pattern id="hachure45" width="6" height="6" patternUnits="userSpaceOnUse"
             patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#7A756B" stroke-width="0.75"/>
    </pattern>
  </defs>
  <!-- cadre double de planche -->
  <rect x="10" y="10" width="460" height="340" stroke="#35566B" stroke-width="1.5"/>
  <rect x="16" y="16" width="448" height="328" stroke="#7A756B" stroke-width="0.75"/>
  <!-- épure : cercle de report + droites de construction (la preuve du calcul) -->
  <circle cx="240" cy="96" r="150" stroke="#7A756B" stroke-width="0.75"
          stroke-dasharray="2 5"/>
  <line x1="90" y1="96" x2="390" y2="96" stroke="#7A756B" stroke-width="0.75"
        stroke-dasharray="2 5"/>
  <!-- lignes horaires : trait tiré à la règle, butt -->
  <g stroke="#35566B" stroke-width="1.5" stroke-linecap="butt">
    <line x1="240" y1="96" x2="120" y2="300"/>
    <line x1="240" y1="96" x2="240" y2="310"/>
    <line x1="240" y1="96" x2="360" y2="300"/>
  </g>
  <!-- ombre du style : SEUL élément pivotant, origine au pied du gnomon -->
  <line x1="240" y1="96" x2="240" y2="264" stroke="#C8951F" stroke-width="3"
        stroke-linecap="round" opacity="0.8"
        style="transform:rotate(var(--sun-angle)); transform-origin:240px 96px"/>
  <!-- rosace au pied du style : arcs au compas, centre sang -->
  <g stroke="#A63D2F" stroke-width="1.5">
    <path d="M240 84a12 12 0 0 1 0 24a12 12 0 0 1 0-24" fill="url(#hachure45)"/>
    <circle cx="240" cy="96" r="3" fill="#A63D2F" stroke="none"/>
  </g>
  <!-- chocards : signature de marge, 3 traits, jamais centrés -->
  <path d="M64 52q8-7 14 0q6-7 14 0" stroke="#1C1A17" stroke-width="3"
        stroke-linecap="round"/>
  <text x="240" y="332" text-anchor="middle" font-family="Fraunces"
        font-size="17" font-style="italic" fill="#1C1A17">Je ne compte que les heures sereines</text>
</svg>
```

Toute nouvelle planche recombine CE vocabulaire (patterns, épaisseurs, rosace, cartouche) — on n'invente pas de nouveau trait sans l'ajouter ici d'abord.

---

## 6. Texture

### 6.1 Grain d'enduit — tuile PNG précalculée

Script : **`grain-tile.mjs`** (dans ce dossier, zéro dépendance, exécuté et validé). Recette verrouillée :

- Tuile **256×256**, PNG gris+alpha, seed **1841** (reproductible).
- Bruit : 80 % bruit blanc (grain fin de sable) + 15 % bruit de valeur cellule 8 px (granulométrie intonaco) + 5 % cellule 32 px (passes de taloche), **tuilable** (grilles bouclées).
- Grain **bi-ton** (pixel blanc pur OU noir pur, jamais gris moyen — un grain d'enduit accroche la lumière ou la retient), seuil : ~55 % de pixels muets.
- **Opacité portée par l'alpha du PNG** (max ≈ 10 %, 3 niveaux quantifiés) → le CSS pose la tuile à `opacity: 1` sans réglage, identique sur chaux et sur nuit.
- Poids obtenu : **20,3 Ko**. Livraison en **fichier** `/assets/textures/grain-256.png` + `<link rel="preload" as="image">` — pas en data-URI (20 Ko bloqueraient le parse CSS).

```css
.grain::after {            /* calque unique, pleine page, au-dessus de tout, inerte */
  content: ""; position: fixed; inset: 0; z-index: 999;
  pointer-events: none;
  background: url(/assets/textures/grain-256.png) repeat 0 0 / 256px 256px;
}
```
Jamais animé, jamais dupliqué par section. Un seul calque fixe pour toute la page.

### 6.2 Chaux en CSS — nuages de taloche (dégradés superposés)

Sous le grain, la profondeur de l'enduit vient de 3 radial-gradients très larges, quasi invisibles isolément :

```css
body {
  background-color: var(--chaux);
  background-image:
    radial-gradient(120% 90% at 15% 8%,  rgba(200,149,31,0.05), transparent 60%),
    radial-gradient(140% 100% at 85% 30%, rgba(122,117,107,0.06), transparent 55%),
    radial-gradient(100% 120% at 50% 100%, rgba(53,86,107,0.04), transparent 65%);
  background-attachment: fixed; /* retirer si jank mobile mesuré : scroll par défaut < 900px */
}
```
Nuit : mêmes formes, teintes `rgba(176,138,62,0.05)` / `rgba(20,22,26,…)` inversées. Cartes `--chaux-creuse` : un seul gradient (le premier), jamais les trois — la carte est un panneau plus lisse que le mur.

---

## 7. Composants

- **Bouton CTA (primaire)** — « Demander une étude — à partir de 900 € » : aplat `--ocre-encre`, texte `--chaux` (6,34:1), style mono-label, padding `14px 28px`, radius 0, barre `--filet-peint` en pied qui est le **socle du gnomon** : au hover un trait d'ombre pseudo-élément pivote légèrement (`transform`, 200 ms) — le seul bouton du site qui possède une ombre. Focus : `outline: 2px solid var(--bleu-charrette); outline-offset: 3px`. Secondaire : fantôme, filet 1.5 `--bistre`, texte `--bistre`, hover = fond `--chaux-creuse`.
- **Liens** : courant → `--ocre-encre` souligné (`text-underline-offset: 3px`, `text-decoration-thickness: 1px`, hover 3px — le trait « se peint »). Secondaires/nav → `--bleu-charrette`. Jamais de lien non souligné dans le corps de texte. Visited : identique (site vitrine).
- **Cartes-planches** (Créations) : fond `--chaux-creuse`, cadre double §5.1-11, zéro radius, zéro box-shadow — le relief vient d'un décalage du cadre externe de 4px (deux rects SVG ou bordure + outline). Contenu : planche SVG, devise, specs mono-data. Hover : le cadre externe glisse de 2px (transform, 200 ms), l'ombre du style de LA carte survolée s'anime si elle fait partie des pivots inventoriés.
- **Tableaux de specs** (mono) : `border-collapse: collapse`, filets fins horizontaux seulement, th mono-label + `border-bottom: var(--filet-trace)`, td mono-data tabular-nums, chiffres alignés à droite, `<caption>` en style courant. Mobile : conteneur `overflow-x: auto` + `tabindex="0"` + `role="region"` + aria-label.
- **Formulaires** (Contact) : labels mono-label TOUJOURS visibles au-dessus (jamais placeholder-seul), inputs fond `--chaux` bordure 1.5 `--bleu-charrette` (6,86:1 > 3:1 UI), radius 0, focus bordure `--ocre-encre` + outline standard, placeholders `--encre-seconde`. Erreurs : texte `--sang` (5,55:1) + filet 3px sang + `aria-describedby` + icône ≠ couleur seule. Fieldsets à filet fin pour « type de projet / mur / localisation ».
- **Header** : barre fine, logo-mot Fraunces + coordonnées de Molines en mono-data (« 44°41′N 6°51′E — 1 750 m »), nav mono-label, lien actif souligné `--filet-peint` ocre. Sticky, fond chaux à 92 % + `backdrop-filter: none` (perf) — le grain fixe passe dessus. CTA persistant à droite. Mobile : `<dialog>` plein écran chaux, nav en display.
- **Footer** : mur nocturne — fond `--nuit`, tokens nuit §1.3, analemme SVG décorative, mention « Site fictif — projet d'étude » en mono-label `--encre-seconde-nuit` (8,21:1 — discrète par la taille 12px, jamais par le contraste).
- **Glossaire inline** : `<dfn tabindex="0">` (ou `<button>` stylé texte), souligné pointillé 1px `--ocre-encre`, curseur `help`. Tooltip : `role="tooltip"` + `aria-describedby`, ouvert au hover ET au focus, fermé à Échap, jamais tronqué au viewport ; panneau fond `--bistre` texte `--chaux` (15,28:1), cadre filet fin, radius 0, flèche = petit gnomon triangulaire. Contenu : terme en mono-label + glose en courant, 32ch max. Sur écran tactile : clic = toggle.

---

## 8. Motion

Doctrine (lock) : **rien ne bondit — tout pivote ou glisse comme une ombre.** Aucun overshoot, aucun bounce, aucune élasticité. Lenis lerp 0.09–0.1.

### 8.1 Table des durées / easings

| Type d'élément | Durée | Easing | Notes |
|---|---|---|---|
| Reveal majeur (sections, planches) | 700–1000 ms | `cubic-bezier(0.65,0,0.35,1)` | clip-path oblique : l'ombre se retire (polygone incliné ~ -14°, cohérent avec `--sun-angle` courant si trivial, sinon fixe) |
| Reveal de texte (titres, devises) | 850 ms | idem | clip-path oblique, décalage 60 ms/ligne, max 4 lignes séquencées |
| Ombres pivotantes (§4) | scrub continu | lissage Lenis seul | jamais de tween propre : elles suivent la variable |
| Micro-interactions (hover, focus, liens) | 180–240 ms | `cubic-bezier(0.33,1,0.68,1)` | soulignés, cadres de cartes, ombre du CTA |
| Tooltip glossaire | 160 ms ouverture / 120 ms fermeture | idem micro | fondu + glissement 4px depuis le terme |
| Dialog nav mobile | 320 ms | reveal-easing | volet qui glisse comme un contrevent, jamais de fondu seul |
| Pièces interactives (curseur de déclinaison, cadran vivant) | 400 ms de rattrapage | `cubic-bezier(0.4,0,0.2,1)` | l'instrument répond, il ne « joue » pas |
| Chiffres qui défilent (prix, dérive) | 500 ms | linéaire sur la valeur | mono tabular-nums, pas de flou |

Anti-monotonie (lock) : les durées ci-dessus sont des ancres, chaque page module ±15 % et possède UNE pièce interactive propre — on ne clone pas la chorégraphie d'une page à l'autre.

### 8.2 Chorégraphie d'entrée par page (au chargement, une seule fois)

1. **Accueil** : filet d'horizon se tire (scaleX 0→1, 900 ms) → display se révèle en 2 balayages obliques → l'ombre du Cadran Vivant se met à l'heure réelle en un seul pivot lent (1000 ms depuis -52°) → mono-data (heure vraie, coordonnées) apparaît sans animation (un instrument affiche, il n'entre pas en scène).
2. **Savoir-faire** : les quatre verbes (relever/tracer/peindre/régler) se révèlent en cascade 90 ms ; l'épure du premier geste se trace (`stroke-dashoffset`, 900 ms, une seule fois, PAS au scroll continu).
3. **Créations** : la grille de planches se révèle rangée par rangée (clip oblique, 700 ms, stagger 80 ms) ; les devises n'arrivent qu'après leurs planches (+200 ms).
4. **L'Atelier** : le récit entre au rythme le plus lent du site (1000 ms) ; les deux colonnes « géomètre / fresquiste » glissent depuis des obliques opposées.
5. **Méthode & tarifs** : entrée sobre et rapide (700 ms), les montants mono chiffrent en 500 ms — page de confiance, pas de spectacle.
6. **Contact** : quasi statique — filet + display seulement ; le formulaire est là d'emblée, entier, sans stagger (on ne fait pas attendre quelqu'un qui vient signer).

### 8.3 Reduced motion (`prefers-reduced-motion: reduce`)

- Lenis désactivé → scroll natif. Aucun clip-path animé : les reveals deviennent opacité 0→1 en 150 ms ou rien.
- `--sun-angle` figé à +31° (15 h solaires). Zéro autoplay, zéro scrub, zéro chiffre défilant (valeurs affichées directement).
- Les pièces interactives restent **fonctionnelles** (le curseur de déclinaison répond instantanément, sans tween de rattrapage) : reduced-motion réduit le mouvement, jamais l'instrument.
- Test d'acceptation : la page en reduced-motion doit rester belle en capture d'écran — l'ombre à 15 h y veille.

---

*Fin de bible. Scripts joints : `contrast-check.mjs` (validation palette, rejouable), `grain-tile.mjs` (tuile de grain, rejouable, sortie `grain-256.png` 20,3 Ko + variante data-URI générée pour mémoire).*
