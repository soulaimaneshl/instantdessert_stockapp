package com.instantdessert.stockapp.presentation.navigation

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.weight
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.instantdessert.stockapp.presentation.components.NavSidebar
import com.instantdessert.stockapp.presentation.screen.*

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Row(modifier = Modifier.fillMaxSize()) {
        NavSidebar(
            destinations = NavDestination.all,
            currentRoute = currentRoute,
            onNavigate = { destination ->
                navController.navigate(destination.route) {
                    popUpTo(navController.graph.findStartDestination().id) {
                        saveState = true
                    }
                    launchSingleTop = true
                    restoreState = true
                }
            }
        )

        NavHost(
            navController = navController,
            startDestination = NavDestination.Accueil.route,
            modifier = Modifier.weight(1f)
        ) {
            composable(NavDestination.Accueil.route) { AccueilScreen() }
            composable(NavDestination.Production.route) { ProductionScreen() }
            composable(NavDestination.StockMP.route) { StockMPScreen() }
            composable(NavDestination.ProduitsFinis.route) { ProduitsFiniScreen() }
            composable(NavDestination.Commandes.route) { CommandesScreen() }
            composable(NavDestination.Recettes.route) { RecettesScreen() }
            composable(NavDestination.Rentabilite.route) { RentabiliteScreen() }
            composable(NavDestination.Historique.route) { HistoriqueScreen() }
            composable(NavDestination.Parametres.route) { ParametresScreen() }
        }
    }
}
