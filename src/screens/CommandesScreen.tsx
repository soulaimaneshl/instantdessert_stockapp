import { useState } from 'react'
import { Plus, Trash2, ChefHat, CheckCircle } from 'lucide-react'
// Trash2 utilisé dans NouvelleCommandeModal pour retirer une ligne
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { Canal, CommandeSite } from '../types'

const CANAUX: Canal[] = ['LIVRAISON', 'SUR_PLACE', 'EMPORTER', 'DRIVE', 'MARKETPLACE']

type LigneLocal = { produitId: string; quantite: number; prix: number }

const STATUT_STYLE: Record<string, string> = {
  en_attente:     'bg-warning-light text-warning',
  en_preparation: 'bg-accent-light text-accent',
  en_livraison:   'bg-accent-light text-accent',
  livre:          'bg-success-light text-success',
  livree:         'bg-success-light text-success',
  annule:         'bg-danger-light text-danger',
  annulee:        'bg-danger-light text-danger',
  recue:          'bg-warning-light text-warning',
  traitee:        'bg-success-light text-success',
}

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', en_preparation: 'En préparation',
  en_livraison: 'En livraison', livre: 'Livré', livree: 'Livrée',
  annule: 'Annulé', annulee: 'Annulée', recue: 'Reçue',
  traitee: 'Traitée ✓',
}

const STATUT_TERMINAL = new Set(['livree', 'livre', 'annule', 'annulee', 'traitee'])

function PrepareModal({ cmd, onClose }: { cmd: CommandeSite; onClose: () => void }) {
  const { produits, recettes, preparerCommandeSite } = useAppStore()
  const [matches, setMatches] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {}
    cmd.lignes.forEach((l, i) => {
      const ln = l.nom.toLowerCase()
      const match = produits.find(p => {
        const pn = p.nom.toLowerCase()
        return pn === ln || ln.includes(pn) || pn.includes(ln.split(' ')[0])
      })
      if (match) init[i] = match.id
    })
    return init
  })
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    const validMatches = Object.entries(matches)
      .filter(([, pfId]) => pfId)
      .map(([i, pfId]) => ({ pfId, quantite: cmd.lignes[+i].quantite }))
    await preparerCommandeSite(cmd.id, cmd.source, validMatches)
    setLoading(false)
    onClose()
  }

  return (
    <Modal title={`Préparer — ${cmd.nomClient}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-40">
            {loading ? 'En cours…' : 'Confirmer préparation'}
          </button>
        </>
      }>
      <p className="text-xs text-text-sub bg-accent-light rounded-lg px-3 py-2">
        Associez chaque article à un produit du stock. Si le produit a une recette, les ingrédients (base + toppings) seront déduits automatiquement. Sinon, c'est le stock du produit fini qui diminue.
      </p>
      <div className="flex flex-col gap-3">
        {cmd.lignes.map((l, i) => {
          const pfId = matches[i] ?? ''
          const pf = produits.find(p => p.id === pfId)
          const aRecette = pf && recettes.some(r => r.produitFiniId === pfId)
          return (
            <div key={i} className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-text-main">{l.nom}</span>
                <span className="text-xs bg-gray-200 text-text-sub px-2 py-0.5 rounded-full font-medium">×{l.quantite}</span>
              </div>
              <select value={pfId} onChange={e => setMatches({ ...matches, [i]: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">— Ignorer —</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom}{p.stockActuel > 0 ? ` (stock: ${p.stockActuel})` : ''}
                  </option>
                ))}
              </select>
              {pfId && (
                <p className="text-xs text-success font-medium">
                  {aRecette
                    ? '→ Recette : ingrédients déduits automatiquement'
                    : `→ Stock déduit : ${l.quantite} unité(s) de "${pf?.nom}"`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

function CommandeSiteCard({ cmd, onPrepare, onValider }: {
  cmd: CommandeSite
  onPrepare: (cmd: CommandeSite) => void
  onValider: () => void
}) {
  const canPrepare = !['livree', 'livre', 'annule', 'annulee', 'en_preparation', 'traitee'].includes(cmd.statut)
  const canValider = cmd.statut === 'en_preparation'
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${cmd.source === 'B2C' ? 'bg-accent text-white' : 'bg-text-main text-white'}`}>
              {cmd.source === 'B2C' ? 'Particulier' : 'Restaurant'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUT_STYLE[cmd.statut] ?? 'bg-gray-100 text-text-sub'}`}>
              {STATUT_LABEL[cmd.statut] ?? cmd.statut}
            </span>
          </div>
          <p className="font-semibold text-text-main">{cmd.nomClient}</p>
          <p className="text-xs text-text-sub mt-0.5">
            {new Date(cmd.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {' · '}#{cmd.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="font-bold text-accent">{cmd.total.toFixed(2)} €</p>
          {canPrepare && (
            <button onClick={() => onPrepare(cmd)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors">
              <ChefHat size={13} /> Préparer
            </button>
          )}
          {canValider && (
            <button onClick={onValider}
              className="flex items-center gap-1.5 text-xs font-semibold bg-success text-white px-3 py-1.5 rounded-lg hover:bg-success/90 transition-colors">
              <CheckCircle size={13} /> Valider
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {cmd.lignes.map((l, i) => (
          <span key={i} className="text-xs bg-gray-100 text-text-sub px-2 py-1 rounded-full">
            {l.nom} ×{l.quantite}
          </span>
        ))}
      </div>
    </div>
  )
}

function NouvelleCommandeModal({ onClose }: { onClose: () => void }) {
  const { produits, enregistrerCommande } = useAppStore()
  const [nomClient, setNomClient] = useState('')
  const [canal, setCanal] = useState<Canal>('SUR_PLACE')
  const [lignes, setLignes] = useState<LigneLocal[]>([])
  const [selectedProduit, setSelectedProduit] = useState(produits[0]?.id?.toString() ?? '')
  const [qte, setQte] = useState('1')
  const [erreur, setErreur] = useState('')

  const addLigne = () => {
    const id = selectedProduit
    const q = parseInt(qte)
    const p = produits.find(p => p.id === id)
    if (!p || isNaN(q) || q <= 0) return
    setLignes(prev => {
      const existing = prev.find(l => l.produitId === id)
      if (existing) return prev.map(l => l.produitId === id ? { ...l, quantite: l.quantite + q } : l)
      return [...prev, { produitId: id, quantite: q, prix: p.prixVente }]
    })
    setQte('1')
  }

  const total = lignes.reduce((s, l) => s + l.quantite * l.prix, 0)

  const valider = () => {
    if (lignes.length === 0) { setErreur('Ajoutez au moins une ligne.'); return }
    enregistrerCommande(nomClient.trim() || 'Client direct', canal, lignes)
    onClose()
  }

  return (
    <Modal title="Vente directe" onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={valider} className="px-4 py-2 bg-accent text-white rounded-lg font-medium">
            Valider ({total.toFixed(2)} €)
          </button>
        </>
      }>
      <label className="flex flex-col gap-1 text-sm font-medium">Nom du client (optionnel)
        <input value={nomClient} onChange={e => setNomClient(e.target.value)} placeholder="ex: Jean Dupont"
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      <div>
        <p className="text-sm font-medium mb-2">Canal</p>
        <div className="flex gap-2 flex-wrap">
          {CANAUX.map(c => (
            <button key={c} onClick={() => setCanal(c)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${canal === c ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <select value={selectedProduit} onChange={e => setSelectedProduit(e.target.value)}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white">
          {produits.map(p => {
            const base = p.baseProduitId ? produits.find(b => b.id === p.baseProduitId) : null
            const displayStock = base ? base.stockActuel : p.stockActuel
            return <option key={p.id} value={p.id}>{p.nom} (stock: {displayStock})</option>
          })}
        </select>
        <input type="number" min="1" value={qte} onChange={e => setQte(e.target.value)}
          className="w-20 border border-border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addLigne} className="p-2 bg-accent text-white rounded-lg"><Plus size={16} /></button>
      </div>
      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
        {lignes.length === 0 && <p className="text-sm text-text-sub text-center py-2">Aucun article</p>}
        {lignes.map(l => {
          const p = produits.find(p => p.id === l.produitId)
          return (
            <div key={l.produitId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm">{p?.nom ?? '?'}</span>
              <span className="text-sm font-semibold">x{l.quantite}</span>
              <span className="text-sm text-text-sub">{(l.quantite * l.prix).toFixed(2)}€</span>
              <button onClick={() => setLignes(prev => prev.filter(x => x.produitId !== l.produitId))}>
                <Trash2 size={14} className="text-danger" />
              </button>
            </div>
          )
        })}
      </div>
      {erreur && <p className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2">{erreur}</p>}
    </Modal>
  )
}

export default function CommandesScreen() {
  const { commandes, commandesSite, produits, validerCommandeSite } = useAppStore()
  const [showNew, setShowNew] = useState(false)
  const [tab, setTab] = useState<'site' | 'directes' | 'annulees'>('site')
  const [preparing, setPreparing] = useState<CommandeSite | null>(null)

  const IS_ANNULEE = (s: string) => ['annule', 'annulee'].includes(s)

  const commandesActives  = commandesSite.filter(c => !IS_ANNULEE(c.statut))
  const commandesAnnulees = commandesSite.filter(c => IS_ANNULEE(c.statut))

  const caDirectes = commandes.reduce((s, c) => s + c.total, 0)
  const caSite = commandesActives.reduce((s, c) => s + c.total, 0)
  const pendingSite = commandesActives.filter(c => ['en_attente', 'recue', 'en_preparation'].includes(c.statut)).length

  const commandesSiteTried = [...commandesActives].sort((a, b) => {
    const aTerminal = STATUT_TERMINAL.has(a.statut)
    const bTerminal = STATUT_TERMINAL.has(b.statut)
    if (aTerminal !== bTerminal) return aTerminal ? 1 : -1
    return a.createdAt - b.createdAt
  })

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Commandes</h1>
          <p className="text-text-sub text-sm">Site: {commandesActives.length} · Directes: {commandes.length} · Annulées: {commandesAnnulees.length}</p>
        </div>
        <button onClick={() => setShowNew(true)} disabled={produits.length === 0}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40">
          <Plus size={18} /> Vente directe
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button onClick={() => setTab('site')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'site' ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
          Commandes site
          {pendingSite > 0 && <span className="bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">{pendingSite}</span>}
        </button>
        <button onClick={() => setTab('directes')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'directes' ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
          Ventes directes
        </button>
        <button onClick={() => setTab('annulees')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'annulees' ? 'border-danger text-danger' : 'border-transparent text-text-sub hover:text-text-main'}`}>
          Annulées
          {commandesAnnulees.length > 0 && <span className="bg-danger/10 text-danger text-xs px-1.5 py-0.5 rounded-full">{commandesAnnulees.length}</span>}
        </button>
      </div>

      {tab === 'annulees' ? (
        <div className="flex flex-col gap-3">
          <div className="bg-danger/10 rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-sm text-danger font-medium">{commandesAnnulees.length} commande(s) annulée(s)</p>
          </div>
          {commandesAnnulees.length === 0 && <p className="text-text-sub text-center py-12">Aucune commande annulée.</p>}
          {[...commandesAnnulees].sort((a, b) => b.createdAt - a.createdAt).map(cmd => (
            <div key={cmd.id} className="bg-white rounded-xl border border-danger/20 p-4 opacity-80">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-text-main">{cmd.nomClient}</p>
                  <p className="text-xs text-text-sub">{new Date(cmd.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-danger-light text-danger text-xs px-2 py-0.5 rounded-full font-medium mb-1">
                    {STATUT_LABEL[cmd.statut] ?? cmd.statut}
                  </span>
                  <p className="font-bold text-text-main">{cmd.total.toFixed(2)} €</p>
                  <p className="text-xs text-text-sub uppercase">{cmd.source}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex flex-col gap-1">
                {cmd.lignes.map((l, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-sub">{l.nom} <span className="text-text-sub/60">×{l.quantite}</span></span>
                    <span className="text-text-main font-medium">{(l.prix * l.quantite).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'site' ? (
        <div className="flex flex-col gap-3">
          <div className="bg-accent-light rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-sm text-accent font-medium">{commandesActives.length} commande(s) · {pendingSite} en cours</p>
            <p className="font-bold text-accent">{caSite.toFixed(2)} €</p>
          </div>
          {commandesActives.length === 0 && <p className="text-text-sub text-center py-12">Aucune commande du site.</p>}
          {commandesSiteTried.map(cmd => (
            <CommandeSiteCard key={cmd.id} cmd={cmd} onPrepare={setPreparing}
              onValider={() => validerCommandeSite(cmd.id, cmd.source)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {commandes.length > 0 && (
            <div className="bg-success-light rounded-xl px-4 py-3 flex justify-between items-center">
              <p className="text-sm text-success font-medium">{commandes.length} vente(s) directe(s)</p>
              <p className="font-bold text-success">{caDirectes.toFixed(2)} €</p>
            </div>
          )}
          {commandes.length === 0 && <p className="text-text-sub text-center py-12">Aucune vente directe enregistrée.</p>}
          {[...commandes].sort((a, b) => b.createdAt - a.createdAt).map(cmd => (
            <div key={cmd.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-main">{cmd.nomClient}</p>
                  <p className="text-sm text-text-sub">{cmd.canal} · {new Date(cmd.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="font-bold text-accent">{cmd.total.toFixed(2)} €</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {cmd.lignes.map(l => {
                  const p = produits.find(p => p.id === l.produitFiniId)
                  return (
                    <span key={l.produitFiniId} className="text-xs bg-accent-light text-accent px-2 py-1 rounded-full">
                      {p?.nom ?? '?'} x{l.quantite} · {(l.prixUnitaireSnapshot * l.quantite).toFixed(2)}€
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NouvelleCommandeModal onClose={() => setShowNew(false)} />}
      {preparing && <PrepareModal cmd={preparing} onClose={() => setPreparing(null)} />}
    </div>
  )
}
