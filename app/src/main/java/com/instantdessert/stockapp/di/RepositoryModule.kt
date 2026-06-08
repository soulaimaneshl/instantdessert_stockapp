package com.instantdessert.stockapp.di

import com.instantdessert.stockapp.data.repository.*
import com.instantdessert.stockapp.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds @Singleton
    abstract fun bindMatierePremierRepository(impl: MatierePremierRepository): IMatierePremierRepository

    @Binds @Singleton
    abstract fun bindProduitFiniRepository(impl: ProduitFiniRepository): IProduitFiniRepository

    @Binds @Singleton
    abstract fun bindRecetteRepository(impl: RecetteRepository): IRecetteRepository

    @Binds @Singleton
    abstract fun bindProductionRepository(impl: ProductionRepository): IProductionRepository

    @Binds @Singleton
    abstract fun bindCommandeRepository(impl: CommandeRepository): ICommandeRepository

    @Binds @Singleton
    abstract fun bindMouvementStockRepository(impl: MouvementStockRepository): IMouvementStockRepository
}
