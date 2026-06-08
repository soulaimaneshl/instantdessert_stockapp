package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "produits_finis")
data class ProduitFini(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val prixVente: Double,
    val stockActuel: Int = 0,
    val coutDeRevient: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
