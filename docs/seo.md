# SEO — Atelier Méridienne

> Livrable SEO complet pour le site vitrine fictif `atelier-meridienne.fr`.
> Conforme au concept lock : aucun faux label, aucune fausse statistique, aucun faux avis,
> **noindex par défaut** (site fictif), palette/ton/perf verrouillés.
> Toutes les longueurs de `title` (<60 car.) et `meta description` (<155 car.) ont été
> vérifiées computationnellement (script `count.py`, sortie en fin de document).

---

## 1. Stratégie sémantique

### 1.1 L'univers sémantique réel du secteur

Le secteur existe : la gnomonique est une niche à très faible volume mais à intention
extrêmement qualifiée (achat « d'une fois dans une vie », paniers 900 € → 28 000 €).
La concurrence SERP est faible et hétérogène (associations savantes, pages patrimoine,
quelques artisans cadraniers). La stratégie n'est donc pas le volume : c'est la
**couverture exhaustive d'une petite galaxie de requêtes** + l'autorité topique
(E-E-A-T par la précision du vocabulaire métier, exactement ce que le ton de voix impose).

Cinq grappes (clusters) :

| Grappe | Requêtes-mères | Intention dominante | Page cible |
|---|---|---|---|
| **Métier / création** | cadran solaire mural, cadran solaire peint, création cadran solaire sur mesure, cadranier, gnomoniste, cadran solaire vertical déclinant | Commerciale | Accueil, Créations |
| **Science / gnomonique** | gnomonique, calcul cadran solaire, déclinaison d'un mur, heure solaire vraie, équation du temps, analemme, méridienne, style polaire | Informationnelle | Savoir-faire |
| **Fresque / technique** | fresque murale extérieure, peinture a fresco, fresquiste, enduit à la chaux, intonaco, sinopia, pigments naturels façade | Informationnelle → commerciale | Savoir-faire, Créations |
| **Patrimoine / restauration** | restauration cadran solaire ancien, restauration fresque façade, patrimoine Hautes-Alpes, ABF façade, sondages stratigraphiques | Commerciale (communes, architectes) | Créations, Méthode & tarifs |
| **Territoire** | cadrans solaires du Queyras, cadrans solaires Hautes-Alpes, Zarbula, Saint-Véran cadran solaire, Molines-en-Queyras | Informationnelle / locale | Accueil, L'Atelier |

**Note Zarbula** : « Zarbula cadran solaire » est l'aimant informationnel n°1 de la niche.
On le capte par un contenu d'admiration explicite (Créations / L'Atelier), **jamais** par
une filiation revendiquée — conforme au lock. Formulation type : « dans une vallée que
Zarbula a couverte de soleils peints » — pas « héritiers de Zarbula ».

### 1.2 Intentions par page (mapping)

| Page | Intention | Requête type |
|---|---|---|
| Accueil | Navigationnelle + commerciale locale | « atelier cadran solaire Queyras » |
| Savoir-faire | Informationnelle experte | « comment calculer un cadran solaire vertical » |
| Créations | Inspirationnelle → commerciale | « cadran solaire peint façade maison » |
| L'Atelier | Confiance / E-E-A-T | « qui fabrique des cadrans solaires dans les Alpes » |
| Méthode & tarifs | Transactionnelle-informationnelle | « prix cadran solaire peint », « autorisation cadran façade » |
| Contact | Transactionnelle | « devis cadran solaire » |

### 1.3 Longue traîne crédible (volumes qualitatifs — jamais de chiffres inventés)

| Requête longue traîne | Volume (qualitatif) | Page / section cible |
|---|---|---|
| prix d'un cadran solaire peint sur façade | faible, très qualifié | Méthode & tarifs (3 exemples) |
| faire peindre un cadran solaire sur sa maison | faible | Accueil → Contact |
| restaurer un cadran solaire ancien sur une grange | très faible, qualifié | Créations (exemple grange) |
| cadran solaire vertical déclinant calcul du tracé | très faible, expert | Savoir-faire (curseur de déclinaison) |
| déclinaison gnomonique d'un mur comment la mesurer | très faible, expert | Savoir-faire (geste « relever ») |
| autorisation ABF cadran solaire façade secteur protégé | très faible, décisive | Méthode & tarifs (FAQ + démarches) |
| artisan fresquiste Hautes-Alpes façade | faible | L'Atelier |
| devise de cadran solaire signification exemples | moyen (curiosité) | Créations (devises intégrées) |
| heure solaire vraie différence heure légale | moyen (curiosité) | Savoir-faire (glossaire) |
| cadran solaire Queyras itinéraire villages | moyen (tourisme) | L'Atelier (la vallée) — capte puis qualifie |
| fresque a fresco extérieure durée de vie entretien | très faible | Méthode & tarifs (FAQ) |
| étude gnomonique tarif | quasi nul, 100 % transactionnel | Contact + Service JSON-LD |

Les requêtes « curiosité » (devises, heure vraie, Queyras tourisme) ne convertissent pas
directement : elles construisent l'autorité topique du domaine et alimentent le maillage
vers les pages commerciales.

### 1.4 Maillage interne

Modèle **étoile + chaînage contextuel**, 6 pages seulement : chaque lien doit être
intentionnel.

- **CTA persistant** (header + fin de chaque page) → `/contact/`, ancre stable :
  « Demander une étude — dès 900 € ». C'est le produit d'appel du lock ; l'ancre
  contient le nom du service, pas « contactez-nous ».
- **Accueil** → Savoir-faire (« comment nous calculons un cadran »), Créations
  (« voir les planches »), Méthode & tarifs (« méthode et tarifs »).
- **Savoir-faire** → Méthode & tarifs (sous le curseur de déclinaison : « ce relevé est
  la première étape de toute commande ») ; → Créations (« quatre gestes, quatre murs »).
- **Créations** → Méthode & tarifs (depuis chaque planche : « voir les exemples de
  prix ») ; chaque carte-planche → Contact.
- **L'Atelier** → Savoir-faire (l'anecdote des 4° pointe vers le curseur de déclinaison :
  ancre `/savoir-faire/#curseur-declinaison`) ; → Créations.
- **Méthode & tarifs** → Contact (CTA final) ; gloses → ancres du glossaire.
- **Glossaire inline** : chaque terme glosé (gnomon, style polaire, déclinaison, heure
  vraie, intonaco, giornata…) est un lien vers son ancre dans `/savoir-faire/`
  (`#gnomon`, `#heure-vraie`…). Faible poids SEO, forte cohérence topique et UX.
- **Footer** : navigation complète (6 liens, ancres = noms de pages) + mention
  « Site fictif — projet d'étude ».
- **Règles d'ancres** : descriptives, variées, jamais « cliquez ici » / « en savoir
  plus » seuls ; un lien contextuel = une intention.

**Canoniques** : chaque page porte
`<link rel="canonical" href="https://atelier-meridienne.fr/…/">` en URL absolue,
auto-référente. URLs en répertoires avec slash final (`/savoir-faire/` → `index.html`),
sans accents, en minuscules. Une seule langue (fr) : pas de hreflang (une version `it`
Piémont est une piste d'évolution, pas un livrable).

---

## 2. Balisage par page

> H1 : sur l'Accueil, la DA impose la tagline en héros. Le H1 reste donc la devise ;
> le descripteur à mots-clés est le sous-titre visible immédiat (`<p class="lede">`),
> et le `title` porte la requête. Pas de texte caché « pour le SEO » (sr-only bourré de
> mots-clés = spam). Ce compromis est standard pour une home de marque.

### 2.1 Accueil — `/`

| Champ | Valeur |
|---|---|
| Slug | `/` |
| Title (53) | `Atelier Méridienne — Cadrans solaires muraux, Queyras` |
| Meta description (137) | `Conception, calcul et peinture a fresco de cadrans solaires muraux à Molines-en-Queyras. Étude gnomonique dès 900 €. L'ombre ne ment pas.` |
| H1 | `Nous peignons l'heure vraie.` (+ sous-titre visible : « Cadrans solaires muraux calculés et peints a fresco — Molines-en-Queyras, Hautes-Alpes. ») |
| og:title | `Nous peignons l'heure vraie.` |
| og:description | `Cadrans solaires muraux calculés et peints a fresco dans le Queyras — l'un des derniers ateliers de gnomonique et de fresque.` |
| Fil d'Ariane | aucun (racine) — pas de BreadcrumbList sur la home |

### 2.2 Savoir-faire — `/savoir-faire/`

| Champ | Valeur |
|---|---|
| Slug | `/savoir-faire/` |
| Title (57) | `Savoir-faire — gnomonique et fresque \| Atelier Méridienne` |
| Meta description (135) | `Relever, tracer, peindre, régler : quatre gestes pour un cadran calculé au degré près, de la déclinaison du mur à la dernière giornata.` |
| H1 | `Relever, tracer, peindre, régler.` |
| og:title | `Relever, tracer, peindre, régler` |
| og:description | `Comment un cadran juste naît d'un mur : déclinaison relevée au degré près, tracé calculé, fresque sur enduit frais, réglage au soleil.` |
| Fil d'Ariane | Accueil › Savoir-faire |

### 2.3 Créations — `/creations/`

| Champ | Valeur |
|---|---|
| Slug | `/creations/` |
| Title (56) | `Créations — cadrans solaires peints \| Atelier Méridienne` |
| Meta description (141) | `Planches techniques de cadrans créés ou restaurés — grange, façade d'hôtel, cadran communal. Chaque tracé porte sa devise et ses coordonnées.` |
| H1 | `Cadrans solaires créés et restaurés` (sous-titre : « Chaque mur a son tracé, chaque cadran sa devise. ») |
| og:title | `Cadrans & devises` |
| og:description | `Des planches gnomoniques, des murs, des devises. Tracés, azimuts, déclinaisons : les specs en regard de la fresque.` |
| Fil d'Ariane | Accueil › Créations |

### 2.4 L'Atelier — `/atelier/`

| Champ | Valeur |
|---|---|
| Slug | `/atelier/` |
| Title (55) | `L'Atelier — géomètre et fresquiste \| Atelier Méridienne` |
| Meta description (143) | `Fondé en 2014 à Molines-en-Queyras par une géomètre-topographe et un fresquiste. Le récit d'un cadran de 1841 et d'une erreur de quatre degrés.` |
| H1 | `Une géomètre, un fresquiste, une vallée.` |
| og:title | `Une géomètre, un fresquiste, une vallée` |
| og:description | `L'histoire d'un cadran de 1841, d'une erreur de quatre degrés et d'une doctrine : recalculer avant de repeindre, toujours.` |
| Fil d'Ariane | Accueil › L'Atelier |

### 2.5 Méthode & tarifs — `/methode-tarifs/`

| Champ | Valeur |
|---|---|
| Slug | `/methode-tarifs/` (le mot « tarifs » dans le slug capte l'intention prix) |
| Title (59) | `Méthode & tarifs — commander un cadran \| Atelier Méridienne` |
| Meta description (134) | `Du relevé de déclinaison à la réception du cadran : étapes, délais, autorisations ABF, trois exemples de prix et questions fréquentes.` |
| H1 | `Commander un cadran, pas à pas.` |
| og:title | `Commander un cadran, pas à pas` |
| og:description | `Méthode, délais, démarches ABF et trois exemples de prix — de l'étude gnomonique à 900 € à la création complète a fresco.` |
| Fil d'Ariane | Accueil › Méthode & tarifs |

### 2.6 Contact / Demander une étude — `/contact/`

| Champ | Valeur |
|---|---|
| Slug | `/contact/` |
| Title (50) | `Demander une étude gnomonique \| Atelier Méridienne` |
| Meta description (135) | `Décrivez votre mur : orientation estimée, localisation, projet. Étude gnomonique à partir de 900 €, réponse sous quelques jours ouvrés.` |
| H1 | `Parlez-nous de votre mur.` |
| og:title | `Parlez-nous de votre mur` |
| og:description | `Orientation, village, projet : trois lignes suffisent pour commencer. Étude gnomonique à partir de 900 €.` |
| Fil d'Ariane | Accueil › Demander une étude |

### 2.7 Page 404 — `/404.html`

| Champ | Valeur |
|---|---|
| Slug | `/404.html` (page d'erreur servie par l'hébergeur ; **jamais dans le sitemap**) |
| Title (37) | `Page introuvable — Atelier Méridienne` |
| Meta description (120) | `Ce mur est exposé plein nord : aucune heure ne s'y lit. Reprenez le sentier vers l'accueil, les créations ou la méthode.` |
| H1 | `Ce mur est exposé plein nord.` (reprend la ligne d'honnêteté du lock — un mur plein nord ne porte jamais de cadran, une 404 ne porte jamais de page) |
| og:title | `Ce mur est exposé plein nord` |
| og:description | `Rien ne se lit ici. Retour vers l'heure vraie.` |
| Fil d'Ariane | aucun (pas de BreadcrumbList) ; `noindex` permanent, même en usage réel ; liens de sortie : Accueil, Créations, Méthode & tarifs |

> **Préfixes OG communs à toutes les pages** : `og:type=website`, `og:locale=fr_FR`,
> `og:site_name=Atelier Méridienne`, `og:url` = canonique,
> `og:image=https://atelier-meridienne.fr/assets/og/og-<page>.png` (1200×630, PNG —
> les scrapers sociaux ne lisent pas le SVG ; ces PNG ne sont jamais chargés par les
> pages elles-mêmes, le budget « aucune image raster lourde » du lock reste respecté).
> `twitter:card=summary_large_image`.

---

## 3. JSON-LD prêts à coller

Éthique respectée : **aucun `aggregateRating`, aucun `review`**, aucun prix gonflé,
aucun label. Le téléphone utilise la tranche `04 65 71 XX XX` **réservée par l'ARCEP aux
œuvres de fiction** (zone sud-est) : aucun risque de collision avec un vrai numéro.
Les coordonnées géo sont celles du village (44°58′N 6°51′E, cohérentes avec la DA),
pas d'adresse postale précise inventée.

### 3.1 `LocalBusiness` — sur l'Accueil et la page Contact

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://atelier-meridienne.fr/#atelier",
  "name": "Atelier Méridienne",
  "slogan": "Nous peignons l'heure vraie.",
  "description": "Atelier de gnomonique et de fresque : conception, calcul, peinture a fresco et restauration de cadrans solaires muraux. L'un des derniers ateliers réunissant le relevé de géomètre et le geste de fresquiste.",
  "url": "https://atelier-meridienne.fr/",
  "email": "bonjour@atelier-meridienne.fr",
  "telephone": "+33 4 65 71 20 14",
  "foundingDate": "2014",
  "founder": [
    { "@type": "Person", "name": "Élise Bérard", "jobTitle": "Géomètre-topographe" },
    { "@type": "Person", "name": "Marco Vayr", "jobTitle": "Fresquiste" }
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Molines-en-Queyras",
    "postalCode": "05350",
    "addressRegion": "Hautes-Alpes",
    "addressCountry": "FR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 44.9667, "longitude": 6.85 },
  "areaServed": [
    { "@type": "Country", "name": "France" },
    { "@type": "AdministrativeArea", "name": "Suisse romande" },
    { "@type": "AdministrativeArea", "name": "Piémont" }
  ],
  "priceRange": "900 € – 28 000 €",
  "currenciesAccepted": "EUR",
  "knowsAbout": [
    "gnomonique", "cadran solaire vertical déclinant", "fresque a fresco",
    "déclinaison gnomonique", "restauration de cadrans solaires",
    "heure solaire vraie", "équation du temps"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Prestations",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "@id": "https://atelier-meridienne.fr/methode-tarifs/#etude-gnomonique" },
        "priceSpecification": { "@type": "PriceSpecification", "minPrice": 900, "priceCurrency": "EUR" }
      },
      {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": "Création complète a fresco", "serviceType": "Création de cadran solaire mural peint a fresco" },
        "priceSpecification": { "@type": "PriceSpecification", "minPrice": 6500, "maxPrice": 28000, "priceCurrency": "EUR", "valueAddedTaxIncluded": true }
      },
      {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": "Restauration de cadran ancien", "serviceType": "Restauration de cadran solaire et de fresque après sondages stratigraphiques" }
      }
    ]
  },
  "image": "https://atelier-meridienne.fr/assets/og/og-accueil.png"
}
</script>
```

> Pourquoi `LocalBusiness` générique : aucun sous-type schema.org ne couvre
> l'artisanat d'art (pas de type « atelier »). Le générique + `knowsAbout` +
> `hasOfferCatalog` est plus juste qu'un `HomeAndConstructionBusiness` approximatif.
> Pas d'`openingHoursSpecification` : l'atelier reçoit sur rendez-vous, on ne fabrique
> pas de faux horaires.

### 3.2 `WebSite` — sur l'Accueil uniquement

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://atelier-meridienne.fr/#website",
  "url": "https://atelier-meridienne.fr/",
  "name": "Atelier Méridienne",
  "inLanguage": "fr-FR",
  "publisher": { "@id": "https://atelier-meridienne.fr/#atelier" }
}
</script>
```

> Pas de `potentialAction: SearchAction` : le site n'a pas de recherche interne,
> on ne déclare pas une capacité qui n'existe pas.

### 3.3 `BreadcrumbList` — une par page intérieure (jamais home ni 404)

```html
<!-- /savoir-faire/ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://atelier-meridienne.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Savoir-faire", "item": "https://atelier-meridienne.fr/savoir-faire/" }
  ]
}
</script>

<!-- /creations/ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://atelier-meridienne.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Créations", "item": "https://atelier-meridienne.fr/creations/" }
  ]
}
</script>

<!-- /atelier/ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://atelier-meridienne.fr/" },
    { "@type": "ListItem", "position": 2, "name": "L'Atelier", "item": "https://atelier-meridienne.fr/atelier/" }
  ]
}
</script>

<!-- /methode-tarifs/ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://atelier-meridienne.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Méthode & tarifs", "item": "https://atelier-meridienne.fr/methode-tarifs/" }
  ]
}
</script>

<!-- /contact/ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://atelier-meridienne.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Demander une étude", "item": "https://atelier-meridienne.fr/contact/" }
  ]
}
</script>
```

Le fil d'Ariane visible correspondant est un `<nav aria-label="Fil d'Ariane">` avec
`<ol>` ; le séparateur « › » est en CSS (`::after`), pas dans le HTML.

### 3.4 `FAQPage` — sur `/methode-tarifs/` uniquement (la FAQ y est visible)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Combien coûte un cadran solaire peint ?",
      "acceptedAnswer": { "@type": "Answer", "text": "L'étude gnomonique seule (relevé de déclinaison, tracé calculé, planche vectorielle signée) démarre à 900 €. Une création complète a fresco se situe entre 6 500 et 28 000 € TTC selon la surface, la technique, le style forgé et l'échafaudage. Une restauration s'estime sur devis, après sondages stratigraphiques. Trois exemples chiffrés sont détaillés sur cette page." }
    },
    {
      "@type": "Question",
      "name": "Mon mur peut-il recevoir un cadran ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Presque tous les murs qui voient le soleil une partie de l'année le peuvent — est, sud, ouest, même très déclinants. Un mur exposé plein nord ne portera jamais de cadran : nous le disons avant tout devis. Le relevé de déclinaison tranche la question en une visite." }
    },
    {
      "@type": "Question",
      "name": "Faut-il une autorisation pour peindre un cadran sur une façade ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui : la modification de l'aspect extérieur d'un bâtiment demande une déclaration préalable en mairie. En secteur protégé (abords de monument historique, site patrimonial remarquable), l'avis de l'Architecte des Bâtiments de France est requis. Nous préparons les pièces graphiques du dossier avec vous." }
    },
    {
      "@type": "Question",
      "name": "Quels sont les délais ?",
      "acceptedAnswer": { "@type": "Answer", "text": "L'étude gnomonique demande quelques semaines, relevé compris. La peinture a fresco exige un enduit hors gel : en altitude, les chantiers se tiennent de la fin du printemps au début de l'automne. Entre le premier contact et la réception, il faut compter en mois — un cadran se cale sur le calendrier du soleil, pas l'inverse." }
    },
    {
      "@type": "Question",
      "name": "Où intervenez-vous ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Depuis Molines-en-Queyras : Hautes-Alpes et arc alpin d'abord, France entière, Suisse romande et Piémont. Au-delà, nous étudions au cas par cas — le déplacement et l'échafaudage entrent alors au devis." }
    },
    {
      "@type": "Question",
      "name": "Comment vieillit un cadran peint a fresco ?",
      "acceptedAnswer": { "@type": "Answer", "text": "La fresque fait corps avec l'enduit : la chaux carbonatée protège les pigments pour des décennies — les cadrans du Queyras du XIXe siècle en témoignent encore. Aucun entretien courant, jamais de nettoyage haute pression ; une inspection après un épisode climatique sévère, et des retouches restent possibles giornata par giornata." }
    }
  ]
}
</script>
```

> Réalisme : depuis 2023, Google réserve l'affichage enrichi FAQ à une poignée de sites
> d'autorité — ce balisage n'apportera probablement **pas** de rich snippet. On le pose
> quand même : il est sémantiquement juste, coûte zéro octet significatif, et sert les
> moteurs de réponse / LLM qui consomment le JSON-LD.

### 3.5 `Service` — l'étude gnomonique, sur `/methode-tarifs/` (repris par `@id` ailleurs)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://atelier-meridienne.fr/methode-tarifs/#etude-gnomonique",
  "name": "Étude gnomonique",
  "serviceType": "Étude gnomonique : relevé de déclinaison et tracé calculé de cadran solaire",
  "description": "Relevé de la déclinaison gnomonique du mur, calcul du tracé horaire pour ce mur unique (latitude, longitude, déclinaison), planche vectorielle signée. Livrable autonome, préalable à toute création ou restauration.",
  "provider": { "@id": "https://atelier-meridienne.fr/#atelier" },
  "areaServed": [
    { "@type": "Country", "name": "France" },
    { "@type": "AdministrativeArea", "name": "Suisse romande" },
    { "@type": "AdministrativeArea", "name": "Piémont" }
  ],
  "offers": {
    "@type": "Offer",
    "url": "https://atelier-meridienne.fr/contact/",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "minPrice": 900,
      "priceCurrency": "EUR"
    },
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

> `minPrice` sans `price` fixe encode honnêtement le « à partir de 900 € ».
> Ni note, ni avis, ni compteur de clients : la preuve, c'est la planche signée.

---

## 4. Fichiers d'infrastructure

### 4.1 `sitemap.xml` (racine du site)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Atelier Méridienne — sitemap.
     Site fictif actuellement en noindex : ce fichier est inerte tant que la balise
     meta robots n'est pas retirée. Il est prêt pour un éventuel usage réel
     (déclaration dans la Search Console après retrait du noindex).
     lastmod à mettre à jour à chaque modification substantielle de contenu.
     changefreq/priority omis : les moteurs modernes les ignorent,
     seul lastmod fait foi. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://atelier-meridienne.fr/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
  <url>
    <loc>https://atelier-meridienne.fr/savoir-faire/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
  <url>
    <loc>https://atelier-meridienne.fr/creations/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
  <url>
    <loc>https://atelier-meridienne.fr/atelier/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
  <url>
    <loc>https://atelier-meridienne.fr/methode-tarifs/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
  <url>
    <loc>https://atelier-meridienne.fr/contact/</loc>
    <lastmod>2026-08-31</lastmod>
  </url>
</urlset>
```

La 404 n'y figure pas (une page d'erreur n'est jamais une URL indexable).

### 4.2 `robots.txt` (racine du site)

```txt
# Atelier Méridienne — site fictif (projet d'étude).
# Le crawl reste OUVERT à dessein : la désindexation est portée par la balise
# <meta name="robots" content="noindex"> présente sur chaque page.
# Ne JAMAIS remplacer ce dispositif par « Disallow: / » : un crawl bloqué
# empêcherait les moteurs de lire la directive noindex, et des URLs pourraient
# rester indexées « à l'aveugle » (sans description) via des liens externes.
# Ne jamais bloquer /assets/ : JS et CSS sont nécessaires au rendu des pages.

User-agent: *
Allow: /

Sitemap: https://atelier-meridienne.fr/sitemap.xml
```

### 4.3 Stratégie noindex (bloc à coller dans le `<head>` de CHAQUE page)

```html
<!--
  SITE FICTIF — « Atelier Méridienne » est un projet d'étude ; l'entreprise,
  ses fondateurs et ses réalisations n'existent pas.
  La balise ci-dessous exclut volontairement la page de l'indexation :
  1) un faux artisan ne doit pas apparaître dans les résultats locaux du Queyras
     ni capter des requêtes destinées à de vrais cadraniers et fresquistes ;
  2) le JSON-LD LocalBusiness (adresse, téléphone, prix) ne doit alimenter
     aucun index, aucun agrégateur, aucune carte ;
  3) des visiteurs réels pourraient sinon demander de vrais devis.
  EN CAS D'USAGE RÉEL : supprimer cette balise sur les 6 pages (la conserver
  sur /404.html), vérifier que robots.txt autorise toujours le crawl, déclarer
  sitemap.xml dans la Search Console, puis demander l'indexation des pages clés.
-->
<meta name="robots" content="noindex">
```

**Justification du mécanisme** : le `noindex` doit être une **balise meta lisible**, pas
un `Disallow` dans robots.txt. Un `Disallow: /` interdit la lecture des pages mais pas
leur indexation : une URL bloquée mais liée depuis l'extérieur peut apparaître en SERP
sous forme « nue ». Seule la balise meta (ou l'en-tête `X-Robots-Tag: noindex`, à
doubler côté hébergeur si possible — utile pour sitemap.xml et les PDF éventuels)
garantit l'exclusion. Le commentaire HTML rend la décision auditable par quiconque
ouvre le code source : la fiction est assumée jusque dans le `<head>`.
La 404 garde son `noindex` **en toutes circonstances**, usage réel compris.

---

## 5. Performance SEO — Core Web Vitals spécifiques à ce site

Objectifs verrouillés par le lock : LCP < 2 s, JS < 150 Ko gzip hors vendor,
aucune image raster lourde. Traduction CWV page par page :

### 5.1 Fonts (Fraunces variable + Spline Sans Mono)

- **Self-héberger** les deux familles en woff2 (pas de `fonts.googleapis.com` au
  runtime) : supprime une connexion tierce entière du chemin critique du LCP —
  le LCP probable étant le H1 en Fraunces, la police EST le chemin critique.
- **Sous-ensembles stricts** : latin + ponctuation française (« » ’ — …),
  primes ′ ″ (U+2032/2033 pour 44°58′N), degré °, €. Vérifier que le subset
  **conserve les petites capitales** (feature `smcp`) : les chiffres romains d'heures
  en petites caps sont une signature DA — un subset agressif les détruit.
- **Deux fichiers Fraunces maximum** (texte opsz bas / display opsz 144), axes limités
  à ceux réellement utilisés (opsz, SOFT, WONK ; figer wght si un seul poids sert).
  Spline Sans Mono : un seul fichier, wght figé.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` pour les 2–3 fichiers
  au-dessus de la ligne de flottaison, `font-display: swap` **plus** métriques de
  compensation sur les fallbacks (`size-adjust`, `ascent-override`, `descent-override`
  sur une `@font-face` fallback Georgia/monospace) : le swap ne provoque alors aucun
  décalage mesurable → CLS ≈ 0 d'origine typographique.

### 5.2 LCP — le hero au Cadran Vivant

- **Le cadran SVG doit être inline dans le HTML**, état initial complet (table, lignes
  horaires, chiffres, ombre au « midi vrai simulé ») **rendu sans JavaScript**.
  `gnomonique.js` ne fait qu'orienter l'ombre à l'heure réelle après coup : si le
  tracé attendait le JS, le LCP deviendrait dépendant du réseau + parse + exécution.
- Le candidat LCP sera le bloc H1 (texte) ou le SVG : dans les deux cas, zéro requête
  réseau (SVG inline, fonts préchargées) → LCP < 2 s tenable même en 4G.
- **CSS critique inline** (tokens, layout du hero, `@font-face`) dans le `<head>` ;
  le reste de la feuille en fichier unique (site 6 pages : une seule CSS, cache chaud
  dès la 2e page). Aucun `@import`.
- GSAP / ScrollTrigger / Lenis vendorisés : chargés en `<script type="module">` (defer
  natif), **jamais** en bloquant avant le hero. La chorégraphie d'entrée (visual bible
  §8.2) s'exécute après First Paint — l'état statique peint d'abord, l'animation habille.
- La tuile de grain (PNG 256 précalculé) : servie en fichier avec
  `Cache-Control: immutable`, pas en data-URI dans la CSS critique (elle n'est pas
  critique et gonflerait le HTML de chaque page).
- Preconnect : aucun nécessaire si tout est self-hébergé — c'est le but.

### 5.3 CLS

- **SVG dimensionnés** : `viewBox` + `aspect-ratio` CSS (ou width/height HTML) sur le
  Cadran Vivant, les planches de Créations, les épures de Savoir-faire — l'espace est
  réservé avant tout rendu.
- **Données injectées par JS** (heure vraie, coordonnées, azimuts) : conteneurs à
  largeur réservée en `ch` (Spline Sans Mono est à chasse fixe : n caractères = n ch),
  `min-height` posé. Le mono-data « apparaît sans animation » (DA) — il doit aussi
  apparaître **sans pousser** ce qui l'entoure.
- **Bascule jour/nuit du hero** (« voir le ciel de cette nuit ») : les deux états
  occupent exactement la même boîte ; on permute des calques (`opacity`/`visibility`),
  jamais la hauteur.
- **Montants qui « chiffrent » sur Méthode & tarifs** : chiffres tabulaires
  (`font-variant-numeric: tabular-nums`, natif en mono) et largeur figée au montant
  final — l'animation change le contenu, jamais la géométrie.
- **Reveals clip-path** : le clip-path ne déclenche ni layout ni CLS — c'est
  précisément pourquoi la DA l'a choisi ; ne jamais le remplacer par des reveals en
  `height`/`margin`.
- Aucune bannière/embed tiers, aucune pub, pas de consentement cookie si le site reste
  sans traceur (recommandé : zéro cookie, mesure d'audience sans cookie ou rien) :
  les sources classiques de CLS tardif sont structurellement absentes.

### 5.4 INP (bonus, même budget)

- `--sun-angle` au scroll : mise à jour via `requestAnimationFrame` unique +
  périmètre déjà verrouillé (5–6 pivots, transforms only) ; listeners `passive`.
- Le curseur de déclinaison (Savoir-faire) recalcule la dérive via `gnomonique.js` :
  calcul pur O(1), aucun layout dans le handler — viser < 50 ms par interaction.
- `prefers-reduced-motion` déjà traité par le lock : scroll natif = INP plancher.

---

## Annexe — preuve des longueurs (sortie de `count.py`)

```
T1:  53 / <60   OK    D1: 137 / <155  OK   (Accueil)
T2:  57 / <60   OK    D2: 135 / <155  OK   (Savoir-faire)
T3:  56 / <60   OK    D3: 141 / <155  OK   (Créations)
T4:  55 / <60   OK    D4: 143 / <155  OK   (L'Atelier)
T5:  59 / <60   OK    D5: 134 / <155  OK   (Méthode & tarifs)
T6:  50 / <60   OK    D6: 135 / <155  OK   (Contact)
T7:  37 / <60   OK    D7: 120 / <155  OK   (404)
```
