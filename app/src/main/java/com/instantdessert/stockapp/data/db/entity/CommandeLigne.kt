package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "commande_lignes",
    foreignKeys = [
        ForeignKey(
            entity = Commande::class,
            parentColumns = ["id"],
            childColumns = ["commandeId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ProduitFini::class,
            parentColumns = ["id"],
            childColumns = ["produitFiniId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["commandeId"]),
        Index(value = ["produitFiniId"])
    ]
)
data class CommandeLigne(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val commandeId: Long,
    val produitFiniId: Long,
    val quantite: Int,
    val prixUnitaireSnapshot: Double
)
