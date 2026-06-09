import { useAppStore } from '../store/useAppStore'

export default function ParametresScreen() {
  const { matieres, produits, commandes, mouvements, recettes } = useAppStore()

  const exportData = () => {
    const data = { matieres, produits, commandes, mouvements, recettes, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instant-dessert-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { label: 'Matières premières', value: matieres.length },
    { label: 'Produits finis', value: produits.length },
    { label: 'Recettes configurées', value: recettes.length },
    { label: 'Commandes totales', value: commandes.length },
    { label: 'Mouvements enregistrés', value: mouvements.length },
    { label: 'CA total', value: `${commandes.reduce((s, c) => s + c.total, 0).toFixed(2)} €` },
  ]

  return (
    <div className="p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Paramètres</h1>
        <p className="text-text-sub text-sm">Données stockées en local dans votre navigateur</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-text-main">Statistiques de la base</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4">
              <p className="text-2xl font-bold text-text-main">{s.value}</p>
              <p className="text-sm text-text-sub mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-text-main">Export des données</h2>
        <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-main">Exporter en JSON</p>
            <p className="text-sm text-text-sub">Télécharge toutes les données dans un fichier JSON</p>
          </div>
          <button onClick={exportData} className="bg-accent text-white px-4 py-2 rounded-xl font-medium">
            Exporter
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-text-main">À propos</h2>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="font-semibold text-text-main">Instant Dessert — Gestion de stock</p>
          <p className="text-sm text-text-sub mt-1">Application web · Données stockées localement (localStorage)</p>
          <p className="text-sm text-text-sub mt-1">React · TypeScript · Zustand · Tailwind CSS</p>
        </div>
      </section>
    </div>
  )
}
