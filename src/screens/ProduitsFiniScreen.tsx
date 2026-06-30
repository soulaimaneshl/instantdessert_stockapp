import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { ProduitFini } from '../types'

function ProduitForm({ initial, presetBaseId, onSave, onClose }: {
  initial?: ProduitFini
  presetBaseId?: string
  onSave: (d: Omit<ProduitFini, 'id' | 'stockActuel' | 'coutDeRevient'> & { id?: string }) => void
  onClose: () => void
}) {
  const { produits } = useAppStore()
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [prix, setPrix] = useState(initial?.prixVente?.toString() ?? '')
  const [baseProduitId, setBaseProduitId] = useState<string>(initial?.baseProduitId ?? presetBaseId ?? '')

  // Seuls les produits sans baseProduitId (et pas le produit courant) peuvent être des bases
  const baseProduits = produits.filter(p => !p.baseProduitId && p.id !== initial?.id)

  return (
    <Modal
      title={initial ? `Modifier ${initial.nom}` : presetBaseId ? 'Nouvelle variante' : 'Nouveau produit'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button
            onClick={() => {
              if (!nom.trim()) return
              onSave({ id: initial?.id, nom: nom.trim(), categorie: initial?.categorie ?? '', prixVente: +prix || 0, baseProduitId: baseProduitId || null })
              onClose()
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium"
          >Sauvegarder</button>
        </>
      }
    >
      <label className="flex flex-col gap-1 text-sm font-medium">Nom du produit
        <input value={nom} onChange={e => setNom(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="ex: Riz au lait Nutella" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Prix de vente (€)
        <input type="number" value={prix} onChange={e => setPrix(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Variante de…</p>
        <select value={baseProduitId} onChange={e => setBaseProduitId(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">— Produit indépendant (a son propre stock) —</option>
          {baseProduits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <p className="text-xs text-text-sub">
          Si c'est une variante (ex: Riz au lait Nutella → Riz au lait), son stock sera celui du produit de base.
        </p>
      </div>
    </Modal>
  )
}

function AjustStockModal({ produit, onClose }: { produit: ProduitFini; onClose: () => void }) {
  const { recettes, ajusterStockProduit } = useAppStore()
  const aRecette = recettes.some(r => r.produitFiniId === produit.id)
  const [delta, setDelta] = useState('')
  const [avecMP, setAvecMP] = useState(true)

  const valider = async () => {
    const d = parseInt(delta)
    if (!isNaN(d) && d !== 0) { await ajusterStockProduit(produit.id, d, avecMP); onClose() }
  }
  const d = parseInt(delta)
  const newStock = !isNaN(d) ? Math.max(0, produit.stockActuel + d) : produit.stockActuel

  return (
    <Modal title={`Stock — ${produit.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={valider} disabled={isNaN(parseInt(delta)) || parseInt(delta) === 0}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-40">Valider</button>
        </>
      }>
      <div className="bg-accent-light rounded-lg px-3 py-2 flex justify-between items-center">
        <span className="text-sm text-text-sub">Stock actuel</span>
        <span className="font-bold text-text-main">{produit.stockActuel} unités</span>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Quantité à ajouter (+) ou retirer (−)
        <input type="number" value={delta} onChange={e => setDelta(e.target.value)}
          placeholder="ex: 10 ou -3" autoFocus
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      {!isNaN(d) && d !== 0 && (
        <p className="text-sm text-text-sub">
          Nouveau stock : <strong className={newStock === 0 ? 'text-danger' : 'text-success'}>{newStock} unités</strong>
        </p>
      )}
      {aRecette && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setAvecMP(v => !v)}>
            <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${avecMP ? 'bg-accent' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${avecMP ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium">
              {d < 0 ? 'Remettre les matières premières en stock' : 'Déduire les matières premières'}
            </span>
          </label>
          <p className="text-xs text-text-sub ml-14">
            {d < 0 ? 'Les ingrédients seront remis en stock.' : 'Les ingrédients de la recette seront consommés.'}
          </p>
        </div>
      )}
      {!aRecette && (
        <p className="text-xs text-text-sub bg-gray-50 rounded-lg px-3 py-2">
          Aucune recette configurée — seul le stock sera modifié.
        </p>
      )}
    </Modal>
  )
}

export default function ProduitsFiniScreen() {
  const { produits, saveProduit, deleteProduit } = useAppStore()
  const [editing, setEditing] = useState<{ produit?: ProduitFini; presetBaseId?: string } | null>(null)
  const [ajust, setAjust] = useState<ProduitFini | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // Map baseId → variantes
  const variantsByBase = useMemo(() => {
    const map: Record<string, ProduitFini[]> = {}
    for (const p of produits) {
      if (p.baseProduitId) {
        if (!map[p.baseProduitId]) map[p.baseProduitId] = []
        map[p.baseProduitId].push(p)
      }
    }
    return map
  }, [produits])

  // Seuls les produits sans baseProduitId apparaissent dans la liste principale
  const bases = produits
    .filter(p => !p.baseProduitId)
    .filter(p => search === '' || p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (variantsByBase[p.id] ?? []).some(v => v.nom.toLowerCase().includes(search.toLowerCase())))

  const nbVariantes = produits.filter(p => p.baseProduitId).length
  const nbEpuises = bases.filter(p => p.stockActuel === 0).length

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Produits finis</h1>
          <p className={`text-sm ${nbEpuises > 0 ? 'text-warning' : 'text-text-sub'}`}>
            {bases.length} produit(s) · {nbVariantes} variante(s){nbEpuises > 0 ? ` · ${nbEpuises} épuisé(s)` : ''}
          </p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit ou une variante..."
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent" />
      </div>

      {bases.length === 0 && <p className="text-text-sub text-center py-12">Aucun résultat.</p>}

      <div className="flex flex-col gap-3">
        {bases.map(p => {
          const variants = variantsByBase[p.id] ?? []
          const isOpen = expanded.has(p.id)
          const isBase = variants.length > 0
          const stockColor = p.stockActuel === 0 ? 'text-danger' : p.stockActuel < 5 ? 'text-warning' : 'text-success'
          const borderColor = p.stockActuel === 0 ? 'border-warning' : 'border-border'
          const marge = p.prixVente > 0 && p.coutDeRevient > 0
            ? ((p.prixVente - p.coutDeRevient) / p.prixVente * 100) : null

          return (
            <div key={p.id} className={`bg-white rounded-xl border overflow-hidden ${borderColor}`}>
              {/* Carte principale */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-main">{p.nom}</p>
                    {isBase && (
                      <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full font-medium">
                        Base · {variants.length} variante{variants.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {p.categorie && (
                      <span className="text-xs bg-gray-100 text-text-sub px-2 py-0.5 rounded-full">{p.categorie}</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <p className="text-sm text-text-sub">Prix: <strong>{p.prixVente}€</strong></p>
                    {p.coutDeRevient > 0 && <p className="text-sm text-text-sub">CDR: {p.coutDeRevient.toFixed(2)}€</p>}
                    {marge !== null && (
                      <p className={`text-sm font-medium ${marge >= 50 ? 'text-success' : 'text-warning'}`}>
                        Marge: {marge.toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold ${stockColor}`}>{p.stockActuel}</p>
                  <p className="text-xs text-text-sub">unités</p>
                </div>

                <button onClick={() => setAjust(p)}
                  className="text-accent font-bold text-sm px-2 py-1 hover:bg-accent-light rounded-lg transition-colors shrink-0">
                  +/-
                </button>
                <button onClick={() => setEditing({ produit: p })} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                  <Pencil size={16} className="text-text-sub" />
                </button>
                <button onClick={() => deleteProduit(p.id)} className="p-2 hover:bg-danger-light rounded-lg shrink-0">
                  <Trash2 size={16} className="text-danger" />
                </button>
                {isBase && (
                  <button onClick={() => toggleExpand(p.id)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                    {isOpen
                      ? <ChevronUp size={16} className="text-text-sub" />
                      : <ChevronDown size={16} className="text-text-sub" />}
                  </button>
                )}
              </div>

              {/* Section variantes (dépliable) */}
              {isBase && isOpen && (
                <div className="border-t border-border bg-gray-50 px-4 py-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-text-sub uppercase tracking-wide">
                    Variantes — déduit du stock de base "{p.nom}"
                  </p>
                  {variants.map(v => {
                    const vMarge = v.prixVente > 0 && v.coutDeRevient > 0
                      ? ((v.prixVente - v.coutDeRevient) / v.prixVente * 100) : null
                    return (
                      <div key={v.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-border/60">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main">{v.nom}</p>
                          <div className="flex gap-3 mt-0.5 flex-wrap">
                            <p className="text-xs text-text-sub">Prix: <strong>{v.prixVente}€</strong></p>
                            {v.coutDeRevient > 0 && <p className="text-xs text-text-sub">CDR: {v.coutDeRevient.toFixed(2)}€</p>}
                            {vMarge !== null && (
                              <p className={`text-xs font-medium ${vMarge >= 50 ? 'text-success' : 'text-warning'}`}>
                                Marge: {vMarge.toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-text-sub italic shrink-0">stock = base</span>
                        <button onClick={() => setEditing({ produit: v })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Pencil size={14} className="text-text-sub" />
                        </button>
                        <button onClick={() => deleteProduit(v.id)} className="p-1.5 hover:bg-danger-light rounded-lg">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => { setEditing({ presetBaseId: p.id }); setExpanded(prev => new Set([...prev, p.id])) }}
                    className="flex items-center gap-2 text-xs text-accent font-semibold hover:bg-accent-light px-3 py-2 rounded-lg transition-colors w-fit mt-1">
                    <Plus size={13} /> Ajouter une variante
                  </button>
                </div>
              )}

              {/* Bouton "ajouter variante" si pas encore déplié */}
              {!isOpen && !isBase && (
                <div className="border-t border-border/40 px-4 py-2">
                  <button
                    onClick={() => setEditing({ presetBaseId: p.id })}
                    className="text-xs text-text-sub hover:text-accent flex items-center gap-1 transition-colors">
                    <Plus size={12} /> Créer des variantes (Nutella, Caramel, Fraise…)
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing !== null && (
        <ProduitForm
          initial={editing.produit}
          presetBaseId={editing.presetBaseId}
          onSave={saveProduit}
          onClose={() => setEditing(null)}
        />
      )}
      {ajust && <AjustStockModal produit={ajust} onClose={() => setAjust(null)} />}
    </div>
  )
}
