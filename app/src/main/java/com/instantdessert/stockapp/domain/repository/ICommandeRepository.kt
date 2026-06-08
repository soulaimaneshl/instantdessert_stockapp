package com.instantdessert.stockapp.domain.repository

import com.instantdessert.stockapp.data.db.dao.CommandeAvecLignes
import com.instantdessert.stockapp.data.db.entity.Commande
import com.instantdessert.stockapp.data.db.entity.CommandeLigne
import kotlinx.coroutines.flow.Flow

interface ICommandeRepository {
    fun getAllAvecLignesFlow(): Flow<List<CommandeAvecLignes>>
    suspend fun getForPeriod(from: Long, to: Long): List<CommandeAvecLignes>
    suspend fun insertCommandeAvecLignes(commande: Commande, lignes: List<CommandeLigne>): Long
}
