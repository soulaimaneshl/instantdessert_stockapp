import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { TypeMouvement } from '../types'

type Period = 'TOUT' | 'AUJOURD' | 'SEMAINE' | 'MOIS'
const PERIODS: { id: Period; label: string }[] = [
  { id: 'TOUT', label: 'Tout' },
  { id: 'AUJOURD', label: "Aujourd'hui" },
  { id: 'SEMAINE', label: 'Semaine' },
  { id: 'MOIS', label: 'Mois' },
]

const TYPES: { id: TypeMouvement | 'TOUS' | 'COMMANDE_SITE'; label: string }[] = [
  { id: 'TOUS', label: 'Tous' },
  { id: 'ACHAT_MP', label: 'Achat MP' },
  { id: 'CORRECTION_MP', label: 'Correction MP' },
  { id: 'PRODUCTION', label: 'Production' },
  { id: 'VENTE', label: 'Vente directe' },
  { id: 'COMMANDE_SITE', label: 'Commande site' },
]

const TYPE_COLORS: Record<string, string> = {
  ACHAT_MP:       'bg-accent-light text-accent',
  CORRECTION_MP:  'bg-warning-light text-warning',
  PRODUCTION:     'bg-success-light text-success',
  VENTE:          'bg-danger-light text-danger',
  COMMANDE_SITE:  'bg-text-main text-white',
}

const SOURCE_LABEL: Record<string, string> = {
  B2C: 'Particulier',
  B2B: 'Restaurant',
}

export default function HistoriqueScreen() {
  const { mouvements, matieres, produits, commandesSite } = useAppStore()
  const [period, setPeriod] = useState<Period>('TOUT')
  const [typeFilter, setTypeFilter] = useState<TypeMouvement | 'TOUS' | 'COMMANDE_SITE'>('TOUS')

  const now = Date.now()
  const startOf = (p: Period) => {
    if (p === 'TOUT') return 0
    if (p === 'AUJOURD') return now - (now % 86_400_000)
    if (p === 'SEMAINE') return now - 7 * 86_400_000
    return now - 30 * 86_400_000
  }
  const start = startOf(period)

  const getEntiteNom = (m: typeof mouvements[0]) => {
    if (m.entiteType === 'MATIERE_PREMIERE') return matieres.find(x => x.id === m.entiteId)?.nom ?? `MP#${m.entiteId}`
    return produits.find(x => x.id === m.entiteId)?.nom ?? `PF#${m.entiteId}`
  }

  // Mouvements filtrés
  const filteredMvt = (typeFilter === 'TOUS' || typeFilter !== 'COMMANDE_SITE')
    ? mouvements.filter(m => {
        const inPeriod = m.createdAt >= start
        const inType = typeFilter === 'TOUS' || m.type === typeFilter
        return inPeriod && inType
      })
    : []

  // Commandes site filtrées
  const filteredSite = (typeFilter === 'TOUS' || typeFilter === 'COMMANDE_SITE')
    ? commandesSite.filter(c => c.createdAt >= start)
    : []

  // Fusion et tri
  type Entry =
    | { kind: 'mvt'; data: typeof mouvements[0] }
    | { kind: 'site'; data: typeof commandesSite[0] }

  const entries: Entry[] = [
    ...filteredMvt.map(m => ({ kind: 'mvt' as const, data: m })),
    ...filteredSite.map(c => ({ kind: 'site' as const, data: c })),
  ].sort((a, b) => b.data.createdAt - a.data.createdAt)

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Historique</h1>
        <p className="text-text-sub text-sm">{entries.length} / {mouvements.length + commandesSite.length} événement(s)</p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium text-text-sub uppercase mb-2">Période</p>
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${period === p.id ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-text-sub uppercase mb-2">Type</p>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${typeFilter === t.id ? 'bg-accent text-white border-accent' : 'border-border text-text-sub hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {entries.length === 0 && <p className="text-text-sub text-center py-12">Aucun événement pour ces filtres.</p>}
        {entries.map(entry => {
          if (entry.kind === 'mvt') {
            const m = entry.data
            return (
              <div key={`mvt-${m.id}`} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${TYPE_COLORS[m.type] ?? 'bg-gray-100 text-text-sub'}`}>{m.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-main truncate">{getEntiteNom(m)}</p>
                  {m.raison && <p className="text-xs text-text-sub truncate">{m.raison}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${m.delta > 0 ? 'text-success' : 'text-danger'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </p>
                  <p className="text-xs text-text-sub">{new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )
          } else {
            const c = entry.data
            return (
              <div key={`site-${c.id}`} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-1 rounded shrink-0 bg-text-main text-white">COMMANDE</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-main truncate">{c.nomClient}</p>
                    <span className="text-xs bg-accent-light text-accent px-1.5 py-0.5 rounded shrink-0">{SOURCE_LABEL[c.source]}</span>
                  </div>
                  <p className="text-xs text-text-sub truncate">{c.lignes.map(l => `${l.nom} ×${l.quantite}`).join(', ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-accent">+{c.total.toFixed(2)}€</p>
                  <p className="text-xs text-text-sub">{new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
