---
title: Instant Dessert StockApp
status: draft
created: 2026-06-08
updated: 2026-06-08
platform: Android Tablet
---

# PRD : Instant Dessert StockApp

## 0. Objet du document

Ce PRD s'adresse au développeur et au propriétaire du laboratoire Instant Dessert. Il définit les exigences fonctionnelles de l'application Android tablette de gestion de stock et de production. Il s'appuie sur le cahier des charges initial et la session de brainstorming BMAD du 2026-06-08 (20 idées validées). Le document UX/UI et l'architecture technique viendront en aval.

---

## 1. Vision

Instant Dessert est un laboratoire de pâtisserie artisanale qui vend ses desserts à des restaurants partenaires (B2B) et à des particuliers (B2C). Aujourd'hui, la gestion du stock repose sur la mémoire et l'observation directe. Conséquence : les ruptures de matières premières sont découvertes en pleine production, forçant des courses d'urgence qui interrompent le travail et génèrent du stress.

**Instant Dessert StockApp est le registre vivant du laboratoire.** Elle centralise en un seul endroit l'état réel du stock (matières premières et produits finis), les recettes, les commandes et la production. Elle anticipe les besoins avant qu'ils deviennent urgents, calcule automatiquement ce qu'il est possible de produire avec le stock disponible, et automatise les tâches administratives répétitives.

L'objectif est de couper définitivement la chaîne : *rupture découverte → appel → course urgente → temps perdu*. En parallèle, l'app fournit les données de rentabilité qui permettent de piloter l'activité avec précision.

---

## 2. Utilisateur cible

### 2.1 Jobs To Be Done

- Savoir, en ouvrant l'app, ce que je peux produire avec mon stock actuel — sans calcul mental.
- Être prévenu avant d'être en rupture, pas au moment où ça bloque la production.
- Déclarer une production en moins de 10 secondes, les mains potentiellement occupées.
- Savoir combien coûte réellement chaque dessert et quelle est ma marge.
- Avoir une liste de courses prête à envoyer au fournisseur sans avoir à la construire moi-même.
- Suivre mes ventes par canal (restaurants vs particuliers) sans ressaisie.
- Exporter mes données de ventes pour ma comptabilité en un tap.

### 2.2 Non-utilisateurs (v1)

- Les restaurants partenaires n'ont pas accès à l'app. [ASSUMPTION: le flux de commandes reste géré en dehors de l'app — WhatsApp, téléphone — et les commandes sont saisies manuellement par le pâtissier.]
- Les particuliers n'ont pas accès à l'app.
- Aucun autre employé ou collaborateur n'utilise l'app en v1.

### 2.3 Parcours utilisateurs

**UJ-1. Démarrer la journée au laboratoire.**
- **Persona :** Le pâtissier, arrivant au laboratoire le matin.
- **État d'entrée :** App fermée. Tablette posée sur le plan de travail.
- **Chemin :** Ouvre l'app → voit immédiatement l'écran d'accueil avec (1) les alertes stock actives et (2) la capacité de production du jour par dessert.
- **Point culminant :** En 5 secondes, il sait ce qui manque et ce qu'il peut produire. Aucune navigation supplémentaire nécessaire.
- **Résolution :** Il commence sa journée en sachant exactement quelle production est faisable et ce qu'il doit commander.

**UJ-2. Déclarer une production.**
- **Persona :** Le pâtissier, après avoir terminé un lot de tiramisus.
- **État d'entrée :** App ouverte sur l'accueil ou l'écran production.
- **Chemin :** Tape sur "Nouvelle production" → sélectionne le dessert dans la liste → saisit la quantité → confirme.
- **Point culminant :** Stock de matières premières déduit automatiquement selon la recette. Produits finis ajoutés au stock.
- **Résolution :** Historique de production mis à jour. Stock temps réel synchronisé.
- **Cas limite :** Si le stock d'un ingrédient est insuffisant pour la quantité saisie, l'app affiche un avertissement avec le détail du manque — et laisse le choix de forcer la saisie ou d'annuler.

**UJ-3. Enregistrer une commande et mettre à jour le stock.**
- **Persona :** Le pâtissier, recevant une commande d'un restaurant partenaire par WhatsApp.
- **État d'entrée :** App ouverte.
- **Chemin :** Tape sur "Nouvelle commande" → choisit le type (restaurant ou particulier) → sélectionne le(s) dessert(s) → saisit les quantités → valide.
- **Point culminant :** Stock de produits finis déduit. Commande enregistrée dans l'historique.
- **Résolution :** L'app vérifie que le stock de produits finis est suffisant. Si insuffisant, elle propose de programmer la production nécessaire. [ASSUMPTION: la gestion de la livraison reste hors app.]

**UJ-4. Générer la liste de courses fournisseur.**
- **Persona :** Le pâtissier, voyant des alertes de stock sur l'accueil.
- **État d'entrée :** Plusieurs matières premières sous leur seuil tampon.
- **Chemin :** Tape sur "Liste de courses" → voit la liste auto-générée avec les quantités exactes à acheter pour revenir au niveau cible → tape "Copier / Envoyer WhatsApp".
- **Point culminant :** Message WhatsApp pré-rempli avec la liste de courses, prêt à envoyer au fournisseur.
- **Résolution :** Zéro calcul mental, zéro oubli.

---

## 3. Glossaire

- **Matière première (MP)** — Ingrédient utilisé dans les recettes (mascarpone, crème liquide, sucre, œufs, chocolat, etc.). Caractérisée par un nom, une unité de mesure (g, kg, L, unité), un stock actuel, un seuil tampon, et un prix d'achat unitaire.
- **Produit fini (PF)** — Dessert fabriqué et disponible à la vente (tiramisu, cheesecake, mousse au chocolat, etc.). Caractérisé par un nom, un stock actuel, et un prix de vente.
- **Recette** — Association d'un produit fini à la liste de matières premières et quantités nécessaires pour produire une unité.
- **Seuil tampon** — Quantité minimale de matière première en dessous de laquelle une alerte est déclenchée. Défini manuellement en v1, calculé dynamiquement en v2.
- **Production** — Déclaration de fabrication d'un lot de produits finis. Déclenche la déduction des MP via la recette et l'ajout au stock PF.
- **Commande** — Demande d'achat d'un ou plusieurs produits finis par un restaurant partenaire ou un particulier. Déclenche la déduction du stock PF à la validation.
- **Canal de vente** — Catégorie d'un client : *Restaurant* (B2B) ou *Particulier* (B2C).
- **Coût de revient (CDR)** — Coût total des matières premières nécessaires pour produire une unité d'un produit fini, calculé automatiquement via la recette et les prix d'achat.
- **Marge brute** — Différence entre le prix de vente et le coût de revient d'un produit fini.
- **Stock théorique** — Niveau de stock calculé par l'app à partir des mouvements enregistrés (productions, ventes, ajustements).
- **Capacité de production** — Nombre maximum d'unités d'un produit fini productibles avec le stock de MP disponible, calculé en temps réel.

---

## 4. Fonctionnalités

### 4.1 Tableau de bord — Vision & Alertes

**Description :** L'écran d'accueil est la pièce centrale de l'app. Il répond en premier lieu à la question "Qu'est-ce qui ne va pas et qu'est-ce que je peux faire aujourd'hui ?". Il affiche les alertes stock actives et la capacité de production du jour. C'est une vue actionnable, pas une vue de reporting. Réalise UJ-1.

**Exigences fonctionnelles :**

#### FR-1 : Alertes stock actives
Le pâtissier voit en haut de l'accueil toutes les matières premières dont le stock actuel est inférieur ou égal au seuil tampon, avec le niveau actuel et la quantité manquante pour atteindre le seuil cible. Réalise UJ-1, UJ-4.

**Conséquences testables :**
- Si stock MP ≤ seuil tampon → la MP apparaît dans la liste d'alertes.
- Si stock MP > seuil tampon → la MP n'apparaît pas dans les alertes.
- L'alerte affiche : nom MP, stock actuel, unité, seuil tampon.

#### FR-2 : Capacité de production du jour
Le pâtissier voit pour chaque produit fini le nombre maximum d'unités productibles avec le stock de MP disponible. Si un ingrédient manque pour produire même une unité, la capacité affichée est 0 avec l'ingrédient bloquant précisé. Réalise UJ-1.

**Conséquences testables :**
- Pour chaque PF : `capacité = min(stock_MP_i / quantité_recette_i)` pour tous les ingrédients i de la recette.
- Si capacité = 0 → affiche "Bloqué : [MP manquante] (X [unité] manquants)".
- La capacité se met à jour en temps réel après chaque déclaration de production ou réception de stock.

---

### 4.2 Gestion des matières premières

**Description :** Suivi du stock de chaque ingrédient en temps réel. Le pâtissier peut consulter, ajouter des entrées (achats) et ajuster manuellement le stock. Réalise UJ-4.

**Exigences fonctionnelles :**

#### FR-3 : Consultation du stock MP
Le pâtissier voit la liste de toutes les MP avec leur stock actuel, unité, seuil tampon et statut (OK / Alerte).

**Conséquences testables :**
- Chaque MP affiche : nom, stock actuel, unité, seuil tampon, statut visuel (OK / Alerte).
- Les MP en alerte sont visuellement distinguées (couleur ou indicateur).

#### FR-4 : Réception de stock (achat)
Le pâtissier peut enregistrer un achat de MP (liste déroulante + quantité + prix d'achat). Le stock est incrémenté. L'achat est horodaté et conservé dans l'historique.

**Conséquences testables :**
- Après saisie : `nouveau_stock = stock_actuel + quantité_achetée`.
- L'historique conserve : date, MP, quantité, prix d'achat unitaire.
- Le prix d'achat unitaire est mis à jour (dernière valeur saisie) et déclenche le recalcul du coût de revient (voir FR-12).

#### FR-5 : Correction manuelle de stock
Le pâtissier peut corriger le stock d'une MP avec une raison (ex : perte, erreur de saisie). La correction est horodatée et tracée dans l'historique.

**Conséquences testables :**
- La correction modifie le stock actuel.
- L'historique trace : date, MP, ancienne valeur, nouvelle valeur, raison.

#### FR-6 : Paramétrage du seuil tampon
Le pâtissier peut définir et modifier le seuil tampon de chaque MP.

**Conséquences testables :**
- La modification est immédiatement reflétée dans les alertes (FR-1).
- La valeur est persistée.

---

### 4.3 Gestion des recettes

**Description :** Chaque produit fini est associé à une recette définissant les MP et quantités nécessaires pour produire une unité. C'est le moteur de toutes les fonctionnalités de calcul automatique.

**Exigences fonctionnelles :**

#### FR-7 : Création et modification de recette
Le pâtissier peut créer une recette pour un produit fini (liste de MP + quantités par unité). Il peut modifier une recette existante. La modification déclenche le recalcul du coût de revient.

**Conséquences testables :**
- Une recette = 1 PF + N lignes (MP, quantité, unité).
- Après modification → CDR du PF recalculé immédiatement (voir FR-12).
- L'historique des versions de recette n'est pas requis en v1. [ASSUMPTION]

#### FR-8 : Format unique par produit
Un produit fini a un format unique. Pas de gestion de tailles ou variantes en v1.

**Hors scope :** gestion des variantes (format individuel / familial).

---

### 4.4 Gestion des produits finis

**Description :** Suivi du stock de desserts fabriqués, disponibles à la vente.

**Exigences fonctionnelles :**

#### FR-9 : Consultation du stock PF
Le pâtissier voit la liste de tous les PF avec leur stock actuel.

**Conséquences testables :**
- Chaque PF affiche : nom, stock actuel (unités).

#### FR-10 : Déclaration de production
Le pâtissier déclare une production (liste déroulante PF + quantité). L'app déduit les MP via la recette et ajoute les PF au stock. Réalise UJ-2.

**Conséquences testables :**
- Pour chaque MP de la recette : `nouveau_stock_MP = stock_MP - (quantité_produite × quantité_recette)`.
- `nouveau_stock_PF = stock_PF + quantité_produite`.
- Si stock d'une MP insuffisant pour la quantité saisie → afficher avertissement avec détail (MP, manque). Permettre de forcer ou d'annuler.
- La production est horodatée dans l'historique.

---

### 4.5 Gestion des commandes

**Description :** Enregistrement des commandes entrantes (restaurants et particuliers) et déduction automatique du stock PF. Réalise UJ-3.

**Exigences fonctionnelles :**

#### FR-11 : Saisie d'une commande
Le pâtissier saisit une commande : canal (Restaurant / Particulier), nom du client [ASSUMPTION : champ texte libre], liste de PF + quantités. À la validation, le stock PF est déduit.

**Conséquences testables :**
- `nouveau_stock_PF = stock_PF - quantité_commandée`.
- Si stock PF insuffisant → avertissement avec détail. Permettre de forcer ou d'annuler.
- La commande est horodatée avec : date, canal, client, produits, quantités.

---

### 4.6 Coûts & Rentabilité

**Description :** Calcul automatique des coûts de revient et des marges à partir des recettes et prix d'achat. Les données se mettent à jour automatiquement à chaque modification. Réalise les idées #12, #13, #17, #18, #20 de la session brainstorming.

**Exigences fonctionnelles :**

#### FR-12 : Coût de revient automatique et vivant
L'app calcule le coût de revient de chaque PF : `CDR = Σ (quantité_MP_recette × prix_achat_MP)`. Le CDR se recalcule automatiquement si la recette est modifiée ou si le prix d'achat d'une MP est mis à jour (via FR-4).

**Conséquences testables :**
- CDR affiché pour chaque PF dans la fiche produit.
- Après modification de recette ou de prix d'achat → CDR recalculé sans action manuelle.

#### FR-13 : Marge brute par produit
L'app calcule la marge brute de chaque PF : `marge = prix_vente - CDR`. Le prix de vente est saisi manuellement par le pâtissier. [ASSUMPTION : un seul prix de vente par PF, indépendamment du canal.]

**Conséquences testables :**
- Marge et pourcentage de marge affichés par PF.
- Mise à jour automatique si CDR ou prix de vente change.

#### FR-14 : Bénéfice brut en temps réel
L'app affiche le bénéfice brut cumulé de la semaine en cours : `bénéfice = Σ (prix_vente × quantité_vendue) - Σ (CDR × quantité_vendue)`. Mis à jour à chaque commande validée.

**Conséquences testables :**
- Indicateur visible sur le tableau de bord ou dans un écran dédié.
- Se remet à zéro chaque début de semaine (lundi 00h00). [ASSUMPTION]

#### FR-15 : Analyse par canal de vente
L'app ventile les ventes par canal : volume (unités), chiffre d'affaires et marge brute, pour la semaine en cours et cumulé.

**Conséquences testables :**
- Stats séparées Restaurant / Particulier pour la période sélectionnée.
- Au minimum : volume total, CA total, marge totale par canal.

---

### 4.7 Réapprovisionnement automatique

**Description :** Génération automatique de la liste de courses à partir des alertes stock. Réalise l'idée #10 de la session brainstorming. Réalise UJ-4.

**Exigences fonctionnelles :**

#### FR-16 : Génération de la liste de courses
L'app génère automatiquement une liste des MP en alerte avec les quantités à acheter pour revenir au niveau cible : `quantité_à_acheter = seuil_tampon - stock_actuel + [ASSUMPTION : marge de sécurité = 20% du seuil tampon]`.

**Conséquences testables :**
- La liste contient uniquement les MP dont le stock < seuil tampon.
- La quantité suggérée est calculée automatiquement.

#### FR-17 : Export WhatsApp de la liste de courses
Le pâtissier peut copier la liste en un tap, sous forme de message texte formaté, prêt à être collé ou envoyé via WhatsApp.

**Conséquences testables :**
- Le tap déclenche l'intent de partage Android (share sheet) avec le texte pré-rempli.
- Format : liste à puces avec nom MP, quantité et unité.

---

### 4.8 Planification de la production

**Description :** Vue consolidée de ce qui est à produire pour honorer toutes les commandes de la semaine. Réalise l'idée #21 de la session brainstorming.

**Exigences fonctionnelles :**

#### FR-18 : Plan de production hebdomadaire
L'app calcule, pour la semaine en cours, le volume total à produire par PF pour honorer toutes les commandes enregistrées, en tenant compte du stock PF disponible. Elle indique si le stock de MP est suffisant pour réaliser ce plan.

**Conséquences testables :**
- `à_produire = max(0, quantité_commandée_semaine - stock_PF_disponible)`.
- Pour chaque PF à produire : vérification stock MP. Si insuffisant → liste des MP manquantes.

---

### 4.9 Historique & Traçabilité

**Description :** Toutes les opérations sont enregistrées avec date, type et détail. C'est la source de vérité pour la comptabilité et les analyses futures.

**Exigences fonctionnelles :**

#### FR-19 : Journal des opérations
Chaque événement (achat MP, production, commande, correction stock) est enregistré avec : date/heure, type d'opération, détail.

**Conséquences testables :**
- Le journal est consultable par type d'opération et par période.
- Aucun enregistrement ne peut être supprimé (correction via FR-5 uniquement).

#### FR-20 : Export comptabilité mensuel
Le pâtissier peut exporter un récapitulatif des ventes du mois : date, canal, client, produits, quantités, montants. Format CSV ou PDF. [ASSUMPTION : format CSV privilégié pour la compatibilité comptable.]

**Conséquences testables :**
- L'export couvre la période sélectionnée (mois calendaire par défaut).
- Colonnes : date, canal, client, produit, quantité, prix unitaire, total.
- L'export est téléchargeable/partageable depuis la tablette.

---

### 4.10 Rapport hebdomadaire

**Description :** Résumé automatique de l'activité de la semaine écoulée. Réalise l'idée #15 de la session brainstorming.

**Exigences fonctionnelles :**

#### FR-21 : Rapport hebdomadaire automatique
Chaque début de semaine, un résumé de la semaine précédente est disponible dans l'app : productions réalisées, ventes par canal, MP consommées, marge brute. [ASSUMPTION : pas de notification push — le rapport est consultable à la demande.]

**Conséquences testables :**
- Le rapport de la semaine N est disponible dès le lundi de la semaine N+1.
- Contenu minimum : nb unités produites par PF, nb unités vendues par PF, CA par canal, marge brute totale.

---

## 5. Non-objectifs (v1)

- **Pas d'accès multi-utilisateurs** — l'app est mono-utilisateur. Pas de rôles, droits ou synchronisation multi-device.
- **Pas de portail restaurant** — les restaurants ne se connectent pas à l'app. Les commandes sont saisies manuellement.
- **Pas de gestion des DLC** — la rotation des MP est suffisamment rapide pour ne pas en avoir besoin.
- **Pas de mode offline** — bonne connexion au laboratoire, pas de synchronisation hors-ligne nécessaire.
- **Pas de prédiction des seuils (v1)** — les seuils tampons sont définis manuellement. La prédiction par analyse de l'historique est une feature V2.
- **Pas de gestion de variantes** — un format unique par produit fini.
- **Pas de gestion des livraisons** — le suivi logistique reste hors app.
- **Pas de comptabilité complète** — l'export couvre les ventes. La TVA, charges et bilan restent hors scope.
- **Pas de notifications push** — les alertes sont visibles à l'ouverture de l'app uniquement.

---

## 6. Périmètre MVP

### 6.1 In Scope (P0 — MVP)

- FR-1 Alertes stock actives
- FR-2 Capacité de production du jour
- FR-3 Consultation stock MP
- FR-4 Réception de stock (achat)
- FR-5 Correction manuelle de stock
- FR-6 Paramétrage seuil tampon
- FR-7 Création et modification de recette
- FR-9 Consultation stock PF
- FR-10 Déclaration de production
- FR-11 Saisie d'une commande
- FR-16 Génération liste de courses
- FR-17 Export WhatsApp liste de courses
- FR-19 Journal des opérations

### 6.2 In Scope (P1 — MVP étendu, même release)

- FR-12 Coût de revient automatique et vivant
- FR-13 Marge brute par produit
- FR-18 Plan de production hebdomadaire

### 6.3 Hors scope MVP — V2

- FR-8 [NOTE FOR PM : simplification confirmée — un format par produit, aucune gestion de variante prévue]
- FR-14 Bénéfice brut en temps réel
- FR-15 Analyse par canal de vente
- FR-20 Export comptabilité mensuel
- FR-21 Rapport hebdomadaire automatique
- Seuils tampons prédictifs (appris sur l'historique des ventes)

---

## 7. Métriques de succès

**Primaires**
- **SM-1 :** Zéro course d'urgence non planifiée par mois après 4 semaines d'utilisation. Valide FR-1, FR-16.
- **SM-2 :** Temps de déclaration d'une production < 15 secondes. Valide FR-10.
- **SM-3 :** L'app est utilisée quotidiennement (7j/7 ou 5j ouvrés selon l'activité). Valide l'adoption globale.

**Secondaires**
- **SM-4 :** 100% des commandes enregistrées dans l'app (zéro carnet papier parallèle). Valide FR-11.
- **SM-5 :** Coût de revient connu pour tous les produits finis après 2 semaines. Valide FR-12.

**Contre-métriques (ne pas optimiser)**
- **SM-C1 :** Temps de saisie total par jour < 5 minutes. Si SM-C1 est dépassé, l'app génère plus de friction qu'elle n'en élimine — signal de refonte UX.

---

## 8. Questions ouvertes

1. **Sauvegarde des données** — Les données sont-elles stockées uniquement en local sur la tablette, ou faut-il une sauvegarde cloud ? [Impact : perte des données si tablette cassée/volée.]
2. **Identifiant client** — Pour les commandes, un champ texte libre suffit-il pour le nom du client, ou faut-il un carnet de clients avec historique ?
3. **Prix de vente B2B vs B2C** — Un même dessert est-il vendu au même prix aux restaurants et aux particuliers, ou y a-t-il une tarification différente par canal ?
4. **Période de calcul du bénéfice brut** — La semaine commence-t-elle le lundi ou le dimanche ?
5. **Format d'export** — CSV ou PDF pour l'export comptabilité ? (ASSUMPTION : CSV par défaut.)

---

## 9. Index des assumptions

- [§2.2] Les commandes restaurants sont transmises hors app (WhatsApp, téléphone) et saisies manuellement par le pâtissier.
- [§2.2] La gestion des livraisons reste hors app.
- [§4.5 FR-11] Le nom du client est un champ texte libre — pas de carnet de clients avec historique en v1.
- [§4.6 FR-13] Un seul prix de vente par PF, indépendamment du canal.
- [§4.6 FR-14] Le bénéfice brut hebdomadaire se remet à zéro le lundi à 00h00.
- [§4.7 FR-16] La quantité à acheter inclut une marge de sécurité de 20% du seuil tampon.
- [§4.9 FR-20] Format CSV privilégié pour l'export comptabilité.
- [§4.10 FR-21] Le rapport hebdomadaire est consulté à la demande, sans notification push.
- [§4.3 FR-7] L'historique des versions de recette n'est pas requis en v1.
