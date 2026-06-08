package com.instantdessert.stockapp.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.instantdessert.stockapp.presentation.navigation.NavDestination
import com.instantdessert.stockapp.presentation.theme.*

@Composable
fun NavSidebar(
    destinations: List<NavDestination>,
    currentRoute: String?,
    onNavigate: (NavDestination) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .width(240.dp)
            .fillMaxHeight()
            .background(Surface)
            .drawBehind {
                drawLine(
                    color = Border,
                    start = Offset(size.width, 0f),
                    end = Offset(size.width, size.height),
                    strokeWidth = 1.dp.toPx()
                )
            }
            .padding(vertical = 8.dp)
    ) {
        Text(
            text = "Instant Dessert",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
        )
        HorizontalDivider(color = Border)
        Spacer(modifier = Modifier.height(8.dp))
        destinations.forEach { destination ->
            NavItem(
                destination = destination,
                isSelected = currentRoute == destination.route,
                onClick = { onNavigate(destination) }
            )
        }
    }
}

@Composable
private fun NavItem(
    destination: NavDestination,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bgColor = if (isSelected) AccentBlueLight else Color.Transparent
    val textColor = if (isSelected) AccentBlue else TextSecondary
    val fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .background(bgColor)
            .then(
                if (isSelected) Modifier.drawBehind {
                    drawLine(
                        color = AccentBlue,
                        start = Offset(0f, 0f),
                        end = Offset(0f, size.height),
                        strokeWidth = 3.dp.toPx()
                    )
                } else Modifier
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = destination.icon,
            contentDescription = null,
            tint = textColor,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = destination.label,
            style = MaterialTheme.typography.bodyLarge,
            color = textColor,
            fontWeight = fontWeight
        )
    }
}
