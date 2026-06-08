package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.entity.Production
import kotlinx.coroutines.flow.Flow

interface IProductionRepository {
    fun getAllFlow(): Flow<List<Production>>
    suspend fun getForPeriod(from: Long, to: Long): List<Production>
    suspend fun insert(production: Production): Long
}
