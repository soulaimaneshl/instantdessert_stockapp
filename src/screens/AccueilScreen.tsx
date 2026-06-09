import { useState } from 'react'
import Modal from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { MatierePremiere, ProduitFini } from '../types'

function AjustMPModal({ mp, onClose }: { mp: MatierePremiere; onClose: () => void }) {
  const { ajusterStock } = useAppStore()
  const [delta, setDelta] = useState('')
  const [raison, setRaison] = useState('')

  const valider = () => {
    const d = parseFloat(delta)
    if (!isNaN(d)) { ajusterStock(mp.id, d, raison || undefined); onClose() }
  }

  return (
    <Modal title={`Ajuster stock — ${mp.nom}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-sub hover:bg-gray-100">Annuler</button>
          <button onClick={valider} className="px-4 py-2 bg-accent text-white rounded-lg font-medium">Valider</button>
        </>
      }>
      <p className="text-sm text-text-sub">
        Stock actuel : <strong>{mp.stockActuel} {mp.unite.toLowerCase()}</strong> · Seuil : {mp.seuilTampon}
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Quantité à ajouter (+) ou retirer (−)
        <input type="number" value={delta} onChange={e => setDelta(e.target.value)}
          placeholder="ex: 5000" autoFocus
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Raison (optionnel)
        <input value={raison} onChange={e => setRaison(e.target.value)}
          placeholder="ex: Livraison Metro"
          className="border border-border rounded-lg px-3 py-2 text-sm" />
      </label>
    </Modal>
  )
}

function AjustProduitModal({ produit, onClose }: { produit: ProduitFini; onClose: () => void }) {
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
            {d < 0 ? 'Les ingrédients utilisés pour ces produits seront remis en stock.' : 'Les ingrédients de la recette seront consommés automatiquement.'}
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

function KpiCard({ label, value, color, valueColor, labelColor }: { label: string; value: string; color: string; valueColor?: string; labelColor?: string }) {
  return (
    <div className={`rounded-xl p-5 border-2 ${color}`}>
      <p className={`text-sm font-semibold mb-1 ${labelColor ?? 'text-text-sub'}`}>{label}</p>
      <p className={`text-2xl font-bold ${valueColor ?? 'text-text-main'}`}>{value}</p>
    </div>
  )
}

type NiveauAlerte = 'critique' | 'attention'

function niveauAlerte(mp: MatierePremiere): NiveauAlerte | null {
  if (mp.stockActuel <= mp.seuilTampon) return 'critique'
  if (mp.stockActuel <= mp.seuilTampon * 2) return 'attention'
  return null
}

function AlerteCard({ mp, onClick }: { mp: MatierePremiere; onClick: () => void }) {
  const niveau = niveauAlerte(mp)!
  const critique = niveau === 'critique'

  const bg    = critique ? 'bg-danger-light border-danger hover:bg-red-100'    : 'bg-orange-50 border-orange-300 hover:bg-orange-100'
  const badge = critique ? 'bg-danger text-white'                               : 'bg-orange-400 text-white'
  const label = mp.stockActuel === 0 ? 'ÉPUISÉ' : critique ? 'CRITIQUE' : 'ATTENTION'
  const btnBorder = critique ? 'border-danger text-danger' : 'border-orange-400 text-orange-500'

  return (
    <button onClick={onClick}
      className={`w-full text-left border rounded-xl px-4 py-3 flex justify-between items-center transition-colors ${bg}`}>
      <div>
        <p className="font-semibold text-text-main">{mp.nom}</p>
        <p className="text-sm text-text-sub">
          Stock: {mp.stockActuel} {mp.unite.toLowerCase()} · Seuil: {mp.seuilTampon}
          {mp.categorie ? ` · ${mp.categorie}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-bold px-2 py-1 rounded ${badge}`}>{label}</span>
        <span className={`text-xs font-medium bg-white border px-2 py-1 rounded-lg ${btnBorder}`}>+ Ajuster</span>
      </div>
    </button>
  )
}

export default function AccueilScreen() {
  const { matieres, produits, commandes, commandesSite } = useAppStore()
  const [ajustMP, setAjustMP] = useState<MatierePremiere | null>(null)
  const [ajustProduit, setAjustProduit] = useState<ProduitFini | null>(null)

  const critique = matieres.filter(m => niveauAlerte(m) === 'critique')
  const attention = matieres.filter(m => niveauAlerte(m) === 'attention')
  const totalAlertes = critique.length + attention.length

  const today = Date.now() - (Date.now() % 86_400_000)
  const cmdAujourd = commandes.filter(c => c.createdAt >= today)
  const caAujourd = cmdAujourd.reduce((s, c) => s + c.total, 0)
  const cmdSiteEnAttente = commandesSite.filter(c => ['en_attente', 'recue', 'en_preparation'].includes(c.statut))
  const totalCommandes = cmdAujourd.length + cmdSiteEnAttente.length
  const ca = caAujourd + cmdSiteEnAttente.reduce((s, c) => s + c.total, 0)
  const stockTotal = produits.reduce((s, p) => s + p.stockActuel, 0)
  const epuises = produits.filter(p => p.stockActuel === 0)

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Tableau de bord</h1>
        <p className="text-text-sub">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="CA aujourd'hui" value={`${ca.toFixed(2)} €`} color="bg-success-light border-success/30" valueColor="text-success" labelColor="text-success" />
        <KpiCard label="Commandes à préparer" value={`${totalCommandes}`} color={totalCommandes > 0 ? 'bg-warning-light border-warning/40' : 'bg-accent-light border-accent/20'} valueColor={totalCommandes > 0 ? 'text-warning' : 'text-text-main'} labelColor={totalCommandes > 0 ? 'text-warning' : 'text-text-sub'} />
        <KpiCard label="Stock produits" value={`${stockTotal} unités`} color="bg-teal-50 border-teal-400" valueColor="text-teal-600" labelColor="text-teal-500" />
        <KpiCard label="Alertes MP" value={`${totalAlertes}`}
          color={critique.length > 0 ? 'bg-red-50 border-red-500' : attention.length > 0 ? 'bg-orange-50 border-orange-400' : 'bg-success-light border-success/30'}
          valueColor={critique.length > 0 ? 'text-red-600' : attention.length > 0 ? 'text-orange-500' : 'text-success'}
          labelColor={critique.length > 0 ? 'text-red-400' : attention.length > 0 ? 'text-orange-400' : undefined} />
      </div>

      {/* Alertes critiques (rouge) */}
      {critique.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />
            <h2 className="font-semibold text-danger">Seuil dépassé — {critique.length} article(s)</h2>
          </div>
          <p className="text-xs text-text-sub mb-3">Cliquez pour ajuster le stock</p>
          <div className="flex flex-col gap-2">
            {critique.map(mp => <AlerteCard key={mp.id} mp={mp} onClick={() => setAjustMP(mp)} />)}
          </div>
        </div>
      )}

      {/* Alertes attention (orange) */}
      {attention.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
            <h2 className="font-semibold text-orange-500">Seuil proche — {attention.length} article(s)</h2>
          </div>
          <p className="text-xs text-text-sub mb-3">Stock entre 1× et 2× le seuil — pensez à commander</p>
          <div className="flex flex-col gap-2">
            {attention.map(mp => <AlerteCard key={mp.id} mp={mp} onClick={() => setAjustMP(mp)} />)}
          </div>
        </div>
      )}

      {epuises.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
            <h2 className="font-semibold text-warning">Produits finis épuisés — {epuises.length} produit(s)</h2>
          </div>
          <p className="text-xs text-text-sub mb-3">Cliquez pour ajuster le stock</p>
          <div className="flex flex-col gap-2">
            {epuises.map(p => (
              <button key={p.id} onClick={() => setAjustProduit(p)}
                className="w-full text-left bg-warning-light border border-warning hover:bg-yellow-100 rounded-xl px-4 py-3 flex justify-between items-center transition-colors">
                <div>
                  <p className="font-semibold text-text-main">{p.nom}</p>
                  <p className="text-sm text-text-sub">Stock: 0 unité{p.categorie ? ` · ${p.categorie}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-warning text-white">ÉPUISÉ</span>
                  <span className="text-xs font-medium bg-white border border-warning text-warning px-2 py-1 rounded-lg">+ Ajuster</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalAlertes === 0 && epuises.length === 0 && (
        <div className="bg-success-light border border-success rounded-xl px-4 py-4">
          <p className="text-success font-semibold">Tout est en ordre ✓</p>
          <p className="text-sm text-text-sub">Aucune alerte de stock</p>
        </div>
      )}

      {ajustMP && <AjustMPModal mp={ajustMP} onClose={() => setAjustMP(null)} />}
      {ajustProduit && <AjustProduitModal produit={ajustProduit} onClose={() => setAjustProduit(null)} />}
    </div>
  )
}
