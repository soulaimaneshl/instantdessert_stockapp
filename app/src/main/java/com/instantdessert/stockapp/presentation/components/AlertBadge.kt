package com.instantdessert.stockapp.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.instantdessert.stockapp.presentation.theme.Danger
import com.instantdessert.stockapp.presentation.theme.TextOnAccent

@Composable
fun AlertBadge(count: Int, modifier: Modifier = Modifier) {
    if (count <= 0) return
    Text(
        text = count.toString(),
        style = MaterialTheme.typography.labelSmall,
        color = TextOnAccent,
        modifier = modifier
            .background(Danger, CircleShape)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}
