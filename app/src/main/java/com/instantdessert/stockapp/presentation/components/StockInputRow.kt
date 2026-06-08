package com.instantdessert.stockapp.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.instantdessert.stockapp.presentation.theme.Border

data class DropdownItem(val id: Long, val label: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StockInputRow(
    items: List<DropdownItem>,
    selectedItem: DropdownItem?,
    quantity: String,
    onItemSelected: (DropdownItem) -> Unit,
    onQuantityChanged: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val transparent = Color.Transparent

    Column(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = it },
                modifier = Modifier.weight(0.7f)
            ) {
                OutlinedTextField(
                    value = selectedItem?.label ?: "",
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = transparent,
                        focusedBorderColor = transparent
                    )
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    items.forEach { item ->
                        DropdownMenuItem(
                            text = { Text(item.label) },
                            onClick = {
                                onItemSelected(item)
                                expanded = false
                            }
                        )
                    }
                }
            }
            OutlinedTextField(
                value = quantity,
                onValueChange = onQuantityChanged,
                modifier = Modifier
                    .weight(0.3f)
                    .height(56.dp),
                textStyle = MaterialTheme.typography.bodyLarge.copy(
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.End
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = transparent,
                    focusedBorderColor = transparent
                )
            )
        }
        HorizontalDivider(color = Border)
    }
}
