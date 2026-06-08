---
title: Instant Dessert StockApp — Design System
status: draft
created: 2026-06-08
updated: 2026-06-08
platform: Android Tablet
---

# DESIGN.md — Instant Dessert StockApp

## Brand & Style

Application professionnelle mono-utilisateur pour usage en laboratoire. L'identité visuelle est fonctionnelle : lisibilité maximale, hiérarchie visuelle immédiate, zéro décoration superflue. L'interface doit être utilisable rapidement, debout, avec un seul pouce ou un doigt.

**Principes :**
- Clarté > Esthétique
- L'information critique (alertes, capacité de production) saute aux yeux sans chercher
- Les actions répétitives (déclarer une production) sont accessibles en 2 taps maximum
- Aucun élément décoratif sans fonction

**Ton microcopy :** Direct, court, actionnable. Pas de phrases longues. Libellés de boutons = verbes ("Déclarer", "Ajouter", "Exporter"). Messages d'alerte = faits ("Mascarpone : 200g restants — seuil : 500g").

---

## Colors

```yaml
colors:
  # Fond & Surfaces
  background: "#F4F5F7"          # Gris très clair — fond général
  surface: "#FFFFFF"             # Blanc — cartes, modales, panels
  surface-raised: "#FFFFFF"      # Cartes avec légère élévation

  # Texte
  text-primary: "#1A1A2E"        # Quasi-noir — corps de texte principal
  text-secondary: "#6B7280"      # Gris moyen — labels secondaires, hints
  text-disabled: "#9CA3AF"       # Gris clair — états désactivés
  text-on-accent: "#FFFFFF"      # Blanc — texte sur couleur d'accent

  # Accent principal (actions, liens, focus)
  accent: "#2563EB"              # Bleu professionnel — CTA, sélections actives
  accent-light: "#DBEAFE"        # Bleu très clair — backgrounds sélectionnés
  accent-dark: "#1D4ED8"         # Bleu foncé — pressed state

  # Statuts sémantiques
  danger: "#DC2626"              # Rouge — alertes critiques, stock épuisé
  danger-light: "#FEE2E2"        # Rouge clair — background alertes
  warning: "#D97706"             # Ambre — avertissements (stock bientôt bas)
  warning-light: "#FEF3C7"       # Ambre clair — background avertissements
  success: "#16A34A"             # Vert — stock OK, confirmation
  success-light: "#DCFCE7"       # Vert clair — background succès

  # Séparateurs
  border: "#E5E7EB"              # Gris très léger — bordures, dividers
  border-strong: "#D1D5DB"       # Gris moyen — bordures visibles
```

**Palette réduite et fonctionnelle.** Le bleu est réservé aux actions. Le rouge/ambre signifient toujours un problème. Le vert confirme. Pas d'autre usage de ces couleurs.

---

## Typography

```yaml
typography:
  font-family: "Roboto"          # Police système Android — pas de dépendance externe
  font-family-mono: "Roboto Mono" # Chiffres dans les tableaux et valeurs de stock

  # Échelle — tablette 10" (densité ~160dp)
  display:
    size: "28sp"
    weight: "700"
    line-height: "36sp"
    usage: "Titre de section principale, valeur dashboard"

  heading:
    size: "20sp"
    weight: "600"
    line-height: "28sp"
    usage: "Titre de carte, nom de feature"

  body-large:
    size: "16sp"
    weight: "400"
    line-height: "24sp"
    usage: "Corps de texte principal, items de liste"

  body:
    size: "14sp"
    weight: "400"
    line-height: "20sp"
    usage: "Labels, descriptions secondaires"

  label:
    size: "12sp"
    weight: "500"
    line-height: "16sp"
    letter-spacing: "0.4sp"
    usage: "Chips, badges, captions, unités de mesure"

  mono:
    size: "16sp"
    weight: "500"
    font: "Roboto Mono"
    usage: "Valeurs numériques de stock, quantités, montants"
```

---

## Layout & Spacing

```yaml
spacing:
  unit: 8            # Grille de base 8dp
  xs: 4              # 0.5u — tight internal padding
  sm: 8              # 1u — padding interne carte
  md: 16             # 2u — padding section, gap entre éléments
  lg: 24             # 3u — padding horizontal de page
  xl: 32             # 4u — séparations majeures
  xxl: 48            # 6u — espaces entre sections

# Tablette Android 10" — layout 2 colonnes
layout:
  sidebar-width: "240dp"         # Navigation latérale fixe
  content-padding: "24dp"        # Padding horizontal du contenu principal
  card-gap: "12dp"               # Espacement entre cartes
  max-content-width: "960dp"     # Largeur max du contenu (tablettes larges)

# Touch targets — WCAG AA mobile (44dp min, 48dp recommandé)
touch:
  min-target: "48dp"
  button-height: "48dp"
  list-item-height: "56dp"       # Items de liste confortables au doigt
  fab-size: "56dp"               # Floating Action Button
```

---

## Elevation & Depth

```yaml
# Material Design 3 — élévation fonctionnelle uniquement
elevation:
  level-0: "0dp"     # Fond de page
  level-1: "1dp"     # Cartes standard (box-shadow légère)
  level-2: "3dp"     # Cartes survolées / actives
  level-3: "6dp"     # Modales, dropdowns
  level-4: "12dp"    # Dialogs, bottom sheets
  level-5: "24dp"    # FAB
```

Pas d'ombres décoratives. L'élévation exprime uniquement la hiérarchie et l'interactivité.

---

## Shapes

```yaml
rounded:
  sm: "4dp"          # Chips, badges, petits éléments
  md: "8dp"          # Cartes, boutons
  lg: "12dp"         # Cartes grandes, panels
  xl: "16dp"         # Modales, bottom sheets
  full: "9999dp"     # Pills, avatars, FAB
```

Arrondi cohérent et modéré — professionnel sans être agressif.

---

## Components

### AlertCard (carte d'alerte stock)
```
background: {colors.danger-light} | {colors.warning-light}
border-left: 4dp solid {colors.danger} | {colors.warning}
padding: {spacing.md}
rounded: {rounded.md}
icon: 20dp, couleur sémantique
title: {typography.body-large}, weight 600
subtitle: {typography.body}, {colors.text-secondary}
```

**Critical** (stock = 0 ou < 50% seuil) → danger. **Warning** (stock < seuil) → warning.

### ProductionButton (action principale)
```
type: Floating Action Button étendu
height: 56dp
background: {colors.accent}
text: {typography.body-large}, weight 600, {colors.text-on-accent}
icon: 24dp, blanc
position: bottom-right, margin 24dp
shadow: {elevation.level-5}
```

### CapacityCard (capacité de production)
```
background: {colors.surface}
elevation: {elevation.level-1}
padding: {spacing.md}
rounded: {rounded.md}
product-name: {typography.heading}
quantity: {typography.display}, {typography.mono}, {colors.accent}
unit: {typography.label}, {colors.text-secondary}
blocked-state: quantity en {colors.danger}, icon warning
```

### StockInputRow (saisie liste + quantité)
```
height: {touch.list-item-height}
layout: [Dropdown 70%] [NumberInput 30%]
dropdown-padding: {spacing.md}
number-input: text-align right, {typography.mono}
border-bottom: 1dp {colors.border}
```

### NavItem (navigation latérale)
```
height: 48dp
padding-horizontal: {spacing.md}
active-background: {colors.accent-light}
active-text: {colors.accent}, weight 600
active-border-left: 3dp solid {colors.accent}
inactive-text: {colors.text-secondary}
icon: 20dp
```

### Badge (compteur alertes)
```
background: {colors.danger}
text: {typography.label}, {colors.text-on-accent}, weight 700
padding: 2dp 6dp
rounded: {rounded.full}
min-width: 20dp
```

---

## Do's and Don'ts

**Do :**
- Utiliser rouge/ambre **uniquement** pour les états problématiques
- Afficher les valeurs numériques en `Roboto Mono` pour alignment et lisibilité
- Touch targets ≥ 48dp sur tous les éléments interactifs
- Libellés de boutons = verbes à l'infinitif
- Contraste texte/fond ≥ 4.5:1 (WCAG AA)

**Don't :**
- Pas d'animations décoratives — uniquement les transitions fonctionnelles (≤ 200ms)
- Pas de couleurs d'accent sur le texte courant — accent réservé aux CTA et états actifs
- Pas d'icônes sans libellé sur les actions principales
- Pas de modales pour des confirmations non-destructives
- Pas de champs de formulaire inutiles — chaque champ = une décision
