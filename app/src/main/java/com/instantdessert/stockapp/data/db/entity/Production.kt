package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "productions",
    foreignKeys = [
        ForeignKey(
            entity = ProduitFini::class,
            parentColumns = ["id"],
            childColumns = ["produitFiniId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["produitFiniId"]),
        Index(value = ["createdAt"])
    ]
)
data class Production(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val produitFiniId: Long,
    val quantite: Int,
    val createdAt: Long = System.currentTimeMillis()
)
