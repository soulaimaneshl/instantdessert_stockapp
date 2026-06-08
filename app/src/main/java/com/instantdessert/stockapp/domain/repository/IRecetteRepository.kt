package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.dao.RecetteAvecIngredients
import com.instantdessert.stockapp.data.db.entity.RecetteIngredient
import kotlinx.coroutines.flow.Flow

interface IRecetteRepository {
    fun getAllAvecIngredientsFlow(): Flow<List<RecetteAvecIngredients>>
    fun getByProduitFiniFlow(produitFiniId: Long): Flow<RecetteAvecIngredients?>
    suspend fun saveOrUpdateRecette(produitFiniId: Long, ingredients: List<RecetteIngredient>)
}
