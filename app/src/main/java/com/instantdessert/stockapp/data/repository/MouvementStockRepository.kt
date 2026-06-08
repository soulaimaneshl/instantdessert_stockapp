package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.dao.MouvementStockDao
import com.instantdessert.stockapp.data.db.entity.MouvementStock
import com.instantdessert.stockapp.data.db.entity.TypeMouvement
import com.instantdessert.stockapp.domain.repository.IMouvementStockRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class MouvementStockRepository @Inject constructor(
    private val dao: MouvementStockDao
) : IMouvementStockRepository {

    override fun getAllFlow(): Flow<List<MouvementStock>> = dao.getAllFlow()
    override fun getForPeriodFlow(from: Long, to: Long): Flow<List<MouvementStock>> = dao.getForPeriodFlow(from, to)
    override fun getByTypeFlow(type: TypeMouvement): Flow<List<MouvementStock>> = dao.getByTypeFlow(type)
    override suspend fun insert(mouvement: MouvementStock): Long = dao.insert(mouvement)
}
