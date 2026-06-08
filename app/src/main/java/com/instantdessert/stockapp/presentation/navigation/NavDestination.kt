package com.instantdessert.stockapp.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class NavDestination(
    val route: String,
    val label: String,
    val icon: ImageVector
) {
    data object Accueil : NavDestination("accueil", "Accueil", Icons.Default.Dashboard)
    data object Production : NavDestination("production", "Production", Icons.Default.AddBox)
    data object StockMP : NavDestination("stock_mp", "Stock MP", Icons.Default.Inventory)
    data object ProduitsFinis : NavDestination("produits_finis", "Produits finis", Icons.Default.Cake)
    data object Commandes : NavDestination("commandes", "Commandes", Icons.Default.Receipt)
    data object Recettes : NavDestination("recettes", "Recettes", Icons.Default.MenuBook)
    data object Rentabilite : NavDestination("rentabilite", "Rentabilité", Icons.Default.TrendingUp)
    data object Historique : NavDestination("historique", "Historique", Icons.Default.History)
    data object Parametres : NavDestination("parametres", "Paramètres", Icons.Default.Settings)

    companion object {
        val all = listOf(
            Accueil, Production, StockMP, ProduitsFinis,
            Commandes, Recettes, Rentabilite, Historique, Parametres
        )
    }
}
