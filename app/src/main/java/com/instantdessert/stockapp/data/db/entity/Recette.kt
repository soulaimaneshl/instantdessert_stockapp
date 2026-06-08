package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "recettes",
    foreignKeys = [
        ForeignKey(
            entity = ProduitFini::class,
            parentColumns = ["id"],
            childColumns = ["produitFiniId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["produitFiniId"], unique = true)]
)
data class Recette(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val produitFiniId: Long,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
