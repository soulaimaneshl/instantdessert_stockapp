package com.instantdessert.stockapp.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.instantdessert.stockapp.presentation.theme.*

@Composable
fun CapacityCard(
    productName: String,
    capacity: Int,
    blockedReason: String? = null,
    modifier: Modifier = Modifier
) {
    val isBlocked = capacity == 0 && blockedReason != null

    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = productName,
                style = MaterialTheme.typography.headlineMedium,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (isBlocked) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Block,
                        contentDescription = null,
                        tint = Danger,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = blockedReason!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Danger
                    )
                }
            } else {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = capacity.toString(),
                        style = MaterialTheme.typography.displayLarge.copy(
                            fontFamily = FontFamily.Monospace
                        ),
                        color = AccentBlue
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "unités",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
            }
        }
    }
}
