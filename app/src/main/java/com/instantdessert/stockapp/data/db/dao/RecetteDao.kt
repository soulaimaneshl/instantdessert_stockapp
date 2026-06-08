package com.instantdessert.stockapp.data.db.dao

import androidx.room.*
import com.instantdessert.stockapp.data.db.entity.MatierePremiere
import com.instantdessert.stockapp.data.db.entity.Recette
import com.instantdessert.stockapp.data.db.entity.RecetteIngredient
import kotlinx.coroutines.flow.Flow

data class RecetteAvecIngredients(
    @Embedded val recette: Recette,
    @Relation(parentColumn = "id", entityColumn = "recetteId")
    val ingredients: List<RecetteIngredient>
)

data class IngredientAvecMP(
    @Embedded val ingredient: RecetteIngredient,
    @Relation(parentColumn = "matierePremiereid", entityColumn = "id")
    val matierePremiere: MatierePremiere
)

@Dao
interface RecetteDao {

    @Transaction
    @Query("SELECT * FROM recettes")
    fun getAllAvecIngredientsFlow(): Flow<List<RecetteAvecIngredients>>

    @Transaction
    @Query("SELECT * FROM recettes WHERE produitFiniId = :produitFiniId LIMIT 1")
    fun getByProduitFiniFlow(produitFiniId: Long): Flow<RecetteAvecIngredients?>

    @Transaction
    @Query("SELECT * FROM recettes WHERE produitFiniId = :produitFiniId LIMIT 1")
    suspend fun getByProduitFiniSync(produitFiniId: Long): RecetteAvecIngredients?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecette(recette: Recette): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIngredients(ingredients: List<RecetteIngredient>)

    @Delete
    suspend fun deleteIngredient(ingredient: RecetteIngredient)

    @Query("DELETE FROM recette_ingredients WHERE recetteId = :recetteId")
    suspend fun deleteAllIngredients(recetteId: Long)

    @Delete
    suspend fun deleteRecette(recette: Recette)

    @Transaction
    suspend fun saveOrUpdateRecette(produitFiniId: Long, ingredients: List<RecetteIngredient>) {
        val existing = getByProduitFiniSync(produitFiniId)
        val recetteId = if (existing == null) {
            insertRecette(Recette(produitFiniId = produitFiniId))
        } else {
            deleteAllIngredients(existing.recette.id)
            existing.recette.id
        }
        insertIngredients(ingredients.map { it.copy(recetteId = recetteId) })
    }
}
