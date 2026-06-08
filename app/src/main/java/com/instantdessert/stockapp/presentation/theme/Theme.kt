package com.instantdessert.stockapp.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val ColorScheme = lightColorScheme(
    primary = AccentBlue,
    onPrimary = TextOnAccent,
    primaryContainer = AccentBlueLight,
    onPrimaryContainer = AccentBlueDark,
    background = Background,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    error = Danger,
    onError = TextOnAccent,
    errorContainer = DangerLight,
    outline = Border,
    outlineVariant = BorderStrong
)

@Composable
fun InstantDessertTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ColorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
