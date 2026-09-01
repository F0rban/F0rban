# Architecture technique — guide contributeur

## Décisions structurantes

### 1. Statique sans build, volontairement
Le site est du HTML/CSS/JS servi tel quel. Pour un site vitrine de 8 pages,
une chaîne de build (bundler, framework) ajouterait de la surface de panne
sans bénéfice : ici, `git clone` + `npm run dev` suffisent, et le site
fonctionne sur n'importe quel hébergeur statique. Le coût assumé : le
header/footer est dupliqué dans chaque page. Toute modification de ces
blocs doit être reportée sur les 8 pages (`index.html`, `savoir-faire/`,
`creations/`, `atelier/`, `methode-tarifs/`, `contact/`, `mentions/`,
`404.html`) — un grep sur un fragment du bloc permet de vérifier.

### 2. URLs en répertoires
Chaque page est un `index.html` dans son répertoire-slug (`/savoir-faire/`).
Les chemins d'assets sont **relatifs** (`../assets/...`) pour que le site
fonctionne servi depuis n'importe quelle base. Exception : `404.html`
utilise des chemins **absolus** (`/assets/...`) car une page d'erreur est
servie à n'importe quelle profondeur d'URL.

### 3. Le moteur gnomonique est la source de vérité
`assets/js/gnomonique.js` est un module ES pur, zéro dépendance, documenté
(JSDoc + `docs/gnomonique-spec.md`), testé (`tests/`, 27 assertions contre
des valeurs de référence). Il sert :
- au **runtime** : le Cadran Vivant (`cadran.js`) et le Curseur de
  déclinaison (`simulateur.js`) l'importent dans le navigateur ;
- au **build des SVG** : `tools/genere-svg.mjs` l'importe sous Node pour
  dessiner le cadran héros et les 5 planches.

Ne jamais dessiner une géométrie gnomonique « à la main » : toute ligne
horaire, arc ou analemme sort du moteur. Si un tracé semble faux, c'est le
moteur qu'on corrige (avec un test), jamais le dessin.

### 4. SVG générés puis injectés
Les SVG calculés vivent dans `assets/img/generated/*.svg.html` et sont
injectés **inline** dans les pages entre marqueurs :

```html
<!-- svg:planche-1 -->
… contenu remplacé par tools/injecte-svg.mjs …
<!-- /svg:planche-1 -->
```

Inline car : les textes internes héritent des fontes du site, les `<title>`/
`<desc>` sont exposés aux lecteurs d'écran, et l'ombre du héros est
animable. Après toute modification du générateur :
`node tools/genere-svg.mjs && node tools/injecte-svg.mjs`.

### 5. Micro-typographie par script
Les insécables français (fine avant `;!?`, insécable avant `:`, guillemets,
milliers, nombre+unité) et les apostrophes typographiques sont appliqués par
`tools/typographie.mjs` — déterministe et idempotent. Écrire les contenus
« naturellement », puis rejouer le script. Il ne touche ni balises, ni
scripts, ni SVG (sauf attributs `data-glose`).

### 6. Motion : la doctrine de l'ombre
Voir `docs/brand/visual-bible.md` §4 et §8. Points non négociables :
- une seule écriture de `--sun-angle` par frame (quickSetter sur `:root`) ;
- pivots limités (inventaire commenté `/* PIVOTS */` par page dans
  `styles.css` §7) ; transforms uniquement ;
- interdits : box-shadow animé, filter animé, feTurbulence live ;
- `prefers-reduced-motion` réduit le mouvement, jamais les instruments.

### 7. Accessibilité
- Palette : seuls les couples listés dans `visual-bible.md` §1.4 sont
  autorisés. Tout nouveau couple passe par `node tools/contrast-check.mjs`.
- Glossaire : `<dfn data-glose="…">` reçoit tooltip accessible
  (hover + focus + Échap) via `main.js` ; les termes restent lisibles sans JS.
- Reveals : états initiaux appliqués seulement sous `html.a-js` — sans
  JavaScript, tout le contenu est visible.

## Dépendances

| Paquet | Version | Rôle | Mise à jour |
|---|---|---|---|
| gsap + ScrollTrigger | 3.15.0 | scrub de `--sun-angle`, ticker | copier `dist/*.min.js` depuis npm dans `assets/vendor/` |
| lenis | 1.3.26 | scroll lissé (lerp 0.095) | idem |
| Fraunces variable | v38 | tout le verbe (axes opsz/SOFT/WONK) | re-télécharger via l'API css2 de Google Fonts, régénérer `fonts.css` |
| Spline Sans Mono | v13 | tout le chiffré | idem |

## Vérifications avant merge

1. `npm test` — le moteur reste exact.
2. `node tools/genere-svg.mjs` — les heures tracées matchent toujours les specs.
3. `node tools/typographie.mjs` — idempotent (aucun diff attendu si déjà appliqué).
4. `node tools/shoot.mjs http://127.0.0.1:4200 <dossier> "" savoir-faire/ creations/ atelier/ methode-tarifs/ contact/ 404.html`
   — zéro erreur console, contrôle visuel desktop + mobile.
