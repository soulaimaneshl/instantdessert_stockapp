package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.dao.ProductionDao
import com.instantdessert.stockapp.data.db.entity.Production
import com.instantdessert.stockapp.domain.repository.IProductionRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ProductionRepository @Inject constructor(
    private val dao: ProductionDao
) : IProductionRepository {

    override fun getAllFlow(): Flow<List<Production>> = dao.getAllFlow()
    override suspend fun getForPeriod(from: Long, to: Long): List<Production> = dao.getForPeriod(from, to)
    override suspend fun insert(production: Production): Long = dao.insert(production)
}
