package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.entity.MouvementStock
import com.instantdessert.stockapp.data.db.entity.TypeMouvement
import kotlinx.coroutines.flow.Flow

interface IMouvementStockRepository {
    fun getAllFlow(): Flow<List<MouvementStock>>
    fun getForPeriodFlow(from: Long, to: Long): Flow<List<MouvementStock>>
    fun getByTypeFlow(type: TypeMouvement): Flow<List<MouvementStock>>
    suspend fun insert(mouvement: MouvementStock): Long
}
