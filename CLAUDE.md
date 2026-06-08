# InstantDessert StockApp — Claude Guidelines

## Principes de code

- **Haute qualité exigée** — pas de raccourcis, pas de code jetable.
- **DRY** (Don't Repeat Yourself) — toute logique dupliquée doit être extraite.
- **SRP** (Single Responsibility Principle) — chaque module/fonction a une seule raison de changer.
- **KISS** (Keep It Simple, Stupid) — choisir toujours la solution la plus simple et la plus lisible.
- **SOLID** — respecter les cinq principes dans la conception orientée objet.
- **YAGNI** (You Aren't Gonna Need It) — n'implémenter que ce qui est nécessaire maintenant.
- **Architecture propre** — séparation claire des couches (UI, logique métier, données).
- **Pas de hack, pas de bricolage** — si une solution semble "sale", trouver la bonne approche.
- **Solution la plus maintenable** — favoriser la lisibilité et la facilité de modification à long terme.

## UX/UI

Utiliser le skill `/ux-ui-pro-max` pour toutes les décisions de design et d'interface.

## Workflow Git

- `main` est toujours propre et fonctionnel — aucun commit direct sur `main`.
- Chaque modification passe par une **nouvelle branche** nommée `feat/`, `fix/`, `chore/`, `refactor/` selon le type.
- **Committer à chaque modification significative** avec un message clair et conventionnel (`feat:`, `fix:`, `chore:`, etc.).
- Ouvrir une PR pour merger dans `main`, squash si nécessaire pour garder un historique propre.

## BMAD Method

Ce projet utilise la méthode BMAD pour la planification et le brainstorming.
Lancer avec `npx bmad-method install` puis suivre le workflow des agents.
