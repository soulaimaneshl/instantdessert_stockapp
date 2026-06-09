import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { Canal } from '../types'

const CANAUX: Canal[] = ['LIVRAISON', 'SUR_PLACE', 'EMPORTER', 'DRIVE', 'MARKETPLACE']

export default function RentabiliteScreen() {
  const { produits, commandes, commandesSite } = useAppStore()
  const [tab, setTab] = useState<'produit' | 'canal'>('produit')

  // --- Par produit (ventes directes uniquement, car les commandes site n'ont pas de produitFiniId)
  const lignes = produits.map(p => {
    const ventes = commandes.flatMap(c => c.lignes.filter(l => l.produitFiniId === p.id))
    const qteTotale = ventes.reduce((s, l) => s + l.quantite, 0)
    const caTotal = ventes.reduce((s, l) => s + l.quantite * l.prixUnitaireSnapshot, 0)
    const cdrTotal = qteTotale * p.coutDeRevient
    const marge = caTotal - cdrTotal
    const taux = caTotal > 0 ? (marge / caTotal) * 100 : 0
    return { produit: p, qteTotale, caTotal, marge, taux }
  }).filter(l => l.qteTotale > 0)

  // --- Par canal : ventes directes + commandes site (B2C / B2B)
  const caDirectTotal = commandes.reduce((s, c) => s + c.total, 0)
  const caSiteB2C = commandesSite.filter(c => c.source === 'B2C').reduce((s, c) => s + c.total, 0)
  const caSiteB2B = commandesSite.filter(c => c.source === 'B2B').reduce((s, c) => s + c.total, 0)
  const caTotalGlobal = caDirectTotal + caSiteB2C + caSiteB2B

  const canalStats = CANAUX.map(c => {
    const cmdCanal = commandes.filter(cmd => cmd.canal === c)
    const ca = cmdCanal.reduce((s, cmd) => s + cmd.total, 0)
    const nbCmd = cmdCanal.length
    const marge = cmdCanal.flatMap(cmd => cmd.lignes).reduce((s, l) => {
      const p = produits.find(p => p.id === l.produitFiniId)
      return s + l.quantite * l.prixUnitaireSnapshot - l.quantite * (p?.coutDeRevient ?? 0)
    }, 0)
    const taux = ca > 0 ? (marge / ca) * 100 : 0
    const share = caTotalGlobal > 0 ? ca / caTotalGlobal : 0
    return { label: c, ca, nbCmd, marge, taux, share, issite: false }
  }).filter(s => s.nbCmd > 0)

  // Ajouter B2C et B2B comme canaux virtuels
  const siteCanaux = [
    { label: 'Site — Particuliers', ca: caSiteB2C, nbCmd: commandesSite.filter(c => c.source === 'B2C').length, marge: 0, taux: 0, share: caTotalGlobal > 0 ? caSiteB2C / caTotalGlobal : 0, issite: true },
    { label: 'Site — Restaurants', ca: caSiteB2B, nbCmd: commandesSite.filter(c => c.source === 'B2B').length, marge: 0, taux: 0, share: caTotalGlobal > 0 ? caSiteB2B / caTotalGlobal : 0, issite: true },
  ].filter(s => s.nbCmd > 0)

  const allCanaux = [...canalStats, ...siteCanaux].sort((a, b) => b.ca - a.ca)

  const hasAnyData = lignes.length > 0 || allCanaux.length > 0

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Rentabilité</h1>
        <p className="text-text-sub text-sm">CA total: {caTotalGlobal.toFixed(2)} € · Ventes directes + Site</p>
      </div>

      <div className="flex border-b border-border">
        {(['produit', 'canal'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-text-sub hover:text-text-main'}`}>
            {t === 'produit' ? 'Par produit' : 'Par canal'}
          </button>
        ))}
      </div>

      {!hasAnyData && <p className="text-text-sub text-center py-12">Aucune vente enregistrée.</p>}

      {tab === 'produit' ? (
        <div>
          {lignes.length === 0 ? (
            <p className="text-text-sub text-center py-12">Aucune vente directe enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-sub font-medium">Produit</th>
                    <th className="text-right py-3 px-4 text-text-sub font-medium">Qté</th>
                    <th className="text-right py-3 px-4 text-text-sub font-medium">CA</th>
                    <th className="text-right py-3 px-4 text-text-sub font-medium">Marge</th>
                    <th className="text-right py-3 px-4 text-text-sub font-medium">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.sort((a, b) => b.caTotal - a.caTotal).map(l => (
                    <tr key={l.produit.id} className="border-b border-border hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-text-main">{l.produit.nom}</td>
                      <td className="py-3 px-4 text-right text-text-sub">{l.qteTotale}</td>
                      <td className="py-3 px-4 text-right font-semibold">{l.caTotal.toFixed(2)}€</td>
                      <td className={`py-3 px-4 text-right font-semibold ${l.marge >= 0 ? 'text-success' : 'text-danger'}`}>{l.marge.toFixed(2)}€</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.taux >= 30 ? 'bg-success-light text-success' : l.taux >= 0 ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger'}`}>
                          {l.taux.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allCanaux.length === 0 ? (
            <p className="text-text-sub text-center py-12">Aucune vente enregistrée.</p>
          ) : allCanaux.map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.issite ? 'bg-accent-light border-accent/20' : 'bg-white border-border'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-main">{s.label}</p>
                    {s.issite && <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-medium">Site web</span>}
                  </div>
                  <p className="text-sm text-text-sub">{s.nbCmd} commande(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{s.ca.toFixed(2)} €</p>
                  {!s.issite && s.marge !== 0 && (
                    <p className={`text-sm font-medium ${s.marge >= 0 ? 'text-success' : 'text-danger'}`}>
                      Marge: {s.marge.toFixed(2)}€ ({s.taux.toFixed(1)}%)
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${s.issite ? 'bg-accent' : 'bg-success'}`}
                  style={{ width: `${(s.share * 100).toFixed(1)}%` }} />
              </div>
              <p className="text-xs text-text-sub mt-1">{(s.share * 100).toFixed(1)}% du CA total</p>
            </div>
          ))}

          {caTotalGlobal > 0 && (
            <div className="bg-white rounded-xl border border-border p-4 flex justify-between items-center">
              <p className="font-semibold text-text-main">CA total (toutes sources)</p>
              <p className="text-xl font-bold text-accent">{caTotalGlobal.toFixed(2)} €</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
