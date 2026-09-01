# CONCEPT LOCK — Atelier Méridienne (décision finale du directeur de création)

## Identité
- **Nom** : Atelier Méridienne. **Tagline** : « Nous peignons l'heure vraie. »
- **Métier** : gnomonique et fresque murale — conception, calcul, peinture a fresco et restauration de cadrans solaires muraux.
- **Lieu** : Molines-en-Queyras, vallée de l'Aigue Blanche, Hautes-Alpes (05). Héritage réel documenté : le Queyras a la plus forte densité de cadrans solaires peints de France (fresquiste Zarbula, XIXe — admiration explicite, AUCUNE filiation inventée).
- **Positionnement** : « instrumentiers de façade » — un cadran n'est pas un décor mais un instrument scientifique peint, calculé au degré près pour un mur unique. Mi-atelier de fresquiste, mi-cabinet de géomètre. Devise implicite : « l'ombre ne ment pas ».
- **Formulation d'unicité** : « l'un des derniers ateliers » — JAMAIS « le seul ».
- **Fondateurs (fictifs, assumés)** : Élise Bérard, géomètre-topographe ; Marco Vayr, fresquiste (10 ans de chantiers de restauration entre Piémont et Vaucluse). Fondation 2014.
- **Récit fondateur (version EXACTE, obligatoire)** : été 2012, restauration du cadran de 1841 sur la grange familiale à Saint-Véran ; le relevé révèle que la déclinaison du mur avait été estimée avec ~4° d'erreur. Conséquence énoncée avec exactitude : une erreur de lecture VARIABLE selon l'heure et la saison — quasi nulle à certains midis, jusqu'à ~20 minutes aux extrêmes (le chiffre final sera CALCULÉ par notre moteur et injecté). Doctrine née de l'anecdote : « recalculer avant de repeindre, toujours. »

## Offre & prix (affichés franchement)
- Étude gnomonique seule (relevé de déclinaison, tracé calculé, planche vectorielle signée) : à partir de 900 € — PRODUIT D'APPEL, CTA persistant sur tout le site.
- Création complète a fresco : 6 500 – 28 000 € TTC selon surface, technique, style forgé, échafaudage.
- Restauration : sur devis après sondages stratigraphiques.
- 3 exemples incarnés obligatoires (grange ~2 m², façade d'hôtel, restauration communale) avec fourchettes HT/TTC.
- Ligne d'honnêteté : « Un mur exposé plein nord ne portera jamais de cadran — nous le disons avant tout devis. »

## Clientèle
Propriétaires alpins, hôtels/refuges, communes & fondations (patrimoine), architectes du patrimoine. France, Suisse romande, Piémont. Achat d'une fois dans une vie : le site doit rassurer, prouver, guider.

## Ton de voix
Exact, lent, solaire-laconique, savant sans surplomb. Première personne du pluriel, présent de l'indicatif. Phrases courtes, affirmatives, comme des devises de cadran. Vocabulaire métier précis et TOUJOURS glosé (glossaire inline) : gnomon, style polaire, sous-stylaire, analemme, équation du temps, déclinaison gnomonique, intonaco, sinopia, giornata, heure vraie.

## Palette (tokens verrouillés — contrastes à valider WCAG AA computationnellement)
- `--chaux` #F5F0E6 (fond clair principal)
- `--bistre` #1C1A17 (encre, fond nocturne)
- `--ocre-lumiere` #C8951F (DÉCORATIF UNIQUEMENT : traits, ombres de soleil, aplats — jamais du texte sur chaux)
- `--ocre-encre` : ocre foncé ≥ 4,5:1 sur chaux (autour de #7A5808–#8A6410, valider) — CTA et liens sur fond clair
- `--sang` #A63D2F (chiffres peints, accents — vérifier contraste selon usage texte, sinon décliner foncé)
- `--bleu-charrette` #35566B (filets, frises, liens secondaires — vérifier)
- `--gris-ombre` #7A756B (JAMAIS pour du texte informatif — décoratif seulement ; textes secondaires dans un ton plus foncé validé AA)
- Nuit : fond #14161A, encre #F5F0E6, ocre désaturé #B08A3E (décoratif), équivalents AA pour le texte.
- Règle : max deux accents par écran. L'ocre = ce qui reçoit la lumière ; le sang = ce qui est peint.

## Typographies (Google Fonts uniquement)
- **Fraunces** (variable, opsz 9–144, axes SOFT/WONK) : tout le verbe. Titres monumentaux opsz 144 WONK on ; texte courant opsz réglé bas. Chiffres romains d'heures en petites capitales.
- **Spline Sans Mono** : tout le chiffré — coordonnées (44°58′N 6°51′E), azimuts, déclinaisons, heures, prix, légendes techniques, labels d'interface.
- Contraste signature : devise peinte en Fraunces / relevé calculé en Spline Sans Mono, côte à côte.

## Motion (contraintes de perf NON NÉGOCIABLES)
- Rien ne bondit : tout pivote ou glisse comme une ombre. Aucun bounce/overshoot.
- Lenis lerp ~0.09–0.1. Reveals majeurs 700–1000 ms cubic-bezier(0.65,0,0.35,1) ; micro-interactions 180–240 ms cubic-bezier(0.33,1,0.68,1).
- Reveals de texte par balayage de clip-path oblique (une ombre qui se retire).
- `--sun-angle` : variable globale pilotée au scroll MAIS périmètre limité à 5–6 éléments pivotants par page, ombres = éléments SVG/pseudo-éléments TRANSFORMÉS uniquement. INTERDIT : box-shadow animé, filter/drop-shadow animé, feTurbulence live plein écran (grain = tuile PNG précalculée en data-URI ou fichier).
- transform-origin toujours explicite « au gnomon » (point d'ancrage visible).
- prefers-reduced-motion : scroll natif, ombres figées à 15 h solaires, zéro autoplay.
- Anti-monotonie : chaque page a UNE pièce interactive propre (voir pages) ; les durées ne sont pas uniformes.

## Double temporalité (résolue)
- Le HERO seul affiche l'heure solaire vraie réelle (l'instrument, calculé pour Molines par défaut).
- La course du soleil au scroll est étiquetée en mono, mention persistante : « course simulée — solstice d'été ». « L'ombre ne ment pas » reste vrai à la lettre.
- Nuit réelle à Molines : le hero sert PAR DÉFAUT le cadran au midi vrai simulé (étiqueté « midi vrai simulé »), avec bascule opt-in « voir le ciel de cette nuit » (analemme + mention). Jamais d'écran d'absence.
- Géolocalisation : JAMAIS de prompt à l'arrivée. Bouton explicite « calculer pour mon ciel » (opt-in), repli manuel élégant.

## Pièces interactives par page
1. **Accueil** : Le Cadran Vivant — cadran vertical déclinant génératif fonctionnel (SVG), équations gnomoniques exactes, ombre du style à la position solaire réelle de l'instant.
2. **Savoir-faire** : scrollytelling « quatre gestes » (relever / tracer / peindre / régler) + **le Curseur de déclinaison** : slider qui fausse le tracé de 0 à 4° et affiche la dérive de lecture au fil de l'année (l'anecdote fondatrice prouvée en dix secondes).
3. **Créations** : planches SVG techniques de 4–5 cadrans fictifs, chacun avec SA devise intégrée (la page Devises est fusionnée ici), specs en mono.
4. **L'Atelier** : récit fondateur, les deux mains (géomètre/fresquiste), la vallée ; extraits de carnet limités à 3 « giornate » datées présentées comme extraits (pas un blog vivant).
5. **Méthode & tarifs** : parcours de commande pas à pas, démarches (ABF/secteur protégé, autorisations, délais, zone d'intervention, assurance), 3 exemples de prix, FAQ.
6. **Contact / Demander une étude** : formulaire riche (type de projet, mur et orientation estimée, localisation, message), coordonnées, mention fictive.

## Éthique de la fiction (obligatoire)
- Aucun faux label, fausse certification, fausse statistique, faux témoignage nommé, aucune filiation revendiquée avec des personnes/institutions réelles.
- Footer : mention discrète « Site fictif — projet d'étude » ; page contact : mention visible.
- Meta robots noindex par défaut (commentée pour explication dans le code).
- La crédibilité vient du récit, du vocabulaire métier exact, de la précision des chiffres calculés.

## Architecture technique
Site statique multi-pages sans build : HTML sémantique, CSS moderne (custom properties, layers, container queries si utile), ES modules vanilla. GSAP + ScrollTrigger + Lenis vendorisés (npm → /assets/vendor). Google Fonts self-hébergées ou via fonts.googleapis (préconnect). Moteur gnomonique maison (`gnomonique.js`) avec équations validées et tests. Performance : LCP < 2 s, budget JS < 150 Ko gzippé hors vendor, aucune image raster lourde. Accessibilité AA.
