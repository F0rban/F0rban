# KIT PROMPTS IMAGES — Atelier Méridienne
*Directeur de la photographie / prompt engineer. Conforme au concept lock et à `visual-bible.md`. Ce kit reproduit l'univers graphique du site (100 % code, choix de DA maintenu) pour une production photo ultérieure — génération IA d'abord, shooting réel ensuite si le client le décide. Les prompts sont en ANGLAIS (les deux modèles y répondent mieux) ; toute la documentation est en français.*

**Règle zéro (éthique du lock)** : aucune image générée ne sera présentée sur le site comme la photographie d'une réalisation réelle. Légende obligatoire tant qu'aucun shooting n'a eu lieu : `IMAGE D'ILLUSTRATION — GÉNÉRÉE` (mono-label, même registre que « COURSE SIMULÉE — SOLSTICE D'ÉTÉ »). Jamais de visage reconnaissable. Jamais un cadran réel existant (Zarbula ou autre) reproduit et attribué à l'atelier — on peut décrire *formellement* la tradition queyrassine (soleil à rais, dents-de-loup, chocards), on n'invoque jamais un nom d'auteur réel dans un prompt destiné au site.

---

## 1. UNIVERS PHOTOGRAPHIQUE DE RÉFÉRENCE (Visual Bible photo)

Principe directeur, hérité de la DA : **le site est un mur de chaux au soleil.** La photo ne « met pas en scène » : elle relève. Chaque image est un constat — lumière réelle, matière franche, cadrage de géomètre. Si une image a l'air d'une publicité, elle est refusée.

### 1.1 Lumière — la rasante d'altitude

- **Une seule famille de lumière : le soleil direct, bas, rasant.** C'est lui qui fait exister l'enduit (chaque grain porte son ombre) et qui donne son sens au sujet : sans ombre nette, pas de cadran. Lumière artificielle interdite dans l'univers (pas de flash, pas de LED, pas de « golden hour » artificielle poussée).
- **Heures de prise de vue (heure solaire)** :
  - Été : 07 h – 09 h 30 et 16 h 30 – 19 h. Incidence 10–25° au-dessus de l'horizon.
  - Hors saison : 09 h – 11 h et 15 h – 16 h 30.
  - **Midi vrai** : réservé à UNE situation — le geste « régler » (ombre courte, verticale, qui couvre la ligne de midi). Partout ailleurs, le midi écrase.
- **Qualité** : dure et propre. Air sec d'altitude, ciel profond, ombres découpées au cutter. La brume est tolérée UNIQUEMENT en fond de vallée (plans larges), jamais sur le sujet.
- **Saisons de référence** : fin d'été / début d'automne (mélèzes qui tournent à l'ocre = la palette du site qui pousse dans la vallée). Une pointe d'hiver autorisée (neige = chaux, ombre bleue = bleu-charrette). Le printemps vert tendre est HORS palette.
- **Direction** : latérale ou contre-jour maîtrisé. Jamais de lumière frontale plate (elle tue le grain de l'enduit), jamais de lumière zénithale sauf « régler ».
- **Cohérence gnomonique (non négociable)** : sur un mur exposé sud vu de face, **matin = ombre du style penchée vers la gauche de l'observateur (ouest du gnomon), après-midi = vers la droite** — même sémantique que `--sun-angle` (négatif = matin). Toute image de cadran doit avoir une ombre cohérente avec l'heure suggérée par la lumière ambiante. On vérifie avant intégration. L'ombre ne ment pas, l'image non plus.

### 1.2 Matières — le carré chaux / pigment / bois / métal

1. **Chaux** : intonaco frais (satiné, humide, traces de taloche), arriccio sec (mat, granuleux), badigeon patiné (faïençage fin, lacunes). Toujours texturée par la rasante, jamais lisse-plastique.
2. **Pigments** : terres et ocres en poudre (jaune, rouge « sang de bœuf » = oxyde de fer, terre d'ombre), godets, pots de verre, éclaboussures sèches. Saturation naturelle de pigment minéral — mate, dense, jamais fluo.
3. **Bois** : mélèze — bardages gris-argent patinés, tables d'atelier cirées, manches d'outils polis par l'usage. Le bois est le support des gestes, pas un décor chalet.
4. **Métal du style** : laiton (chaud, brossé, reflets ocre), fer forgé (noir-bistre, martelé), acier patiné. Toujours montré à sa fonction : scellé, tendu, portant l'ombre.
- Matières interdites : plastique, inox brillant, verre moderne, textile technique voyant, tout ce qui date la photo après 1950 (exception assumée : le théodolite et ses mitaines — l'atelier est un cabinet de géomètre, l'instrument moderne est légitime).

### 1.3 Optique — angles, focales, profondeur de champ

- **Angles** : le regard du géomètre. **Frontal-orthogonal pour tout cadran et tout mur** (écho direct de la règle DA « la planche est frontale, orthogonale, comme un relevé »). Verticales tenues (pas de convergence sauvage). Contre-plongée légère tolérée seulement quand la situation l'impose (cadran haut sur façade), et alors assumée, corrigée en post au mieux.
- **Interdits d'angle** : drone épique, fisheye, plongée « lifestyle », dutch angle, vue « immobilier ».
- **Focales (équiv. 24×36)** :
  - 24 mm : rare, uniquement vallée en bandeau.
  - 35 mm : scènes d'atelier, situations, silhouettes.
  - 50 mm : les gestes — distance de compagnon, pas de voyeur.
  - 85–105 mm macro : matières et détails (pigment, laiton, tratteggio).
- **Profondeur de champ** :
  - Documentaire (cadrans, vallée, architecture) : f/5.6–f/11 — tout est net, un relevé ne floute pas.
  - Gestes et mains : f/2.8–f/4 — le geste net, l'arrière-plan qui se tait.
  - Macro matière : f/8–f/11 — la texture est le sujet, elle est nette bord à bord.
  - **Jamais** de bokeh spectaculaire f/1.2, jamais de tilt-shift jouet.

### 1.4 Palette de post-production — alignée sur les tokens

Le grade est une traduction photographique directe des tokens verrouillés :

| Zone | Cible | Token |
|---|---|---|
| Hautes lumières | roulées vers le blanc cassé chaud, JAMAIS blanc pur écrêté | `--chaux` #F5F0E6 |
| Noirs | légèrement relevés, denses et bruns, JAMAIS noir pur | `--bistre` #1C1A17 |
| Médiums chauds | dorés, tenus | `--ocre-lumiere` #C8951F |
| Accent peint | rouge terre désaturé | `--sang` #A63D2F |
| Ombres | teintées froid discret (split-toning ombres ≈ 8–12 % vers #35566B) | `--bleu-charrette` |
| Gris neutres | tirés vers le taupe, jamais neutres-numériques | `--gris-ombre` #7A756B |

- Balance des blancs : 5200–5600 K, dérive magenta nulle. Saturation globale −8 à −12 (rendu pigment, pas écran). Contraste : courbe douce en S, épaules longues (l'altitude contraste déjà).
- **Règle des deux accents, version photo** : par image, jamais plus de deux couleurs vives parmi {ocre, sang, bleu}. Un ciel très bleu + une frise sang + une devise dorée = une couleur de trop → on désature le ciel.
- Référence de rendu à écrire dans les prompts : négatif couleur type Portra/Ektar posé pour les ombres, tirage mat.

### 1.5 Grain

- **Le site pose déjà son grain** : calque fixe `grain-256.png` (recette seed 1841, alpha ≤ 10 %) au-dessus de TOUTE la page, images comprises. Donc : **grain modéré dans l'image générée** (grain argentique fin type 160–400 ISO), jamais de gros grain ajouté en post — sinon double peine visuelle.
- Le grain de l'image est du grain *photographique* (aléatoire, dans la matière) ; le grain du site est du grain *d'enduit* (le mur). Les deux se superposent sans conflit tant que celui de l'image reste fin.
- Interdits : lissage IA « peau de plastique », netteté artificielle, débruitage agressif, HDR.

### 1.6 Interdits photographiques récapitulés (à recopier dans tout brief)

Visages reconnaissables · lumière artificielle · HDR / oversharpen · drone épique · plastique et modernité datante (voitures, câbles, enseignes, vêtements techniques voyants) · vert printemps saturé · ciel dégradé « wallpaper » · bokeh f/1.2 · noir pur / blanc pur · mise en scène publicitaire (sourires, poses) · texte lisible généré présenté en gros plan (voir §3, note sur les chiffres).

---

## 2. SYSTÈME DE PROMPT

### 2.1 Architecture

Chaque prompt = **[SUJET] + [BLOC LUMIÈRE] + [BLOC MATIÈRE/PALETTE] + [BLOC OPTIQUE] + [BLOC RENDU] + [modificateur de SÉRIE] + [paramètres]**. Les blocs sont fixes — c'est eux qui fabriquent la cohérence d'univers. On ne réécrit jamais un bloc à la main dans un prompt final : on le colle.

**Blocs canoniques (anglais, à coller tels quels) :**

- `[LUM]` : `low raking alpine morning light, hard clean sunlight, crisp long shadows, high-altitude clear air`
  - variante après-midi `[LUM-PM]` : `low raking late-afternoon alpine light, warm hard sunlight, long eastward shadows`
  - variante midi vrai `[LUM-MIDI]` : `harsh overhead true-noon mountain sunlight, short vertical shadow, deep blue sky`
  - variante ombre ouverte `[LUM-OMBRE]` (macro matière seulement) : `soft open shade, diffuse skylight, no direct sun`
- `[PAL]` : `muted mineral palette: warm limewash off-white, deep bistre brown blacks, golden ochre and oxblood red accents, faint cool slate-blue in the shadows, matte pigment-like colors, slightly desaturated`
- `[REND]` : `understated documentary craft photography, natural light only, analog film look, fine 35mm film grain, matte finish, no HDR, no oversharpening`
- `[NEG]` (liste d'exclusion commune) : `text, lettering, watermark, logo, signature, people, face, cartoon, illustration, painting, 3d render, HDR, oversaturated, neon, cars, power lines, plastic, modern signage, snowcapped postcard, lens flare`
  - Pour la série E (des humains SONT présents) : retirer `people` et remplacer `face` par `recognizable face, facial features, eyes, portrait gaze`.

### 2.2 Template de base

**Midjourney v7 :**
```
[SUJET précis, 1–2 phrases] , [LUM] , [PAL] , [REND] , [modificateur de série]
--ar <ratio> --v 7 --style raw --s <50–150> --no <NEG> [--sref <URL ancre> --sw 250] [--seed <n>]
```
- `--style raw` TOUJOURS (désactive l'esthétisation MJ — notre esthétique vient des blocs, pas du modèle).
- `--s` : 50 pour le documentaire strict (matière, cadrans), 100 pour gestes/portraits, 150 max pour la vallée. Au-delà, MJ « fait joli » : hors univers.
- `--chaos 0` implicite (ne pas monter : la cohérence prime sur la surprise).

**Flux (Flux.1 Dev / Pro, ou 1.1 Pro) :** prompt en langage naturel, UN paragraphe qui déroule sujet → lumière → palette → optique → rendu → exclusions *formulées positivement* (Flux n'a pas de negative prompt natif ; si l'interface en expose un — ComfyUI, Forge —, y coller `[NEG]`).
```
A(n) [sujet]. [LUM développé]. [PAL développé]. Shot at [focale] at [ouverture],
[angle]. [REND développé]. The frame contains no people, no visible text or
lettering, no modern objects.
```
Réglages Flux : guidance **2.5–3.5** (Dev ; plus haut = rendu plastique), steps **30–40**, sampler Euler. Tailles par ratio : 1:1 → 1024×1024 · 4:5 → 1024×1280 · 3:4 → 1024×1364 · 3:2 → 1344×896 · 21:9 → 1792×768.

### 2.3 Modificateurs de série

| Série | Modificateur (à ajouter au template) | Focale/PDC | Usage principal |
|---|---|---|---|
| **A — geste** | `close working distance, hands mid-gesture, 50mm at f/2.8, shallow focus on the hands, background falls into soft darkness` | 50 mm f/2.8 | Savoir-faire, scrollytelling |
| **B — matière** | `extreme close-up, flat frontal macro, 100mm macro at f/8, texture sharp edge to edge, surface fills the whole frame` | 100 mm f/8 | Fonds de section, vignettes |
| **C — vallée** | `wide quiet landscape, 24–35mm at f/8, deep focus, distant haze only in the valley floor, no postcard drama` | 24–35 mm f/8 | Bandeaux L'Atelier / Accueil |
| **D — cadrans en situation** | `strict frontal orthogonal view of the wall, verticals kept parallel, 35–50mm at f/8, surveyor's framing, the painted dial centered like a technical plate` | 35–50 mm f/8 | Fiches Créations, vitrine Accueil |
| **E — portraits d'atelier** | `figures seen from behind or in silhouette, faces turned away or fully in shadow, anonymous, 35mm at f/4` | 35 mm f/4 | L'Atelier « les deux mains », bandeau méthode |

### 2.4 Cohérence de série (le « sref » maison)

1. Générer d'abord **4 images-ancres** (A3, B1, C1, D1 ci-dessous) jusqu'à validation DA.
2. **Midjourney** : réutiliser ces ancres en `--sref <URL1> <URL2> --sw 250` sur TOUTES les images suivantes de la même série (`--sw 200–300 : adhérence forte sans clonage`). Noter le `--seed` de chaque image validée dans le tableau de production.
3. **Flux** : pas de sref natif → passer les ancres validées par **Flux Redux** (référence de style) ou, pour une production longue, entraîner un **LoRA « Méridienne »** sur les 12–20 premières images validées. À défaut : la discipline des blocs §2.1 suffit pour une première passe.
4. Toute image validée entre dans la planche contact de référence ; toute nouvelle série se prompte ancres à l'appui.

---

## 3. LES 20 PROMPTS FINAUX

**Note générale sur le texte peint (chiffres, devises)** : les modèles génèrent des chiffres romains et des devises *faux ou déformés*. Règle de production : (a) cadrer assez large pour que le lettrage reste petit ; (b) ne JAMAIS publier un gros plan de devise générée ; (c) pour les fiches Créations, la vérité typographique reste portée par la planche SVG à côté de la photo (voir §4.4). Les prompts demandent donc des « painted roman numerals » sans jamais en faire le sujet du cadre.

Chaque bloc : usage → prompt MJ → prompt Flux → réglages → note de cohérence.

---

### SÉRIE A — LE GESTE (Savoir-faire, scrollytelling §2.2)

#### A1 · « Relever » — le théodolite à l'aube
- **Usage** : Savoir-faire, Geste 01 — colonne image du scrollytelling. **Ratio 4:5.**
- **MJ v7** :
```
a surveyor's theodolite on a wooden tripod at the foot of a tall lime-plastered
alpine gable wall at dawn, frost on the meadow grass, open field notebook and
pencil on a stone, low raking alpine morning light, hard clean sunlight, crisp
long shadows, high-altitude clear air, muted mineral palette: warm limewash
off-white, deep bistre brown blacks, golden ochre and oxblood red accents, faint
cool slate-blue in the shadows, matte pigment-like colors, slightly desaturated,
understated documentary craft photography, natural light only, analog film look,
fine 35mm film grain, matte finish, no HDR, close working distance, 50mm at
f/2.8, shallow focus on the instrument, background falls into soft darkness
--ar 4:5 --v 7 --style raw --s 100 --no text, lettering, watermark, logo, people,
face, cartoon, illustration, 3d render, HDR, oversaturated, cars, power lines,
plastic, lens flare
```
- **Flux** : `A surveyor's theodolite on a wooden tripod stands at the foot of a tall lime-plastered alpine gable wall at dawn, frost still on the meadow grass, an open field notebook and a pencil resting on a flat stone beside it. Low raking morning light skims the plaster, casting long crisp shadows in the clear high-altitude air. Muted mineral palette: warm limewash off-white, deep bistre browns, a touch of golden ochre, faint slate-blue in the shadows, slightly desaturated matte colors. Shot at 50mm at f/2.8, focus on the instrument, background softly dark. Understated documentary craft photography on 35mm film, fine grain, natural light only. No people, no visible text, no modern objects.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : soleil TRÈS bas (le texte du site dit « avant que la vallée ne chauffe »). Le théodolite est la seule modernité autorisée de tout le kit. Vérifier l'absence de marque lisible sur l'instrument.

#### A2 · « Tracer » — la table à tracer
- **Usage** : Savoir-faire, Geste 02. **Ratio 4:5.**
- **MJ v7** :
```
drafting table in a mountain workshop, large technical drawing of a sundial hour
line fan pinned flat, brass compass and ruling pen, hands of a draftsman holding
a protractor, larch wood table, low raking alpine morning light through a side
window, hard clean sunlight, crisp shadows, muted mineral palette: warm limewash
off-white, deep bistre brown blacks, golden ochre and oxblood red accents, faint
cool slate-blue in the shadows, matte pigment-like colors, slightly desaturated,
understated documentary craft photography, natural light only, analog film look,
fine 35mm film grain, matte finish, no HDR, close working distance, hands
mid-gesture, 50mm at f/2.8, shallow focus on the drawing, faces out of frame
--ar 4:5 --v 7 --style raw --s 100 --no readable text, lettering, watermark,
logo, recognizable face, facial features, eyes, cartoon, illustration, 3d
render, HDR, oversaturated, plastic, lens flare
```
- **Flux** : `The corner of a drafting table in a mountain workshop: a large technical drawing of a sundial's fanned hour lines is pinned flat, a brass compass and a ruling pen lie across it, and the weathered hands of a draftsman hold a protractor against one line. Larch wood table, raking sidelight from a window, crisp shadows. Muted mineral palette of limewash off-white, bistre brown, golden ochre, oxblood red accents, faint slate-blue shadows, slightly desaturated. Shot at 50mm at f/2.8, focus on the drawing and hands, any face out of frame. Documentary craft photography, 35mm film grain, natural light only. The drawing shows only lines and geometry, no readable lettering.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : l'épure photographiée doit ÉVOQUER la planche SVG du site (éventail de lignes, cercle de report) — c'est la passerelle photo↔DA. Lignes seules, pas de lettrage lisible (il serait faux).

#### A3 · « Peindre » — la giornata (IMAGE-ANCRE de la série)
- **Usage** : Savoir-faire, Geste 03 ; réutilisable Accueil §1.4 (bandeau méthode). **Ratio 4:5.**
- **MJ v7** :
```
close view of a fresco painter's hand laying oxblood red mineral pigment into
fresh wet lime plaster with a fine brush, edge of the day's smooth intonaco
patch visible against the rough dry arriccio, drips of limewash on the wrist,
low raking alpine morning light, hard clean sunlight, crisp shadows, muted
mineral palette: warm limewash off-white, deep bistre brown blacks, golden ochre
and oxblood red accents, faint cool slate-blue in the shadows, matte
pigment-like colors, slightly desaturated, understated documentary craft
photography, natural light only, analog film look, fine 35mm film grain, matte
finish, no HDR, close working distance, hands mid-gesture, 50mm at f/2.8,
shallow focus on the brush tip
--ar 4:5 --v 7 --style raw --s 100 --no readable text, lettering, watermark,
recognizable face, facial features, eyes, cartoon, illustration, 3d render, HDR,
oversaturated, plastic, gloves, lens flare
```
- **Flux** : `A fresco painter's bare hand lays oxblood red mineral pigment into fresh wet lime plaster with a fine long-haired brush; the smooth damp intonaco patch of the day meets the rough dry arriccio at a visible edge, and dried limewash speckles the wrist. Raking morning light rakes across the wall, sharp small shadows in every trowel mark. Muted mineral palette: limewash off-white, bistre brown, golden ochre, oxblood red, slightly desaturated, matte. Shot at 50mm at f/2.8, focus on the brush tip, shallow depth. Documentary craft photography, fine 35mm film grain, natural light. No face in frame, no text, no gloves.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : la frontière intonaco frais / arriccio sec DOIT se voir (c'est la giornata, mot glosé du site). Le rouge = sang #A63D2F, pas vermillon vif → au besoin désaturer en post.

#### A4 · « Régler » — le midi vrai
- **Usage** : Savoir-faire, Geste 04 — la seule image zénithale du site. **Ratio 4:5.**
- **MJ v7** :
```
freshly sealed brass gnomon rod on a painted lime plaster sundial, its short
vertical shadow exactly covering the painted noon line, a plumb line and a
pocket chronometer held nearby, harsh overhead true-noon mountain sunlight,
short vertical shadow, deep blue sky reflected faintly, muted mineral palette:
warm limewash off-white, deep bistre brown blacks, golden ochre and oxblood red
accents, matte pigment-like colors, slightly desaturated, understated
documentary craft photography, natural light only, analog film look, fine 35mm
film grain, matte finish, no HDR, 50mm at f/4, focus on the shadow meeting the
line, painted roman numerals small and out of focus at frame edge
--ar 4:5 --v 7 --style raw --s 75 --no readable text, large lettering,
watermark, people, face, cartoon, illustration, 3d render, HDR, oversaturated,
plastic, lens flare
```
- **Flux** : `Close view of a freshly sealed brass gnomon rod on a lime-plastered painted sundial at true noon: the rod's short shadow falls exactly along the painted vertical noon line. A plumb line hangs beside it and a pocket chronometer is held at the frame's edge. Harsh overhead mountain sunlight, tiny hard shadows in the plaster grain. Limewash off-white, bistre, golden ochre, one oxblood red painted line, desaturated matte palette. 50mm at f/4, focus where shadow meets line; any painted numerals stay small and soft at the frame edges. Documentary craft photography, fine film grain. No readable lettering, no people.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : ombre COURTE et VERTICALE, alignée sur la ligne peinte — c'est le sens même du geste (« l'ombre doit couvrir la ligne de midi. Exactement. »). Toute génération avec ombre oblique = rejet immédiat.

---

### SÉRIE B — LA MATIÈRE (fonds de section, vignettes Accueil/Savoir-faire)

#### B1 · Intonaco frais — la taloche (IMAGE-ANCRE)
- **Usage** : fond de la section Manifeste (Accueil §1.2) en très faible contraste, vignette Savoir-faire. **Ratio 1:1.**
- **MJ v7** :
```
extreme close-up of fresh lime plaster intonaco surface, subtle curved trowel
strokes catching the light, fine sand grain, damp satin sheen on one side
drying to matte on the other, low raking alpine morning light, hard clean
sunlight, crisp micro-shadows in every grain, muted mineral palette: warm
limewash off-white, faint golden warmth, hint of cool slate-blue in the shadow
of each stroke, slightly desaturated, understated documentary craft photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, flat frontal macro, 100mm macro at f/8, texture sharp edge to edge, surface
fills the whole frame
--ar 1:1 --v 7 --style raw --s 50 --no text, watermark, people, cracks, dirt,
cartoon, illustration, 3d render, HDR, oversaturated, plastic
```
- **Flux** : `Extreme close-up of a fresh lime plaster intonaco surface filling the entire frame: subtle curved trowel strokes, fine river-sand grain, a damp satin sheen on one side drying to chalky matte on the other. Low raking light travels across the surface so every grain casts a micro-shadow. Warm limewash off-white with faint golden warmth and a hint of slate-blue in the stroke shadows, slightly desaturated. Flat frontal macro, 100mm at f/8, sharp edge to edge. Documentary texture photography, fine film grain, natural light. No text, no objects, no people.` — guidance 2.8, steps 35, 1024×1024.
- **Cohérence** : c'est la version photographique du fond `--chaux` + nuages de taloche de la DA (§6.2 de la bible). En intégration, elle peut être éclaircie vers #F5F0E6 pour servir de fond réel (voir §4.2).

#### B2 · Les pigments — terres et oxydes
- **Usage** : vignette Geste 03 (Savoir-faire), Créations §3.1. **Ratio 1:1.**
- **MJ v7** :
```
overhead close-up of open pigment jars and small mounds of dry mineral pigment
on a larch wood workbench: yellow ochre, red iron oxide, raw umber, a worn
horsehair brush and a small brass scale beside them, dry pigment dust scattered,
low raking alpine light from one side, crisp shadows, muted mineral palette,
matte pigment-like colors, slightly desaturated, understated documentary craft
photography, natural light only, analog film look, fine 35mm film grain, matte
finish, no HDR, flat frontal macro, 100mm macro at f/8, texture sharp edge to
edge
--ar 1:1 --v 7 --style raw --s 50 --no text, labels, lettering, watermark,
people, plastic, modern packaging, cartoon, 3d render, HDR, oversaturated, neon
```
- **Flux** : `Overhead close-up of a fresco painter's pigments on a larch workbench: open glass jars and small mounds of dry mineral pigment — yellow ochre, red iron oxide, raw umber — with a worn horsehair brush and a small brass scale, fine pigment dust scattered on the wood. Raking sidelight, crisp shadows, matte mineral colors, slightly desaturated. Frontal macro at 100mm, f/8, everything sharp. Documentary craft photography, fine 35mm film grain, natural light. No labels, no lettering, no plastic, no people.` — guidance 3.0, steps 35, 1024×1024.
- **Cohérence** : les trois tas = littéralement `--ocre-lumiere`, `--sang`, `--bistre`. Refuser toute génération avec pigments bleus/verts dominants (le bleu reste un filet dans la DA, pas une matière).

#### B3 · Le mélèze — bardage patiné
- **Usage** : L'Atelier §4.3 (la vallée), fond de carte alternatif. **Ratio 1:1.**
- **MJ v7** :
```
extreme close-up of weathered silver-grey larch wood boards of an alpine barn
wall, deep grain ridges, old wooden pegs, a thin wedge of lime plaster visible
at the edge where masonry meets timber, low raking alpine light, crisp shadows
in the wood grain, muted mineral palette, warm grey and bistre tones with faint
golden warmth, slightly desaturated, understated documentary craft photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, flat frontal macro, 100mm macro at f/8, texture sharp edge to edge
--ar 1:1 --v 7 --style raw --s 50 --no text, watermark, people, nails, metal
brackets, cartoon, 3d render, HDR, oversaturated, green moss
```
- **Flux** : `Extreme close-up of the silver-grey weathered larch boards of an alpine barn wall: deep ridged grain, old wooden pegs, and at one edge a thin band of lime plaster where masonry meets timber. Raking light digs into the grain. Warm greys and bistre with a faint golden warmth, desaturated, matte. Frontal macro, 100mm at f/8, sharp edge to edge. Documentary texture photography, fine film grain, natural light. No text, no modern hardware, no people.` — guidance 2.8, steps 35, 1024×1024.
- **Cohérence** : le gris du bois doit tirer vers `--gris-ombre` #7A756B (taupe), pas vers un gris froid numérique.

#### B4 · Le laiton du style — détail de scellement
- **Usage** : Méthode & tarifs (étape scellement), vignette specs Créations. **Ratio 1:1.**
- **MJ v7** :
```
macro detail of a forged brass gnomon rod sealed into lime plaster with a fresh
lead and mortar joint, brushed warm metal catching low sunlight, hammer marks
visible, the painted wall surface slightly out of focus around it, low raking
alpine light, crisp shadows, muted mineral palette with one golden metal
accent, slightly desaturated, understated documentary craft photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, 100mm macro at f/8
--ar 1:1 --v 7 --style raw --s 50 --no text, watermark, people, rust, chrome,
stainless steel, cartoon, 3d render, HDR, oversaturated, lens flare
```
- **Flux** : `Macro detail of a forged brass gnomon rod where it is sealed into a lime-plastered wall: a fresh mortar joint, hammer marks on the warm brushed metal, low sunlight catching the rod's edge, the painted plaster softly out of focus around the sealing point. Muted mineral palette with a single golden metal accent, desaturated, matte. 100mm macro at f/8. Documentary craft photography, fine film grain, natural light. No text, no chrome, no people.` — guidance 3.0, steps 35, 1024×1024.
- **Cohérence** : le laiton EST `--ocre-lumiere` incarné — c'est la seule « brillance » autorisée du kit, et elle reste brossée, jamais chromée.

---

### SÉRIE C — LA VALLÉE (L'Atelier, Accueil)

#### C1 · L'Aigue Blanche au matin (IMAGE-ANCRE)
- **Usage** : L'Atelier §4.3, bandeau pleine largeur. **Ratio 21:9** (art direction : recadrage 3:2 sous 640 px).
- **MJ v7** :
```
wide quiet view of a high alpine valley at early morning, larch forests turning
golden ochre in late autumn, scattered stone and timber hamlets with
lime-plastered gables catching the first raking sunlight, thin mist only on the
valley floor, long shadows across mown meadows, high peaks kept dark and
undramatic, low raking alpine morning light, muted mineral palette: warm
limewash off-white, deep bistre brown, golden ochre, faint cool slate-blue
shadows, slightly desaturated, understated documentary landscape photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, 35mm at f/8, deep focus, no postcard drama
--ar 21:9 --v 7 --style raw --s 150 --no text, watermark, people, cars, roads,
power lines, ski lifts, snowcapped postcard peaks, saturated blue sky, HDR,
cartoon, 3d render, lens flare
```
- **Flux** : `A wide quiet view of a high alpine valley in late autumn early morning: larch forests turned golden ochre, scattered hamlets of stone and silvered timber whose lime-plastered gables catch the first raking sunlight, thin mist lying only on the valley floor, long shadows across mown meadows, the high peaks kept dark and understated. Muted mineral palette — limewash off-white, bistre, golden ochre, faint slate-blue shadows — slightly desaturated, matte. 35mm at f/8, deep focus, level horizon. Documentary landscape photography on 35mm film, fine grain, natural light. No roads, no vehicles, no power lines, no people, no text.` — guidance 3.2, steps 40, 1792×768.
- **Cohérence** : les mélèzes d'automne = la palette du site dans le paysage (ocre sur bistre). Ciel désaturé obligatoire (règle des deux accents). Horizon TENU (le filet d'horizon est un motif DA).

#### C2 · Le hameau aux façades
- **Usage** : Accueil §1.2 (Manifeste, vis-à-vis du texte) ou L'Atelier. **Ratio 3:2.**
- **MJ v7** :
```
small alpine hamlet street in morning light, tall lime-plastered facades with
two faded painted sundials visible high on the gables in the middle distance,
timber balconies loaded with firewood, cobbled lane in shadow while upper walls
catch golden raking sun, muted mineral palette: limewash off-white, bistre,
golden ochre, one oxblood red painted accent, faint slate-blue shadows,
slightly desaturated, understated documentary photography, natural light only,
analog film look, fine 35mm film grain, matte finish, no HDR, 35mm at f/8, deep
focus, verticals kept parallel
--ar 3:2 --v 7 --style raw --s 100 --no readable text, large lettering,
watermark, people, cars, shop signs, power lines, flower pots, cartoon, 3d
render, HDR, oversaturated
```
- **Flux** : `A narrow lane in a small alpine hamlet at morning: tall lime-plastered facades, timber balconies stacked with firewood, and high on two gables in the middle distance, faded painted sundials catching the golden raking sun while the lane below stays in cool shadow. Limewash off-white, bistre, golden ochre, one oxblood accent, slate-blue shadows, desaturated matte palette. 35mm at f/8, deep focus, verticals kept parallel. Documentary photography, fine 35mm film grain, natural light. No people, no vehicles, no signs, no readable lettering.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : les cadrans restent à distance moyenne (lettrage illisible = pas de faux texte). Bas de rue en ombre bleue / hauts de murs en ocre : c'est la dramaturgie `--sun-angle` en photo.

#### C3 · La crête qui avale le soleil
- **Usage** : Savoir-faire, en regard du Geste 01 (« les masques — la crête qui avale le soleil de novembre »). **Ratio 3:2.**
- **MJ v7** :
```
late afternoon in a deep alpine valley, the sun about to disappear behind a
high dark ridgeline, the last raking light cutting across one lime-plastered
gable wall while the rest of the hamlet already lies in cold blue shadow, sharp
shadow line climbing the wall, muted mineral palette, golden ochre light
against slate-blue shadow, slightly desaturated, understated documentary
photography, natural light only, analog film look, fine 35mm film grain, matte
finish, no HDR, 50mm at f/8, deep focus
--ar 3:2 --v 7 --style raw --s 100 --no text, watermark, people, sun star,
lens flare, cars, power lines, HDR, oversaturated, cartoon, 3d render
```
- **Flux** : `Late afternoon in a deep alpine valley: the sun is about to drop behind a high dark ridge, and the last raking light cuts across a single lime-plastered gable wall while the rest of the hamlet already sits in cold blue shadow. The shadow line of the ridge climbs the wall, sharp and straight. Golden ochre light against slate-blue shade, desaturated, matte. 50mm at f/8, deep focus. Documentary photography, fine film grain, natural light, no lens flare. No people, no text, no vehicles.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : l'image prouve la notion de *masque solaire* (vocabulaire du relevé). La limite ombre/lumière doit être NETTE — c'est un trait, pas un dégradé.

#### C4 · Hiver — l'ombre longue sur la chaux
- **Usage** : L'Atelier §4.5 (clôture) ou page 404. **Ratio 3:2.**
- **MJ v7** :
```
winter morning, low sun over deep snow, a lime-plastered alpine house wall with
a painted sundial catching pale gold light, immensely long blue shadows of a
bare larch tree stretching across the untouched snow toward the wall, muted
mineral palette, snow rendered warm off-white not pure white, slate-blue
shadows, one small ochre and oxblood dial accent, slightly desaturated,
understated documentary photography, natural light only, analog film look, fine
35mm film grain, matte finish, no HDR, 35mm at f/8, deep focus
--ar 3:2 --v 7 --style raw --s 100 --no text, readable lettering, watermark,
people, ski equipment, cars, power lines, saturated blue sky, HDR, cartoon, 3d
render
```
- **Flux** : `A winter morning in the high mountains: low sun over deep snow, a lime-plastered house wall with a small painted sundial catching pale gold light, and the immensely long blue shadow of a bare larch tree stretching across untouched snow toward the wall. Snow rendered warm off-white, never pure white; slate-blue shadows; one small ochre-and-oxblood accent on the dial. Desaturated, matte. 35mm at f/8, deep focus. Documentary photography, fine film grain, natural light. No people, no tracks, no equipment, no readable lettering.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : la neige = `--chaux`, l'ombre = `--bleu-charrette` : l'hiver est la palette du site à ciel ouvert. Ne jamais laisser la neige écrêter en blanc pur (voir grade §1.4).

---

### SÉRIE D — CADRANS EN SITUATION (Créations, Accueil §1.3)

*Règle de série : vue frontale-orthogonale stricte, cadran traité comme une planche. Les 4 images font écho aux fiches du site SANS prétendre les documenter — types génériques, jamais légendés d'un lieu réel précis autre que celui de la fiction.*

#### D1 · La grange au pignon — type « Le Veilleur d'Arvieux » (IMAGE-ANCRE)
- **Usage** : Créations, fiche 1, vis-à-vis de la planche SVG ; Accueil §1.3 vitrine. **Ratio 3:4.**
- **MJ v7** :
```
strict frontal view of the upper gable of an alpine barn, silvered larch
boards below and lime-plastered masonry above, a painted sundial with a fan of
hour lines, small painted roman numerals, a radiant sun with sixteen straight
rays painted in ochre and oxblood red, a slender brass gnomon casting a crisp
morning shadow leaning to the left of the rod, low raking alpine morning light,
muted mineral palette, slightly desaturated, understated documentary
photography, natural light only, analog film look, fine 35mm film grain, matte
finish, no HDR, verticals kept parallel, 50mm at f/8, surveyor's framing, the
dial centered like a technical plate
--ar 3:4 --v 7 --style raw --s 75 --no readable text, large lettering,
watermark, people, cars, power lines, satellite dish, cartoon, 3d render, HDR,
oversaturated, lens flare
```
- **Flux** : `Strict frontal view of the upper gable of an alpine barn: silvered larch boards below, lime-plastered masonry above, and on the plaster a painted sundial — a fan of hour lines, small painted roman numerals kept tiny, a radiant sun with sixteen straight rays in ochre and oxblood red — its slender brass gnomon casting one crisp morning shadow leaning to the left of the rod. Raking morning light, muted mineral palette, desaturated, matte. Verticals parallel, 50mm at f/8, the dial centered like a technical plate. Documentary photography, fine 35mm film grain, natural light. No people, no wires, no readable lettering.` — guidance 3.0, steps 40, 1024×1364.
- **Cohérence** : ombre à GAUCHE = matin (fiche : « l'ombre monte du foin à la crête », cadran VI–XVI, cadran du matin). Soleil à seize rais = motif queyrassin décrit dans la copie. Chiffres petits, illisibles de loin : la vérité épigraphique reste sur la planche SVG.

#### D2 · La façade d'hôtel d'altitude — type « Le Grand Déclinant »
- **Usage** : Créations, fiche 2 ; réutilisable Méthode (exemple 2). **Ratio 3:2.**
- **MJ v7** :
```
frontal view of a large lime-plastered facade of an old alpine mountain inn in
late afternoon, a monumental painted sundial with a visibly asymmetric
off-center fan of hour lines, a painted blue frieze border, gilded details
catching the low sun, long brass gnomon shadow leaning far to the right of the
rod, wooden shutters closed, low raking late-afternoon alpine light, warm hard
sunlight, muted mineral palette with slate-blue frieze and golden ochre
accents, slightly desaturated, understated documentary photography, natural
light only, analog film look, fine 35mm film grain, matte finish, no HDR,
verticals kept parallel, 35mm at f/8, surveyor's framing
--ar 3:2 --v 7 --style raw --s 75 --no readable text, large lettering,
watermark, people, cars, parasols, signage, power lines, cartoon, 3d render,
HDR, oversaturated
```
- **Flux** : `Frontal view of the large lime-plastered facade of an old alpine mountain inn in late afternoon: a monumental painted sundial whose fan of hour lines is visibly asymmetric and off-center, bordered by a painted slate-blue frieze with small gilded details catching the low sun; the long brass gnomon throws its shadow far to the right of the rod. Wooden shutters closed, no signage. Raking warm light, muted mineral palette, desaturated, matte. Verticals parallel, 35mm at f/8. Documentary photography, fine film grain, natural light. No people, no vehicles, no readable lettering.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : l'ASYMÉTRIE du tracé est le sujet (mur déclinant 41° ouest, « nous avons assumé l'asymétrie ») ; ombre à DROITE = après-midi (« un cadran d'après-midi »). Frise bleue + or : on tient les deux accents, ciel désaturé.

#### D3 · L'école — type « L'Heure d'apprendre »
- **Usage** : Créations, fiche 3. **Ratio 3:4.**
- **MJ v7** :
```
frontal view of the lime-plastered wall of a small old village school above a
quiet gravel courtyard, a painted sundial set low at reading height with big
frank hour lines, a painted figure-eight analemma curve crossing the noon line,
patinated steel gnomon, morning shadow on the dial, a long bench against the
wall, low raking alpine morning light, muted mineral palette, slightly
desaturated, understated documentary photography, natural light only, analog
film look, fine 35mm film grain, matte finish, no HDR, verticals kept parallel,
50mm at f/8, surveyor's framing, the dial centered like a technical plate
--ar 3:4 --v 7 --style raw --s 75 --no readable text, large lettering,
watermark, people, children, toys, cars, power lines, cartoon, 3d render, HDR,
oversaturated
```
- **Flux** : `Frontal view of the lime-plastered wall of a small old village school above a quiet gravel courtyard: a painted sundial set unusually low, at reading height, with big frank hour lines and a painted figure-eight analemma crossing the noon line, its patinated steel gnomon throwing a crisp morning shadow. A long wooden bench stands against the wall. Raking morning light, muted mineral palette, desaturated, matte. Verticals parallel, 50mm at f/8, the dial centered like a technical plate. Documentary photography, fine film grain, natural light. Empty courtyard, no people, no readable lettering.` — guidance 3.0, steps 40, 1024×1364.
- **Cohérence** : le cadran est BAS (« à hauteur de regard » d'enfant — c'est le récit de la fiche) ; l'analemme en huit doit être présent (mot glosé du site). Cour vide : jamais d'enfants générés.

#### D4 · La restauration — détail a tratteggio, type « La Chapelle aux deux tracés »
- **Usage** : Créations, fiche 5 ; Méthode (restauration sur devis). **Ratio 4:5.**
- **MJ v7** :
```
close frontal detail of an old painted sundial on a chapel wall under
restoration, faded ghost hour lines and worn painted patches, one filled lacuna
retouched with fine vertical tratteggio hatching strokes subtly different from
the original paint, edges of old lime plaster layers visible, raking light
revealing the surface relief, muted mineral palette, faded oxblood and ochre on
worn limewash, slightly desaturated, understated documentary conservation
photography, natural light only, analog film look, fine 35mm film grain, matte
finish, no HDR, 100mm macro at f/8, texture sharp edge to edge
--ar 4:5 --v 7 --style raw --s 50 --no readable text, large lettering,
watermark, people, scaffolding, tools, cartoon, 3d render, HDR, oversaturated,
fresh bright paint
```
- **Flux** : `Close frontal detail of an old painted sundial on a chapel wall under restoration: faded ghost hour lines, worn patches of oxblood and ochre paint on aged limewash, and one filled lacuna retouched with fine vertical tratteggio hatching, its strokes subtly distinguishable from the original paint at close range. Raking light reveals the relief of the old plaster layers. Muted, faded mineral palette, desaturated, matte. 100mm macro at f/8, sharp edge to edge. Documentary conservation photography, fine film grain, natural light. No people, no tools, no readable lettering.` — guidance 2.8, steps 40, 1024×1280.
- **Cohérence** : le tratteggio (« fins traits verticaux, lisibles de près, invisibles de loin » — texte exact de la fiche) doit être discernable en macro. C'est l'image la plus « preuve de savoir-faire » du kit : zéro spectaculaire, tout dans la surface.

---

### SÉRIE E — PORTRAITS D'ATELIER (mains et silhouettes, JAMAIS de visage)

#### E1 · Les mains du géomètre
- **Usage** : L'Atelier §4.2, portrait 1 (Élise Bérard — sans jamais montrer un visage). **Ratio 4:5.**
- **MJ v7** :
```
close view of a surveyor's hands in fingerless wool gloves adjusting the brass
fine-adjustment screw of a theodolite, a field notebook with pencil sketches of
angles tucked under one arm, cold morning breath-fog absent, face entirely out
of frame, low raking alpine morning light, crisp shadows, muted mineral
palette, slightly desaturated, understated documentary craft photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, 50mm at f/2.8, shallow focus on the fingers and screw
--ar 4:5 --v 7 --style raw --s 100 --no recognizable face, facial features,
eyes, portrait gaze, readable text, watermark, cartoon, 3d render, HDR,
oversaturated, plastic
```
- **Flux** : `Close view of a surveyor's hands in fingerless wool gloves adjusting the small brass fine-adjustment screw of a theodolite at dawn; a field notebook filled with pencil angle sketches is tucked under one arm. The face stays entirely out of frame — only hands, sleeves and instrument. Raking morning light, crisp shadows, muted mineral palette, desaturated, matte. 50mm at f/2.8, focus on the fingers and screw. Documentary craft photography, fine 35mm film grain, natural light. No face anywhere in frame, no readable text.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : la précision est le sujet (vis micrométrique, carnet d'angles). Mains crédibles = point de contrôle n°1 (voir vigilance finale).

#### E2 · Les mains du fresquiste
- **Usage** : L'Atelier §4.2, portrait 2 (Marco Vayr). **Ratio 4:5.**
- **MJ v7** :
```
close view of a fresco painter's weathered hands, limewash dried white in the
knuckle creases and under the nails, holding a worn wide brush and a small
steel trowel, forearms flecked with ochre pigment, dark canvas apron behind,
face entirely out of frame, low raking light, crisp shadows, muted mineral
palette, slightly desaturated, understated documentary craft photography,
natural light only, analog film look, fine 35mm film grain, matte finish, no
HDR, 50mm at f/2.8, shallow focus on the hands
--ar 4:5 --v 7 --style raw --s 100 --no recognizable face, facial features,
eyes, portrait gaze, readable text, watermark, gloves, cartoon, 3d render, HDR,
oversaturated, plastic
```
- **Flux** : `Close view of a fresco painter's weathered bare hands holding a worn wide brush and a small steel trowel: limewash has dried white in the knuckle creases and under the nails, the forearms are flecked with ochre pigment, a dark canvas apron fills the background. The face stays entirely out of frame. Raking light, crisp shadows, muted mineral palette, desaturated, matte. 50mm at f/2.8, focus on the hands. Documentary craft photography, fine film grain, natural light. No face, no gloves, no readable text.` — guidance 3.0, steps 35, 1024×1280.
- **Cohérence** : diptyque avec E1 — même lumière, même distance, même fond sombre : « les deux mains » du site, littéralement. À générer avec le même seed/sref que E1 si possible.

#### E3 · La silhouette sur l'échafaudage
- **Usage** : Accueil §1.4 (bandeau méthode) ; Méthode & tarifs en tête. **Ratio 3:2.**
- **MJ v7** :
```
backlit silhouette of a painter standing on simple wooden scaffolding against a
tall freshly plastered lime wall, seen from behind and below at a respectful
distance, raising a brush toward a faint sinopia outline of sundial hour lines,
figure dark and anonymous against the sunlit wall, low raking late-afternoon
alpine light, warm hard sunlight, muted mineral palette, slightly desaturated,
understated documentary photography, natural light only, analog film look, fine
35mm film grain, matte finish, no HDR, 35mm at f/4, verticals kept parallel
--ar 3:2 --v 7 --style raw --s 100 --no recognizable face, facial features,
eyes, readable text, watermark, hard hat, high-visibility vest, metal
scaffolding, cartoon, 3d render, HDR, oversaturated, lens flare
```
- **Flux** : `The backlit silhouette of a painter stands on simple wooden scaffolding against a tall freshly plastered lime wall, seen from behind and slightly below at a respectful distance, one arm raised with a brush toward the faint red sinopia outline of a sundial's hour lines. The figure stays dark and anonymous against the sunlit wall. Warm raking late-afternoon light, muted mineral palette, desaturated, matte. 35mm at f/4, verticals parallel. Documentary photography, fine film grain, natural light. The face is not visible; no readable text, no modern safety equipment, wooden scaffolding only.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : la sinopia (esquisse ocre rouge, mot glosé) relie l'image au Geste 03. Échafaudage BOIS (l'acier + EPI moderne daterait et casserait l'univers — choix de fiction assumé, comme l'absence de casque sur les gravures anciennes).

#### E4 · Les deux à la table — l'atelier au soir
- **Usage** : L'Atelier §4.1 (récit fondateur), image de clôture. **Ratio 3:2.**
- **MJ v7** :
```
two figures seen strictly from behind, seated at a long larch drafting table in
a mountain workshop, one bent over a technical sundial drawing with a ruler,
the other holding a small brass instrument to the window light, a deep window
in a thick stone wall opening onto a dusk-blue alpine valley, warm low sunlight
entering sideways, faces entirely invisible, low raking evening light, muted
mineral palette, golden interior against slate-blue valley, slightly
desaturated, understated documentary photography, natural light only, analog
film look, fine 35mm film grain, matte finish, no HDR, 35mm at f/4
--ar 3:2 --v 7 --style raw --s 100 --no recognizable face, facial features,
eyes, portrait gaze, readable text, watermark, lamps, electric light, computer,
cartoon, 3d render, HDR, oversaturated
```
- **Flux** : `Two figures seen strictly from behind, seated at a long larch drafting table in a mountain workshop: one bends over a technical sundial drawing with a ruler, the other holds a small brass instrument up to the light of a deep window set in a thick stone wall, which opens onto a dusk-blue alpine valley. Warm low sunlight enters sideways; no electric light. Faces entirely invisible. Golden interior tones against the slate-blue valley, muted mineral palette, desaturated, matte. 35mm at f/4. Documentary photography, fine film grain, natural light. No faces, no screens, no readable text.` — guidance 3.0, steps 40, 1344×896.
- **Cohérence** : le duo géomètre/fresquiste sans identité — les fondateurs restent des rôles, pas des visages (fiction assumée du lock). Intérieur ocre / vallée bleue = les deux accents, encore.

---

## 4. RÈGLES D'INTÉGRATION

### 4.1 Traitement — pas de duotone par défaut

- **Les séries A, D, E (documentaires) restent en couleur**, gradées §1.4. Un duotone les transformerait en « design » et ruinerait la fonction de preuve. La crédibilité du site vient de l'exactitude : la photo documentaire doit avoir l'air d'un constat.
- **Duotone autorisé pour B et C UNIQUEMENT en usage « fond de section »** (image sous texte) : bichromie `--bistre` → `--chaux` (jour) ou `--nuit` → `--chaux` (footer), **pré-calculée à l'export** (jamais `filter:` CSS sur une image — coût de rendu, et les filtres animés sont interdits par le lock). Opacité d'intégration ≤ 20 % sous du texte ; re-vérifier le contraste AA du texte SUR l'image moyenne (même exigence que la palette).
- **Grain : ne rien ajouter à l'intégration.** Le calque global `grain-256.png` (z-index 999, fixe) couvre déjà les images. Le grain argentique fin demandé dans les prompts suffit. Interdit de dupliquer la tuile par image.
- Traitement de cohérence livré avec le kit : un preset unique (LUT ou réglages Lightroom équivalents au §1.4) appliqué à TOUTES les images avant export. Une image non passée au preset ne part pas en intégration.

### 4.2 Formats, tailles, poids (budget perf du lock : LCP < 2 s intouché)

- **Formats** : AVIF (qualité ~50) + repli WebP (~q75) via `<picture>` ; JPEG en dernier recours legacy. Métadonnées strippées, profil sRGB.
- **Grille de tailles** (`srcset` : 480 / 800 / 1200 / 1600 w — 1600 max, rien au-delà, écrans hi-dpi servis par l'AVIF compressif) :
  - Bandeaux 21:9 : affichage max 1200 px (largeur conteneur) → fichier 1600 w ≤ 180 Ko AVIF.
  - Cartes/fiches 3:4 et 4:5 : affichage max ~640 px → fichier 1200 w ≤ 120 Ko.
  - Vignettes matière 1:1 : affichage max ~400 px → fichier 800 w ≤ 60 Ko.
- **Budget par page : ≤ 600 Ko de raster au total, 4 images max par page.** Méthode & tarifs : 1 image max. Contact : 0.
- **Art direction** : `<picture><source media="(max-width:640px)">` pour recadrer les 21:9 en 3:2 mobile (recadrage éditorial, pas un simple crop centré).

### 4.3 Lazy-loading et layout

```html
<figure class="photo-planche">
  <picture>
    <source type="image/avif" srcset="… 480w, … 800w, … 1200w, … 1600w" sizes="…">
    <source type="image/webp" srcset="…">
    <img src="…-800.jpg" width="1200" height="1500" alt="[description factuelle]"
         loading="lazy" decoding="async" fetchpriority="low">
  </picture>
  <figcaption class="mono-label">IMAGE D'ILLUSTRATION — GÉNÉRÉE · [légende mono-data]</figcaption>
</figure>
```
- `loading="lazy"` sur TOUTES les images : le hero reste le Cadran Vivant SVG, aucune image n'est LCP — c'est la condition pour que le budget perf du lock tienne. Aucune image raster au-dessus du pli, aucun `preload` d'image (seul `grain-256.png` garde le sien).
- `width`/`height` toujours posés (+ `aspect-ratio` CSS) : zéro CLS. Placeholder pendant le chargement : fond `--chaux-creuse` nu — pas de blur-up LQIP (le flou n'existe pas dans cet univers ; un panneau d'enduit vide, oui).
- Apparition au scroll : même reveal clip-path oblique que le reste (700–1000 ms, easing du lock), l'image est révélée comme une planche — jamais de fade-in flou.

### 4.4 Comment les photos remplacent (ou pas) les SVG sans casser la DA

Doctrine : **la photo s'ajoute au relevé, elle ne le remplace jamais quand le SVG est un instrument ou une preuve.**

| Élément SVG actuel | Remplaçable ? | Modalité |
|---|---|---|
| Hero « Cadran Vivant » (Accueil) | **NON, jamais** | C'est un instrument fonctionnel (heure vraie réelle). Une photo serait une régression du concept. |
| Curseur de déclinaison, courbes (Savoir-faire) | **NON** | Pièces interactives calculées. |
| Planches techniques des 5 fiches (Créations) | **NON — cohabitation** | La planche SVG reste (la preuve du calcul) ; la photo D1–D4 entre en vis-à-vis dans la grille 5+7 existante. Le couple planche/photo = « le tracé et le mur », déclinaison du contraste signature devise/relevé. |
| Illustrations d'ambiance des sections (épures décoratives, frises) | **OUI, sélectivement** | Séries B et C, en fond basse opacité ou en figure pleine colonne. |
| Analemme du footer, chocards, rosaces | **NON** | Signatures graphiques de la marque. |

Règles de cadre pour toute photo intégrée (la photo obéit aux composants, pas l'inverse) :
1. **Cadre double de planche** (filet 1.5 + filet 0.75 espacés de 6 px, comme §5.1-11 de la bible DA), `border-radius: 0`, zéro box-shadow.
2. **Cartouche mono-data** sous l'image : lieu fictif, ratio, mention `IMAGE D'ILLUSTRATION — GÉNÉRÉE`. La photo est traitée comme un relevé versionné, pas comme un visuel marketing.
3. **Règle des deux accents inchangée** : une photo riche en ocre + sang interdit tout autre accent dans son écran ; vérifier écran par écran après intégration.
4. Les 5–6 éléments pivotants `--sun-angle` restent des SVG/pseudo-éléments : **aucune ombre photo n'est animée** (une photo a son heure, elle la garde — cohérent avec « l'ombre ne ment pas »).
5. `alt` factuel et honnête (décrire ce que montre l'image, sans prétendre à un lieu réel) ; les photos décoratives de fond : `alt=""` + `role="presentation"`.

### 4.5 Ordre de production recommandé

1. Ancres : A3, B1, C1, D1 → validation DA (grade appliqué, planche contact).
2. Compléter série par série avec `--sref`/Redux + seeds notés.
3. Passe de post unique (preset §1.4) → exports AVIF/WebP → intégration sur UNE page pilote (Créations) → contrôle perf (LCP, poids, CLS) et AA → généralisation.

---

## 5. VIGILANCE ÉTHIQUE SPÉCIFIQUE IMAGES (rappel bloquant)

1. Mention `IMAGE D'ILLUSTRATION — GÉNÉRÉE` tant qu'aucun shooting réel : non négociable, même registre typographique que les mentions de simulation déjà en place.
2. Jamais de visage reconnaissable, y compris accidentel dans un fond → contrôle à la loupe avant validation, régénération sinon.
3. Jamais de reproduction identifiable d'un cadran réel existant (Queyras ou ailleurs) présentée comme une création de l'atelier ; les prompts décrivent des types, pas des originaux.
4. Aucun texte généré publié lisible (devises, chiffres) : le lettrage vrai vit dans les SVG et l'HTML.
5. Les images ne créent ni faux label, ni fausse preuve : pas de « chantier classé », pas de plaque officielle, pas de logo d'institution dans le champ.
