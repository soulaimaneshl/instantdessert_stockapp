package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.dao.MatierePremierDao
import com.instantdessert.stockapp.data.db.entity.MatierePremiere
import com.instantdessert.stockapp.domain.repository.IMatierePremierRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class MatierePremierRepository @Inject constructor(
    private val dao: MatierePremierDao
) : IMatierePremierRepository {

    override fun getAllFlow(): Flow<List<MatierePremiere>> = dao.getAllFlow()
    override fun getAlertesFlow(): Flow<List<MatierePremiere>> = dao.getAlertesFlow()
    override suspend fun getById(id: Long): MatierePremiere? = dao.getById(id)
    override suspend fun getAll(): List<MatierePremiere> = dao.getAll()
    override suspend fun save(matiere: MatierePremiere): Long = dao.insert(matiere)
    override suspend fun incrementStock(id: Long, delta: Double) = dao.incrementStock(id, delta)
    override suspend fun setStock(id: Long, newStock: Double) = dao.setStock(id, newStock)
    override suspend fun updatePrix(id: Long, prix: Double) = dao.updatePrix(id, prix)
    override suspend fun updateSeuil(id: Long, seuil: Double) = dao.updateSeuil(id, seuil)
    override suspend fun delete(matiere: MatierePremiere) = dao.delete(matiere)
}
