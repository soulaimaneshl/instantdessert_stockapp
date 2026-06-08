package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "matieres_premieres",
    indices = [
        Index(value = ["nom"], unique = true),
        Index(value = ["stockActuel", "seuilTampon"], name = "idx_alertes")
    ]
)
data class MatierePremiere(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val unite: Unite,
    val stockActuel: Double,
    val seuilTampon: Double,
    val prixAchat: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
