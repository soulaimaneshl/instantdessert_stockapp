package com.instantdessert.stockapp.data.db.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "commandes",
    indices = [Index(value = ["createdAt"])]
)
data class Commande(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val canal: Canal,
    val nomClient: String,
    val total: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis()
)
