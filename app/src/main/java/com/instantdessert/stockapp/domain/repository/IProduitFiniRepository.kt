package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.entity.ProduitFini
import kotlinx.coroutines.flow.Flow

interface IProduitFiniRepository {
    fun getAllFlow(): Flow<List<ProduitFini>>
    suspend fun getById(id: Long): ProduitFini?
    suspend fun save(produit: ProduitFini): Long
    suspend fun incrementStock(id: Long, delta: Int)
    suspend fun updateCdr(id: Long, cdr: Double)
    suspend fun delete(produit: ProduitFini)
}
