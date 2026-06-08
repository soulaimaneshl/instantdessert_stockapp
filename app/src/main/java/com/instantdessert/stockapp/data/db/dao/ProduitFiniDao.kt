package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.ProduitFini
import kotlinx.coroutines.flow.Flow

@Dao
interface ProduitFiniDao {

    @Query("SELECT * FROM produits_finis ORDER BY nom ASC")
    fun getAllFlow(): Flow<List<ProduitFini>>

    @Query("SELECT * FROM produits_finis WHERE id = :id")
    suspend fun getById(id: Long): ProduitFini?

    @Query("SELECT * FROM produits_finis")
    suspend fun getAll(): List<ProduitFini>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(produit: ProduitFini): Long

    @Update
    suspend fun update(produit: ProduitFini)

    @Delete
    suspend fun delete(produit: ProduitFini)

    @Query("UPDATE produits_finis SET stockActuel = stockActuel + :delta, updatedAt = :now WHERE id = :id")
    suspend fun incrementStock(id: Long, delta: Int, now: Long = System.currentTimeMillis())

    @Query("UPDATE produits_finis SET coutDeRevient = :cdr, updatedAt = :now WHERE id = :id")
    suspend fun updateCdr(id: Long, cdr: Double, now: Long = System.currentTimeMillis())
}
