package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.Production
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductionDao {

    @Query("SELECT * FROM productions ORDER BY createdAt DESC")
    fun getAllFlow(): Flow<List<Production>>

    @Query("SELECT * FROM productions WHERE produitFiniId = :id ORDER BY createdAt DESC")
    fun getByProduitFiniFlow(id: Long): Flow<List<Production>>

    @Query("SELECT * FROM productions WHERE createdAt >= :from AND createdAt <= :to ORDER BY createdAt DESC")
    suspend fun getForPeriod(from: Long, to: Long): List<Production>

    @Insert
    suspend fun insert(production: Production): Long
}
