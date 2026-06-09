import { useState, useMemo } from 'react'
import { RotateCcw, Pencil, Search, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'

function EditProductionModal({ productionId, onClose }: { productionId: string; onClose: () => void }) {
  const { produits, recettes, productions, modifierProduction } = useAppStore()
  const prod = productions.find(p => p.id === productionId)
  const [selectedId, setSelectedId] = useState(prod?.produitFiniId ?? '')
  const [qte, setQte] = useState(prod?.quantite.toString() ?? '1')
  const [search, setSearch] = useState('')
  const [erreur, setErreur] = useState('')

  const produitAvecRecette = useMemo(() =>
    produits
      .filter(p => recettes.some(r => r.produitFiniId === p.id))
      .filter(p => search === '' || p.nom.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  , [produits, recettes, search])

  const valider = async () => {
    const q = parseInt(qte)
    if (!selectedId || isNaN(q) || q <= 0) { setErreur('Champs invalides'); return }
    const res = await modifierProduction(productionId, selectedId, q)
    if (res.ok) onClose()
    else setErreur(res.erreur ?? 'Erreur')
  }

  return (
    <Modal title="Modifier la production" onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={valider} className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Enregistrer</button>
        </>
      }>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
          className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
        {produitAvecRecette.map(p => (
          <button key={p.id} onClick={() => setSelectedId(p.id)}
            className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${selectedId === p.id ? 'border-accent bg-accent-light' : 'border-border hover:bg-gray-50'}`}>
            <p className="font-medium text-text-main text-sm">{p.nom}</p>
            <p className="text-xs text-text-sub">Stock: {p.stockActuel} unités</p>
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">Quantité
        <input type="number" min="1" value={qte} onChange={e => setQte(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm max-w-xs" />
      </label>
      {erreur && <p className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{erreur}</p>}
    </Modal>
  )
}

export default function ProductionScreen() {
  const { produits, recettes, produire, annulerProduction, productions } = useAppStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [qte, setQte] = useState('1')
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const produitAvecRecette = useMemo(() =>
    produits
      .filter(p => recettes.some(r => r.produitFiniId === p.id))
      .filter(p => search === '' || p.nom.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  , [produits, recettes, search])

  const selected = produits.find(p => p.id === selectedId)

  const lancer = async () => {
    if (!selectedId) { setResult({ ok: false, msg: 'Sélectionnez un produit.' }); return }
    const q = parseInt(qte)
    if (isNaN(q) || q <= 0) { setResult({ ok: false, msg: 'Quantité invalide.' }); return }
    const res = await produire(selectedId, q)
    if (res.ok) {
      setResult({ ok: true, msg: `✓ ${q} × ${selected?.nom ?? ''} produit(s) enregistré(s).` })
      setSelectedId(null); setQte('1')
    } else {
      setResult({ ok: false, msg: res.erreur ?? 'Erreur' })
    }
  }

  const supprimer = async (id: string) => {
    await annulerProduction(id)
    setConfirmDelete(null)
  }

  const sortedProductions = [...productions].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Production</h1>
        <p className="text-text-sub text-sm">Lancer et gérer les productions</p>
      </div>

      {/* Formulaire nouvelle production */}
      <div className="bg-white rounded-xl border border-border p-6 flex flex-col gap-5 max-w-xl">
        <p className="font-semibold text-text-main flex items-center gap-2"><Plus size={16} /> Nouvelle production</p>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-sub" />
          <input value={search} onChange={e => { setSearch(e.target.value); setSelectedId(null); setResult(null) }}
            placeholder="Rechercher un produit..."
            className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent" />
        </div>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
          {produitAvecRecette.length === 0 && (
            <p className="text-sm text-text-sub text-center py-4">
              {search ? 'Aucun résultat.' : 'Aucun produit avec recette configurée.'}
            </p>
          )}
          {produitAvecRecette.map(p => (
            <button key={p.id} onClick={() => { setSelectedId(p.id); setResult(null) }}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${selectedId === p.id ? 'border-accent bg-accent-light' : 'border-border hover:bg-gray-50'}`}>
              <p className="font-medium text-text-main">{p.nom}</p>
              <p className="text-sm text-text-sub">Stock: {p.stockActuel} unités · {p.prixVente}€</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-text-main flex-1 max-w-xs">
            Quantité à produire
            <input type="number" min="1" value={qte} onChange={e => { setQte(e.target.value); setResult(null) }}
              className="border border-border rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>

        {result && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.ok ? 'bg-success-light text-success border border-success' : 'bg-danger-light text-danger border border-danger'}`}>
            {result.msg}
          </div>
        )}

        <button onClick={lancer} disabled={!selectedId}
          className="bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
          Lancer la production
        </button>
      </div>

      {/* Historique des productions */}
      <div>
        <h2 className="font-semibold text-text-main mb-3">
          Historique ({productions.length} production{productions.length > 1 ? 's' : ''})
        </h2>

        {sortedProductions.length === 0 && (
          <p className="text-text-sub text-sm text-center py-8">Aucune production enregistrée.</p>
        )}

        <div className="flex flex-col gap-2">
          {sortedProductions.map(prod => {
            const p = produits.find(x => x.id === prod.produitFiniId)
            const isDeleting = confirmDelete === prod.id
            return (
              <div key={prod.id} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center gap-3">
                {/* Date badge */}
                <div className="text-center shrink-0 w-12">
                  <p className="text-xs font-bold text-text-main">{new Date(prod.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
                  <p className="text-xs text-text-sub">{new Date(prod.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-main truncate">{p?.nom ?? '—'}</p>
                  {p?.categorie && <span className="text-xs bg-accent-light text-accent px-1.5 py-0.5 rounded-full">{p.categorie}</span>}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-accent">{prod.quantite}</p>
                  <p className="text-xs text-text-sub">unité{prod.quantite > 1 ? 's' : ''}</p>
                </div>

                {isDeleting ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-danger font-medium">Supprimer ?</p>
                    <button onClick={() => supprimer(prod.id)} className="text-xs bg-danger text-white px-3 py-1 rounded-lg font-medium">Oui</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs bg-gray-100 text-text-sub px-3 py-1 rounded-lg">Non</button>
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingId(prod.id)}
                      className="p-2 hover:bg-accent-light rounded-lg transition-colors" title="Modifier">
                      <Pencil size={15} className="text-accent" />
                    </button>
                    <button onClick={() => setConfirmDelete(prod.id)}
                      className="p-2 hover:bg-danger-light rounded-lg transition-colors" title="Supprimer">
                      <RotateCcw size={15} className="text-danger" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {editingId && <EditProductionModal productionId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  )
}
