import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { MatierePremiere, Unite } from '../types'

const UNITES: Unite[] = ['G', 'KG', 'L', 'ML', 'UNITE']

function MPForm({ initial, onSave, onClose }: {
  initial?: MatierePremiere
  onSave: (d: Omit<MatierePremiere, 'id' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [unite, setUnite] = useState<Unite>(initial?.unite ?? 'KG')
  const [stock, setStock] = useState(initial?.stockActuel?.toString() ?? '0')
  const [seuil, setSeuil] = useState(initial?.seuilTampon?.toString() ?? '1')
  const [prix, setPrix] = useState(initial?.prixAchat?.toString() ?? '0')

  return (
    <Modal
      title={initial ? `Modifier ${initial.nom}` : 'Nouvelle matière première'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button
            onClick={() => {
              if (!nom.trim()) return
              onSave({ id: initial?.id, nom: nom.trim(), unite, categorie: initial?.categorie ?? '', stockActuel: +stock || 0, seuilTampon: +seuil || 1, prixAchat: +prix || 0 })
              onClose()
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium"
          >Sauvegarder</button>
        </>
      }
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-text-main">Nom
        <input value={nom} onChange={e => setNom(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" placeholder="ex: Farine" />
      </label>
      <div>
        <p className="text-sm font-medium text-text-main mb-2">Unité</p>
        <div className="flex gap-2 flex-wrap">
          {UNITES.map(u => (
            <button key={u} onClick={() => setUnite(u)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${unite === u ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
              {u}
            </button>
          ))}
        </div>
      </div>
      {[['Stock actuel', stock, setStock], ["Seuil d'alerte", seuil, setSeuil], ['Prix achat (€/unité)', prix, setPrix]].map(([label, val, setter]) => (
        <label key={label as string} className="flex flex-col gap-1 text-sm font-medium text-text-main">{label as string}
          <input type="number" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
        </label>
      ))}
    </Modal>
  )
}

function AjustForm({ mp, onClose }: { mp: MatierePremiere; onClose: () => void }) {
  const ajusterStock = useAppStore(s => s.ajusterStock)
  const [delta, setDelta] = useState('')
  const [raison, setRaison] = useState('')
  return (
    <Modal title={`Ajuster stock — ${mp.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={() => { const d = parseFloat(delta); if (!isNaN(d)) { ajusterStock(mp.id, d, raison); onClose() } }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Valider</button>
        </>
      }>
      <p className="text-sm text-text-sub">Stock actuel: {mp.stockActuel} {mp.unite.toLowerCase()}</p>
      <label className="flex flex-col gap-1 text-sm font-medium">Quantité (+/-)
        <input type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="ex: 5000 ou -200"
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Raison (optionnel)
        <input value={raison} onChange={e => setRaison(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
    </Modal>
  )
}

export default function StockMPScreen() {
  const { matieres, saveMatiere, deleteMatiere } = useAppStore()
  const [tab, setTab] = useState<'stock' | 'reappro'>('stock')
  const [editing, setEditing] = useState<MatierePremiere | null | 'new'>(null)
  const [ajust, setAjust] = useState<MatierePremiere | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')

  const categories = useMemo(() => {
    const cats = [...new Set(matieres.map(m => m.categorie).filter(Boolean))].sort()
    return ['Tous', ...cats]
  }, [matieres])

  const alertes = matieres.filter(m => m.stockActuel <= m.seuilTampon * 2)
  const alertesCritiques = matieres.filter(m => m.stockActuel <= m.seuilTampon)

  const filtered = matieres.filter(mp => {
    const matchSearch = search === '' || mp.nom.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Tous' || mp.categorie === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Matières premières</h1>
          <p className={`text-sm ${alertesCritiques.length > 0 ? 'text-danger' : alertes.length > 0 ? 'text-orange-500' : 'text-text-sub'}`}>
            {matieres.length} article(s) · {alertesCritiques.length > 0 ? `${alertesCritiques.length} critique(s)` : ''}{alertes.length - alertesCritiques.length > 0 ? ` · ${alertes.length - alertesCritiques.length} attention` : ''}{alertes.length === 0 ? '0 alerte' : ''}
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une matière première..."
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent"
        />
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

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['stock', 'reappro'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === t ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
            {t === 'stock' ? 'Stock' : 'Réappro'}
            {t === 'reappro' && alertes.length > 0 && (
              <span className={`text-white text-xs px-1.5 py-0.5 rounded-full ${alertesCritiques.length > 0 ? 'bg-danger' : 'bg-orange-400'}`}>{alertes.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && <p className="text-text-sub text-center py-12">Aucun résultat.</p>}
          {filtered.map(mp => {
            const critique = mp.stockActuel <= mp.seuilTampon
            const attention = !critique && mp.stockActuel <= mp.seuilTampon * 2
            const borderColor = critique ? 'border-danger' : attention ? 'border-orange-300' : 'border-border'
            const badgeClass = mp.stockActuel === 0 ? 'bg-danger text-white' : critique ? 'bg-danger-light text-danger' : attention ? 'bg-orange-100 text-orange-500' : 'bg-success-light text-success'
            const badgeLabel = mp.stockActuel === 0 ? 'ÉPUISÉ' : critique ? 'CRITIQUE' : attention ? 'ATTENTION' : 'OK'
            return (
              <div key={mp.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${borderColor}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-main">{mp.nom}</p>
                    {mp.categorie && <span className="text-xs bg-gray-100 text-text-sub px-2 py-0.5 rounded-full">{mp.categorie}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-text-sub mt-1">
                    Stock: <strong>{mp.stockActuel} {mp.unite.toLowerCase()}</strong> · Seuil: {mp.seuilTampon} · {mp.prixAchat > 0 ? `${mp.prixAchat}€/${mp.unite.toLowerCase()}` : '—'}
                  </p>
                </div>
                <button onClick={() => setAjust(mp)} className="text-accent font-bold text-sm px-2 hover:bg-accent-light rounded">+/-</button>
                <button onClick={() => setEditing(mp)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={16} className="text-text-sub" /></button>
                <button onClick={() => deleteMatiere(mp.id)} className="p-2 hover:bg-danger-light rounded-lg"><Trash2 size={16} className="text-danger" /></button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alertes.length === 0 ? (
            <div className="bg-success-light border border-success rounded-xl p-5">
              <p className="font-semibold text-success">Aucune alerte ✓</p>
              <p className="text-sm text-text-sub">Toutes les matières sont au-dessus du seuil.</p>
            </div>
          ) : alertes.map(mp => {
            const qte = Math.max(0, mp.seuilTampon * 3 - mp.stockActuel)
            const epuise = mp.stockActuel === 0
            return (
              <div key={mp.id} className={`rounded-xl border p-4 flex items-center gap-4 ${epuise ? 'bg-danger-light border-danger' : 'bg-warning-light border-warning'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-main">{mp.nom}</p>
                    <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${epuise ? 'bg-danger' : 'bg-warning'}`}>{epuise ? 'ÉPUISÉ' : 'ALERTE'}</span>
                  </div>
                  <p className="text-sm text-text-sub mt-1">Stock: {mp.stockActuel} {mp.unite.toLowerCase()} · Seuil: {mp.seuilTampon}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-sub">Commander</p>
                  <p className={`font-bold ${epuise ? 'text-danger' : 'text-warning'}`}>{qte.toFixed(0)} {mp.unite.toLowerCase()}</p>
                  {mp.prixAchat > 0 && <p className="text-xs text-text-sub">≈ {(qte * mp.prixAchat).toFixed(2)} €</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <MPForm
          initial={editing === 'new' ? undefined : editing}
          onSave={saveMatiere}
          onClose={() => setEditing(null)}
        />
      )}
      {ajust && <AjustForm mp={ajust} onClose={() => setAjust(null)} />}
    </div>
  )
}
