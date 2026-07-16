import { create } from 'zustand'
import { supabase, supabaseAdmin } from '../lib/supabase'
import type {
  MatierePremiere, ProduitFini, Recette, RecetteIngredient,
  Production, Commande, CommandeLigne, MouvementStock, Canal,
  CommandeSite, PreparationIngredient, PreparationRecette
} from '../types'

interface AppStore {
  matieres: MatierePremiere[]
  produits: ProduitFini[]
  recettes: Recette[]
  preparationRecettes: PreparationRecette[]
  productions: Production[]
  commandes: Commande[]
  commandesSite: CommandeSite[]
  mouvements: MouvementStock[]
  loading: boolean

  loadAll: () => Promise<void>

  saveMatiere: (data: Omit<MatierePremiere, 'id' | 'createdAt'> & { id?: string }) => Promise<void>
  deleteMatiere: (id: string) => Promise<void>
  ajusterStock: (id: string, delta: number, raison?: string) => Promise<void>
  savePreparationRecette: (prepId: string, ingredients: PreparationIngredient[]) => Promise<void>
  produirePreparation: (prepId: string, quantite: number) => Promise<{ ok: boolean; erreur?: string }>

  saveProduit: (data: Omit<ProduitFini, 'id' | 'stockActuel' | 'coutDeRevient'> & { id?: string }) => Promise<void>
  deleteProduit: (id: string) => Promise<void>

  saveRecette: (produitFiniId: string, ingredients: RecetteIngredient[]) => Promise<void>

  produire: (produitId: string, quantite: number) => Promise<{ ok: boolean; erreur?: string }>
  annulerProduction: (productionId: string) => Promise<{ ok: boolean; erreur?: string }>
  modifierProduction: (productionId: string, newProduitId: string, newQuantite: number) => Promise<{ ok: boolean; erreur?: string }>
  ajusterStockProduit: (produitId: string, delta: number, avecMP: boolean, raisonOverride?: string) => Promise<void>

  enregistrerCommande: (
    nomClient: string, canal: Canal,
    lignes: { produitId: string; quantite: number; prix: number }[]
  ) => Promise<void>

  preparerCommandeSite: (
    cmdId: string,
    source: 'B2C' | 'B2B',
    matches: { pfId: string; quantite: number }[]
  ) => Promise<void>

  annulerCommandeSite: (
    cmdId: string,
    source: 'B2C' | 'B2B',
    matches: { pfId: string; quantite: number }[]
  ) => Promise<void>

  validerCommandeSite: (cmdId: string, source: 'B2C' | 'B2B') => Promise<void>
}

// Helpers de mapping Supabase → types locaux
const mpFromRow = (r: Record<string, unknown>): MatierePremiere => ({
  id: r.id as string,
  nom: r.nom as string,
  unite: r.unite as MatierePremiere['unite'],
  categorie: (r.categorie as string) || '',
  stockActuel: Number(r.stock_actuel),
  seuilTampon: Number(r.seuil_tampon),
  prixAchat: Number(r.prix_achat),
  createdAt: new Date(r.created_at as string).getTime(),
  estPreparation: Boolean(r.est_preparation),
})

const pfFromRow = (r: Record<string, unknown>): ProduitFini => ({
  id: r.id as string,
  nom: r.nom as string,
  categorie: (r.categorie as string) || '',
  prixVente: Number(r.prix_vente),
  stockActuel: Number(r.stock_actuel),
  coutDeRevient: Number(r.cout_de_revient),
  baseProduitId: (r.base_produit_id as string) || null,
})

const mouFromRow = (r: Record<string, unknown>): MouvementStock => ({
  id: r.id as string,
  type: r.type as MouvementStock['type'],
  entiteId: r.entite_id as string,
  entiteType: r.entite_type as MouvementStock['entiteType'],
  delta: Number(r.delta),
  raison: r.raison as string | undefined,
  createdAt: new Date(r.created_at as string).getTime(),
})

const cmdFromRow = (r: Record<string, unknown>, lignes: CommandeLigne[]): Commande => ({
  id: r.id as string,
  canal: r.canal as Canal,
  nomClient: r.nom_client as string,
  total: Number(r.total),
  lignes,
  createdAt: new Date(r.created_at as string).getTime(),
})

// Calcule les déductions réelles en cascade :
// si un ingrédient est une Préparation sans stock → remplace par ses MPs brutes
function resolveDeductions(
  ingredients: { mpId: string; quantite: number }[],
  matieres: MatierePremiere[],
  preparationRecettes: PreparationRecette[]
): { mpId: string; delta: number }[] {
  const result: { mpId: string; delta: number }[] = []
  for (const { mpId, quantite } of ingredients) {
    const mp = matieres.find(m => m.id === mpId)
    if (!mp?.estPreparation || mp.stockActuel >= quantite) {
      result.push({ mpId, delta: -quantite })
    } else {
      const sub = preparationRecettes.find(r => r.preparationId === mpId)
      if (sub && sub.ingredients.length > 0) {
        for (const si of sub.ingredients)
          result.push({ mpId: si.mpIngredientId, delta: -(si.quantite * quantite) })
      } else {
        result.push({ mpId, delta: -quantite })
      }
    }
  }
  return result
}

// Vérifie la faisabilité avec cascade
function checkDeductions(
  ingredients: { mpId: string; quantite: number }[],
  matieres: MatierePremiere[],
  preparationRecettes: PreparationRecette[]
): { ok: boolean; erreur?: string } {
  for (const { mpId, quantite } of ingredients) {
    const mp = matieres.find(m => m.id === mpId)
    if (!mp?.estPreparation) {
      if (!mp || mp.stockActuel < quantite)
        return { ok: false, erreur: `Stock insuffisant: ${mp?.nom ?? '?'} (dispo: ${mp?.stockActuel ?? 0}, requis: ${quantite})` }
    } else if (mp.stockActuel >= quantite) {
      continue
    } else {
      const sub = preparationRecettes.find(r => r.preparationId === mpId)
      if (!sub || sub.ingredients.length === 0)
        return { ok: false, erreur: `${mp.nom} insuffisant(e) (stock: ${mp.stockActuel}) — aucune recette de secours configurée` }
      for (const si of sub.ingredients) {
        const subMp = matieres.find(m => m.id === si.mpIngredientId)
        const requis = si.quantite * quantite
        if (!subMp || subMp.stockActuel < requis)
          return { ok: false, erreur: `Impossible de fabriquer ${mp.nom}: ${subMp?.nom ?? '?'} insuffisant (dispo: ${subMp?.stockActuel ?? 0}, requis: ${requis})` }
      }
    }
  }
  return { ok: true }
}

export const useAppStore = create<AppStore>((set, get) => ({
  matieres: [], produits: [], recettes: [], preparationRecettes: [],
  productions: [], commandes: [], commandesSite: [], mouvements: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    const [mpRes, pfRes, riRes, prepIngRes, prodRes, mvtRes, ventesRes, lignesRes, b2cRes, b2cItemsRes, b2bRes, b2bItemsRes] = await Promise.all([
      supabase.from('matieres_premieres').select('*').order('created_at'),
      supabase.from('produits_finis').select('*').order('created_at'),
      supabase.from('recette_ingredients').select('*'),
      supabase.from('preparation_ingredients').select('*'),
      supabase.from('productions').select('*').order('created_at', { ascending: false }),
      supabase.from('mouvements_stock').select('*').order('created_at', { ascending: false }),
      supabase.from('ventes_directes').select('*').order('created_at', { ascending: false }),
      supabase.from('vente_lignes').select('*'),
      supabaseAdmin.from('orders_b2c').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('order_items_b2c').select('*'),
      supabaseAdmin.from('orders_b2b').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('order_items_b2b').select('id, order_id, product_id, quantite, products(nom, prix_b2b)'),
    ])

    const matieres = (mpRes.data ?? []).map(mpFromRow)
    const produits = (pfRes.data ?? []).map(pfFromRow)

    // Recettes groupées par produit_fini_id
    const riMap: Record<string, RecetteIngredient[]> = {}
    for (const ri of (riRes.data ?? [])) {
      const pid = ri.produit_fini_id as string
      if (!riMap[pid]) riMap[pid] = []
      riMap[pid].push({ matierePremiereId: ri.matiere_premiere_id as string, quantite: Number(ri.quantite) })
    }
    const recettes: Recette[] = Object.entries(riMap).map(([produitFiniId, ingredients]) => ({
      produitFiniId,
      ingredients,
    }))

    // Recettes des préparations
    const prepIngMap: Record<string, PreparationIngredient[]> = {}
    for (const r of (prepIngRes.data ?? [])) {
      const pid = r.preparation_id as string
      if (!prepIngMap[pid]) prepIngMap[pid] = []
      prepIngMap[pid].push({ mpIngredientId: r.mp_ingredient_id as string, quantite: Number(r.quantite) })
    }
    const preparationRecettes: PreparationRecette[] = Object.entries(prepIngMap).map(([preparationId, ingredients]) => ({
      preparationId, ingredients
    }))

    const productions: Production[] = (prodRes.data ?? []).map(r => ({
      id: r.id as string,
      produitFiniId: r.produit_fini_id as string,
      quantite: Number(r.quantite),
      createdAt: new Date(r.created_at as string).getTime(),
    }))

    const mouvements = (mvtRes.data ?? []).map(mouFromRow)

    // Commandes avec lignes
    const lignesMap: Record<string, CommandeLigne[]> = {}
    for (const l of (lignesRes.data ?? [])) {
      const vid = l.vente_id as string
      if (!lignesMap[vid]) lignesMap[vid] = []
      lignesMap[vid].push({
        produitFiniId: l.produit_fini_id as string,
        quantite: Number(l.quantite),
        prixUnitaireSnapshot: Number(l.prix_unitaire),
      })
    }
    const commandes = (ventesRes.data ?? []).map(r =>
      cmdFromRow(r, lignesMap[r.id as string] ?? [])
    )

    // Commandes B2C du site
    const b2cItemsMap: Record<string, { nom: string; quantite: number; prix: number }[]> = {}
    for (const i of (b2cItemsRes.data ?? [])) {
      const oid = i.order_id as string
      if (!b2cItemsMap[oid]) b2cItemsMap[oid] = []
      b2cItemsMap[oid].push({ nom: i.nom as string, quantite: Number(i.quantite), prix: Number(i.prix) })
    }
    const commandesB2C: CommandeSite[] = (b2cRes.data ?? []).map(o => ({
      id: o.id as string,
      source: 'B2C' as const,
      nomClient: `${o.adresse_prenom ?? ''} ${o.adresse_nom ?? ''}`.trim() || 'Client',
      statut: o.statut as string,
      total: Number(o.total),
      lignes: b2cItemsMap[o.id as string] ?? [],
      createdAt: new Date(o.created_at as string).getTime(),
    }))

    // Commandes B2B du site
    const b2bItemsMap: Record<string, { nom: string; quantite: number; prix: number }[]> = {}
    for (const i of (b2bItemsRes.data ?? [])) {
      const oid = i.order_id as string
      if (!b2bItemsMap[oid]) b2bItemsMap[oid] = []
      const prod = (i.products as unknown) as { nom: string; prix_b2b: number } | null
      b2bItemsMap[oid].push({ nom: prod?.nom ?? 'Produit', quantite: Number(i.quantite), prix: Number(prod?.prix_b2b ?? 0) })
    }
    const commandesB2B: CommandeSite[] = (b2bRes.data ?? []).map(o => ({
      id: o.id as string,
      source: 'B2B' as const,
      nomClient: 'Restaurant',
      statut: o.statut as string,
      total: b2bItemsMap[o.id as string]?.reduce((s, i) => s + i.quantite * i.prix, 0) ?? 0,
      lignes: b2bItemsMap[o.id as string] ?? [],
      createdAt: new Date(o.created_at as string).getTime(),
    }))

    const commandesSite = [...commandesB2C, ...commandesB2B].sort((a, b) => b.createdAt - a.createdAt)

    // Auto-restauration des commandes annulées par le site (stock déduit lors de la préparation)
    const restoredRaisons = new Set<string>()
    for (const cmd of commandesSite.filter(c => ['annulee', 'annule'].includes(c.statut))) {
      const raison = `Commande site #${cmd.id.slice(0, 8)}`
      const relatedMvts = mouvements.filter(m => m.raison === raison && m.delta < 0)
      if (relatedMvts.length === 0) continue
      for (const mvt of relatedMvts) {
        if (mvt.entiteType === 'MATIERE_PREMIERE') {
          const idx = matieres.findIndex(m => m.id === mvt.entiteId)
          if (idx >= 0) {
            const newStock = Math.max(0, matieres[idx].stockActuel + Math.abs(mvt.delta))
            matieres[idx] = { ...matieres[idx], stockActuel: newStock }
            await supabase.from('matieres_premieres').update({ stock_actuel: newStock }).eq('id', mvt.entiteId)
          }
        } else if (mvt.entiteType === 'PRODUIT_FINI') {
          const idx = produits.findIndex(p => p.id === mvt.entiteId)
          if (idx >= 0) {
            const newStock = Math.max(0, produits[idx].stockActuel + Math.abs(mvt.delta))
            produits[idx] = { ...produits[idx], stockActuel: newStock }
            await supabase.from('produits_finis').update({ stock_actuel: newStock }).eq('id', mvt.entiteId)
          }
        }
      }
      await supabase.from('mouvements_stock').delete().eq('raison', raison).lt('delta', 0)
      restoredRaisons.add(raison)
    }
    const mouvementsFinal = mouvements.filter(m => !(restoredRaisons.has(m.raison ?? '') && m.delta < 0))
    // Les commandes annulées restent visibles pour traçabilité (stock déjà restauré ci-dessus)
    set({ matieres, produits, recettes, preparationRecettes, productions, mouvements: mouvementsFinal, commandes, commandesSite, loading: false })
  },

  saveMatiere: async (data) => {
    const row = {
      nom: data.nom, unite: data.unite,
      stock_actuel: data.stockActuel, seuil_tampon: data.seuilTampon, prix_achat: data.prixAchat,
      est_preparation: data.estPreparation ?? false,
    }
    if (data.id) {
      await supabase.from('matieres_premieres').update(row).eq('id', data.id)
      set(s => ({ matieres: s.matieres.map(m => m.id === data.id ? { ...m, ...data } : m) }))
    } else {
      const { data: inserted } = await supabase.from('matieres_premieres').insert(row).select().single()
      if (inserted) set(s => ({ matieres: [...s.matieres, mpFromRow(inserted as Record<string, unknown>)] }))
    }
  },

  deleteMatiere: async (id) => {
    await supabase.from('matieres_premieres').delete().eq('id', id)
    set(s => ({ matieres: s.matieres.filter(m => m.id !== id) }))
  },

  ajusterStock: async (id, delta, raison) => {
    const mp = get().matieres.find(m => m.id === id)
    if (!mp) return
    const newStock = Math.max(0, mp.stockActuel + delta)
    await supabase.from('matieres_premieres').update({ stock_actuel: newStock }).eq('id', id)
    const { data: mvt } = await supabase.from('mouvements_stock').insert({
      type: delta >= 0 ? 'ACHAT_MP' : 'CORRECTION_MP',
      entite_id: id, entite_type: 'MATIERE_PREMIERE', delta, raison,
    }).select().single()
    set(s => ({
      matieres: s.matieres.map(m => m.id === id ? { ...m, stockActuel: newStock } : m),
      mouvements: mvt ? [mouFromRow(mvt as Record<string, unknown>), ...s.mouvements] : s.mouvements,
    }))
  },

  saveProduit: async (data) => {
    const row = { nom: data.nom, prix_vente: data.prixVente, base_produit_id: data.baseProduitId ?? null }
    if (data.id) {
      await supabase.from('produits_finis').update(row).eq('id', data.id)
      set(s => ({ produits: s.produits.map(p => p.id === data.id ? { ...p, ...data } : p) }))
    } else {
      const { data: inserted } = await supabase.from('produits_finis').insert(row).select().single()
      if (inserted) set(s => ({ produits: [...s.produits, pfFromRow(inserted as Record<string, unknown>)] }))
    }
  },

  deleteProduit: async (id) => {
    await supabase.from('produits_finis').delete().eq('id', id)
    set(s => ({
      produits: s.produits.filter(p => p.id !== id),
      recettes: s.recettes.filter(r => r.produitFiniId !== id),
    }))
  },

  saveRecette: async (produitFiniId, ingredients) => {
    // Supprimer les anciens ingrédients
    await supabase.from('recette_ingredients').delete().eq('produit_fini_id', produitFiniId)
    // Insérer les nouveaux
    if (ingredients.length > 0) {
      await supabase.from('recette_ingredients').insert(
        ingredients.map(i => ({
          produit_fini_id: produitFiniId,
          matiere_premiere_id: i.matierePremiereId,
          quantite: i.quantite,
        }))
      )
    }
    // Recalcul CDR
    const matieres = get().matieres
    const cdr = ingredients.reduce((sum, ing) => {
      const mp = matieres.find(m => m.id === ing.matierePremiereId)
      return sum + (mp?.prixAchat ?? 0) * ing.quantite
    }, 0)
    await supabase.from('produits_finis').update({ cout_de_revient: cdr }).eq('id', produitFiniId)
    set(s => ({
      recettes: [
        ...s.recettes.filter(r => r.produitFiniId !== produitFiniId),
        { produitFiniId, ingredients },
      ],
      produits: s.produits.map(p => p.id === produitFiniId ? { ...p, coutDeRevient: cdr } : p),
    }))
  },

  produire: async (produitId, quantite) => {
    const { matieres, recettes, produits, preparationRecettes } = get()
    const recette = recettes.find(r => r.produitFiniId === produitId)
    const produit = produits.find(p => p.id === produitId)
    if (!produit) return { ok: false, erreur: 'Produit introuvable' }

    if (recette) {
      const check = checkDeductions(
        recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
        matieres, preparationRecettes
      )
      if (!check.ok) return { ok: false, erreur: check.erreur }
    }

    const newMatieres = [...matieres]
    const mvtInserts: object[] = []
    if (recette) {
      // Résoudre la cascade : préparation en stock → déduire direct ; épuisée → déduire ses MPs brutes
      const deductions = resolveDeductions(
        recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
        matieres, preparationRecettes
      )
      for (const { mpId, delta } of deductions) {
        const idx = newMatieres.findIndex(m => m.id === mpId)
        if (idx >= 0) {
          newMatieres[idx] = { ...newMatieres[idx], stockActuel: Math.max(0, newMatieres[idx].stockActuel + delta) }
          await supabase.from('matieres_premieres').update({ stock_actuel: newMatieres[idx].stockActuel }).eq('id', mpId)
          mvtInserts.push({ type: 'PRODUCTION', entite_id: mpId, entite_type: 'MATIERE_PREMIERE', delta, raison: `Production: ${produit.nom} ×${quantite}` })
        }
      }
    }

    const newStock = produit.stockActuel + quantite
    await supabase.from('produits_finis').update({ stock_actuel: newStock }).eq('id', produitId)
    mvtInserts.push({ type: 'PRODUCTION', entite_id: produitId, entite_type: 'PRODUIT_FINI', delta: quantite, raison: `Production ×${quantite}` })

    await supabase.from('productions').insert({ produit_fini_id: produitId, quantite })
    const { data: newMvts } = await supabase.from('mouvements_stock').insert(mvtInserts).select()

    set(s => ({
      matieres: newMatieres,
      produits: s.produits.map(p => p.id === produitId ? { ...p, stockActuel: newStock } : p),
      mouvements: [...(newMvts ?? []).map(m => mouFromRow(m as Record<string, unknown>)), ...s.mouvements],
    }))
    return { ok: true }
  },

  annulerProduction: async (productionId) => {
    const { matieres, recettes, produits, productions } = get()
    const prod = productions.find(p => p.id === productionId)
    if (!prod) return { ok: false, erreur: 'Production introuvable' }
    const produit = produits.find(p => p.id === prod.produitFiniId)
    if (!produit) return { ok: false, erreur: 'Produit introuvable' }

    const recette = recettes.find(r => r.produitFiniId === prod.produitFiniId)
    const newMatieres = [...matieres]
    const mvtInserts: object[] = []

    // Ré-incrémenter les MP
    if (recette) {
      for (const ing of recette.ingredients) {
        const requis = ing.quantite * prod.quantite
        const idx = newMatieres.findIndex(m => m.id === ing.matierePremiereId)
        if (idx >= 0) {
          newMatieres[idx] = { ...newMatieres[idx], stockActuel: newMatieres[idx].stockActuel + requis }
          await supabase.from('matieres_premieres').update({ stock_actuel: newMatieres[idx].stockActuel }).eq('id', ing.matierePremiereId)
          mvtInserts.push({ type: 'CORRECTION_MP', entite_id: ing.matierePremiereId, entite_type: 'MATIERE_PREMIERE', delta: requis, raison: `Annulation production: ${produit.nom} ×${prod.quantite}` })
        }
      }
    }

    // Décrémenter le PF
    const newStock = Math.max(0, produit.stockActuel - prod.quantite)
    await supabase.from('produits_finis').update({ stock_actuel: newStock }).eq('id', prod.produitFiniId)
    mvtInserts.push({ type: 'CORRECTION_MP', entite_id: prod.produitFiniId, entite_type: 'PRODUIT_FINI', delta: -prod.quantite, raison: `Annulation production ×${prod.quantite}` })

    await supabase.from('productions').delete().eq('id', productionId)
    const { data: newMvts } = await supabase.from('mouvements_stock').insert(mvtInserts).select()

    set(s => ({
      matieres: newMatieres,
      productions: s.productions.filter(p => p.id !== productionId),
      produits: s.produits.map(p => p.id === prod.produitFiniId ? { ...p, stockActuel: newStock } : p),
      mouvements: [...(newMvts ?? []).map(m => mouFromRow(m as Record<string, unknown>)), ...s.mouvements],
    }))
    return { ok: true }
  },

  modifierProduction: async (productionId, newProduitId, newQuantite) => {
    const { matieres, recettes, produits, productions } = get()
    const prod = productions.find(p => p.id === productionId)
    if (!prod) return { ok: false, erreur: 'Production introuvable' }
    const oldProduit = produits.find(p => p.id === prod.produitFiniId)
    const newProduit = produits.find(p => p.id === newProduitId)
    if (!oldProduit || !newProduit) return { ok: false, erreur: 'Produit introuvable' }

    const oldRecette = recettes.find(r => r.produitFiniId === prod.produitFiniId)
    const newRecette = recettes.find(r => r.produitFiniId === newProduitId)

    // Simuler les stocks MP après annulation ancienne + application nouvelle
    const mpMap: Map<string, number> = new Map(matieres.map(m => [m.id, m.stockActuel]))

    // Reverser ancienne production (re-créditer les MP)
    if (oldRecette) {
      for (const ing of oldRecette.ingredients) {
        mpMap.set(ing.matierePremiereId, (mpMap.get(ing.matierePremiereId) ?? 0) + ing.quantite * prod.quantite)
      }
    }

    // Vérifier faisabilité de la nouvelle production
    if (newRecette) {
      for (const ing of newRecette.ingredients) {
        const dispo = mpMap.get(ing.matierePremiereId) ?? 0
        const requis = ing.quantite * newQuantite
        if (dispo < requis) {
          const nom = matieres.find(m => m.id === ing.matierePremiereId)?.nom ?? '?'
          return { ok: false, erreur: `Stock insuffisant: ${nom} (dispo: ${dispo.toFixed(0)}, requis: ${requis})` }
        }
      }
    }

    // Appliquer la nouvelle production (débiter MP)
    if (newRecette) {
      for (const ing of newRecette.ingredients) {
        mpMap.set(ing.matierePremiereId, (mpMap.get(ing.matierePremiereId) ?? 0) - ing.quantite * newQuantite)
      }
    }

    // Stocks PF : annuler ancien PF, créditer nouveau PF
    const pfMap: Map<string, number> = new Map(produits.map(p => [p.id, p.stockActuel]))
    pfMap.set(prod.produitFiniId, (pfMap.get(prod.produitFiniId) ?? 0) - prod.quantite)
    pfMap.set(newProduitId, (pfMap.get(newProduitId) ?? 0) + newQuantite)

    // Appliquer en DB
    for (const [id, stock] of mpMap) {
      const old = matieres.find(m => m.id === id)
      if (old && old.stockActuel !== stock) {
        await supabase.from('matieres_premieres').update({ stock_actuel: Math.max(0, stock) }).eq('id', id)
      }
    }
    for (const [id, stock] of pfMap) {
      const old = produits.find(p => p.id === id)
      if (old && old.stockActuel !== stock) {
        await supabase.from('produits_finis').update({ stock_actuel: Math.max(0, stock) }).eq('id', id)
      }
    }
    await supabase.from('productions').update({ produit_fini_id: newProduitId, quantite: newQuantite }).eq('id', productionId)

    set(s => ({
      matieres: s.matieres.map(m => mpMap.has(m.id) ? { ...m, stockActuel: Math.max(0, mpMap.get(m.id)!) } : m),
      produits: s.produits.map(p => pfMap.has(p.id) ? { ...p, stockActuel: Math.max(0, pfMap.get(p.id)!) } : p),
      productions: s.productions.map(p => p.id === productionId ? { ...p, produitFiniId: newProduitId, quantite: newQuantite } : p),
    }))
    return { ok: true }
  },

  ajusterStockProduit: async (produitId, delta, avecMP, raisonOverride) => {
    const { matieres, recettes, produits } = get()
    const produit = produits.find(p => p.id === produitId)
    if (!produit) return

    // Si c'est une variante, la déduction de stock va sur le produit de base
    const effectifId = produit.baseProduitId ?? produitId
    const effectif = produits.find(p => p.id === effectifId) ?? produit

    const newStock = Math.max(0, effectif.stockActuel + delta)
    await supabase.from('produits_finis').update({ stock_actuel: newStock }).eq('id', effectifId)

    const mvtInserts: object[] = [{
      type: delta >= 0 ? 'PRODUCTION' : 'CORRECTION_MP',
      entite_id: effectifId, entite_type: 'PRODUIT_FINI', delta,
      raison: raisonOverride ?? `Ajustement manuel ×${Math.abs(delta)}`,
    }]

    const newMatieres = [...matieres]
    if (avecMP && delta !== 0) {
      // Cherche la recette sur la variante d'abord (toppings), sinon sur la base
      const recette = recettes.find(r => r.produitFiniId === produitId) ?? recettes.find(r => r.produitFiniId === effectifId)
      if (recette) {
        for (const ing of recette.ingredients) {
          const consommation = ing.quantite * delta
          const idx = newMatieres.findIndex(m => m.id === ing.matierePremiereId)
          if (idx >= 0) {
            const newS = Math.max(0, newMatieres[idx].stockActuel - consommation)
            newMatieres[idx] = { ...newMatieres[idx], stockActuel: newS }
            await supabase.from('matieres_premieres').update({ stock_actuel: newS }).eq('id', ing.matierePremiereId)
            mvtInserts.push({
              type: delta >= 0 ? 'PRODUCTION' : 'CORRECTION_MP',
              entite_id: ing.matierePremiereId, entite_type: 'MATIERE_PREMIERE',
              delta: -consommation, raison: `Ajustement: ${effectif.nom}`,
            })
          }
        }
      }
    }

    const { data: newMvts } = await supabase.from('mouvements_stock').insert(mvtInserts).select()
    set(s => ({
      matieres: newMatieres,
      produits: s.produits.map(p => p.id === effectifId ? { ...p, stockActuel: newStock } : p),
      mouvements: [...(newMvts ?? []).map(m => mouFromRow(m as Record<string, unknown>)), ...s.mouvements],
    }))
  },

  savePreparationRecette: async (prepId, ingredients) => {
    await supabase.from('preparation_ingredients').delete().eq('preparation_id', prepId)
    if (ingredients.length > 0) {
      await supabase.from('preparation_ingredients').insert(
        ingredients.map(i => ({ preparation_id: prepId, mp_ingredient_id: i.mpIngredientId, quantite: i.quantite }))
      )
    }
    // Auto-calcul du prix unitaire depuis les ingrédients
    const matieres = get().matieres
    const cout = ingredients.reduce((sum, ing) => {
      const mp = matieres.find(m => m.id === ing.mpIngredientId)
      return sum + (mp?.prixAchat ?? 0) * ing.quantite
    }, 0)
    if (cout > 0) {
      await supabase.from('matieres_premieres').update({ prix_achat: cout }).eq('id', prepId)
      set(s => ({ matieres: s.matieres.map(m => m.id === prepId ? { ...m, prixAchat: cout } : m) }))
    }
    set(s => ({
      preparationRecettes: [
        ...s.preparationRecettes.filter(r => r.preparationId !== prepId),
        { preparationId: prepId, ingredients },
      ]
    }))
  },

  produirePreparation: async (prepId, quantite) => {
    const { matieres, preparationRecettes } = get()
    const prep = matieres.find(m => m.id === prepId)
    if (!prep) return { ok: false, erreur: 'Préparation introuvable' }
    const recette = preparationRecettes.find(r => r.preparationId === prepId)
    if (recette) {
      for (const ing of recette.ingredients) {
        const mp = matieres.find(m => m.id === ing.mpIngredientId)
        const requis = ing.quantite * quantite
        if (!mp || mp.stockActuel < requis) {
          return { ok: false, erreur: `Stock insuffisant : ${mp?.nom ?? '?'} (dispo: ${mp?.stockActuel ?? 0}, requis: ${requis})` }
        }
      }
      for (const ing of recette.ingredients) {
        await get().ajusterStock(ing.mpIngredientId, -(ing.quantite * quantite), `Prod. ${prep.nom} ×${quantite}`)
      }
    }
    await get().ajusterStock(prepId, quantite, `Prod. ${prep.nom} ×${quantite}`)
    return { ok: true }
  },

  preparerCommandeSite: async (cmdId, source, matches) => {
    const { recettes, produits, preparationRecettes } = get()
    const raison = `Commande site #${cmdId.slice(0, 8)}`

    for (const { pfId, quantite } of matches) {
      const pf = produits.find(p => p.id === pfId)
      const recette = recettes.find(r => r.produitFiniId === pfId)

      if (pf?.baseProduitId) {
        // VARIANTE → déduire stock de base + ingrédients variante avec cascade
        await get().ajusterStockProduit(pf.baseProduitId, -quantite, false, raison)
        if (recette) {
          const deductions = resolveDeductions(
            recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
            get().matieres, preparationRecettes
          )
          for (const { mpId, delta } of deductions)
            await get().ajusterStock(mpId, delta, raison)
        }
      } else if (recette) {
        // BASE avec recette → déduire ingrédients avec cascade (prep épuisée = utilise ses MPs)
        const deductions = resolveDeductions(
          recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
          get().matieres, preparationRecettes
        )
        for (const { mpId, delta } of deductions)
          await get().ajusterStock(mpId, delta, raison)
      } else {
        // Pré-fait sans recette → déduire le stock directement
        await get().ajusterStockProduit(pfId, -quantite, false, raison)
      }
    }
    const table = source === 'B2C' ? 'orders_b2c' : 'orders_b2b'
    await supabaseAdmin.from(table).update({ statut: 'en_preparation' }).eq('id', cmdId)
    set(s => ({
      commandesSite: s.commandesSite.map(c => c.id === cmdId ? { ...c, statut: 'en_preparation' } : c)
    }))
  },

  annulerCommandeSite: async (cmdId, source, matches) => {
    const { recettes, produits, preparationRecettes } = get()
    const raison = `Annulation commande #${cmdId.slice(0, 8)}`

    for (const { pfId, quantite } of matches) {
      const pf = produits.find(p => p.id === pfId)
      const recette = recettes.find(r => r.produitFiniId === pfId)

      if (pf?.baseProduitId) {
        // Variante → remettre stock de base + ingrédients variante
        await get().ajusterStockProduit(pf.baseProduitId, quantite, false)
        if (recette) {
          const deductions = resolveDeductions(
            recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
            get().matieres, preparationRecettes
          )
          for (const { mpId, delta } of deductions)
            await get().ajusterStock(mpId, -delta, raison)
        }
      } else if (recette) {
        // Base avec recette → remettre les ingrédients
        const deductions = resolveDeductions(
          recette.ingredients.map(i => ({ mpId: i.matierePremiereId, quantite: i.quantite * quantite })),
          get().matieres, preparationRecettes
        )
        for (const { mpId, delta } of deductions)
          await get().ajusterStock(mpId, -delta, raison)
      } else {
        // Pré-fait → remettre le stock PF
        await get().ajusterStockProduit(pfId, quantite, false)
      }
    }

    const table = source === 'B2C' ? 'orders_b2c' : 'orders_b2b'
    await supabaseAdmin.from(table).update({ statut: 'annulee' }).eq('id', cmdId)
    set(s => ({
      commandesSite: s.commandesSite.map(c => c.id === cmdId ? { ...c, statut: 'annulee' } : c)
    }))
  },

  validerCommandeSite: async (cmdId, source) => {
    const table = source === 'B2C' ? 'orders_b2c' : 'orders_b2b'
    await supabaseAdmin.from(table).update({ statut: 'traitee' }).eq('id', cmdId)
    set(s => ({
      commandesSite: s.commandesSite.map(c => c.id === cmdId ? { ...c, statut: 'traitee' } : c)
    }))
  },

  enregistrerCommande: async (nomClient, canal, lignes) => {
    const { produits } = get()
    const total = lignes.reduce((s, l) => s + l.prix * l.quantite, 0)
    const { data: vente } = await supabase.from('ventes_directes').insert({ nom_client: nomClient, canal, total }).select().single()
    if (!vente) return
    await supabase.from('vente_lignes').insert(
      lignes.map(l => ({ vente_id: vente.id, produit_fini_id: l.produitId, quantite: l.quantite, prix_unitaire: l.prix }))
    )

    // Regrouper les déductions par produit effectif (base si variante)
    const stockUpdates = new Map<string, number>()
    for (const l of lignes) {
      const p = produits.find(p => p.id === l.produitId)
      const effectifId = p?.baseProduitId ?? l.produitId
      stockUpdates.set(effectifId, (stockUpdates.get(effectifId) ?? 0) + l.quantite)
    }

    const mvtInserts = lignes.map(l => ({ type: 'VENTE', entite_id: l.produitId, entite_type: 'PRODUIT_FINI', delta: -l.quantite, raison: `Vente: ${nomClient}` }))
    for (const [effectifId, totalQte] of stockUpdates) {
      const p = produits.find(p => p.id === effectifId)
      if (p) await supabase.from('produits_finis').update({ stock_actuel: Math.max(0, p.stockActuel - totalQte) }).eq('id', effectifId)
    }

    const { data: newMvts } = await supabase.from('mouvements_stock').insert(mvtInserts).select()
    const cmdLignes: CommandeLigne[] = lignes.map(l => ({ produitFiniId: l.produitId, quantite: l.quantite, prixUnitaireSnapshot: l.prix }))
    const commande = cmdFromRow(vente as Record<string, unknown>, cmdLignes)

    set(s => ({
      commandes: [commande, ...s.commandes],
      produits: s.produits.map(p => {
        const delta = stockUpdates.get(p.id)
        return delta ? { ...p, stockActuel: Math.max(0, p.stockActuel - delta) } : p
      }),
      mouvements: [...(newMvts ?? []).map(m => mouFromRow(m as Record<string, unknown>)), ...s.mouvements],
    }))
  },
}))
