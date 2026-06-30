import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChefHat, BookOpen } from 'lucide-react'
import Modal from '../components/Modal'
import QuantiteInput from '../components/QuantiteInput'
import { useAppStore } from '../store/useAppStore'
import type { MatierePremiere, PreparationIngredient } from '../types'

function PrepForm({ initial, onSave, onClose }: {
  initial?: MatierePremiere
  onSave: (d: Omit<MatierePremiere, 'id' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [stock, setStock] = useState(initial?.stockActuel?.toString() ?? '0')
  const [seuil, setSeuil] = useState(initial?.seuilTampon?.toString() ?? '5')

  return (
    <Modal
      title={initial ? `Modifier ${initial.nom}` : 'Nouvelle préparation'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button
            onClick={() => {
              if (!nom.trim()) return
              onSave({ id: initial?.id, nom: nom.trim(), unite: 'UNITE', categorie: 'Préparations', stockActuel: +stock || 0, seuilTampon: +seuil || 5, prixAchat: initial?.prixAchat ?? 0, estPreparation: true })
              onClose()
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium"
          >Sauvegarder</button>
        </>
      }
    >
      <p className="text-xs bg-accent-light text-accent rounded-lg px-3 py-2">
        Les préparations sont des produits semi-finis fabriqués par le pâtissier (riz au lait nature, crêpe nature…). Elles sont en unités et ont leur propre recette.
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">Nom
        <input value={nom} onChange={e => setNom(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="ex: Riz au lait nature, Crêpe nature…" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Stock actuel (unités)
        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Seuil d'alerte
        <input type="number" min="0" value={seuil} onChange={e => setSeuil(e.target.value)}
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
      <p className="text-sm text-text-sub">Stock actuel: <strong>{mp.stockActuel} unités</strong></p>
      <label className="flex flex-col gap-1 text-sm font-medium">Quantité (+/-)
        <QuantiteInput unite="UNITE" value={delta} onChange={setDelta} autoFocus allowNegative />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Raison (optionnel)
        <input value={raison} onChange={e => setRaison(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
    </Modal>
  )
}

function RecetteModal({ prep, onClose }: { prep: MatierePremiere; onClose: () => void }) {
  const { matieres, preparationRecettes, savePreparationRecette } = useAppStore()
  const existing = preparationRecettes.find(r => r.preparationId === prep.id)
  const [ingredients, setIngredients] = useState<PreparationIngredient[]>(existing?.ingredients ?? [])
  const [selectedMP, setSelectedMP] = useState('')
  const [qte, setQte] = useState('')

  const rawMPs = matieres.filter(m => !m.estPreparation && m.id !== prep.id)
  const selectedMPObj = rawMPs.find(m => m.id === selectedMP)

  const addIngr = () => {
    const q = parseFloat(qte)
    if (!selectedMP || isNaN(q) || q <= 0) return
    if (ingredients.find(i => i.mpIngredientId === selectedMP)) return
    setIngredients(prev => [...prev, { mpIngredientId: selectedMP, quantite: q }])
    setQte('')
  }

  const coutEstime = ingredients.reduce((sum, ing) => {
    const mp = matieres.find(m => m.id === ing.mpIngredientId)
    return sum + (mp?.prixAchat ?? 0) * ing.quantite
  }, 0)

  return (
    <Modal title={`Recette — ${prep.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={() => { savePreparationRecette(prep.id, ingredients); onClose() }}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Sauvegarder</button>
        </>
      }>
      <p className="text-xs bg-accent-light text-accent px-3 py-2 rounded-lg">
        Ingrédients pour fabriquer <strong>1 unité</strong> de "{prep.nom}"
      </p>
      <div className="flex gap-2">
        <select value={selectedMP} onChange={e => { setSelectedMP(e.target.value); setQte('') }}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">— Choisir une MP brute —</option>
          {rawMPs.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.unite})</option>)}
        </select>
        <button onClick={addIngr} className="p-2 bg-accent text-white rounded-lg shrink-0"><Plus size={16} /></button>
      </div>
      {selectedMPObj && (
        <QuantiteInput unite={selectedMPObj.unite} value={qte} onChange={setQte} placeholder="Quantité" />
      )}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {ingredients.length === 0 && <p className="text-sm text-text-sub text-center py-4">Aucun ingrédient</p>}
        {ingredients.map(ing => {
          const mp = matieres.find(m => m.id === ing.mpIngredientId)
          return (
            <div key={ing.mpIngredientId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm">{mp?.nom ?? '?'}</span>
              <span className="text-sm font-semibold text-text-sub">{ing.quantite} {mp?.unite.toLowerCase()}</span>
              <button onClick={() => setIngredients(prev => prev.filter(i => i.mpIngredientId !== ing.mpIngredientId))}
                className="p-1 hover:bg-danger-light rounded"><Trash2 size={14} className="text-danger" /></button>
            </div>
          )
        })}
      </div>
      {coutEstime > 0 && (
        <div className="bg-success-light rounded-lg px-3 py-2 flex justify-between">
          <span className="text-sm text-success font-medium">Coût estimé / unité</span>
          <span className="text-sm font-bold text-success">{coutEstime.toFixed(4)} €</span>
        </div>
      )}
    </Modal>
  )
}

function ProduireModal({ prep, onClose }: { prep: MatierePremiere; onClose: () => void }) {
  const { matieres, preparationRecettes, produirePreparation } = useAppStore()
  const recette = preparationRecettes.find(r => r.preparationId === prep.id)
  const [quantite, setQuantite] = useState('1')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const qty = Math.max(1, parseInt(quantite) || 1)
  const preview = recette?.ingredients.map(ing => {
    const mp = matieres.find(m => m.id === ing.mpIngredientId)
    const requis = ing.quantite * qty
    return { nom: mp?.nom ?? '?', unite: mp?.unite ?? '', requis, dispo: mp?.stockActuel ?? 0, ok: (mp?.stockActuel ?? 0) >= requis }
  }) ?? []
  const peutProduire = preview.every(p => p.ok)

  const handleProduce = async () => {
    setLoading(true); setErreur('')
    const result = await produirePreparation(prep.id, qty)
    setLoading(false)
    if (result.ok) onClose()
    else setErreur(result.erreur ?? 'Erreur')
  }

  return (
    <Modal title={`Produire — ${prep.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={handleProduce} disabled={loading || (!peutProduire && preview.length > 0)}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-40">
            {loading ? 'En cours…' : `Produire ×${qty}`}
          </button>
        </>
      }>
      <label className="flex flex-col gap-1 text-sm font-medium">Nombre d'unités à produire
        <input type="number" min="1" value={quantite} onChange={e => setQuantite(e.target.value)} autoFocus
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      {preview.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-text-sub uppercase tracking-wide">Matières consommées</p>
          {preview.map(p => (
            <div key={p.nom} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${p.ok ? 'bg-success-light' : 'bg-danger-light'}`}>
              <span className={p.ok ? 'text-success font-medium' : 'text-danger font-medium'}>{p.nom}</span>
              <span className={`text-xs ${p.ok ? 'text-success' : 'text-danger font-bold'}`}>
                {p.requis} {p.unite} / {p.dispo} dispo {p.ok ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
      {!recette && (
        <p className="text-xs bg-warning-light text-warning rounded-lg px-3 py-2">
          Aucune recette configurée — le stock sera ajouté sans déduction de MP.
        </p>
      )}
      {erreur && <p className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{erreur}</p>}
    </Modal>
  )
}

export default function PreparationsScreen() {
  const { matieres, saveMatiere, deleteMatiere, recettes, produits, preparationRecettes } = useAppStore()

  const preparations = matieres.filter(m => m.estPreparation)

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

  const [editing, setEditing] = useState<MatierePremiere | 'new' | null>(null)
  const [ajust, setAjust] = useState<MatierePremiere | null>(null)
  const [editRecette, setEditRecette] = useState<MatierePremiere | null>(null)
  const [produire, setProduire] = useState<MatierePremiere | null>(null)
  const [search, setSearch] = useState('')

  const filtered = preparations.filter(p =>
    search === '' || p.nom.toLowerCase().includes(search.toLowerCase())
  )

  const totalStock = preparations.reduce((s, p) => s + p.stockActuel, 0)
  const alertes = preparations.filter(p => p.stockActuel <= p.seuilTampon)

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Préparations</h1>
          <p className={`text-sm ${alertes.length > 0 ? 'text-orange-500' : 'text-text-sub'}`}>
            {preparations.length} préparation(s) · {totalStock} unités en stock
            {alertes.length > 0 ? ` · ${alertes.length} en alerte` : ''}
          </p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> Nouvelle
        </button>
      </div>

      <div className="bg-accent-light rounded-xl px-4 py-3 text-sm text-accent">
        Les préparations sont fabriquées par le pâtissier depuis des matières premières brutes. Elles constituent la base des produits finis (riz au lait, crêpe, gaufre…).
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une préparation…"
          className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-accent" />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ChefHat size={48} className="text-text-sub mx-auto mb-3 opacity-20" />
          <p className="text-text-sub">Aucune préparation.</p>
          <button onClick={() => setEditing('new')} className="mt-3 text-accent font-medium text-sm hover:underline">
            + Créer une préparation
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(prep => {
          const recette = preparationRecettes.find(r => r.preparationId === prep.id)
          const utiliseDans = mpRecettesMap[prep.id] ?? []
          const critique = prep.stockActuel <= prep.seuilTampon
          const stockColor = prep.stockActuel === 0 ? 'text-danger' : critique ? 'text-orange-500' : 'text-success'
          const borderColor = prep.stockActuel === 0 ? 'border-danger' : critique ? 'border-orange-300' : 'border-border'

          return (
            <div key={prep.id} className={`bg-white rounded-xl border p-4 ${borderColor}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-main">{prep.nom}</p>
                    {recette ? (
                      <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full">
                        {recette.ingredients.length} ingr.
                      </span>
                    ) : (
                      <span className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full">
                        Sans recette
                      </span>
                    )}
                  </div>

                  {prep.prixAchat > 0 && (
                    <p className="text-xs text-text-sub mt-0.5">Coût: {prep.prixAchat.toFixed(4)}€/unité</p>
                  )}

                  {/* Recette inline */}
                  {recette && recette.ingredients.length > 0 && (
                    <div className="mt-2 flex flex-col gap-0.5 border-l-2 border-accent/30 pl-3">
                      {recette.ingredients.map(ing => {
                        const mp = matieres.find(m => m.id === ing.mpIngredientId)
                        return (
                          <p key={ing.mpIngredientId} className="text-xs text-text-sub">
                            {mp?.nom ?? '?'} — <span className="font-medium">{ing.quantite} {mp?.unite.toLowerCase()}</span>
                          </p>
                        )
                      })}
                    </div>
                  )}

                  {utiliseDans.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {utiliseDans.map(nom => (
                        <span key={nom} className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full font-medium">{nom}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-3xl font-bold ${stockColor}`}>{prep.stockActuel}</p>
                  <p className="text-xs text-text-sub">unités</p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => setProduire(prep)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white px-2.5 py-1.5 rounded-lg">
                    <ChefHat size={12} /> Produire
                  </button>
                  <button onClick={() => setEditRecette(prep)}
                    className="flex items-center gap-1.5 text-xs font-medium border border-accent text-accent px-2.5 py-1.5 rounded-lg hover:bg-accent-light">
                    <BookOpen size={12} /> Recette
                  </button>
                </div>

                <button onClick={() => setAjust(prep)} className="text-accent font-bold text-sm px-2 hover:bg-accent-light rounded">+/-</button>
                <button onClick={() => setEditing(prep)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={16} className="text-text-sub" /></button>
                <button onClick={() => deleteMatiere(prep.id)} className="p-2 hover:bg-danger-light rounded-lg"><Trash2 size={16} className="text-danger" /></button>
              </div>
            </div>
          )
        })}
      </div>

      {editing !== null && (
        <PrepForm
          initial={editing === 'new' ? undefined : editing}
          onSave={saveMatiere}
          onClose={() => setEditing(null)}
        />
      )}
      {ajust && <AjustForm mp={ajust} onClose={() => setAjust(null)} />}
      {editRecette && <RecetteModal prep={editRecette} onClose={() => setEditRecette(null)} />}
      {produire && <ProduireModal prep={produire} onClose={() => setProduire(null)} />}
    </div>
  )
}
