package com.instantdessert.stockapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.instantdessert.stockapp.presentation.navigation.AppNavigation
import com.instantdessert.stockapp.presentation.theme.InstantDessertTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            InstantDessertTheme {
                AppNavigation()
            }
        }
    }
}
