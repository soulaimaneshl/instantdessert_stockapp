package com.instantdessert.stockapp.presentation.screen

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun AccueilScreen() = PlaceholderScreen("Accueil")

@Composable
fun ProductionScreen() = PlaceholderScreen("Production")

@Composable
fun StockMPScreen() = PlaceholderScreen("Stock MP")

@Composable
fun ProduitsFiniScreen() = PlaceholderScreen("Produits finis")

@Composable
fun CommandesScreen() = PlaceholderScreen("Commandes")

@Composable
fun RecettesScreen() = PlaceholderScreen("Recettes")

@Composable
fun RentabiliteScreen() = PlaceholderScreen("Rentabilité")

@Composable
fun HistoriqueScreen() = PlaceholderScreen("Historique")

@Composable
fun ParametresScreen() = PlaceholderScreen("Paramètres")

@Composable
private fun PlaceholderScreen(title: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = title, style = MaterialTheme.typography.headlineMedium)
    }
}
