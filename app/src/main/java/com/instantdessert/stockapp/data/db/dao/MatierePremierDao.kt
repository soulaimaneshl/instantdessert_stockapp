package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.MatierePremiere
import kotlinx.coroutines.flow.Flow

@Dao
interface MatierePremierDao {

    @Query("SELECT * FROM matieres_premieres ORDER BY nom ASC")
    fun getAllFlow(): Flow<List<MatierePremiere>>

    @Query("SELECT * FROM matieres_premieres WHERE stockActuel <= seuilTampon ORDER BY nom ASC")
    fun getAlertesFlow(): Flow<List<MatierePremiere>>

    @Query("SELECT * FROM matieres_premieres WHERE id = :id")
    suspend fun getById(id: Long): MatierePremiere?

    @Query("SELECT * FROM matieres_premieres")
    suspend fun getAll(): List<MatierePremiere>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(matiere: MatierePremiere): Long

    @Update
    suspend fun update(matiere: MatierePremiere)

    @Delete
    suspend fun delete(matiere: MatierePremiere)

    @Query("UPDATE matieres_premieres SET stockActuel = stockActuel + :delta, updatedAt = :now WHERE id = :id")
    suspend fun incrementStock(id: Long, delta: Double, now: Long = System.currentTimeMillis())

    @Query("UPDATE matieres_premieres SET stockActuel = :newStock, updatedAt = :now WHERE id = :id")
    suspend fun setStock(id: Long, newStock: Double, now: Long = System.currentTimeMillis())

    @Query("UPDATE matieres_premieres SET prixAchat = :prix, updatedAt = :now WHERE id = :id")
    suspend fun updatePrix(id: Long, prix: Double, now: Long = System.currentTimeMillis())

    @Query("UPDATE matieres_premieres SET seuilTampon = :seuil, updatedAt = :now WHERE id = :id")
    suspend fun updateSeuil(id: Long, seuil: Double, now: Long = System.currentTimeMillis())
}
