import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import AccueilScreen from './screens/AccueilScreen'
import StockMPScreen from './screens/StockMPScreen'
import ProduitsFiniScreen from './screens/ProduitsFiniScreen'
import RecettesScreen from './screens/RecettesScreen'
import ProductionScreen from './screens/ProductionScreen'
import CommandesScreen from './screens/CommandesScreen'
import RentabiliteScreen from './screens/RentabiliteScreen'
import HistoriqueScreen from './screens/HistoriqueScreen'
import ParametresScreen from './screens/ParametresScreen'
import { useAppStore } from './store/useAppStore'

const screens: Record<string, React.ReactNode> = {
  accueil: <AccueilScreen />,
  'stock-mp': <StockMPScreen />,
  produits: <ProduitsFiniScreen />,
  recettes: <RecettesScreen />,
  production: <ProductionScreen />,
  commandes: <CommandesScreen />,
  rentabilite: <RentabiliteScreen />,
  historique: <HistoriqueScreen />,
  parametres: <ParametresScreen />,
}

export default function App() {
  const [page, setPage] = useState('accueil')
  const { loadAll, loading } = useAppStore()

  useEffect(() => { loadAll() }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-sub text-sm">Chargement des données…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar current={page} onChange={setPage} />
      <main className="flex-1 overflow-y-auto relative">
        {/* Fond décoratif — strictement derrière tout le contenu */}
        {/* Coin haut-droite */}
        <svg className="absolute pointer-events-none" style={{ opacity: 0.18, top: 0, right: 0, width: 480, height: 480, zIndex: 0 }} viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="480" cy="0" r="240" stroke="#C8953E" strokeWidth="2" />
          <circle cx="480" cy="0" r="180" stroke="#2B1A14" strokeWidth="1.5" />
          <circle cx="480" cy="0" r="120" stroke="#C8953E" strokeWidth="1.5" />
          <circle cx="480" cy="0" r="60" stroke="#2B1A14" strokeWidth="1" />
          <circle cx="400" cy="80" r="6" fill="#C8953E" />
          <circle cx="360" cy="40" r="4" fill="#2B1A14" />
          <circle cx="430" cy="130" r="3" fill="#C8953E" />
          <path d="M 310 10 L 319 22 L 310 34 L 301 22 Z" stroke="#C8953E" strokeWidth="1.5" />
          <path d="M 270 60 L 276 68 L 270 76 L 264 68 Z" stroke="#2B1A14" strokeWidth="1" />
        </svg>
        {/* Coin bas-droite */}
        <svg className="absolute pointer-events-none" style={{ opacity: 0.18, bottom: 0, right: 0, width: 380, height: 380, zIndex: 0 }} viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="380" cy="380" r="220" stroke="#C8953E" strokeWidth="2" />
          <circle cx="380" cy="380" r="160" stroke="#2B1A14" strokeWidth="1.5" />
          <circle cx="380" cy="380" r="100" stroke="#C8953E" strokeWidth="1.5" />
          <circle cx="280" cy="300" r="5" fill="#C8953E" />
          <circle cx="310" cy="270" r="4" fill="#2B1A14" />
          <circle cx="250" cy="330" r="3" fill="#C8953E" />
          <path d="M 220 250 L 227 260 L 220 270 L 213 260 Z" stroke="#C8953E" strokeWidth="1.5" />
        </svg>
        {/* Centre-droite */}
        <svg className="absolute pointer-events-none" style={{ opacity: 0.14, top: '30%', right: 20, width: 300, height: 300, zIndex: 0 }} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="150" cy="150" r="140" stroke="#C8953E" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="100" stroke="#2B1A14" strokeWidth="1.2" />
          <circle cx="150" cy="150" r="60" stroke="#C8953E" strokeWidth="1" />
          <circle cx="150" cy="150" r="25" stroke="#2B1A14" strokeWidth="0.8" />
          <circle cx="210" cy="90" r="5" fill="#C8953E" />
          <circle cx="100" cy="200" r="4" fill="#2B1A14" />
          <circle cx="230" cy="180" r="3" fill="#C8953E" />
          <path d="M 50 150 L 58 160 L 50 170 L 42 160 Z" stroke="#C8953E" strokeWidth="1.5" />
        </svg>
        {/* Haut-centre */}
        <svg className="absolute pointer-events-none" style={{ opacity: 0.12, top: 0, left: '38%', width: 260, height: 220, zIndex: 0 }} viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="130" cy="0" r="140" stroke="#2B1A14" strokeWidth="1.5" />
          <circle cx="130" cy="0" r="95" stroke="#C8953E" strokeWidth="1.2" />
          <circle cx="130" cy="0" r="55" stroke="#2B1A14" strokeWidth="1" />
          <circle cx="180" cy="60" r="4" fill="#C8953E" />
          <circle cx="80" cy="70" r="3" fill="#2B1A14" />
          <circle cx="210" cy="30" r="3" fill="#C8953E" />
          <path d="M 50 40 L 56 48 L 50 56 L 44 48 Z" stroke="#C8953E" strokeWidth="1.2" />
        </svg>
        {/* Bas-centre */}
        <svg className="absolute pointer-events-none" style={{ opacity: 0.15, bottom: 0, left: '25%', width: 360, height: 220, zIndex: 0 }} viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 80 Q 90 20 180 80 Q 270 140 360 80" stroke="#2B1A14" strokeWidth="1.5" fill="none" />
          <path d="M 0 110 Q 90 50 180 110 Q 270 170 360 110" stroke="#C8953E" strokeWidth="1.5" fill="none" />
          <path d="M 0 140 Q 90 80 180 140 Q 270 200 360 140" stroke="#2B1A14" strokeWidth="1" fill="none" />
          <circle cx="60" cy="190" r="5" fill="#C8953E" />
          <circle cx="180" cy="200" r="4" fill="#2B1A14" />
          <circle cx="300" cy="185" r="4" fill="#C8953E" />
          <circle cx="120" cy="175" r="3" fill="#2B1A14" />
          <path d="M 240 170 L 247 179 L 240 188 L 233 179 Z" stroke="#C8953E" strokeWidth="1.5" />
          <path d="M 80 160 L 85 167 L 80 174 L 75 167 Z" stroke="#2B1A14" strokeWidth="1" />
        </svg>
        <div className="relative" style={{ zIndex: 1 }}>{screens[page]}</div>
      </main>
    </div>
  )
}
