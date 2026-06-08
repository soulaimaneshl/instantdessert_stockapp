package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.dao.ProduitFiniDao
import com.instantdessert.stockapp.data.db.entity.ProduitFini
import com.instantdessert.stockapp.domain.repository.IProduitFiniRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ProduitFiniRepository @Inject constructor(
    private val dao: ProduitFiniDao
) : IProduitFiniRepository {

    override fun getAllFlow(): Flow<List<ProduitFini>> = dao.getAllFlow()
    override suspend fun getById(id: Long): ProduitFini? = dao.getById(id)
    override suspend fun save(produit: ProduitFini): Long = dao.insert(produit)
    override suspend fun incrementStock(id: Long, delta: Int) = dao.incrementStock(id, delta)
    override suspend fun updateCdr(id: Long, cdr: Double) = dao.updateCdr(id, cdr)
    override suspend fun delete(produit: ProduitFini) = dao.delete(produit)
}
