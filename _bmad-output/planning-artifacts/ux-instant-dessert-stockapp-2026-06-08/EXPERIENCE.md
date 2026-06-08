---
title: Instant Dessert StockApp — Experience Spec
status: draft
created: 2026-06-08
updated: 2026-06-08
platform: Android Tablet
---

# EXPERIENCE.md — Instant Dessert StockApp

## Foundation

- **Plateforme :** Android tablette (10", mode paysage par défaut)
- **Système UI :** Material Design 3 (composants natifs Android) — DESIGN.md étend les tokens par défaut
- **Utilisateur unique :** pas d'authentification, pas de gestion de comptes
- **Langue :** Français
- **Orientation :** Paysage fixe (le labo = tablette posée à l'horizontale sur le plan de travail)
- **Saisie :** Doigt / pouce — pas de stylet, pas de clavier externe supposé

---

## Information Architecture

### Navigation principale (sidebar fixe gauche — 240dp)

```
┌──────────────────┐
│  🏠 Accueil       │  ← Tableau de bord + alertes + capacité
│  🥘 Production    │  ← Déclarer une production
│  📦 Stock MP      │  ← Matières premières
│  🍰 Produits finis│  ← Desserts en stock
│  📋 Commandes     │  ← Saisir / consulter commandes
│  📖 Recettes      │  ← Gérer les recettes
│  📊 Rentabilité   │  ← Coûts, marges, bénéfice brut
│  ──────────────  │
│  🕐 Historique    │  ← Journal des opérations
│  ⚙️  Paramètres   │  ← Seuils tampons, prix de vente, prix d'achat
└──────────────────┘
```

**Règles de navigation :**
- Section active = highlight bleu sur l'item nav + border-left accent
- Badge rouge sur "Accueil" si alertes actives
- Pas de navigation en breadcrumb — profondeur max = 1 niveau (liste → détail)
- Retour = flèche Android standard ou bouton "← Retour" en haut à gauche

---

## Écrans — Spécifications comportementales

---

### E-1 : Tableau de bord (Accueil)

**Layout tablette paysage — 2 colonnes :**

```
┌─────────────────────────────────────────────────────────┐
│ COLONNE GAUCHE (45%)        │ COLONNE DROITE (55%)       │
│                              │                            │
│ ┌──────────────────────────┐ │ ┌──────────────────────┐  │
│ │ ⚠️  ALERTES STOCK (N)    │ │ │ CAPACITÉ DE          │  │
│ │ ───────────────────────  │ │ │ PRODUCTION DU JOUR   │  │
│ │ 🔴 Mascarpone            │ │ │ ──────────────────── │  │
│ │    200g / seuil 500g     │ │ │ Tiramisu      45     │  │
│ │ 🟡 Crème liquide         │ │ │ Cheesecake    12     │  │
│ │    400g / seuil 600g     │ │ │ Mousse choc  🔴 0    │  │
│ │                          │ │ │  (manque crème 200g) │  │
│ │ [Générer liste courses]  │ │ └──────────────────────┘  │
│ └──────────────────────────┘ │                            │
│                              │ ┌──────────────────────┐  │
│                              │ │ CETTE SEMAINE        │  │
│                              │ │ Bénéfice brut: +X€   │  │
│                              │ │ Ventes: N unités      │  │
│                              │ └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                                          [+ Production]  ← FAB
```

**Comportements :**
- Si 0 alertes → section alertes affiche "✅ Tous les stocks sont OK" en vert
- Capacité = 0 → ligne rouge + détail de l'ingrédient manquant au tap
- FAB "+" toujours visible → ouvre directement E-2 (Déclarer production)
- Tap "Générer liste de courses" → ouvre bottom sheet E-7
- Actualisation en temps réel (pas de pull-to-refresh nécessaire)

---

### E-2 : Déclarer une production

**Layout : Bottom sheet ou plein écran — déclenché par FAB ou nav**

```
┌───────────────────────────────────────┐
│ Nouvelle production                 ✕ │
│ ─────────────────────────────────── │
│                                       │
│  Dessert                              │
│  ┌─────────────────────────────────┐  │
│  │ Tiramisu                    ▼  │  │  ← Dropdown liste PF
│  └─────────────────────────────────┘  │
│                                       │
│  Quantité produite                    │
│  ┌──────────┐                         │
│  │   30     │  unités                 │  ← NumPad natif Android
│  └──────────┘                         │
│                                       │
│  Aperçu consommation :                │
│  • Mascarpone : −1 500g               │  ← Calculé en temps réel
│  • Sucre : −600g                      │
│  • Œufs : −30 unités                  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │      ✓  Confirmer production   │  │  ← Bouton pleine largeur
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

**Comportements :**
- L'aperçu de consommation se calcule en temps réel dès que dessert + quantité sont saisis
- Si stock insuffisant pour un ingrédient → ligne en rouge dans l'aperçu + warning inline :
  `"⚠️ Mascarpone insuffisant : il manque 300g. Continuer quand même ?"`
  Deux boutons : [Continuer] [Annuler]
- Après confirmation → toast "Production enregistrée ✓" + retour accueil
- Pas de confirmation supplémentaire si stock suffisant

---

### E-3 : Stock matières premières

**Layout : Liste complète + barre de recherche**

```
┌─────────────────────────────────────────────────────────┐
│ Stock matières premières          [🔍 Rechercher]  [+ Ajouter MP] │
│ ─────────────────────────────────────────────────────── │
│ Filtres : [Toutes ▼]  [⚠️ Alertes seulement]             │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ ⚠️ MASCARPONE              200 g     seuil : 500 g  [+] │
│ ⚠️ CRÈME LIQUIDE           400 g     seuil : 600 g  [+] │
│ ✅ SUCRE                  2,4 kg     seuil : 1 kg   [+] │
│ ✅ ŒUFS                    48 u      seuil : 12 u   [+] │
│ ✅ CHOCOLAT NOIR           900 g     seuil : 500 g  [+] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comportements :**
- Tap [+] sur une ligne → bottom sheet "Réception stock" (FR-4) :
  champ quantité + champ prix d'achat pré-rempli avec la dernière valeur
- Tap sur le nom d'une MP → fiche détail avec historique des mouvements
- Filtre "Alertes seulement" → n'affiche que les MP sous seuil
- Swipe left sur une ligne → option "Correction manuelle" (FR-5)
- Bouton "Ajouter MP" → formulaire création nouvelle matière première

---

### E-4 : Produits finis

**Layout similaire à E-3**

```
┌─────────────────────────────────────────────────────────┐
│ Produits finis                              [+ Nouveau PF] │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ TIRAMISU           45 unités   coût: X.XX€  marge: XX%  │
│ CHEESECAKE         12 unités   coût: X.XX€  marge: XX%  │
│ MOUSSE CHOCOLAT     0 unités   coût: X.XX€  marge: XX%  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comportements :**
- Tap sur un PF → fiche détail : recette, CDR, historique productions/ventes
- Stock = 0 → ligne grisée ou badge "Rupture"
- Coût et marge calculés depuis la recette (DESIGN.md → CapacityCard pattern)

---

### E-5 : Saisir une commande

**Layout : Formulaire en 3 étapes (stepper léger)**

```
Étape 1 — Qui commande ?
  ┌──────────────┐  ┌──────────────┐
  │  🏪 Restaurant │  │  👤 Particulier│
  └──────────────┘  └──────────────┘
  Nom du client : [_________________________]

Étape 2 — Quoi ?
  [Dessert ▼]  [Qté]  [+ Ajouter ligne]
  Tiramisu      20
  Cheesecake     5

Étape 3 — Confirmation
  Récapitulatif de la commande
  Total : 25 unités
  Stock suffisant : ✅ / ⚠️ manque X
  [✓ Valider la commande]
```

**Comportements :**
- Sélection Restaurant / Particulier en step 1 = 2 grandes cartes tappables
- Step 2 : pattern StockInputRow (liste déroulante + quantité) répété N fois
- Bouton "Ajouter une ligne" = ajouter un autre PF à la commande
- Step 3 : vérification automatique du stock PF disponible avant validation
- Validation → déduction stock PF + enregistrement historique + toast confirmation

---

### E-6 : Recettes

**Layout : Liste de recettes + éditeur inline**

```
┌─────────────────────────────────────────────────────────┐
│ Recettes                                  [+ Nouvelle recette] │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ TIRAMISU                        coût/unité : X.XX€  [✏️] │
│   • Mascarpone : 50g                                     │
│   • Sucre : 20g                                          │
│   • Œufs : 1 unité                                       │
│   • Café : 30ml                                          │
│                                                          │
│ CHEESECAKE                      coût/unité : X.XX€  [✏️] │
│   • ...                                                  │
└─────────────────────────────────────────────────────────┘
```

**Comportements :**
- Tap [✏️] → recette passe en mode édition inline (pas de page séparée)
- Modification d'une quantité → CDR recalculé en temps réel (FR-12)
- Ajout/suppression d'un ingrédient via bouton +/−
- Sauvegarde automatique à la sortie du mode édition
- Avertissement si modification impacte la capacité de production en cours

---

### E-7 : Liste de courses (Bottom Sheet)

```
┌───────────────────────────────────────────┐
│ ─── Liste de courses          [✕ Fermer] │
│                                           │
│ Générée automatiquement                   │
│ ─────────────────────────────────────── │
│ • Mascarpone      300 g à acheter         │
│ • Crème liquide   260 g à acheter         │
│                                           │
│ ┌───────────────────────────────────────┐ │
│ │    📤  Envoyer via WhatsApp           │ │
│ └───────────────────────────────────────┘ │
│ ┌───────────────────────────────────────┐ │
│ │    📋  Copier dans le presse-papier   │ │
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**Comportements :**
- Calcule automatiquement `quantité_à_acheter = seuil_tampon × 1.2 − stock_actuel`
- "Envoyer via WhatsApp" → intent Android share avec texte pré-formaté
- Si aucune alerte active → bottom sheet affiche "Aucun réapprovisionnement nécessaire ✅"

---

### E-8 : Rentabilité

**Layout : Dashboard analytics simple**

```
┌─────────────────────────────────────────────────────────┐
│ Rentabilité                   [Cette semaine ▼]          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│  Bénéfice brut        +XXX€                              │
│  CA total             +XXX€   Coût MP : XXX€             │
│                                                          │
│  Par canal :                                             │
│  🏪 Restaurants       XXX€    XX unités   XX% marge      │
│  👤 Particuliers      XXX€    XX unités   XX% marge      │
│                                                          │
│  Par produit :                                           │
│  Tiramisu             XX%     XX vendus                  │
│  Cheesecake           XX%     XX vendus                  │
│  Mousse chocolat      XX%     XX vendus                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comportements :**
- Sélecteur de période : Cette semaine / Semaine dernière / Ce mois / Mois dernier
- Chiffres en Roboto Mono pour l'alignement (DESIGN.md → typography.mono)
- Tap sur un produit → détail des ventes sur la période

---

### E-9 : Paramètres

**Layout : Liste de sections**

- **Matières premières** — modifier les seuils tampons et prix d'achat actuels
- **Produits finis** — modifier les prix de vente
- **Sauvegarde** — [ASSUMPTION: export manuel des données en JSON/CSV]

---

## Voice and Tone

| Contexte | Ton | Exemple |
|---|---|---|
| Alerte critique | Direct, factuel | "Mascarpone : 200g restants. Seuil : 500g." |
| Confirmation action | Bref, positif | "Production enregistrée ✓" |
| Avertissement stock | Informatif, sans alarmisme | "Stock insuffisant pour 30 unités. Il manque 300g de mascarpone." |
| État vide | Invitant | "Aucune commande cette semaine. Appuyez sur + pour en saisir une." |
| Succès | Minimaliste | "✓ Commande validée" |

Pas de points d'exclamation sauf confirmation critique. Pas de jargon technique. Tutoyement. [ASSUMPTION]

---

## State Patterns

| État | Comportement |
|---|---|
| **Chargement** | Skeleton screens (pas de spinner global) — max 200ms |
| **Vide** | Message court + action principale suggérée |
| **Erreur** | Snackbar rouge en bas d'écran, auto-disparaît après 4s |
| **Succès** | Toast vert en bas d'écran, auto-disparaît après 2s |
| **Stock insuffisant** | Warning inline dans le formulaire (pas de modale) |
| **Confirmation destructive** | Dialog Android natif uniquement pour suppressions |
| **Champ invalide** | Bordure rouge + message sous le champ, validation à la saisie |

---

## Interaction Primitives

- **Tap** — action principale sur tous les éléments
- **Long press** — menu contextuel (modifier / supprimer) sur items de liste
- **Swipe left** — correction rapide sur lignes de stock
- **Dropdown natif Android** — pour toutes les sélections (pas de custom picker sauf si nécessaire)
- **NumPad numérique** — pour toutes les saisies de quantité (`inputType="number"`)
- **Bottom sheet** — pour les actions secondaires et confirmations légères
- **FAB (Floating Action Button)** — action principale de la section active

---

## Accessibility Floor

- Contraste texte/fond ≥ 4.5:1 pour tout texte body (WCAG AA) — voir DESIGN.md colors
- Touch targets ≥ 48dp — voir DESIGN.md spacing.touch
- Labels `contentDescription` sur toutes les icônes sans texte visible
- TalkBack compatible : ordre de focus logique (sidebar → header → contenu principal)
- Couleur jamais seule pour transmettre une information critique (toujours icône + couleur)
- Taille de police respecte les préférences système Android (sp, pas dp)

---

## Key Flows

**KF-1. Le pâtissier démarre sa journée — Parcours Karim**
> Karim, pâtissier, ouvre la tablette posée sur son plan de travail à 7h30. Il voit immédiatement sur l'accueil : 2 alertes (Mascarpone et Crème liquide en orange), et la capacité du jour : Tiramisu 45, Cheesecake 12, Mousse chocolat 0 (bloquée — crème insuffisante). En 5 secondes sans navigation, il sait ce qu'il peut produire et ce qu'il doit commander. Il tape "Générer liste de courses" → la bottom sheet s'ouvre avec les quantités calculées → il tape "Envoyer WhatsApp" → le message est dans son clipboard, prêt à envoyer au fournisseur.
> **Climax :** Karim a pris toutes ses décisions du matin en moins de 30 secondes.

**KF-2. Déclarer 30 tiramisus produits**
> Karim vient de finir un lot. Il tape le FAB "+" → sélectionne "Tiramisu" dans la liste → saisit "30" sur le numpad → voit l'aperçu de consommation se calculer en temps réel (−1500g mascarpone, −600g sucre, −30 œufs) → tape "Confirmer" → toast vert "Production enregistrée ✓". Retour à l'accueil automatique.
> **Climax :** 3 taps, stock mis à jour, historique enregistré.

**KF-3. Saisir une commande restaurant**
> Karim reçoit un WhatsApp d'un restaurant : 20 tiramisus pour vendredi. Il ouvre "Commandes" → "Nouvelle commande" → sélectionne "Restaurant" → saisit le nom → ajoute "Tiramisu : 20" → step 3 confirme "Stock suffisant ✅" → valide. Toast vert.
> **Climax :** Commande enregistrée, stock PF déduit, zéro calcul mental.

**KF-4. Consulter la rentabilité de la semaine**
> Fin de semaine. Karim ouvre "Rentabilité" → voit le bénéfice brut, le CA par canal et la marge par dessert sur la semaine. Il constate que le cheesecake a une marge plus élevée que le tiramisu.
> **Climax :** Décision éclairée sur la production à prioriser la semaine suivante.
