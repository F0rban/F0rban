# Organisation des projets — audit et réorganisation (2 septembre 2026)

Principe visé : **1 dépôt GitHub = 1 projet**. AGENCY OS reste séparé des sites ;
chaque site (client ou fictif) et chaque prototype vit dans son propre dépôt.

Ce document est le rapport de l'audit du dépôt `F0rban/F0rban`, la cartographie
des projets, l'architecture cible et les règles à respecter ensuite.

---

## 1. Ce qui a été découvert

### Sur GitHub (compte F0rban)

| Dépôt | Contenu réel | Remarque |
|---|---|---|
| `F0rban/F0rban` (public) | **3 projets différents, un par branche** | C'est le dépôt « profil » GitHub (« Config files for my GitHub profile »). Il n'a **pas de branche `main`**. |
| `F0rban/mon-projet` (privé) | **vide** (aucun commit) | Dernier push : novembre 2024. Inutilisé. |

### Les trois branches de `F0rban/F0rban`

| Branche | Projet | Commits | Fichiers | Base commune |
|---|---|---|---|---|
| `claude/premium-showcase-website-tm8yd1` (branche par défaut) | **Atelier Méridienne** — site vitrine fictif, 8 pages | 5 | 62 | — |
| `claude/premium-showcase-website-co0cyh` | **Tesson** — site vitrine fictif one page | 6 (= les 5 de Méridienne + 1) | 27 | construite **par-dessus** Méridienne : le commit Tesson supprime les fichiers Méridienne et met les siens à la place |
| `claude/ai-command-center-gelf0i` | **Bench** (ex « AI Command Center ») — prototype Next.js | 40 | 178 | historique orphelin, aucun lien avec les sites |

Aucune branche ne contient de configuration Claude Code (`.claude/`, `CLAUDE.md`,
`.mcp.json`), de skills ni de MCP. Seul Bench a un workflow CI
(`.github/workflows/deploy-pages.yml`) qui publie une preview GitHub Pages à
`https://f0rban.github.io/F0rban/` à chaque push sur sa branche.

### Ce qui N'EST PAS sur GitHub

D'après l'historique des sessions Claude Code, ces projets ont été travaillés
**sur ton Mac** (sessions « Remote Control » sur `macbook-air-de-ulysse`) et
n'ont jamais été poussés sur GitHub :

- **AGENCY OS** (session « AGENCY OS website template structure », 29 août)
- **Atelier Sillage** (sessions des 27, 29 août et 1er septembre)
- **Altis Étanchéité** (sessions des 30, 31 août et 1er septembre)
- **Memova** (design studio, audit et stabilisation — 31 août)
- Bibliothèque de skills / architecture skills (28–29 août)

Ils sont donc **hors de portée de cet audit** (impossible d'y accéder depuis
l'environnement cloud). Ils ne sont pas mélangés dans `F0rban/F0rban`. Voir
§ 5 pour les faire entrer proprement dans l'architecture cible.

### Le point dangereux

**PR #1** de `F0rban/F0rban` (« feat: site one page Tesson… ») propose de
fusionner la branche Tesson **dans** la branche Méridienne. La fusionner
**écraserait Atelier Méridienne** (43 fichiers supprimés, remplacés par Tesson).
Elle ne doit pas être fusionnée : les deux sites doivent vivre dans deux dépôts.

---

## 2. Cartographie

### ATELIER MÉRIDIENNE
- **Fichiers / dossiers** : `index.html`, `atelier/`, `contact/`, `creations/`,
  `methode-tarifs/`, `savoir-faire/`, `mentions/`, `404.html`, `assets/`
  (css, js dont le moteur gnomonique, fontes, SVG générés, OG, textures,
  vendor Lenis), `docs/` (concept, visual bible, prompts images, spec
  gnomonique, SEO, architecture), `tests/gnomonique.test.mjs`, `tools/` (9 scripts).
- **Technologie** : HTML/CSS/JS statique, sans build ; Node 22 pour tests et outillage.
- **État** : terminé (« 42 audits cleared »), `npm test` = 27/27.
- **Dépendances** : aucune dépendance npm à installer (Lenis vendorisé).
  Aucune référence à Tesson ni à Bench.
- **Dépôt actuel** : `F0rban/F0rban` @ `claude/premium-showcase-website-tm8yd1`
- **Dépôt recommandé** : `F0rban/atelier-meridienne`

### TESSON
- **Fichiers / dossiers** : `index.html`, `404.html`, `assets/` (css, js, 2
  fontes, favicon, OG, texture, vendor Lenis), `docs/` (concept, visual bible),
  `tests/murs.test.mjs`, `tools/` (générateur de murs `tools/lib/murs.mjs` + 6 scripts).
- **Technologie** : HTML/CSS/JS statique ; `npm run build` régénère les murs (idempotent).
- **État** : livré (PR #1 ouverte), `npm test` = 7/7.
- **Dépendances** : aucune dépendance npm à installer. Aucune référence à
  Méridienne ni à Bench (les fichiers Méridienne sont supprimés dans son arbre).
- **Dépôt actuel** : `F0rban/F0rban` @ `claude/premium-showcase-website-co0cyh`
- **Dépôt recommandé** : `F0rban/tesson`
- **Note** : son historique Git contient, en dessous, les 5 commits de
  Méridienne (il a été construit par-dessus). C'est conservé tel quel pour ne
  rien perdre ; c'est sans effet sur le site.

### BENCH (ex AI COMMAND CENTER)
- **Fichiers / dossiers** : `src/` (app Next.js : pages, composants, features,
  lib), `docs/` (product, architecture, design), `screenshots/`, `scripts/`
  (a11y, responsive, screenshot), `.github/workflows/deploy-pages.yml`,
  `AUTONOMOUS_PROGRESS.md`, `LICENSE` (MIT).
- **Technologie** : Next.js 15, React 19, TypeScript, Tailwind v4, Zustand,
  Vitest. Tout tourne dans le navigateur (aucun backend, aucune clé API).
- **État** : prototype v0.2.0, en évolution (session « AI Command Center SaaS
  prototype » encore ouverte). `typecheck` OK, `vitest` = 357/357, export
  statique OK.
- **Dépendances** : `package-lock.json`, `npm ci` (525 paquets). Aucune référence aux sites.
- **Dépôt actuel** : `F0rban/F0rban` @ `claude/ai-command-center-gelf0i`
- **Dépôt recommandé** : `F0rban/bench`

### AGENCY OS, ATELIER SILLAGE, ALTIS ÉTANCHÉITÉ, MEMOVA
- **Emplacement** : sur ton Mac uniquement (non poussés sur GitHub).
- **Dépôt actuel** : aucun.
- **Dépôt recommandé** : `F0rban/agency-os`, `F0rban/atelier-sillage`,
  `F0rban/altis-etancheite`, `F0rban/memova` (un dépôt chacun, voir § 5).

### Ce qui n'est PAS un projet distinct
- `docs/`, `tools/`, `tests/` de chaque site : ils font partie du site.
- Les fichiers de config (`.editorconfig`, `.gitignore`, `package.json`) :
  propres à chaque projet, ils suivent leur projet.
- `AUTONOMOUS_PROGRESS.md` et `screenshots/` : font partie de Bench.

---

## 3. Architecture GitHub cible

```
F0rban/F0rban              dépôt profil : README + docs/ORGANISATION.md (cette carte). Aucun code.
F0rban/agency-os           AGENCY OS — le système central réutilisable (templates, skills, process)
F0rban/atelier-sillage     site client, indépendant
F0rban/altis-etancheite    site client, indépendant
F0rban/atelier-meridienne  site fictif, indépendant
F0rban/tesson              site fictif, indépendant
F0rban/bench               prototype / application, indépendant
F0rban/memova              application, indépendante (si c'est bien un projet à part)
F0rban/mon-projet          vide : à supprimer ou à réutiliser, au choix
```

Chaque site est un dépôt autonome : il ne référence aucun autre dépôt, ni
AGENCY OS. AGENCY OS sert à **produire** un nouveau site (copie initiale), pas à
le faire tourner. Un futur site = un nouveau dépôt créé depuis AGENCY OS, sans
toucher aux autres.

Cohérence vérifiée : aucune dépendance croisée entre Méridienne, Tesson et
Bench (recherche des noms dans les trois arbres : zéro référence). Chacun se
teste et se construit seul.

---

## 4. Migration : fait / pas fait

### Fait dans cette session
- Audit complet des deux dépôts GitHub et des trois branches (aucune modification).
- Vérification de chaque projet dans son propre arbre :
  - Méridienne : `npm test` → 27 tests, 0 échec.
  - Tesson : `npm test` → 7 tests, 0 échec.
  - Bench : `npm ci`, `npm run typecheck` (OK), `npm test` → 357 tests, 0 échec,
    `STATIC_EXPORT=1 npm run build` → export statique complet.
- Vérification d'indépendance (aucune référence croisée).
- Script de migration prêt : `scripts/migrer-projets.sh`.
- Cette documentation, sur une branche **orpheline** de `F0rban/F0rban`
  (`claude/audit-reorganisation-projets-25rtcw`) qui ne contient aucun code de site.

### Pas fait, et pourquoi
- **Création des dépôts** : refusée à l'intégration GitHub de Claude Code
  (`403 Resource not accessible by integration`). Les trois dépôts ont été créés
  à la main, puis la migration a été exécutée depuis la session (voir § 9).
- **Rien n'a été supprimé** (branches, PR, fichiers) : règle absolue de la mission.
- **Bench / GitHub Pages** : pas modifié. Après migration, la preview vivra à
  `https://f0rban.github.io/bench/` et non plus `/F0rban/` ; cela demande un
  petit patch (§ 4.2) que je n'applique pas sans ton accord, car il touche
  `next.config.ts`.
- **Projets locaux (AGENCY OS, Sillage, Altis, Memova)** : inaccessibles depuis ici.

### 4.1 Exécuter la migration (5 minutes, sur ton Mac)

```bash
brew install gh && gh auth login        # une seule fois
git clone https://github.com/F0rban/F0rban.git -b claude/audit-reorganisation-projets-25rtcw f0rban-audit
cd f0rban-audit
DRY_RUN=1 bash scripts/migrer-projets.sh # montre ce qui va se passer
bash scripts/migrer-projets.sh           # crée les 3 dépôts et pousse l'historique complet vers main
```

Le script ne supprime rien, ne force rien, et vérifie que le SHA arrivé sur
`main` est identique à la branche source. Les branches d'origine restent dans
`F0rban/F0rban` comme sauvegarde tant que tu ne décides pas de les enlever.

Si tu préfères ne pas installer `gh` : crée les trois dépôts **vides** (sans
README) sur github.com — `atelier-meridienne`, `tesson`, `bench` — puis lance
`SKIP_CREATE=1 bash scripts/migrer-projets.sh`.

### 4.2 Après la migration
1. **PR #1** (`F0rban/F0rban`) : ✔ fermée sans fusion (2 septembre 2026).
2. **Bench → Pages** (optionnel) : dans `F0rban/bench`, Settings → Pages →
   Source « GitHub Actions », puis appliquer ce patch et pousser :
   - `.github/workflows/deploy-pages.yml` : `branches: [claude/ai-command-center-gelf0i]` → `branches: [main]`
     et `NEXT_PUBLIC_BASE_PATH: /F0rban` → `/bench`
   - `next.config.ts` : `basePath: "/F0rban"` → `basePath: "/bench"`
3. **`F0rban/F0rban`** : ✔ `main` créée depuis la branche d'audit (documentation
   seule, historique indépendant des sites). **Reste à faire à la main** : la
   définir comme branche par défaut (Settings → General → Default branch → `main`).
   Le README s'affichera alors sur ton profil.
4. Quand les nouveaux dépôts sont vérifiés (site ouvert, tests lancés), les
   branches `claude/*` de `F0rban/F0rban` peuvent être supprimées. Pas avant.
5. Dans Claude Code (web/mobile), les sessions existantes pointent encore sur
   `F0rban/F0rban` ; ouvre les prochaines sur le nouveau dépôt du projet.

---

## 5. Faire entrer les projets locaux dans l'architecture

Pour chacun de AGENCY OS, Atelier Sillage, Altis Étanchéité, Memova — depuis le
dossier du projet sur ton Mac :

```bash
cd ~/chemin/vers/atelier-sillage
git init 2>/dev/null; git add -A && git commit -m "import initial"   # si pas encore un dépôt git
gh repo create F0rban/atelier-sillage --private --source=. --push
```

Un dépôt par projet, jamais deux projets dans le même `git init`. Si un dossier
local contient à la fois AGENCY OS et des sites générés, sépare-les **avant**
de pousser (chaque site dans son dossier, chaque dossier son dépôt).

---

## 6. Règles pour ne plus jamais mélanger deux projets

1. **Une branche n'est pas un projet.** Un nouveau projet = un nouveau dépôt,
   jamais une branche dans un dépôt existant. Les branches servent aux
   variantes d'un même projet.
2. **Dans Claude Code, choisis le dépôt du projet avant de commencer**
   (web/mobile : sélecteur de dépôt à la création de session ; CLI : lance
   `claude` depuis le dossier du projet). Si la session s'ouvre sur
   `F0rban/F0rban`, ce n'est le bon dépôt que pour cette documentation.
3. **Ne jamais démarrer un site depuis la branche d'un autre site.** Le commit
   Tesson a été fait par-dessus Méridienne : c'est exactement ce qui a créé le
   mélange et la PR dangereuse.
4. **Un site ne dépend d'aucun autre dépôt à l'exécution.** Tout ce dont il a
   besoin (fontes, vendor, outils) est dans son dépôt.
5. **AGENCY OS ne contient aucun site client.** Il contient des templates,
   skills, process, exemples génériques. Un site réel ou fictif produit avec
   AGENCY OS est copié dans son propre dépôt au moment de sa création.
6. **Le dépôt profil `F0rban/F0rban` ne contient pas de code**, seulement cette carte.
7. **Avant de fusionner une PR**, vérifier que base et head sont le **même
   projet** (une PR qui supprime des dizaines de fichiers est un signal d'alarme).

---

## 7. Créer un nouveau site (à partir d'AGENCY OS)

1. Créer le dépôt vide du site : `gh repo create F0rban/<nom-du-site> --private`.
2. Générer le site depuis AGENCY OS (dans le dépôt `agency-os`, selon sa
   propre procédure) **vers un dossier séparé**, puis dans ce dossier :
   `git init && git add -A && git commit -m "site initial (depuis AGENCY OS)"`
   et `git remote add origin https://github.com/F0rban/<nom-du-site>.git && git push -u origin main`.
   Variante si AGENCY OS est un « template repository » GitHub :
   `gh repo create F0rban/<nom-du-site> --template F0rban/agency-os --private`.
3. Ouvrir la session Claude Code **sur `F0rban/<nom-du-site>`**, pas sur `agency-os`.
4. Ne jamais copier de fichiers d'un autre site ; si une amélioration est
   générique, elle remonte dans `agency-os`, pas dans le site voisin.

---

## 8. Quel dépôt sélectionner dans Claude Code

| Tu veux travailler sur… | Dépôt à sélectionner |
|---|---|
| Le système, les templates, les skills | `F0rban/agency-os` (à créer depuis ton Mac) |
| Atelier Sillage | `F0rban/atelier-sillage` (à créer depuis ton Mac) |
| Altis Étanchéité | `F0rban/altis-etancheite` (à créer depuis ton Mac) |
| Atelier Méridienne | `F0rban/atelier-meridienne` ✔ migré |
| Tesson | `F0rban/tesson` ✔ migré |
| Bench / AI Command Center | `F0rban/bench` ✔ migré |
| Memova | `F0rban/memova` (à créer depuis ton Mac) |
| Cette carte des projets | `F0rban/F0rban` |

---

## 9. État après migration (2 septembre 2026, 15 h UTC)

Migration exécutée par push direct (sans force), historique complet, arbre
vérifié identique à la source par clone frais, tests relancés dans chaque clone.

| Dépôt | `main` = | Commits | Fichiers | Tests |
|---|---|---|---|---|
| `F0rban/atelier-meridienne` | `393b425` (= `claude/premium-showcase-website-tm8yd1`) | 5 | 62 | 27/27 |
| `F0rban/tesson` | `f3df112` (= `claude/premium-showcase-website-co0cyh`) | 7 | 27 | 7/7 |
| `F0rban/bench` | `1c288ae` (= `claude/ai-command-center-gelf0i`) | 40 | 178 | typecheck OK, 357/357 |

`F0rban/F0rban` : aucune branche supprimée ni modifiée par la migration ; PR #1
toujours ouverte, non fusionnée.

**Point d'attention — Tesson.** Pendant la migration, la session Claude Code
« Site vitrine premium one-page » (encore ouverte, rattachée à `F0rban/F0rban`)
a poussé un commit supplémentaire (`f3df112`, passe design). Il a été repris
dans `tesson/main` par avance rapide. Tant que cette session reste ouverte sur
`F0rban/F0rban`, tout nouveau travail Tesson atterrira dans l'ancien dépôt :
**la fermer, et rouvrir les prochaines sessions Tesson sur `F0rban/tesson`.**
Même règle pour la session « AI Command Center SaaS prototype » (Bench).

Restant à faire à la main : définir `main` comme branche par défaut de
`F0rban/F0rban` (§ 4.2, point 3) ; Pages pour Bench si souhaité (§ 4.2, point 2).
