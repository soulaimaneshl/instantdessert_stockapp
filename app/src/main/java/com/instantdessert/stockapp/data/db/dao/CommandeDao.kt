package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.Commande
import com.instantdessert.stockapp.data.db.entity.CommandeLigne
import kotlinx.coroutines.flow.Flow

data class CommandeAvecLignes(
    @Embedded val commande: Commande,
    @Relation(parentColumn = "id", entityColumn = "commandeId")
    val lignes: List<CommandeLigne>
)

@Dao
interface CommandeDao {

    @Transaction
    @Query("SELECT * FROM commandes ORDER BY createdAt DESC")
    fun getAllAvecLignesFlow(): Flow<List<CommandeAvecLignes>>

    @Transaction
    @Query("SELECT * FROM commandes WHERE createdAt >= :from AND createdAt <= :to ORDER BY createdAt DESC")
    suspend fun getForPeriod(from: Long, to: Long): List<CommandeAvecLignes>

    @Insert
    suspend fun insertCommande(commande: Commande): Long

    @Insert
    suspend fun insertLignes(lignes: List<CommandeLigne>)

    @Update
    suspend fun updateCommande(commande: Commande)
}
