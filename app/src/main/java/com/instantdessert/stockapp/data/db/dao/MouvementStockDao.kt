package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.MouvementStock
import com.instantdessert.stockapp.data.db.entity.TypeMouvement
import kotlinx.coroutines.flow.Flow

@Dao
interface MouvementStockDao {

    @Query("SELECT * FROM mouvements_stock ORDER BY createdAt DESC")
    fun getAllFlow(): Flow<List<MouvementStock>>

    @Query("SELECT * FROM mouvements_stock WHERE createdAt >= :from AND createdAt <= :to ORDER BY createdAt DESC")
    fun getForPeriodFlow(from: Long, to: Long): Flow<List<MouvementStock>>

    @Query("SELECT * FROM mouvements_stock WHERE type = :type ORDER BY createdAt DESC")
    fun getByTypeFlow(type: TypeMouvement): Flow<List<MouvementStock>>

    @Insert
    suspend fun insert(mouvement: MouvementStock): Long
}
