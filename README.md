# F0rban — carte des projets

Ce dépôt est le dépôt « profil » GitHub. Il ne contient **aucun code**, seulement
la carte des projets et les règles d'organisation :

- **[docs/ORGANISATION.md](docs/ORGANISATION.md)** — audit, cartographie,
  architecture cible (1 dépôt = 1 projet), règles, comment créer un nouveau site.
- **[scripts/migrer-projets.sh](scripts/migrer-projets.sh)** — script qui sort
  les trois projets historiquement mélangés ici vers leurs propres dépôts,
  historique complet conservé, sans rien supprimer.

## Où sont les projets

| Projet | Type | Dépôt |
|---|---|---|
| AGENCY OS | système central réutilisable | `F0rban/agency-os` (à pousser depuis le Mac) |
| Atelier Sillage | site client | `F0rban/atelier-sillage` (à pousser depuis le Mac) |
| Altis Étanchéité | site client | `F0rban/altis-etancheite` (à pousser depuis le Mac) |
| Atelier Méridienne | site fictif | `F0rban/atelier-meridienne` ✔ migré |
| Tesson | site fictif | `F0rban/tesson` ✔ migré |
| Bench (ex AI Command Center) | prototype | `F0rban/bench` ✔ migré |
| Memova | application | `F0rban/memova` (à pousser depuis le Mac) |

Méridienne, Tesson et Bench ont été migrés le 2 septembre 2026 (historique
complet, SHA vérifiés, voir `docs/ORGANISATION.md` § 9). Leurs branches
d'origine (`claude/premium-showcase-website-tm8yd1`, `claude/premium-showcase-website-co0cyh`,
`claude/ai-command-center-gelf0i`) restent ici comme sauvegarde.
**Ne pas fusionner la PR #1** (elle écraserait Méridienne par Tesson) : la fermer.
Ouvrir toute nouvelle session Claude Code sur le dépôt du projet, jamais sur celui-ci.
