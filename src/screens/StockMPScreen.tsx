import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'
import QuantiteInput from '../components/QuantiteInput'
import { useAppStore } from '../store/useAppStore'
import type { MatierePremiere, Unite } from '../types'

const UNITES: Unite[] = ['G', 'KG', 'L', 'ML', 'UNITE']

function formatPrix(prix: number, unite: Unite): string {
  if (prix <= 0) return '—'
  const clean = (n: number) => parseFloat(n.toPrecision(4)).toString()
  if (unite === 'G')  return `${clean(prix * 1000)}€/kg`
  if (unite === 'ML') return `${clean(prix * 1000)}€/L`
  if (unite === 'KG') return `${clean(prix)}€/kg`
  if (unite === 'L')  return `${clean(prix)}€/L`
  return `${clean(prix)}€/unité`
}

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
              onSave({ id: initial?.id, nom: nom.trim(), unite, categorie: initial?.categorie ?? '', stockActuel: +stock || 0, seuilTampon: +seuil || 1, prixAchat: +prix || 0, estPreparation: false })
              onClose()
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium"
          >Sauvegarder</button>
        </>
      }
    >
      <label className="flex flex-col gap-1 text-sm font-medium">Nom
        <input value={nom} onChange={e => setNom(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="ex: Farine T55" />
      </label>
      <div>
        <p className="text-sm font-medium mb-2">Unité</p>
        <div className="flex gap-2 flex-wrap">
          {UNITES.map(u => (
            <button key={u} onClick={() => setUnite(u)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${unite === u ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">Stock actuel
        <QuantiteInput unite={unite} value={stock} onChange={setStock} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Seuil d'alerte
        <QuantiteInput unite={unite} value={seuil} onChange={setSeuil} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Prix achat (€/unité)
        <input type="number" value={prix} onChange={e => setPrix(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
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
        <QuantiteInput unite={mp.unite} value={delta} onChange={setDelta} autoFocus allowNegative />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Raison (optionnel)
        <input value={raison} onChange={e => setRaison(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
    </Modal>
  )
}

export default function StockMPScreen() {
  const { matieres, saveMatiere, deleteMatiere, recettes, produits } = useAppStore()

  const rawMPs = matieres.filter(m => !m.estPreparation)

  const mpRecettesMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const r of recettes) {
      const produit = produits.find(p => p.id === r.produitFiniId)
      if (!produit) continue
      for (const ing of r.ingredients) {
        if (!map[ing.matierePremiereId]) map[ing.matierePremiereId] = []
        if (!map[ing.matierePremiereId].includes(produit.nom))
          map[ing.matierePremiereId].push(produit.nom)
      }
    }
    return map
  }, [recettes, produits])

  const [tab, setTab] = useState<'stock' | 'reappro'>('stock')
  const [editing, setEditing] = useState<MatierePremiere | 'new' | null>(null)
  const [ajust, setAjust] = useState<MatierePremiere | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())

  const categories = useMemo(() => {
    const cats = [...new Set(rawMPs.map(m => m.categorie).filter(Boolean))].sort()
    return ['Tous', ...cats]
  }, [rawMPs])

  const alertes = rawMPs.filter(m => m.stockActuel <= m.seuilTampon * 2)
  const alertesCritiques = rawMPs.filter(m => m.stockActuel <= m.seuilTampon)

  const filtered = rawMPs.filter(mp => {
    const matchSearch = search === '' || mp.nom.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Tous' || mp.categorie === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Matières premières</h1>
          <p className={`text-sm ${alertesCritiques.length > 0 ? 'text-danger' : alertes.length > 0 ? 'text-orange-500' : 'text-text-sub'}`}>
            {rawMPs.length} MP{alertesCritiques.length > 0 ? ` · ${alertesCritiques.length} critique(s)` : alertes.length > 0 ? ` · ${alertes.length} alerte(s)` : ''}
          </p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          ['stock', 'Matières premières', alertesCritiques.length > 0 ? 'danger' : alertes.length > 0 ? 'warning' : null],
          ['reappro', 'Réappro', alertes.length > 0 ? (alertesCritiques.length > 0 ? 'danger' : 'warning') : null],
        ] as [string, string, string | null][]).map(([id, label, badgeColor]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === id ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
            {label}
            {badgeColor && alertes.length > 0 && (
              <span className={`text-white text-xs px-1.5 py-0.5 rounded-full ${badgeColor === 'danger' ? 'bg-danger' : 'bg-orange-400'}`}>{alertes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Onglet Matières premières ─── */}
      {tab === 'stock' && (
        <>
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
            {filtered.map(mp => {
              const critique = mp.stockActuel <= mp.seuilTampon
              const attention = !critique && mp.stockActuel <= mp.seuilTampon * 2
              const borderColor = critique ? 'border-danger' : attention ? 'border-orange-300' : 'border-border'
              const badgeClass = mp.stockActuel === 0 ? 'bg-danger text-white' : critique ? 'bg-danger-light text-danger' : attention ? 'bg-orange-100 text-orange-500' : 'bg-success-light text-success'
              const badgeLabel = mp.stockActuel === 0 ? 'ÉPUISÉ' : critique ? 'CRITIQUE' : attention ? 'ATTENTION' : 'OK'
              const utiliseDans = mpRecettesMap[mp.id] ?? []
              const tagsExpanded = expandedTags.has(mp.id)
              const visibleTags = tagsExpanded ? utiliseDans : utiliseDans.slice(0, 2)
              return (
                <div key={mp.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${borderColor}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text-main">{mp.nom}</p>
                      {mp.categorie && <span className="text-xs bg-gray-100 text-text-sub px-2 py-0.5 rounded-full">{mp.categorie}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${badgeClass}`}>{badgeLabel}</span>
                    </div>
                    <p className="text-sm text-text-sub mt-1">
                      Stock: <strong>{mp.stockActuel} {mp.unite.toLowerCase()}</strong> · Seuil: {mp.seuilTampon} · {mp.prixAchat > 0 ? formatPrix(mp.prixAchat, mp.unite) : '—'}
                    </p>
                    {utiliseDans.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {visibleTags.map(nom => (
                          <span key={nom} className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full font-medium">{nom}</span>
                        ))}
                        {utiliseDans.length > 2 && (
                          <button onClick={e => { e.stopPropagation(); setExpandedTags(prev => { const s = new Set(prev); s.has(mp.id) ? s.delete(mp.id) : s.add(mp.id); return s }) }}
                            className="text-xs text-accent font-semibold hover:underline px-1">
                            {tagsExpanded ? '▲ moins' : `+${utiliseDans.length - 2} autres`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setAjust(mp)} className="text-accent font-bold text-sm px-2 hover:bg-accent-light rounded">+/-</button>
                  <button onClick={() => setEditing(mp)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={16} className="text-text-sub" /></button>
                  <button onClick={() => deleteMatiere(mp.id)} className="p-2 hover:bg-danger-light rounded-lg"><Trash2 size={16} className="text-danger" /></button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ─── Onglet Réappro ─── */}
      {tab === 'reappro' && (
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

      {editing !== null && (
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
