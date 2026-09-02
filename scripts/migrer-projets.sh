#!/usr/bin/env bash
# =============================================================================
# Migration des projets mélangés dans F0rban/F0rban vers des dépôts indépendants.
#
#   1 dépôt GitHub = 1 projet.
#
# Ce script :
#   - clone F0rban/F0rban (toutes les branches) dans un dossier temporaire ;
#   - crée chaque dépôt cible s'il n'existe pas encore (via `gh`) ;
#   - pousse la branche source vers `main` du dépôt cible, AVEC tout l'historique ;
#   - vérifie que le SHA arrivé sur `main` est exactement celui de la source.
#
# Ce script NE FAIT PAS :
#   - aucune suppression (ni branche, ni fichier, ni dépôt) ;
#   - aucun force-push (si `main` existe déjà et diverge, le push échoue et on s'arrête) ;
#   - aucune modification de code.
#
# Il est idempotent : le relancer ne casse rien.
#
# Prérequis (sur ton Mac) : git, et le CLI GitHub `gh` connecté (`gh auth login`).
# Usage :
#   bash scripts/migrer-projets.sh            # dépôts publics (comme F0rban/F0rban aujourd'hui)
#   VISIBILITY=private bash scripts/migrer-projets.sh
#   DRY_RUN=1 bash scripts/migrer-projets.sh  # montre ce qui serait fait, ne pousse rien
# =============================================================================
set -euo pipefail

OWNER="${OWNER:-F0rban}"
SOURCE_REPO="${SOURCE_REPO:-F0rban/F0rban}"
VISIBILITY="${VISIBILITY:-public}"
DRY_RUN="${DRY_RUN:-0}"

# nom du dépôt cible | branche source dans F0rban/F0rban | description
PROJETS=(
  "atelier-meridienne|claude/premium-showcase-website-tm8yd1|Atelier Méridienne — site vitrine fictif (gnomonique & fresque murale), 8 pages statiques"
  "tesson|claude/premium-showcase-website-co0cyh|Tesson — site vitrine one page fictif (carreaux de grès émaillés, Fribourg)"
  "bench|claude/ai-command-center-gelf0i|Bench (ex AI Command Center) — prototype Next.js : duels de modèles à l'aveugle et table de routage"
)

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33m/!\\ %s\033[0m\n' "$*"; }
die()  { printf '\033[31mERREUR : %s\033[0m\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "git est requis."
if ! command -v gh >/dev/null; then
  die "Le CLI GitHub 'gh' est requis pour créer les dépôts (brew install gh && gh auth login).
Alternative : crée à la main sur github.com les dépôts vides (SANS README) : $(for p in "${PROJETS[@]}"; do printf '%s/%s ' "$OWNER" "${p%%|*}"; done)
puis relance ce script avec SKIP_CREATE=1."
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/migration-f0rban.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

log "Clone complet de $SOURCE_REPO (toutes les branches) dans $WORK"
git clone --quiet "https://github.com/$SOURCE_REPO.git" "$WORK/source"
cd "$WORK/source"
git fetch --quiet origin '+refs/heads/*:refs/remotes/origin/*'

ERREURS=0
for entree in "${PROJETS[@]}"; do
  IFS='|' read -r NOM BRANCHE DESCRIPTION <<<"$entree"
  CIBLE="$OWNER/$NOM"
  log "$NOM  ⇐  $SOURCE_REPO@$BRANCHE"

  if ! git rev-parse --verify --quiet "origin/$BRANCHE" >/dev/null; then
    warn "Branche source introuvable : $BRANCHE — projet ignoré."
    ERREURS=$((ERREURS+1)); continue
  fi
  SHA_SOURCE="$(git rev-parse "origin/$BRANCHE")"
  echo "    source : $SHA_SOURCE ($(git log -1 --format=%s "origin/$BRANCHE"))"
  echo "    commits : $(git rev-list --count "origin/$BRANCHE")  fichiers : $(git ls-tree -r --name-only "origin/$BRANCHE" | wc -l | tr -d ' ')"

  # --- création du dépôt cible (si absent) ---
  if gh repo view "$CIBLE" >/dev/null 2>&1; then
    echo "    dépôt $CIBLE : existe déjà, on le réutilise."
  elif [ "${SKIP_CREATE:-0}" = "1" ]; then
    warn "Dépôt $CIBLE absent et SKIP_CREATE=1 — projet ignoré."
    ERREURS=$((ERREURS+1)); continue
  elif [ "$DRY_RUN" = "1" ]; then
    echo "    [dry-run] gh repo create $CIBLE --$VISIBILITY"
  else
    gh repo create "$CIBLE" "--$VISIBILITY" --description "$DESCRIPTION" >/dev/null
    echo "    dépôt $CIBLE : créé ($VISIBILITY)."
  fi

  # --- push de l'historique complet vers main (jamais forcé) ---
  URL="https://github.com/$CIBLE.git"
  if [ "$DRY_RUN" = "1" ]; then
    echo "    [dry-run] git push $URL origin/$BRANCHE:refs/heads/main"
    continue
  fi
  SHA_DISTANT="$(git ls-remote "$URL" refs/heads/main 2>/dev/null | cut -f1 || true)"
  if [ -n "$SHA_DISTANT" ] && [ "$SHA_DISTANT" = "$SHA_SOURCE" ]; then
    echo "    main de $CIBLE : déjà à jour ($SHA_DISTANT)."
  elif [ -n "$SHA_DISTANT" ]; then
    warn "main de $CIBLE existe déjà avec un autre historique ($SHA_DISTANT). Aucun push forcé : à examiner à la main."
    ERREURS=$((ERREURS+1)); continue
  else
    git push --quiet "$URL" "origin/$BRANCHE:refs/heads/main"
    echo "    push effectué vers $CIBLE (main)."
  fi

  # --- vérification ---
  SHA_VERIF="$(git ls-remote "$URL" refs/heads/main | cut -f1)"
  if [ "$SHA_VERIF" = "$SHA_SOURCE" ]; then
    echo "    ✔ vérifié : $CIBLE@main == $BRANCHE ($SHA_VERIF)"
  else
    warn "SHA différent après push ($SHA_VERIF ≠ $SHA_SOURCE)."
    ERREURS=$((ERREURS+1))
  fi
done

log "Terminé"
if [ "$ERREURS" -gt 0 ]; then
  warn "$ERREURS projet(s) en anomalie — voir ci-dessus. Rien n'a été supprimé."
  exit 2
fi
cat <<FIN

Les trois projets vivent désormais dans leur propre dépôt (branche main, historique complet).
RIEN n'a été retiré de $SOURCE_REPO : les branches d'origine y restent comme sauvegarde.

Étapes suivantes, à faire à la main quand tu es sûr (voir docs/ORGANISATION.md) :
  - Bench : activer GitHub Pages (Settings → Pages → Source : GitHub Actions) et appliquer
    le petit patch de chemins décrit dans docs/ORGANISATION.md (basePath /F0rban → /bench).
  - PR #1 de $SOURCE_REPO (Tesson → Méridienne) : à FERMER sans fusionner.
  - Une fois les nouveaux dépôts vérifiés, les branches claude/* de $SOURCE_REPO peuvent être
    archivées (tag) ou supprimées — c'est ta décision, pas celle de ce script.
FIN
