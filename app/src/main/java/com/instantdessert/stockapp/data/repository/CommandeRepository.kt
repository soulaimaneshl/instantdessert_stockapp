package com.instantdessert.stockapp.data.repository

import com.instantdessert.stockapp.data.db.AppDatabase
import com.instantdessert.stockapp.data.db.dao.CommandeAvecLignes
import com.instantdessert.stockapp.data.db.dao.CommandeDao
import com.instantdessert.stockapp.data.db.entity.Commande
import com.instantdessert.stockapp.data.db.entity.CommandeLigne
import com.instantdessert.stockapp.domain.repository.ICommandeRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class CommandeRepository @Inject constructor(
    private val dao: CommandeDao,
    private val db: AppDatabase
) : ICommandeRepository {

    override fun getAllAvecLignesFlow(): Flow<List<CommandeAvecLignes>> = dao.getAllAvecLignesFlow()

    override suspend fun getForPeriod(from: Long, to: Long): List<CommandeAvecLignes> =
        dao.getForPeriod(from, to)

    override suspend fun insertCommandeAvecLignes(commande: Commande, lignes: List<CommandeLigne>): Long =
        db.withTransaction {
            val commandeId = dao.insertCommande(commande)
            val lignesWithId = lignes.map { it.copy(commandeId = commandeId) }
            dao.insertLignes(lignesWithId)
            commandeId
        }
}
