package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.entity.MatierePremiere
import kotlinx.coroutines.flow.Flow

interface IMatierePremierRepository {
    fun getAllFlow(): Flow<List<MatierePremiere>>
    fun getAlertesFlow(): Flow<List<MatierePremiere>>
    suspend fun getById(id: Long): MatierePremiere?
    suspend fun getAll(): List<MatierePremiere>
    suspend fun save(matiere: MatierePremiere): Long
    suspend fun incrementStock(id: Long, delta: Double)
    suspend fun setStock(id: Long, newStock: Double)
    suspend fun updatePrix(id: Long, prix: Double)
    suspend fun updateSeuil(id: Long, seuil: Double)
    suspend fun delete(matiere: MatierePremiere)
}
