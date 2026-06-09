import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { ProduitFini } from '../types'

function ProduitForm({ initial, onSave, onClose }: {
  initial?: ProduitFini; onSave: (d: Omit<ProduitFini, 'id' | 'stockActuel' | 'coutDeRevient'> & { id?: string }) => void; onClose: () => void
}) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [prix, setPrix] = useState(initial?.prixVente?.toString() ?? '')
  return (
    <Modal title={initial ? `Modifier ${initial.nom}` : 'Nouveau produit fini'} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={() => { if (nom.trim()) { onSave({ id: initial?.id, nom: nom.trim(), categorie: initial?.categorie ?? '', prixVente: +prix || 0 }); onClose() } }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Sauvegarder</button>
        </>
      }>
      <label className="flex flex-col gap-1 text-sm font-medium">Nom du produit
        <input value={nom} onChange={e => setNom(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" placeholder="ex: Éclair chocolat" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Prix de vente (€)
        <input type="number" value={prix} onChange={e => setPrix(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
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
    if (!isNaN(d) && d !== 0) {
      await ajusterStockProduit(produit.id, d, avecMP)
      onClose()
    }
  }

  const d = parseInt(delta)
  const newStock = !isNaN(d) ? Math.max(0, produit.stockActuel + d) : produit.stockActuel

  return (
    <Modal title={`Stock — ${produit.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={valider} disabled={isNaN(parseInt(delta)) || parseInt(delta) === 0}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-40">
            Valider
          </button>
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
            {d < 0
              ? 'Les ingrédients utilisés pour ces produits seront remis en stock.'
              : 'Les ingrédients de la recette seront consommés automatiquement.'}
          </p>
        </div>
      )}

      {!aRecette && (
        <p className="text-xs text-text-sub bg-gray-50 rounded-lg px-3 py-2">
          Aucune recette configurée — seul le stock du produit sera modifié.
        </p>
      )}
    </Modal>
  )
}

export default function ProduitsFiniScreen() {
  const { produits, saveProduit, deleteProduit } = useAppStore()
  const [editing, setEditing] = useState<ProduitFini | 'new' | null>(null)
  const [ajust, setAjust] = useState<ProduitFini | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')

  const categories = useMemo(() => {
    const cats = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort()
    return ['Tous', ...cats]
  }, [produits])

  const filtered = produits.filter(p => {
    const matchSearch = search === '' || p.nom.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Tous' || p.categorie === catFilter
    return matchSearch && matchCat
  })

  const enAlerte = produits.filter(p => p.stockActuel === 0).length

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Produits finis</h1>
          <p className={`text-sm ${enAlerte > 0 ? 'text-warning' : 'text-text-sub'}`}>
            {produits.length} produit(s){enAlerte > 0 ? ` · ${enAlerte} épuisé(s)` : ''}
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${catFilter === cat ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-text-sub text-center py-12">Aucun résultat.</p>}
      <div className="flex flex-col gap-3">
        {filtered.map(p => {
          const stockColor = p.stockActuel === 0 ? 'text-danger' : p.stockActuel < 5 ? 'text-warning' : 'text-success'
          const marge = p.prixVente > 0 && p.coutDeRevient > 0 ? ((p.prixVente - p.coutDeRevient) / p.prixVente * 100) : null
          return (
            <div key={p.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text-main">{p.nom}</p>
                  {p.categorie && <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full">{p.categorie}</span>}
                </div>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <p className="text-sm text-text-sub">Prix: <strong>{p.prixVente}€</strong></p>
                  {p.coutDeRevient > 0 && <p className="text-sm text-text-sub">CDR: {p.coutDeRevient.toFixed(2)}€</p>}
                  {marge !== null && <p className={`text-sm font-medium ${marge >= 50 ? 'text-success' : 'text-warning'}`}>Marge: {marge.toFixed(0)}%</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-2xl font-bold ${stockColor}`}>{p.stockActuel}</p>
                <p className="text-xs text-text-sub">unités</p>
              </div>
              <button onClick={() => setAjust(p)} className="text-accent font-bold text-sm px-2 py-1 hover:bg-accent-light rounded-lg transition-colors">+/-</button>
              <button onClick={() => setEditing(p)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={16} className="text-text-sub" /></button>
              <button onClick={() => deleteProduit(p.id)} className="p-2 hover:bg-danger-light rounded-lg"><Trash2 size={16} className="text-danger" /></button>
            </div>
          )
        })}
      </div>

      {editing && <ProduitForm initial={editing === 'new' ? undefined : editing} onSave={saveProduit} onClose={() => setEditing(null)} />}
      {ajust && <AjustStockModal produit={ajust} onClose={() => setAjust(null)} />}
    </div>
  )
}
