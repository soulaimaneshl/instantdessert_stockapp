import * as XLSX from 'xlsx'
import { useAppStore } from '../store/useAppStore'

export default function ParametresScreen() {
  const { matieres, produits, commandes, mouvements, recettes } = useAppStore()

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const date = new Date().toISOString().slice(0, 10)

    // Onglet 1 — Matières premières
    const mpRows = matieres.map(m => ({
      'Nom': m.nom,
      'Catégorie': m.categorie,
      'Unité': m.unite,
      'Stock actuel': m.stockActuel,
      'Seuil tampon': m.seuilTampon,
      "Prix d'achat (€)": m.prixAchat,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mpRows), 'Matières premières')

    // Onglet 2 — Produits finis
    const prodRows = produits.map(p => ({
      'Nom': p.nom,
      'Catégorie': p.categorie,
      'Prix de vente (€)': p.prixVente,
      'Stock actuel': p.stockActuel,
      'Coût de revient (€)': p.coutDeRevient,
      'Marge (€)': parseFloat((p.prixVente - p.coutDeRevient).toFixed(2)),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Produits finis')

    // Onglet 3 — Commandes
    const cmdRows = commandes.flatMap(c =>
      c.lignes.map(l => {
        const produit = produits.find(p => p.id === l.produitFiniId)
        return {
          'Date': new Date(c.createdAt).toLocaleDateString('fr-FR'),
          'Canal': c.canal,
          'Client': c.nomClient || '—',
          'Produit': produit?.nom ?? l.produitFiniId,
          'Quantité': l.quantite,
          'Prix unitaire (€)': l.prixUnitaireSnapshot,
          'Sous-total (€)': parseFloat((l.quantite * l.prixUnitaireSnapshot).toFixed(2)),
          'Total commande (€)': c.total,
        }
      })
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cmdRows.length ? cmdRows : [{}]), 'Commandes')

    // Onglet 4 — Mouvements de stock
    const mvtRows = mouvements.map(m => {
      const entite = m.entiteType === 'MATIERE_PREMIERE'
        ? matieres.find(x => x.id === m.entiteId)?.nom
        : produits.find(x => x.id === m.entiteId)?.nom
      return {
        'Date': new Date(m.createdAt).toLocaleDateString('fr-FR'),
        'Type': m.type,
        'Entité': entite ?? m.entiteId,
        'Type entité': m.entiteType === 'MATIERE_PREMIERE' ? 'Matière première' : 'Produit fini',
        'Delta': m.delta,
        'Raison': m.raison ?? '—',
      }
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mvtRows.length ? mvtRows : [{}]), 'Mouvements')

    // Onglet 5 — Recettes
    const recetteRows = recettes.flatMap(r => {
      const produit = produits.find(p => p.id === r.produitFiniId)
      return r.ingredients.map(ing => {
        const mp = matieres.find(m => m.id === ing.matierePremiereId)
        return {
          'Produit': produit?.nom ?? r.produitFiniId,
          'Ingrédient': mp?.nom ?? ing.matierePremiereId,
          'Quantité': ing.quantite,
          'Unité': mp?.unite ?? '—',
        }
      })
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recetteRows.length ? recetteRows : [{}]), 'Recettes')

    XLSX.writeFile(wb, `instant-dessert-${date}.xlsx`)
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
    <div className="p-4 md:p-8 flex flex-col gap-8">
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
        <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-text-main">Exporter en Excel</p>
            <p className="text-sm text-text-sub">Télécharge toutes les données dans un fichier .xlsx</p>
            <p className="text-xs text-text-sub mt-1 opacity-70">5 onglets : MP · Produits · Commandes · Mouvements · Recettes</p>
          </div>
          <button onClick={exportExcel} className="bg-accent text-white px-4 py-2 rounded-xl font-medium shrink-0">
            Exporter
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-text-main">À propos</h2>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="font-semibold text-text-main">Instant Dessert — Gestion de stock</p>
          <p className="text-sm text-text-sub mt-1">Application web · Données stockées dans Supabase</p>
          <p className="text-sm text-text-sub mt-1">React · TypeScript · Zustand · Tailwind CSS</p>
        </div>
      </section>
    </div>
  )
}
