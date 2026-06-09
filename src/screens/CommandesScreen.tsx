import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
}

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', en_preparation: 'En préparation',
  en_livraison: 'En livraison', livre: 'Livré', livree: 'Livrée',
  annule: 'Annulé', annulee: 'Annulée', recue: 'Reçue',
}

function CommandeSiteCard({ cmd }: { cmd: CommandeSite }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
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
        <p className="font-bold text-accent">{cmd.total.toFixed(2)} €</p>
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
          {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (stock: {p.stockActuel})</option>)}
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
  const { commandes, commandesSite, produits } = useAppStore()
  const [showNew, setShowNew] = useState(false)
  const [tab, setTab] = useState<'site' | 'directes'>('site')

  const caDirectes = commandes.reduce((s, c) => s + c.total, 0)
  const caSite = commandesSite.reduce((s, c) => s + c.total, 0)
  const pendingSite = commandesSite.filter(c => ['en_attente', 'recue', 'en_preparation'].includes(c.statut)).length

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Commandes</h1>
          <p className="text-text-sub text-sm">Site: {commandesSite.length} · Directes: {commandes.length}</p>
        </div>
        <button onClick={() => setShowNew(true)} disabled={produits.length === 0}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40">
          <Plus size={18} /> Vente directe
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([['site', 'Commandes site'], ['directes', 'Ventes directes']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === id ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
            {label}
            {id === 'site' && pendingSite > 0 && (
              <span className="bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">{pendingSite}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'site' ? (
        <div className="flex flex-col gap-3">
          <div className="bg-accent-light rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-sm text-accent font-medium">{commandesSite.length} commande(s) reçues du site</p>
            <p className="font-bold text-accent">{caSite.toFixed(2)} €</p>
          </div>
          {commandesSite.length === 0 && <p className="text-text-sub text-center py-12">Aucune commande du site.</p>}
          {commandesSite.map(cmd => <CommandeSiteCard key={cmd.id} cmd={cmd} />)}
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
    </div>
  )
}
