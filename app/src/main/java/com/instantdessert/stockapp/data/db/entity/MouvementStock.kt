package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "mouvements_stock",
    indices = [
        Index(value = ["createdAt"]),
        Index(value = ["entiteType", "entiteId"])
    ]
)
data class MouvementStock(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: TypeMouvement,
    val entiteId: Long,
    val entiteType: EntiteType,
    val delta: Double,
    val raison: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
