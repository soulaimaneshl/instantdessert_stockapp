package com.instantdessert.stockapp.di

import android.content.Context
import androidx.room.Room
import com.instantdessert.stockapp.data.db.AppDatabase
import com.instantdessert.stockapp.data.db.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "instant_dessert.db")
            .build()

    @Provides fun provideMatierePremierDao(db: AppDatabase): MatierePremierDao = db.matierePremierDao()
    @Provides fun provideProduitFiniDao(db: AppDatabase): ProduitFiniDao = db.produitFiniDao()
    @Provides fun provideRecetteDao(db: AppDatabase): RecetteDao = db.recetteDao()
    @Provides fun provideProductionDao(db: AppDatabase): ProductionDao = db.productionDao()
    @Provides fun provideCommandeDao(db: AppDatabase): CommandeDao = db.commandeDao()
    @Provides fun provideMouvementStockDao(db: AppDatabase): MouvementStockDao = db.mouvementStockDao()
}
