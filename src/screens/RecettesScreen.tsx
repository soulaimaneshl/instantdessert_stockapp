import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { RecetteIngredient } from '../types'

function RecetteModal({ produitId, onClose }: { produitId: string; onClose: () => void }) {
  const { matieres, recettes, saveRecette, produits } = useAppStore()
  const existing = recettes.find(r => r.produitFiniId === produitId)
  const produit = produits.find(p => p.id === produitId)
  const [ingredients, setIngredients] = useState<RecetteIngredient[]>(
    existing?.ingredients ?? []
  )
  const [selectedMP, setSelectedMP] = useState(matieres[0]?.id ?? '')
  const [qte, setQte] = useState('')
  const [searchMP, setSearchMP] = useState('')

  const matieresFiltrees = matieres.filter(m =>
    searchMP === '' || m.nom.toLowerCase().includes(searchMP.toLowerCase())
  )

  const addIngr = () => {
    const id = selectedMP
    const q = parseFloat(qte)
    if (!id || isNaN(q) || q <= 0) return
    if (ingredients.find(i => i.matierePremiereId === id)) return
    setIngredients(prev => [...prev, { matierePremiereId: id, quantite: q }])
    setQte('')
  }

  const removeIngr = (matierePremiereId: string) =>
    setIngredients(prev => prev.filter(i => i.matierePremiereId !== matierePremiereId))

  return (
    <Modal title={`Recette — ${produit?.nom ?? ''}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={() => { saveRecette(produitId, ingredients); onClose() }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Sauvegarder</button>
        </>
      }>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={searchMP} onChange={e => setSearchMP(e.target.value)}
          placeholder="Filtrer les MP..."
          className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2">
        <select value={selectedMP} onChange={e => setSelectedMP(e.target.value)}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white">
          {matieresFiltrees.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.unite})</option>)}
        </select>
        <input type="number" value={qte} onChange={e => setQte(e.target.value)} placeholder="Qté"
          className="w-24 border border-border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addIngr} className="p-2 bg-accent text-white rounded-lg"><Plus size={16} /></button>
      </div>

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {ingredients.length === 0 && <p className="text-sm text-text-sub text-center py-4">Aucun ingrédient</p>}
        {ingredients.map(ing => {
          const mp = matieres.find(m => m.id === ing.matierePremiereId)
          return (
            <div key={ing.matierePremiereId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-text-main">{mp?.nom ?? '?'}</span>
              <span className="text-sm font-semibold text-text-sub">{ing.quantite} {mp?.unite.toLowerCase()}</span>
              <button onClick={() => removeIngr(ing.matierePremiereId)} className="p-1 hover:bg-danger-light rounded">
                <Trash2 size={14} className="text-danger" />
              </button>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default function RecettesScreen() {
  const { matieres, produits, recettes } = useAppStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const categories = useMemo(() => {
    const cats = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort()
    return ['Tous', ...cats]
  }, [produits])

  const filtered = produits
    .filter(p => {
      const matchSearch = search === '' || p.nom.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'Tous' || p.categorie === catFilter
      return matchSearch && matchCat
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Recettes</h1>
        <p className="text-text-sub text-sm">{recettes.length} recette(s) configurée(s)</p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une recette..."
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent" />
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${catFilter === cat ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && <p className="text-text-sub text-center py-12">Aucun résultat.</p>}
        {filtered.map(p => {
          const r = recettes.find(r => r.produitFiniId === p.id)
          const isOpen = expanded.has(p.id)
          return (
            <div key={p.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-main">{p.nom}</p>
                    {p.categorie && <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full">{p.categorie}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${r ? 'bg-success-light text-success' : 'bg-gray-100 text-text-sub'}`}>
                      {r ? `${r.ingredients.length} ingr.` : 'Pas de recette'}
                    </span>
                  </div>
                  {r && p.coutDeRevient > 0 && (
                    <p className="text-sm text-text-sub mt-1">CDR: {p.coutDeRevient.toFixed(2)}€ · Marge: {p.prixVente > 0 ? ((p.prixVente - p.coutDeRevient) / p.prixVente * 100).toFixed(0) + '%' : '—'}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r && (
                    <button onClick={() => toggleExpand(p.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir les ingrédients">
                      {isOpen ? <ChevronUp size={16} className="text-text-sub" /> : <ChevronDown size={16} className="text-text-sub" />}
                    </button>
                  )}
                  <button onClick={() => setEditing(p.id)} className="flex items-center gap-2 text-sm text-accent font-medium hover:bg-accent-light px-3 py-2 rounded-lg">
                    <Pencil size={15} /> {r ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </div>

              {r && isOpen && (
                <div className="border-t border-border bg-gray-50 px-4 py-3 flex flex-col gap-1.5">
                  {r.ingredients.map(ing => {
                    const mp = matieres.find(m => m.id === ing.matierePremiereId)
                    return (
                      <div key={ing.matierePremiereId} className="flex items-center justify-between text-sm">
                        <span className="text-text-main">{mp?.nom ?? '?'}</span>
                        <span className="font-semibold text-text-sub">{ing.quantite} {mp?.unite.toLowerCase()}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing !== null && <RecetteModal produitId={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
