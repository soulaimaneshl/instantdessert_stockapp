package com.instantdessert.stockapp.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.instantdessert.stockapp.data.db.dao.*
import com.instantdessert.stockapp.data.db.entity.*

@Database(
    entities = [
        MatierePremiere::class,
        ProduitFini::class,
        Recette::class,
        RecetteIngredient::class,
        Production::class,
        Commande::class,
        CommandeLigne::class,
        MouvementStock::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun matierePremierDao(): MatierePremierDao
    abstract fun produitFiniDao(): ProduitFiniDao
    abstract fun recetteDao(): RecetteDao
    abstract fun productionDao(): ProductionDao
    abstract fun commandeDao(): CommandeDao
    abstract fun mouvementStockDao(): MouvementStockDao
}
