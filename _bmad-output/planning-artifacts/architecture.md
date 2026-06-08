---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-instant-dessert-stockapp-2026-06-08/prd.md
  - _bmad-output/planning-artifacts/ux-instant-dessert-stockapp-2026-06-08/DESIGN.md
  - _bmad-output/planning-artifacts/ux-instant-dessert-stockapp-2026-06-08/EXPERIENCE.md
workflowType: architecture
project_name: instant-dessert-stockapp
date: '2026-06-08'
status: final
---

# Architecture — Instant Dessert StockApp

---

## 1. Analyse du contexte

### Périmètre fonctionnel
- **21 exigences fonctionnelles** sur 10 features : stock MP, recettes, production, commandes, alertes, coûts, planification, historique, exports WhatsApp/CSV.
- Toutes les features = CRUD enrichi avec **calculs dérivés en temps réel** (capacité de production, coût de revient, marge brute, alertes seuil).
- **Complexité : Moyenne** — pas de réseau en v1, pas de multi-utilisateur, pas d'authentification.

### Contraintes techniques
- Tablette Android (10", paysage, Android 10+)
- Stockage 100% local — pas de backend, pas de cloud en v1
- Mono-utilisateur — pas d'auth, pas de sync
- Export WhatsApp via Android intent share
- Material Design 3, Jetpack Compose (défini dans DESIGN.md)
- Calculs réactifs : tout changement de stock → recalcul immédiat de la capacité et des alertes

### Défi architectural central
La **cohérence des données réactives** : une entrée de stock MP → recalcul capacité de production → recalcul alertes → recalcul CDR si prix d'achat change. Ces dépendances doivent être gérées proprement sans couplage fort entre les couches.

---

## 2. Stack technologique

### Décisions principales

| Domaine | Choix | Justification |
|---|---|---|
| Langage | **Kotlin** | Langage officiel Android, null-safety, coroutines natives |
| UI | **Jetpack Compose** | UI déclarative moderne Android, Material 3 natif, parfait pour les états réactifs |
| Architecture | **Clean Architecture + MVVM** | Séparation claire des couches, testable, maintenable |
| Base de données | **Room** (SQLite) | ORM officiel Android, type-safe, Flow support natif |
| Réactivité | **Kotlin Coroutines + StateFlow** | Flux de données asynchrones et réactifs, intégration native Compose |
| Injection de dépendances | **Hilt** | DI officiel Android, intégration Compose et ViewModel |
| Navigation | **Jetpack Navigation Compose** | Navigation type-safe entre écrans Compose |
| Build | **Gradle (Kotlin DSL)** | Standard Android, type-safe build scripts |
| Tests | **JUnit 5 + Turbine + MockK** | Tests unitaires domain layer + Flow testing |

### Versions cibles
```kotlin
// build.gradle.kts (app level)
compileSdk = 35
minSdk = 29              // Android 10 — couvre 95%+ des tablettes actuelles
targetSdk = 35

// Dépendances clés
compose_bom = "2024.09.00"
room = "2.6.1"
hilt = "2.51.1"
kotlin = "2.0.0"
```

---

## 3. Architecture en couches (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│  Compose Screens + ViewModels (Hilt) + UiState (data)   │
├─────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                          │
│  Use Cases + Domain Models + Repository Interfaces       │
├─────────────────────────────────────────────────────────┤
│                     DATA LAYER                           │
│  Room DAOs + Repositories + Entities + Mappers           │
└─────────────────────────────────────────────────────────┘
```

### Règle de dépendance
- Presentation → Domain (via ViewModel)
- Data → Domain (implémente les interfaces)
- Domain ne dépend de rien

---

## 4. Structure du projet

```
app/
├── src/main/kotlin/com/instantdessert/stockapp/
│   ├── data/
│   │   ├── local/
│   │   │   ├── database/
│   │   │   │   ├── AppDatabase.kt
│   │   │   │   └── Migrations.kt
│   │   │   ├── dao/
│   │   │   │   ├── MatierePremierDao.kt
│   │   │   │   ├── ProduitFiniDao.kt
│   │   │   │   ├── RecetteDao.kt
│   │   │   │   ├── ProductionDao.kt
│   │   │   │   ├── CommandeDao.kt
│   │   │   │   └── MouvementStockDao.kt
│   │   │   └── entity/
│   │   │       ├── MatierePremierEntity.kt
│   │   │       ├── ProduitFiniEntity.kt
│   │   │       ├── RecetteEntity.kt
│   │   │       ├── RecetteIngredientEntity.kt
│   │   │       ├── ProductionEntity.kt
│   │   │       ├── CommandeEntity.kt
│   │   │       ├── CommandeLigneEntity.kt
│   │   │       └── MouvementStockEntity.kt
│   │   └── repository/
│   │       ├── StockRepositoryImpl.kt
│   │       ├── RecetteRepositoryImpl.kt
│   │       ├── ProductionRepositoryImpl.kt
│   │       └── CommandeRepositoryImpl.kt
│   ├── domain/
│   │   ├── model/
│   │   │   ├── MatierePremiere.kt
│   │   │   ├── ProduitFini.kt
│   │   │   ├── Recette.kt
│   │   │   ├── Production.kt
│   │   │   ├── Commande.kt
│   │   │   └── MouvementStock.kt
│   │   ├── repository/
│   │   │   ├── StockRepository.kt
│   │   │   ├── RecetteRepository.kt
│   │   │   ├── ProductionRepository.kt
│   │   │   └── CommandeRepository.kt
│   │   └── usecase/
│   │       ├── stock/
│   │       │   ├── GetStockAlertsUseCase.kt
│   │       │   ├── UpdateStockMPUseCase.kt
│   │       │   └── GenerateListeCoursesUseCase.kt
│   │       ├── production/
│   │       │   ├── GetCapaciteProductionUseCase.kt
│   │       │   └── DeclarerProductionUseCase.kt
│   │       ├── commande/
│   │       │   └── ValiderCommandeUseCase.kt
│   │       └── rentabilite/
│   │           ├── CalculerCoutRevientUseCase.kt
│   │           └── GetRentabiliteUseCase.kt
│   ├── presentation/
│   │   ├── navigation/
│   │   │   └── AppNavigation.kt
│   │   ├── screen/
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardScreen.kt
│   │   │   │   └── DashboardViewModel.kt
│   │   │   ├── production/
│   │   │   │   ├── ProductionScreen.kt
│   │   │   │   └── ProductionViewModel.kt
│   │   │   ├── stock/
│   │   │   │   ├── StockMPScreen.kt
│   │   │   │   ├── StockMPViewModel.kt
│   │   │   │   ├── ProduitFiniScreen.kt
│   │   │   │   └── ProduitFiniViewModel.kt
│   │   │   ├── commande/
│   │   │   │   ├── CommandeScreen.kt
│   │   │   │   └── CommandeViewModel.kt
│   │   │   ├── recette/
│   │   │   │   ├── RecetteScreen.kt
│   │   │   │   └── RecetteViewModel.kt
│   │   │   ├── rentabilite/
│   │   │   │   ├── RentabiliteScreen.kt
│   │   │   │   └── RentabiliteViewModel.kt
│   │   │   ├── historique/
│   │   │   │   └── HistoriqueScreen.kt
│   │   │   └── parametres/
│   │   │       └── ParametresScreen.kt
│   │   └── component/
│   │       ├── AlertCard.kt
│   │       ├── CapacityCard.kt
│   │       ├── StockInputRow.kt
│   │       ├── NavSidebar.kt
│   │       └── WeeklyBenefitChip.kt
│   ├── di/
│   │   ├── DatabaseModule.kt
│   │   └── RepositoryModule.kt
│   └── MainApplication.kt
```

---

## 5. Schéma de base de données

```sql
-- Matières premières
CREATE TABLE matieres_premieres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    unite       TEXT NOT NULL,         -- g, kg, L, ml, unité
    stock_actuel REAL NOT NULL DEFAULT 0,
    seuil_tampon REAL NOT NULL DEFAULT 0,
    prix_achat  REAL NOT NULL DEFAULT 0,  -- prix unitaire en €
    created_at  INTEGER NOT NULL,      -- timestamp Unix
    updated_at  INTEGER NOT NULL
);

-- Produits finis
CREATE TABLE produits_finis (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nom          TEXT NOT NULL,
    stock_actuel INTEGER NOT NULL DEFAULT 0,
    prix_vente   REAL NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);

-- Recettes (une par produit fini)
CREATE TABLE recettes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_fini_id INTEGER NOT NULL UNIQUE,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    FOREIGN KEY (produit_fini_id) REFERENCES produits_finis(id) ON DELETE CASCADE
);

-- Ingrédients d'une recette (quantité par unité produite)
CREATE TABLE recette_ingredients (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    recette_id          INTEGER NOT NULL,
    matiere_premiere_id INTEGER NOT NULL,
    quantite            REAL NOT NULL,
    FOREIGN KEY (recette_id) REFERENCES recettes(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_premiere_id) REFERENCES matieres_premieres(id)
);

-- Productions déclarées
CREATE TABLE productions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_fini_id INTEGER NOT NULL,
    quantite        INTEGER NOT NULL,
    forcee          INTEGER NOT NULL DEFAULT 0,  -- 0/1 : production forcée malgré stock insuffisant
    date_heure      INTEGER NOT NULL,
    FOREIGN KEY (produit_fini_id) REFERENCES produits_finis(id)
);

-- Commandes
CREATE TABLE commandes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    canal       TEXT NOT NULL,          -- RESTAURANT | PARTICULIER
    nom_client  TEXT NOT NULL,
    date_heure  INTEGER NOT NULL,
    notes       TEXT
);

-- Lignes de commande
CREATE TABLE commande_lignes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    commande_id     INTEGER NOT NULL,
    produit_fini_id INTEGER NOT NULL,
    quantite        INTEGER NOT NULL,
    prix_unitaire   REAL NOT NULL,      -- prix au moment de la commande (snapshot)
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_fini_id) REFERENCES produits_finis(id)
);

-- Achats de matières premières
CREATE TABLE achats_mp (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere_premiere_id INTEGER NOT NULL,
    quantite            REAL NOT NULL,
    prix_unitaire       REAL NOT NULL,
    date_heure          INTEGER NOT NULL,
    FOREIGN KEY (matiere_premiere_id) REFERENCES matieres_premieres(id)
);

-- Journal des mouvements de stock (traçabilité complète)
CREATE TABLE mouvements_stock (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,  -- ACHAT_MP | PRODUCTION | VENTE | CORRECTION_MP | CORRECTION_PF
    ref_id      INTEGER,        -- id de l'entité source (production_id, commande_id, achat_id)
    ref_table   TEXT,           -- table de référence
    date_heure  INTEGER NOT NULL,
    note        TEXT
);
```

### Index critiques
```sql
CREATE INDEX idx_alertes ON matieres_premieres(stock_actuel, seuil_tampon);
CREATE INDEX idx_mouvements_date ON mouvements_stock(date_heure);
CREATE INDEX idx_commandes_date ON commandes(date_heure);
CREATE INDEX idx_productions_date ON productions(date_heure);
```

---

## 6. Flux de données réactifs (Use Cases critiques)

### GetCapaciteProductionUseCase
```kotlin
// Flux réactif : se recalcule à chaque changement de stock
fun execute(): Flow<List<CapaciteProduction>> {
    return combine(
        stockRepository.getAllMatieresPremieresFlow(),
        recetteRepository.getAllRecettesAvecIngredientsFlow()
    ) { stocks, recettes ->
        recettes.map { recette ->
            val capacite = recette.ingredients.minOf { ingredient ->
                val stockMP = stocks.find { it.id == ingredient.matierePremiereid }
                if (stockMP == null || ingredient.quantite == 0.0) 0
                else (stockMP.stockActuel / ingredient.quantite).toInt()
            }
            val ingredientBloquant = if (capacite == 0) {
                recette.ingredients.firstOrNull { ingredient ->
                    val stock = stocks.find { it.id == ingredient.matierePremiereid }
                    stock == null || stock.stockActuel < ingredient.quantite
                }
            } else null
            CapaciteProduction(
                produitFini = recette.produitFini,
                capacite = capacite,
                ingredientBloquant = ingredientBloquant
            )
        }
    }
}
```

### CalculerCoutRevientUseCase
```kotlin
// Recalcul automatique si recette OU prix d'achat change
fun execute(produitFiniId: Long): Flow<Double> {
    return combine(
        recetteRepository.getRecetteAvecIngredientsFlow(produitFiniId),
        stockRepository.getAllMatieresPremieresFlow()
    ) { recette, stocks ->
        recette?.ingredients?.sumOf { ingredient ->
            val prixAchat = stocks.find { it.id == ingredient.matierePremiereid }?.prixAchat ?: 0.0
            ingredient.quantite * prixAchat
        } ?: 0.0
    }
}
```

### DeclarerProductionUseCase
```kotlin
// Transaction atomique : déduire MP + ajouter PF + enregistrer historique
suspend fun execute(produitFiniId: Long, quantite: Int, forcee: Boolean = false): Result<Unit> {
    return withContext(Dispatchers.IO) {
        runCatching {
            val recette = recetteRepository.getRecetteAvecIngredients(produitFiniId)
                ?: throw IllegalStateException("Recette introuvable")

            database.withTransaction {
                // 1. Vérifier le stock (sauf si forcée)
                if (!forcee) {
                    recette.ingredients.forEach { ingredient ->
                        val stock = stockRepository.getMatierePremiere(ingredient.matierePremiereid)
                        val quantiteNecessaire = ingredient.quantite * quantite
                        if ((stock?.stockActuel ?: 0.0) < quantiteNecessaire) {
                            throw StockInsuffisantException(ingredient, quantiteNecessaire)
                        }
                    }
                }

                // 2. Déduire les MP
                recette.ingredients.forEach { ingredient ->
                    stockRepository.decrementerStockMP(
                        id = ingredient.matierePremiereid,
                        quantite = ingredient.quantite * quantite
                    )
                }

                // 3. Ajouter les PF
                stockRepository.incrementerStockPF(produitFiniId, quantite)

                // 4. Enregistrer la production
                val productionId = productionRepository.insert(
                    Production(produitFiniId = produitFiniId, quantite = quantite, forcee = forcee)
                )

                // 5. Journal des mouvements
                mouvementStockRepository.insert(
                    MouvementStock(type = TypeMouvement.PRODUCTION, refId = productionId)
                )
            }
        }
    }
}
```

---

## 7. Navigation (Jetpack Navigation Compose)

```kotlin
// AppNavigation.kt — destinations principales
sealed class Screen(val route: String) {
    object Dashboard       : Screen("dashboard")
    object Production      : Screen("production")
    object StockMP         : Screen("stock_mp")
    object ProduitsFinis   : Screen("produits_finis")
    object Commandes       : Screen("commandes")
    object Recettes        : Screen("recettes")
    object Rentabilite     : Screen("rentabilite")
    object Historique      : Screen("historique")
    object Parametres      : Screen("parametres")
}

// Layout tablette : NavigationRail (sidebar) + NavHost (contenu)
@Composable
fun AppLayout(navController: NavHostController) {
    Row(modifier = Modifier.fillMaxSize()) {
        NavSidebar(
            navController = navController,
            modifier = Modifier.width(240.dp)
        )
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.weight(1f)
        ) {
            composable(Screen.Dashboard.route)     { DashboardScreen() }
            composable(Screen.Production.route)    { ProductionScreen() }
            // ... autres destinations
        }
    }
}
```

---

## 8. Patterns d'état (UiState)

```kotlin
// Pattern standard pour tous les ViewModels
data class DashboardUiState(
    val alertes: List<AlerteStock> = emptyList(),
    val capacitesProduction: List<CapaciteProduction> = emptyList(),
    val beneficeBrutSemaine: Double = 0.0,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val getStockAlertsUseCase: GetStockAlertsUseCase,
    private val getCapaciteProductionUseCase: GetCapaciteProductionUseCase,
    private val getRentabiliteUseCase: GetRentabiliteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                getStockAlertsUseCase.execute(),
                getCapaciteProductionUseCase.execute(),
                getRentabiliteUseCase.getBeneficeSemaine()
            ) { alertes, capacites, benefice ->
                DashboardUiState(
                    alertes = alertes,
                    capacitesProduction = capacites,
                    beneficeBrutSemaine = benefice,
                    isLoading = false
                )
            }.catch { e ->
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }.collect { state ->
                _uiState.value = state
            }
        }
    }
}
```

---

## 9. Export WhatsApp (Android Share Intent)

```kotlin
fun genererMessageCourses(liste: List<ItemListeCourses>): String {
    val lignes = liste.joinToString("\n") { item ->
        "• ${item.nom} : ${item.quantiteAAcheter.formatDecimal()} ${item.unite}"
    }
    return "🛒 Liste de courses Instant Dessert\n\n$lignes"
}

fun partagerViaWhatsApp(context: Context, message: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, message)
    }
    context.startActivity(Intent.createChooser(intent, "Envoyer via..."))
}
```

---

## 10. ADR — Architecture Decision Records

| ADR | Décision | Alternative écartée | Raison |
|---|---|---|---|
| ADR-1 | Kotlin + Jetpack Compose | Flutter / React Native | App Android native, Material 3 natif, ecosystem officiel |
| ADR-2 | Room (SQLite) | Realm / Firebase | Officiel Android, type-safe, Flow natif, pas de dépendance externe |
| ADR-3 | Clean Architecture + MVVM | MVI / Simple ViewModel | Testabilité du domain layer, séparation claire calculs métier / UI |
| ADR-4 | Hilt (DI) | Manual DI / Koin | Officiel Google, intégration native Compose + ViewModel |
| ADR-5 | StateFlow + Combine | LiveData / RxJava | Coroutines natives Kotlin, intégration Compose, plus simple que RxJava |
| ADR-6 | Transactions Room atomiques | Logique multi-requêtes | Intégrité des données : déclaration production = 1 transaction ou rien |
| ADR-7 | Stockage local uniquement | Firestore / Supabase | V1 : pas de backend nécessaire, simplicité, zéro coût infrastructure |
| ADR-8 | Prix snapshot dans commande_lignes | Calcul à la volée | Historique fidèle : le CDR au moment de la vente est conservé |

---

## 11. Checklist de démarrage projet

```bash
# 1. Créer le projet Android Studio
File → New Project → Empty Activity (Jetpack Compose)
Package: com.instantdessert.stockapp
Language: Kotlin
Min SDK: 29

# 2. Ajouter les dépendances (build.gradle.kts)
# Room, Hilt, Navigation Compose, Coroutines, Material3

# 3. Configurer Room
# AppDatabase.kt + toutes les @Entity + @Dao

# 4. Configurer Hilt
# @HiltAndroidApp sur MainApplication
# DatabaseModule + RepositoryModule

# 5. Implémenter la navigation tablette
# NavigationRail (sidebar) + NavHost

# 6. Commencer par le feature Dashboard
# DashboardViewModel → GetStockAlertsUseCase → GetCapaciteProductionUseCase
```
