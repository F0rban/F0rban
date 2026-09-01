# Spécification du moteur gnomonique — Atelier Méridienne

Document de référence des équations implémentées dans `gnomonique.mjs`.
Chaque formule ci-dessous est soit reprise d'une source citée, soit dérivée
vectoriellement dans ce document ; toutes sont recoupées par la suite de tests
`gnomonique.test.mjs` (valeurs d'éphémérides, cas limites, symétries, et
recoupements analytiques indépendants). C'est l'argument de la marque :
**vérifiez le code**.

---

## 1. Conventions de signes et notations (contractuelles)

Toutes les entrées/sorties publiques du module sont en **degrés**.
Le module convertit en radians en interne.

| Symbole | Grandeur | Convention |
|---|---|---|
| φ | latitude du lieu | positive au nord ; domaine des fonctions de cadran : 0° < φ < 90° |
| λ | longitude du lieu | **positive à l'est** de Greenwich (Molines-en-Queyras ≈ +6,85°) |
| δ | déclinaison du Soleil | positive au nord de l'équateur céleste ; \|δ\| ≤ 23,44° |
| E | équation du temps | en **minutes** ; **positive quand le Soleil vrai est en avance** sur le temps moyen (cadran en avance sur la montre). Début novembre ≈ +16 min, mi-février ≈ −14 min |
| HSV | heure solaire vraie | heure décimale, 12 = midi vrai (Soleil au méridien) |
| H | angle horaire du Soleil | H = 15°·(HSV − 12) ; **0 au midi vrai, positif l'après-midi** (vers l'ouest), 15° par heure |
| h | hauteur du Soleil | au-dessus de l'horizon, **géométrique** (réfraction ignorée, cf. §13) |
| A | azimut du Soleil | depuis le **nord**, sens horaire : 0 = N, 90 = E, 180 = S, 270 = O |
| Aₛ | azimut depuis le sud | Aₛ = A − 180 ; **positif vers l'ouest** (commodité gnomonique) |
| d | déclinaison gnomonique du mur | angle entre la **normale extérieure** du mur et le **sud**, **positif vers l'ouest**. d = 0 : mur plein sud ; d = +20 : le mur regarde 20° à l'ouest du sud. Domaine : \|d\| < 90° |
| L | longueur du style droit | tige perpendiculaire au mur (porte-nodus), unité libre |
| γ | hauteur du style | angle entre le style polaire et le plan du mur |
| σ | sous-stylaire | angle entre la sous-stylaire et la verticale descendante |
| H₀ | angle horaire sous-stylaire | angle horaire du Soleil quand l'ombre du style couvre la sous-stylaire |

**Repère du tracé mural (2D, celui des planches SVG)** : origine au pied du style
(point où l'axe du style perce le mur), **x positif vers la droite de l'observateur
qui fait face au mur** (côté est pour un mur plein sud), **y positif vers le bas**
(compatible écran/SVG). Les angles de lignes horaires sont mesurés **depuis la
verticale descendante** (ligne de midi), **positifs vers +x** : heures du matin à
gauche (négatives), après-midi à droite (positives). Un cadran vertical se lit
ainsi dans le sens **antihoraire**, miroir du cadran horizontal — conforme aux
cadrans réels.

**Repère 3D local** : base orthonormée (Est, Nord, Zénith), vecteurs notés
s (vers le Soleil), n (normale extérieure du mur), p (axe du monde).

---

## 2. Temps

Un instant est un objet `Date` JavaScript (temps universel). Jour julien et
siècle julien depuis J2000.0 :

```
JD = t_ms / 86 400 000 + 2 440 587,5          (t_ms : millisecondes Unix, UTC)
T  = (JD − 2 451 545,0) / 36 525
```

L'écart TT − UTC (~70 s) est négligé : il déplace les angles solaires d'environ
0,03′ d'arc, sans effet à l'échelle d'une lecture de cadran (cf. §13).

*Source : Meeus, « Astronomical Algorithms », 2ᵉ éd., ch. 7.*

## 3. Éléments solaires (approximation basse précision Meeus / NOAA)

Angles en degrés, T en siècles juliens :

```
L₀ = 280,46646 + 36 000,76983·T + 0,0003032·T²         (longitude moyenne, mod 360)
M  = 357,52911 + 35 999,05029·T − 0,0001537·T²          (anomalie moyenne)
e  = 0,016708634 − 0,000042037·T − 0,0000001267·T²      (excentricité)
C  = (1,914602 − 0,004817·T − 0,000014·T²)·sin M
   + (0,019993 − 0,000101·T)·sin 2M
   + 0,000289·sin 3M                                     (équation du centre)
Ω  = 125,04 − 1934,136·T                                 (nœud lunaire)
λ_app = L₀ + C − 0,00569 − 0,00478·sin Ω                 (longitude apparente)
ε₀ = 23° 26′ 21,448″ − 46,815″·T − 0,00059″·T² + 0,001813″·T³   (obliquité moyenne)
ε  = ε₀ + 0,00256·cos Ω                                  (obliquité corrigée)
```

*Sources : Meeus, ch. 22 et 25 ; NOAA Global Monitoring Laboratory, « Solar
Calculator » (mêmes coefficients).*

## 4. Déclinaison du Soleil

```
sin δ = sin ε · sin λ_app        →        δ = asin(sin ε · sin λ_app)
```

Repères de validation (testés) : δ = +23,44° ± 0,05 au solstice de juin,
−23,44° ± 0,05 au solstice de décembre, \|δ\| < 0,1° aux équinoxes,
\|δ\| ≤ 23,45° toute l'année.

*Source : Meeus, ch. 25 (précision ≈ 0,01°).*

## 5. Équation du temps

Avec y = tan²(ε/2), angles en radians dans les sinus :

```
E = 4·(180/π)·[ y·sin 2L₀ − 2e·sin M + 4e·y·sin M·cos 2L₀
                − ½y²·sin 4L₀ − 5/4·e²·sin 2M ]        (minutes)
```

**Signe** : E = temps solaire vrai − temps solaire moyen. E > 0 → le cadran est
en avance sur la montre. Repères de validation (testés) : minimum annuel
≈ −14,2 min vers le 11–12 février ; maximum ≈ +16,4 min vers le 3 novembre ;
annulations vers le 15 avril, 14 juin, 1ᵉʳ septembre, 25 décembre.

*Sources : Meeus, ch. 28 (formule de Smart) ; NOAA Solar Calculator.*

## 6. Heure solaire vraie depuis l'heure légale et la longitude

L'« heure légale » entre par l'objet `Date` (un instant absolu). En minutes :

```
HSV = heure_UTC + 4·λ + E        (mod 1440, λ en degrés, 4 min par degré)
```

Pour un utilisateur en France : heure légale = UTC+1 (hiver) ou UTC+2 (été), la
conversion vers UTC est faite par `Date` lui-même. Puis :

```
H = 15°·(HSV/60 − 12)            (angle horaire, + l'après-midi)
```

## 7. Position du Soleil (hauteur, azimut)

```
sin h        = sin φ·sin δ + cos φ·cos δ·cos H
cos h·sin Aₛ = cos δ·sin H
cos h·cos Aₛ = sin φ·cos δ·cos H − cos φ·sin δ
→  Aₛ = atan2(cos δ·sin H , sin φ·cos δ·cos H − cos φ·sin δ)      A = Aₛ + 180
```

L'emploi d'`atan2` règle les quadrants sans ambiguïté. Vérifications testées :
azimut = 180,000° au midi vrai ; hauteur au midi vrai = 90° − φ + δ (identité
exacte, car sin h = cos(φ−δ) quand H = 0) ; symétrie matin/soir.

Vecteur unitaire vers le Soleil, base (Est, Nord, Zénith) :

```
s = ( −cos h·sin Aₛ , −cos h·cos Aₛ , sin h )
```

*Source : Meeus, ch. 13 ; convention d'azimut ramenée au nord pour l'API.*

## 8. Repère du mur et style polaire

Mur vertical de déclinaison gnomonique d :

```
n  = ( −sin d , −cos d , 0 )      normale extérieure (horizontale)
eX = (  cos d , −sin d , 0 )      horizontale du mur, droite de l'observateur
eY = (  0 , 0 , −1 )              verticale descendante
```

Le style polaire est parallèle à l'axe du monde ; sa direction **sortante**
(du mur vers l'observateur, hémisphère nord, mur regardant vers le sud) :

```
q = ( 0 , −cos φ , −sin φ )         avec q·n = cos φ·cos d > 0
```

Le Soleil éclaire la face du mur si et seulement si **s·n > 0**, avec la forme
fermée remarquable :

```
s·n = cos h · cos(Aₛ − d)
```

## 9. Cadran vertical déclinant

### 9.1 Constantes du cadran (formules classiques, revérifiées vectoriellement)

```
sin γ  = cos φ · cos d           hauteur du style sur le mur
tan σ  = sin d / tan φ           sous-stylaire, depuis la verticale descendante,
                                 comptée positive vers +x
tan H₀ = tan d / sin φ           angle horaire de la sous-stylaire
```

Cas limites testés : d = 0 → γ = 90° − φ (colatitude), σ = H₀ = 0 (la
sous-stylaire se confond avec la ligne de midi). Pour d > 0 (mur déclinant
ouest), σ > 0 et H₀ > 0 : la sous-stylaire bascule du côté après-midi du tracé
(côté +x, l'est du mur étant à droite de l'observateur, cf. §1 — l'ombre du
style s'y couche quand le Soleil passe le plan normal au mur).

*Source : D. Savoie, « La Gnomonique », Les Belles Lettres, ch. cadrans
déclinants ; R.R.J. Rohr, « Les cadrans solaires ». Ces formes fermées sont
égalées à mieux que 10⁻¹² par la dérivation vectorielle du module (testé).*

### 9.2 Lignes horaires : angle sur le mur

Le plan horaire de l'angle H contient l'axe du monde p = (0, cos φ, sin φ) et
la direction du Soleil ; sa normale (prise avec δ = 0, le plan est le même pour
tout δ — c'est la propriété fondatrice du style polaire) :

```
m = p × s₀ = ( cos H , −sin φ·sin H , cos φ·sin H )
```

La ligne horaire est l'intersection de ce plan avec le mur : v = m × n.
Projetée dans le repère du tracé (x, y) :

```
x = cos φ · sin H
y = cos d · cos H + sin φ · sin d · sin H
```

d'où l'angle Z de la ligne horaire avec la verticale descendante (positif
vers +x) :

```
tan Z = cos φ · sin H / ( cos d · cos H + sin φ · sin d · sin H )
```

Vérifications testées :
- d = 0 : **tan Z = cos φ · tan H**, la formule classique du cadran vertical
  plein sud ; lignes symétriques autour de midi (Z(12+t) = −Z(12−t)) ;
  6 h et 18 h solaires exactement horizontales.
- **La ligne de midi est verticale pour toute déclinaison de mur** (H = 0 →
  x = 0) — propriété connue de tous les cadrans verticaux.
- La ligne d'angle horaire H₀ coïncide avec la sous-stylaire.
- L'ombre réelle du style polaire (projection vectorielle indépendante, §9.3)
  retombe sur la ligne horaire de l'heure solaire vraie à mieux que 10⁻⁶ degré.

L'orientation de la **demi-droite** d'ombre (le tracé part du pied du style)
est fixée par l'ombre physique : w = q − (q·n / s·n)·s, calculée pour une
déclinaison solaire qui éclaire effectivement le mur à cette heure ; le module
signale par `recoitSoleil` les heures jamais éclairées (ex. le matin d'un mur
déclinant fortement ouest).

### 9.3 Ombre du style droit (tige perpendiculaire, porte-nodus)

Projection du point P le long du rayon lumineux (direction −s) sur le plan du
mur passant par l'origine :

```
ombre(P) = P − (P·n / s·n) · s          (définie si s·n > 0)
```

Pour l'extrémité du style droit P = L·n, en posant a = Aₛ − d :

```
x = L · tan a
y = L · tan h / cos a
longueur = √(x² + y²)
```

Conditions de visibilité : h > 0 (jour) **et** s·n = cos h·cos a > 0 (Soleil
devant le mur). Vérification testée : au midi vrai d'un mur plein sud, x = 0 et
y = L·tan h exactement (ombre verticale sous la tige).

*Source : construction géométrique élémentaire ; cf. Savoie pour la lecture
« point du style droit » des cadrans de hauteur.*

## 10. Analemme

À **heure légale fixe** (fuseau fixé à UTC+1, l'heure légale d'hiver française,
constant toute l'année — l'heure d'été couperait la courbe en deux branches),
on échantillonne l'année civile : la position du Soleil (et, si un mur est
fourni, l'ombre du nodus par §9.3) décrit le « huit » de l'analemme, produit de
la variation conjointe de δ (axe vertical du huit) et de E (axe horizontal).
Le module rend pour chaque point : date, δ, E, h, A, visibilité, et (x, y) sur
le mur. Étendues vérifiées par test : E ∈ [−14,8 ; +16,8] min, \|δ\| ≤ 23,45°.

## 11. Arcs de déclinaison (solstices, équinoxes)

Pour une déclinaison solaire δ donnée (par défaut −23,437°, 0°, +23,437°), on
parcourt l'angle horaire H et on trace l'ombre du nodus (§9.3) aux instants où
le mur est éclairé. Propriétés vérifiées par test :

- **À δ = 0 (équinoxes), l'arc est une droite exacte** — les rayons passant par
  le nodus balaient un plan (le cône diurne dégénère), dont l'intersection avec
  le mur est une droite. Testé : écart < 10⁻⁹ à la corde.
- Aux solstices, deux branches d'hyperboles encadrant l'équinoxiale : à midi,
  l'ombre du nodus est plus haute sur le mur en hiver (Soleil bas) qu'à
  l'équinoxe, elle-même plus haute qu'en été (ordre des y testé).
- Les lectures rasantes (incidence < 1° par défaut) sont exclues : l'ombre y
  file à l'infini, le paramètre est documenté.

## 12. Erreur d'estimation de la déclinaison du mur (récit fondateur)

Modélisation du cadran de 1841 : tracé **et** style construits pour une
déclinaison estimée d_est, posés sur un mur qui décline réellement de d_réel.
L'instrument entier est rigide : dans le repère du mur réel, le style physique
a les composantes (cos φ·cos d_est, cos φ·sin d_est, sin φ) sur (n, eX, eY) —
il n'est plus exactement polaire. On projette son ombre (§9.3), puis on inverse
la formule des lignes horaires **de conception** pour obtenir l'heure lue :

```
tan H_lu = sin θ·cos d_est / ( cos φ·cos θ − sin φ·sin d_est·sin θ )
erreur   = 4 min/° · (H_lu − H_vrai)
```

(θ : angle de l'ombre observée ; branche choisie au plus près de H_vrai.)

Recoupement analytique indépendant, testé à 0,5 % près : tourner le cadran de
Δd équivaut à décaler le Soleil de Δd en azimut ; au midi vrai,
dA/dH = cos δ / sin(φ−δ), donc l'erreur au midi vaut :

```
ΔH ≈ Δd · sin(φ−δ) / cos δ        soit ×4 en minutes
```

À φ = 44°58′ et Δd = 4° : 6,4 min au midi d'été, 11,3 min à l'équinoxe,
16,2 min au midi d'hiver — l'erreur ne s'annule jamais et garde le même signe
toute l'année. La variante « style recalé polaire, tracé seul faux »
(`styleRecale: true`) s'annule au midi vrai et culmine vers 10–13 min aux
heures extrêmes. Chiffres complets : `derive-resultat.md`, script
`derive-calc.mjs`.

## 13. Précision et limites (annoncées honnêtement)

- Déclinaison solaire : ≈ ±0,01° ; équation du temps : quelques secondes,
  sur ~1950–2050 (approximation basse précision de Meeus). La finesse de
  lecture d'un cadran peint est de l'ordre de la minute : marge > 50×.
- **Réfraction atmosphérique ignorée** (position géométrique). Effet < 0,1°
  au-dessus de 30° de hauteur, ~0,6° à l'horizon — sensible uniquement aux
  levers/couchers, hors plage de lecture utile.
- TT − UTC négligé (cf. §2). Parallaxe solaire (≈ 8,8″) négligée.
- Domaine des fonctions de cadran : hémisphère nord (0° < φ < 90°), mur
  regardant vers le sud au sens large (\|d\| < 90°) — garde-fous `RangeError`
  testés. Les fonctions purement solaires (δ, E, HSV, position) sont valides
  partout.

## 14. Correspondance API (`gnomonique.mjs`)

| Fonction | Spécification |
|---|---|
| `declinaisonSoleil(date)` | §4 |
| `equationDuTemps(date)` | §5 |
| `heureSolaireVraie(date, longitude)` | §6 |
| `positionSoleil(date, lat, lon)` / `positionDepuisAngleHoraire(lat, δ, H)` | §7 |
| `geometrieCadran(lat, declMur)` | §9.1 |
| `lignesHoraires(lat, declMur, heures[])` | §9.2 |
| `ombreStyle(date, lat, lon, declMur, L)` | §9.2–9.3 |
| `analemme(lat, lon, heureLegale, options)` | §10 |
| `arcsDeclinaison(lat, declMur, declinaisons[], options)` | §11 |
| `erreurLecture(...)` / `deriveLecture(...)` | §12 |

Tests : `node --test gnomonique.test.mjs` — 27 tests, tous verts.

## 15. Sources

1. Jean Meeus, *Astronomical Algorithms*, 2ᵉ éd., Willmann-Bell, 1998 —
   ch. 7 (jour julien), 13 (coordonnées), 22 (nutation/obliquité),
   25 (position du Soleil, basse précision), 28 (équation du temps).
2. NOAA Global Monitoring Laboratory, *Solar Calculator* (« NOAA Solar
   Calculations », feuilles de calcul publiques) — coefficients identiques,
   valeurs de contrôle pour E et δ.
3. Denis Savoie, *La Gnomonique*, Les Belles Lettres, 2007 — cadrans verticaux
   déclinants : hauteur du style, sous-stylaire, angle horaire sous-stylaire.
4. René R.J. Rohr, *Les cadrans solaires*, Oberlin, 1986 — géométrie classique
   des cadrans muraux.

Les dérivations vectorielles (§8–9) sont autoportantes : elles ne dépendent
d'aucune formule apprise et **redémontrent** les formes classiques de Savoie et
Rohr, ce que la suite de tests vérifie numériquement à 10⁻¹² près.
