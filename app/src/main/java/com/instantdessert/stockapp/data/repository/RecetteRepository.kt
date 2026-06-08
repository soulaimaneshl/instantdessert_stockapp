package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.dao.RecetteAvecIngredients
import com.instantdessert.stockapp.data.db.dao.RecetteDao
import com.instantdessert.stockapp.data.db.entity.RecetteIngredient
import com.instantdessert.stockapp.domain.repository.IRecetteRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class RecetteRepository @Inject constructor(
    private val dao: RecetteDao
) : IRecetteRepository {

    override fun getAllAvecIngredientsFlow(): Flow<List<RecetteAvecIngredients>> =
        dao.getAllAvecIngredientsFlow()

    override fun getByProduitFiniFlow(produitFiniId: Long): Flow<RecetteAvecIngredients?> =
        dao.getByProduitFiniFlow(produitFiniId)

    override suspend fun saveOrUpdateRecette(produitFiniId: Long, ingredients: List<RecetteIngredient>) =
        dao.saveOrUpdateRecette(produitFiniId, ingredients)
}
