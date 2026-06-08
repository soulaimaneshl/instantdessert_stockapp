---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-instant-dessert-stockapp-2026-06-08/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-instant-dessert-stockapp-2026-06-08/DESIGN.md
  - _bmad-output/planning-artifacts/ux-instant-dessert-stockapp-2026-06-08/EXPERIENCE.md
---

# Instant Dessert StockApp — Epic Breakdown

## Requirements Inventory

### Functional Requirements

FR-1: Alertes stock actives — afficher les MP sous seuil tampon avec niveau actuel et manque
FR-2: Capacité de production du jour — calculer en temps réel le max productible par PF
FR-3: Consultation stock MP — liste complète avec statut OK/Alerte
FR-4: Réception stock (achat) — incrémenter stock MP + enregistrer prix d'achat + historique
FR-5: Correction manuelle stock — ajuster stock avec raison + trace
FR-6: Paramétrage seuil tampon — définir/modifier le seuil par MP
FR-7: Création et modification de recette — associer PF à liste MP + quantités
FR-8: Format unique par produit — pas de variantes
FR-9: Consultation stock PF — liste avec stock actuel
FR-10: Déclaration de production — déduire MP + ajouter PF + historique (transaction atomique)
FR-11: Saisie d'une commande — canal + client + lignes PF → déduction stock PF
FR-12: Coût de revient automatique — CDR = Σ(quantité_recette × prix_achat) recalculé auto
FR-13: Marge brute par produit — marge = prix_vente - CDR
FR-14: Bénéfice brut en temps réel — Σ ventes - Σ coûts MP semaine en cours (V2)
FR-15: Analyse par canal — stats séparées Restaurant/Particulier (V2)
FR-16: Génération liste de courses — quantités à acheter = seuil × 1.2 - stock actuel
FR-17: Export WhatsApp liste de courses — Android intent share texte formaté
FR-18: Plan de production hebdomadaire — volume à produire pour honorer commandes
FR-19: Journal des opérations — historique immuable de tous les mouvements
FR-20: Export comptabilité mensuel — CSV ventes par date/canal/client (V2)
FR-21: Rapport hebdomadaire automatique — résumé semaine précédente (V2)

### Non-Functional Requirements

NFR-1: Saisie d'une production en moins de 15 secondes (3 taps maximum)
NFR-2: Touch targets ≥ 48dp sur tous les éléments interactifs (WCAG AA mobile)
NFR-3: Contraste texte/fond ≥ 4.5:1 (WCAG AA)
NFR-4: Transactions Room atomiques pour toute opération modifiant plusieurs tables
NFR-5: Calculs réactifs via Flow — tout changement stock → recalcul immédiat capacité + alertes
NFR-6: Android 10+ (minSdk 29), tablette paysage
NFR-7: Skeleton screens — pas de spinner global, chargement < 200ms perçu
NFR-8: Données stockées 100% localement (Room/SQLite) — pas de réseau en v1

### Additional Requirements (Architecture)

- Setup projet Android Studio : Kotlin + Jetpack Compose + Room + Hilt + Navigation Compose
- AppDatabase.kt avec 8 tables + index critiques + migrations
- DatabaseModule + RepositoryModule (Hilt)
- NavigationRail (sidebar 240dp) + NavHost pour layout tablette paysage
- Pattern UiState + ViewModel + StateFlow + Combine pour tous les écrans
- Transactions Room via database.withTransaction pour DeclarerProduction + ValiderCommande
- Android intent share pour export WhatsApp (FR-17)

### UX Design Requirements

UX-DR1: AlertCard component — 2 variantes (danger / warning), border-left 4dp couleur sémantique
UX-DR2: CapacityCard component — valeur en Roboto Mono, état bloqué en rouge + détail ingrédient
UX-DR3: StockInputRow component — Dropdown 70% + NumberInput 30%, height 56dp
UX-DR4: NavSidebar (NavigationRail) — 240dp, item actif background accent-light + border-left
UX-DR5: FAB "Nouvelle production" — visible sur accueil et écran production, bottom-right 24dp
UX-DR6: Bottom sheet liste de courses — calculé auto, 2 boutons (WhatsApp + copier)
UX-DR7: Material Design 3 theme complet (couleurs, typographie Roboto, spacing 8dp grid)
UX-DR8: Orientation tablette paysage fixe (landscape lock)
UX-DR9: States patterns — skeleton, vide, erreur (snackbar), succès (toast), stock insuffisant (inline warning)

### FR Coverage Map

| FR | Epic | Story |
|---|---|---|
| FR-1 | Epic 4 | 4.1 |
| FR-2 | Epic 4 | 4.2 |
| FR-3 | Epic 2 | 2.1 |
| FR-4 | Epic 2 | 2.2 |
| FR-5 | Epic 2 | 2.3 |
| FR-6 | Epic 2 | 2.4 |
| FR-7 | Epic 3 | 3.1 |
| FR-8 | Epic 3 | 3.1 |
| FR-9 | Epic 3 | 3.2 |
| FR-10 | Epic 5 | 5.1 |
| FR-11 | Epic 6 | 6.1 |
| FR-12 | Epic 8 | 8.1 |
| FR-13 | Epic 8 | 8.2 |
| FR-14 | Epic 10 | 10.1 |
| FR-15 | Epic 10 | 10.2 |
| FR-16 | Epic 7 | 7.1 |
| FR-17 | Epic 7 | 7.2 |
| FR-18 | Epic 8 | 8.3 |
| FR-19 | Epic 9 | 9.1 |
| FR-20 | Epic 10 | 10.3 |
| FR-21 | Epic 10 | 10.4 |

---

## Epic List

- **Epic 1** : Setup & Infrastructure Android
- **Epic 2** : Gestion des matières premières
- **Epic 3** : Recettes & Produits finis
- **Epic 4** : Tableau de bord — Vision & Alertes
- **Epic 5** : Déclaration de production
- **Epic 6** : Gestion des commandes
- **Epic 7** : Réapprovisionnement — Liste de courses
- **Epic 8** : Coûts & Rentabilité (MVP P1)
- **Epic 9** : Historique & Traçabilité
- **Epic 10** : Reporting & Exports (V2)

---

## Epic 1 : Setup & Infrastructure Android

**Objectif :** Mettre en place le projet Android avec toute la stack technique, la navigation tablette et le design system. Aucune feature métier — uniquement les fondations sur lesquelles tous les epics suivants s'appuient.

### Story 1.1 : Initialiser le projet Android

En tant que développeur,
Je veux créer le projet Android avec la stack complète (Kotlin, Compose, Room, Hilt),
Afin que toutes les couches techniques soient en place avant de coder les features.

**Acceptance Criteria :**

**Given** un environnement Android Studio configuré
**When** le projet est créé et les dépendances ajoutées
**Then** le projet compile sans erreur avec compileSdk 35, minSdk 29
**And** les dépendances Room 2.6.1, Hilt 2.51.1, Compose BOM 2024.09.00, Navigation Compose sont présentes dans build.gradle.kts
**And** @HiltAndroidApp est configuré sur MainApplication
**And** la structure de packages domain/data/presentation/di existe
**And** un écran vide "Hello Instant Dessert" s'affiche sur la tablette

---

### Story 1.2 : Configurer la base de données Room

En tant que développeur,
Je veux créer AppDatabase avec les 8 entités et les DAOs correspondants,
Afin que la persistance locale soit opérationnelle pour toutes les features.

**Acceptance Criteria :**

**Given** le projet Android initialisé
**When** AppDatabase est créée avec toutes les entités
**Then** les 8 tables existent : matieres_premieres, produits_finis, recettes, recette_ingredients, productions, commandes, commande_lignes, mouvements_stock
**And** chaque table a les colonnes et types définis dans architecture.md
**And** les index critiques sont créés (idx_alertes, idx_mouvements_date, idx_commandes_date)
**And** les foreign keys avec ON DELETE CASCADE sont correctement définies
**And** DatabaseModule (Hilt) expose AppDatabase et tous les DAOs

---

### Story 1.3 : Implémenter la navigation tablette

En tant que pâtissier,
Je veux voir une sidebar de navigation fixe à gauche avec toutes les sections,
Afin de naviguer rapidement entre les écrans sans friction.

**Acceptance Criteria :**

**Given** l'app lancée sur tablette Android en paysage
**When** l'app s'ouvre
**Then** une sidebar de 240dp est visible à gauche avec les 9 destinations (Accueil, Production, Stock MP, Produits finis, Commandes, Recettes, Rentabilité, Historique, Paramètres)
**And** chaque item affiche une icône + libellé
**And** l'item actif a un fond accent-light (#DBEAFE) + border-left 3dp bleu (#2563EB) + texte bleu gras
**And** le tap sur un item navigue vers l'écran correspondant
**And** l'orientation est verrouillée en paysage (landscapeOrientation)

---

### Story 1.4 : Implémenter le Material Design 3 theme

En tant que pâtissier,
Je veux que l'app applique le design system défini (couleurs, typographie, composants),
Afin d'avoir une interface cohérente et lisible.

**Acceptance Criteria :**

**Given** le theme Material 3 configuré
**When** n'importe quel écran est affiché
**Then** le fond général est #F4F5F7, les cartes #FFFFFF
**And** la police est Roboto pour tous les textes, Roboto Mono pour les valeurs numériques
**And** la couleur d'accent est #2563EB (bleu), danger #DC2626 (rouge), warning #D97706 (ambre)
**And** tous les touch targets sont ≥ 48dp
**And** les composants AlertCard, CapacityCard, StockInputRow sont implémentés selon DESIGN.md

---

## Epic 2 : Gestion des matières premières

**Objectif :** Permettre au pâtissier de consulter, ajouter et gérer le stock de matières premières avec seuils tampons configurables. Couvre FR-3, FR-4, FR-5, FR-6.

### Story 2.1 : Consulter la liste des matières premières

En tant que pâtissier,
Je veux voir la liste de toutes les matières premières avec leur stock actuel et statut,
Afin de connaître l'état de mon stock d'un coup d'œil.

**Acceptance Criteria :**

**Given** des matières premières existent dans la base de données
**When** j'ouvre l'écran "Stock MP"
**Then** je vois la liste de toutes les MPs avec : nom, stock actuel, unité, seuil tampon, statut (OK ✅ / Alerte ⚠️)
**And** les MPs en alerte (stock ≤ seuil) sont visuellement distinguées (icône ⚠️ + couleur warning/danger)
**And** un filtre "Alertes seulement" est disponible
**And** une barre de recherche filtre la liste par nom
**And** si aucune MP n'existe → message "Aucun ingrédient. Appuyez sur + pour en ajouter."

---

### Story 2.2 : Recevoir du stock (achat matières premières)

En tant que pâtissier,
Je veux enregistrer un achat de matière première (quantité + prix),
Afin que mon stock soit mis à jour et mon coût de revient recalculé.

**Acceptance Criteria :**

**Given** je suis sur l'écran Stock MP
**When** je tape [+] sur une ligne MP ou le bouton "Ajouter un achat"
**Then** un bottom sheet s'ouvre avec : MP pré-sélectionnée, champ quantité (numpad), champ prix unitaire (pré-rempli avec la dernière valeur)
**And** après confirmation : stock_actuel += quantité achetée
**And** le prix d'achat de la MP est mis à jour avec la valeur saisie
**And** l'achat est enregistré dans achats_mp avec date/heure
**And** un mouvement ACHAT_MP est enregistré dans mouvements_stock
**And** toast vert "Stock mis à jour ✓" s'affiche

---

### Story 2.3 : Corriger manuellement le stock

En tant que pâtissier,
Je veux corriger le stock d'une matière première avec une raison,
Afin de rectifier une erreur de saisie ou enregistrer une perte.

**Acceptance Criteria :**

**Given** je suis sur l'écran Stock MP
**When** je fais un swipe left sur une ligne MP
**Then** une option "Correction" apparaît
**And** un dialog s'ouvre avec : nouvelle valeur de stock, raison (champ texte libre)
**And** après confirmation : stock_actuel = nouvelle valeur
**And** un mouvement CORRECTION_MP est enregistré avec ancienne valeur, nouvelle valeur, raison, date/heure
**And** toast vert "Correction enregistrée ✓"

---

### Story 2.4 : Paramétrer le seuil tampon

En tant que pâtissier,
Je veux définir et modifier le seuil tampon de chaque matière première,
Afin que les alertes correspondent à mes besoins réels.

**Acceptance Criteria :**

**Given** je suis sur la fiche détail d'une MP
**When** je modifie la valeur du seuil tampon
**Then** la nouvelle valeur est sauvegardée immédiatement
**And** les alertes sur le tableau de bord et la liste MP se mettent à jour en temps réel
**And** si le stock actuel < nouveau seuil → la MP passe en alerte immédiatement
**And** si le stock actuel ≥ nouveau seuil → l'alerte disparaît immédiatement

---

### Story 2.5 : Créer une nouvelle matière première

En tant que pâtissier,
Je veux ajouter une nouvelle matière première au catalogue,
Afin de l'intégrer dans mes recettes et suivre son stock.

**Acceptance Criteria :**

**Given** je suis sur l'écran Stock MP
**When** je tape "+ Ajouter MP"
**Then** un formulaire s'ouvre avec : nom (texte), unité (dropdown : g / kg / L / ml / unité), stock initial, seuil tampon, prix d'achat
**And** après validation : la MP est créée et apparaît dans la liste
**And** tous les champs sont obligatoires sauf prix d'achat (optionnel à la création)

---

## Epic 3 : Recettes & Produits finis

**Objectif :** Créer et gérer les recettes de desserts et le catalogue des produits finis. Couvre FR-7, FR-8, FR-9.

### Story 3.1 : Créer et modifier une recette

En tant que pâtissier,
Je veux définir la recette d'un dessert (liste d'ingrédients + quantités par unité),
Afin que l'app calcule automatiquement la consommation lors d'une production.

**Acceptance Criteria :**

**Given** un produit fini existe
**When** j'ouvre l'écran Recettes et tape [✏️] sur un PF
**Then** la recette passe en mode édition inline avec la liste des ingrédients actuels
**And** je peux ajouter un ingrédient (dropdown MP + quantité)
**And** je peux modifier la quantité d'un ingrédient existant
**And** je peux supprimer un ingrédient (swipe left ou bouton −)
**And** le coût de revient calculé s'affiche en temps réel pendant l'édition : CDR = Σ(quantité × prix_achat)
**And** la modification est sauvegardée automatiquement à la fermeture du mode édition
**And** le CDR est recalculé et persisté après sauvegarde

---

### Story 3.2 : Créer un nouveau produit fini

En tant que pâtissier,
Je veux créer un dessert dans le catalogue avec son prix de vente,
Afin de pouvoir l'associer à une recette, des productions et des commandes.

**Acceptance Criteria :**

**Given** je suis sur l'écran Produits finis
**When** je tape "+ Nouveau PF"
**Then** un formulaire s'ouvre avec : nom, prix de vente, stock initial (défaut 0)
**And** après création : le PF apparaît dans la liste avec stock = 0, CDR = 0 (recette non encore définie)
**And** un badge "Recette manquante" indique qu'aucune recette n'est associée

---

### Story 3.3 : Consulter le stock de produits finis

En tant que pâtissier,
Je veux voir la liste de tous les desserts avec leur stock actuel,
Afin de savoir combien d'unités sont disponibles à la vente.

**Acceptance Criteria :**

**Given** des produits finis existent
**When** j'ouvre l'écran "Produits finis"
**Then** je vois chaque PF avec : nom, stock actuel (unités), CDR (€/unité), marge (%)
**And** stock = 0 → badge "Rupture" visible
**And** tap sur un PF → fiche détail avec historique productions + ventes

---

## Epic 4 : Tableau de bord — Vision & Alertes

**Objectif :** Implémenter l'écran d'accueil qui répond en premier lieu à "qu'est-ce qui ne va pas et que puis-je faire aujourd'hui ?". Couvre FR-1, FR-2.

### Story 4.1 : Afficher les alertes stock actives

En tant que pâtissier,
Je veux voir dès l'ouverture de l'app toutes les matières premières sous seuil tampon,
Afin d'identifier immédiatement ce qui doit être commandé.

**Acceptance Criteria :**

**Given** l'app est ouverte sur l'écran Accueil
**When** au moins une MP a stock_actuel ≤ seuil_tampon
**Then** une section "Alertes stock" affiche chaque MP en alerte avec : nom, stock actuel + unité, seuil tampon
**And** les MPs à 0 stock sont en rouge (danger), les autres en orange (warning)
**And** la liste se met à jour en temps réel via StateFlow (sans recharger l'écran)
**And** si aucune alerte → afficher "✅ Tous les stocks sont OK" en vert
**And** un bouton "Générer liste de courses" est visible si ≥ 1 alerte

---

### Story 4.2 : Afficher la capacité de production du jour

En tant que pâtissier,
Je veux voir combien d'unités de chaque dessert je peux produire avec mon stock actuel,
Afin de planifier ma journée de production sans calcul mental.

**Acceptance Criteria :**

**Given** des recettes sont définies et des MPs sont en stock
**When** j'ouvre l'écran Accueil
**Then** chaque PF avec une recette affiche le nombre maximum d'unités productibles : capacité = min(stock_MP_i / quantité_recette_i) pour tous les ingrédients
**And** si capacité = 0 → la ligne affiche "🔴 Bloqué — [MP manquante] (Xg manquants)"
**And** si capacité > 0 → la valeur est affichée en bleu en Roboto Mono
**And** la capacité se recalcule automatiquement dès qu'un stock MP change (Flow combine)
**And** les PF sans recette sont exclus de cette section

---

## Epic 5 : Déclaration de production

**Objectif :** Permettre au pâtissier de déclarer un lot produit en moins de 15 secondes avec déduction automatique des ingrédients. Couvre FR-10.

### Story 5.1 : Déclarer une production

En tant que pâtissier,
Je veux déclarer la production d'un lot de desserts en sélectionnant le produit et la quantité,
Afin que le stock des matières premières soit déduit automatiquement et le stock des produits finis incrémenté.

**Acceptance Criteria :**

**Given** je suis sur l'app (accueil ou écran production)
**When** je tape le FAB "+" puis sélectionne un PF et saisis une quantité
**Then** un aperçu de consommation s'affiche en temps réel : liste des MPs avec quantités à déduire
**And** si toutes les MPs sont suffisantes → bouton "Confirmer" actif en bleu
**And** si une MP est insuffisante → ligne en rouge "⚠️ [MP] insuffisant : manque Xg" + 2 boutons [Continuer quand même] [Annuler]
**And** après confirmation → transaction atomique Room :
  - stock_MP -= quantité_recette × quantité_produite pour chaque ingrédient
  - stock_PF += quantité_produite
  - production enregistrée dans productions avec date/heure
  - mouvement PRODUCTION enregistré dans mouvements_stock
**And** toast vert "Production enregistrée ✓"
**And** retour automatique à l'accueil
**And** le flux entier (FAB → sélection → quantité → confirmation) se fait en < 15 secondes

---

## Epic 6 : Gestion des commandes

**Objectif :** Enregistrer les commandes restaurants et particuliers avec déduction automatique du stock PF. Couvre FR-11.

### Story 6.1 : Saisir et valider une commande

En tant que pâtissier,
Je veux enregistrer une commande (canal, client, produits, quantités) et voir le stock PF déduit automatiquement,
Afin de tracer toutes mes ventes sans ressaisie.

**Acceptance Criteria :**

**Given** je suis sur l'écran Commandes
**When** je tape "Nouvelle commande"
**Then** un formulaire en 3 étapes s'affiche :
  - Étape 1 : sélection canal (2 grandes cartes : 🏪 Restaurant / 👤 Particulier) + nom client (texte libre)
  - Étape 2 : ajout de lignes PF (StockInputRow : dropdown PF + quantité), bouton "+ Ajouter une ligne"
  - Étape 3 : récapitulatif avec vérification stock PF
**And** en étape 3 : si stock PF suffisant → "✅ Stock disponible" + bouton valider actif
**And** en étape 3 : si stock PF insuffisant → "⚠️ Stock insuffisant pour [PF] — manque X unités" + bouton valider toujours actif (forçage possible)
**And** après validation → transaction atomique Room :
  - stock_PF -= quantité_commandée pour chaque ligne
  - commande + commande_lignes enregistrées avec prix_unitaire snapshot du prix_vente actuel
  - mouvement VENTE enregistré dans mouvements_stock
**And** toast vert "Commande validée ✓"

---

## Epic 7 : Réapprovisionnement — Liste de courses

**Objectif :** Générer automatiquement la liste de courses et l'envoyer au fournisseur via WhatsApp. Couvre FR-16, FR-17.

### Story 7.1 : Générer la liste de courses automatique

En tant que pâtissier,
Je veux voir en un tap la liste des ingrédients à acheter avec les quantités calculées,
Afin de ne rien oublier et de ne faire aucun calcul mental.

**Acceptance Criteria :**

**Given** au moins une MP est sous son seuil tampon
**When** je tape "Générer liste de courses" sur l'accueil ou l'écran Stock MP
**Then** un bottom sheet s'ouvre avec la liste des MPs en alerte
**And** pour chaque MP : quantité_à_acheter = max(0, seuil_tampon × 1.2 - stock_actuel) arrondie à l'unité supérieure
**And** si aucune MP n'est sous seuil → bottom sheet affiche "✅ Aucun réapprovisionnement nécessaire"
**And** la liste est mise à jour en temps réel si un stock change pendant que le bottom sheet est ouvert

---

### Story 7.2 : Exporter la liste de courses via WhatsApp

En tant que pâtissier,
Je veux envoyer ma liste de courses directement en message WhatsApp au fournisseur,
Afin de passer commande sans recopier manuellement.

**Acceptance Criteria :**

**Given** le bottom sheet liste de courses est ouvert avec ≥ 1 item
**When** je tape "📤 Envoyer via WhatsApp"
**Then** l'Android share sheet s'ouvre avec le message pré-rempli :
```
🛒 Liste de courses Instant Dessert

• [MP 1] : X [unité]
• [MP 2] : X [unité]
...
```
**And** je peux choisir l'application cible (WhatsApp ou autre)
**And** un bouton "📋 Copier" est également disponible pour copier le texte dans le presse-papier
**And** les deux actions fonctionnent sans connexion internet

---

## Epic 8 : Coûts & Rentabilité (MVP P1)

**Objectif :** Calculer et afficher automatiquement les coûts de revient, marges et plan de production. Couvre FR-12, FR-13, FR-18.

### Story 8.1 : Calculer le coût de revient automatiquement

En tant que pâtissier,
Je veux que le coût de revient de chaque dessert soit calculé et mis à jour automatiquement,
Afin de connaître ma marge réelle sans aucun calcul manuel.

**Acceptance Criteria :**

**Given** une recette est définie avec des ingrédients ayant un prix d'achat
**When** je consulte un produit fini ou l'écran rentabilité
**Then** le CDR affiché = Σ(quantité_ingrédient_recette × prix_achat_MP) pour tous les ingrédients
**And** si le prix d'achat d'une MP est mis à jour (FR-4) → le CDR de tous les PF utilisant cette MP est recalculé immédiatement via Flow
**And** si la recette d'un PF est modifiée (FR-7) → le CDR est recalculé immédiatement
**And** le CDR est affiché en €/unité avec 2 décimales en Roboto Mono

---

### Story 8.2 : Afficher la marge brute par produit

En tant que pâtissier,
Je veux voir la marge brute de chaque dessert (prix_vente - CDR),
Afin de savoir quels produits sont les plus rentables.

**Acceptance Criteria :**

**Given** un PF a un prix de vente et un CDR calculé
**When** je consulte l'écran Produits finis ou Rentabilité
**Then** chaque PF affiche : CDR (€), Prix vente (€), Marge brute (€), Pourcentage de marge (%)
**And** marge = prix_vente - CDR, pourcentage = (marge / prix_vente) × 100
**And** si CDR = 0 (recette sans prix d'achat renseigné) → afficher "—" pour la marge avec tooltip "Prix d'achat non renseigné"
**And** si marge < 0 → afficher en rouge avec avertissement "Marge négative"

---

### Story 8.3 : Plan de production hebdomadaire

En tant que pâtissier,
Je veux voir ce que je dois produire cette semaine pour honorer toutes mes commandes,
Afin d'organiser ma production sans calcul manuel.

**Acceptance Criteria :**

**Given** des commandes sont enregistrées pour la semaine en cours (lundi au dimanche)
**When** j'ouvre la section "Plan de production"
**Then** pour chaque PF commandé cette semaine :
  - quantité_commandée_semaine = somme des lignes de commande sur la période
  - à_produire = max(0, quantité_commandée_semaine - stock_PF_disponible)
**And** si à_produire > 0 et stock MP suffisant → ligne verte "✅ Production faisable"
**And** si à_produire > 0 et stock MP insuffisant → ligne rouge "⚠️ Stock MP insuffisant — manque [MP] : Xg"
**And** si à_produire = 0 (stock PF couvre les commandes) → "✅ Stock suffisant pour les commandes"
**And** un bouton "Déclarer cette production" sur chaque ligne lance directement FR-10 pré-rempli

---

## Epic 9 : Historique & Traçabilité

**Objectif :** Fournir un journal immuable de toutes les opérations pour la traçabilité complète. Couvre FR-19.

### Story 9.1 : Journal des opérations

En tant que pâtissier,
Je veux consulter l'historique chronologique de toutes les opérations (achats, productions, ventes, corrections),
Afin de comprendre à tout moment l'origine de chaque mouvement de stock.

**Acceptance Criteria :**

**Given** des opérations ont été enregistrées
**When** j'ouvre l'écran "Historique"
**Then** je vois la liste chronologique inversée de toutes les opérations avec : date/heure, type (icône + libellé), détail (produit, quantité, canal si applicable)
**And** un filtre par type est disponible : Tous / Achats MP / Productions / Ventes / Corrections
**And** un sélecteur de période permet de filtrer (cette semaine / ce mois / tout)
**And** aucune entrée ne peut être supprimée depuis cet écran (immuable)
**And** si l'historique est vide → "Aucune opération enregistrée pour cette période."

---

## Epic 10 : Reporting & Exports (V2)

**Objectif :** Ajouter les fonctionnalités analytiques et d'export pour le pilotage et la comptabilité. Couvre FR-14, FR-15, FR-20, FR-21.

### Story 10.1 : Bénéfice brut en temps réel

En tant que pâtissier,
Je veux voir le bénéfice brut cumulé de la semaine en cours mis à jour à chaque vente,
Afin de savoir si ma semaine est rentable sans attendre la fin du mois.

**Acceptance Criteria :**

**Given** des ventes ont été enregistrées cette semaine
**When** j'ouvre le tableau de bord ou l'écran Rentabilité
**Then** un indicateur affiche : bénéfice_brut = Σ(prix_vente × quantité) - Σ(CDR × quantité) pour toutes les commandes de la semaine en cours (lundi 00:00 → dimanche 23:59)
**And** l'indicateur se met à jour automatiquement après chaque commande validée
**And** il se remet à zéro chaque lundi à 00:00

---

### Story 10.2 : Analyse par canal de vente

En tant que pâtissier,
Je veux comparer les performances de mes deux canaux (restaurants vs particuliers),
Afin de décider lequel développer en priorité.

**Acceptance Criteria :**

**Given** des commandes existent avec des canaux différents
**When** j'ouvre l'écran Rentabilité et sélectionne une période
**Then** deux blocs séparés affichent pour Restaurant et Particulier : nombre de commandes, unités vendues, CA (€), marge brute (€)
**And** un sélecteur de période est disponible : cette semaine / ce mois / tout

---

### Story 10.3 : Export comptabilité mensuel

En tant que pâtissier,
Je veux exporter un récapitulatif CSV de mes ventes du mois pour mon comptable,
Afin d'éviter toute ressaisie et les erreurs qui en découlent.

**Acceptance Criteria :**

**Given** des commandes existent sur la période
**When** je tape "Exporter" sur l'écran Historique ou Rentabilité et sélectionne un mois
**Then** un fichier CSV est généré avec les colonnes : date, canal, nom_client, produit, quantité, prix_unitaire, total
**And** le fichier est partageable via l'Android share sheet (email, Google Drive, etc.)
**And** le nom du fichier est : instantdessert_ventes_AAAA-MM.csv

---

### Story 10.4 : Rapport hebdomadaire automatique

En tant que pâtissier,
Je veux consulter un résumé automatique de la semaine précédente sans rien faire,
Afin d'avoir une vision rapide de mon activité.

**Acceptance Criteria :**

**Given** la semaine précédente a des données enregistrées
**When** j'ouvre l'app un lundi ou consulte la section Rentabilité
**Then** un bloc "Semaine précédente" affiche : unités produites par PF, unités vendues par PF, CA par canal, marge brute totale
**And** le rapport est disponible sans action manuelle dès le lundi matin
**And** si aucune donnée la semaine précédente → "Aucune activité enregistrée la semaine passée"
