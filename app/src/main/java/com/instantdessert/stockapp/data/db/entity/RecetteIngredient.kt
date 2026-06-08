package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "recette_ingredients",
    foreignKeys = [
        ForeignKey(
            entity = Recette::class,
            parentColumns = ["id"],
            childColumns = ["recetteId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = MatierePremiere::class,
            parentColumns = ["id"],
            childColumns = ["matierePremiereid"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["recetteId"]),
        Index(value = ["matierePremiereid"])
    ]
)
data class RecetteIngredient(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recetteId: Long,
    val matierePremiereid: Long,
    val quantite: Double
)
