import {
  LayoutDashboard, PlusSquare, Package, Cake,
  FileText, BookOpen, TrendingUp, Clock, Settings, ChefHat, ScanLine
} from 'lucide-react'

const nav = [
  { id: 'accueil',       label: 'Accueil',        icon: LayoutDashboard },
  { id: 'production',    label: 'Production',      icon: PlusSquare },
  { id: 'preparations',  label: 'Préparations',    icon: ChefHat },
  { id: 'stock-mp',      label: 'Stock MP',        icon: Package },
  { id: 'produits',      label: 'Produits finis',  icon: Cake },
  { id: 'commandes',     label: 'Commandes',       icon: FileText },
  { id: 'recettes',      label: 'Recettes',        icon: BookOpen },
  { id: 'rentabilite',   label: 'Rentabilité',     icon: TrendingUp },
  { id: 'historique',    label: 'Historique',      icon: Clock },
  { id: 'scanner',       label: 'Scanner ticket',  icon: ScanLine },
  { id: 'parametres',    label: 'Paramètres',      icon: Settings },
]

interface Props { current: string; onChange: (id: string) => void }

export default function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="hidden md:flex w-60 flex-col h-screen shrink-0" style={{ background: '#2B1A14' }}>
      <div className="relative px-5 py-5 border-b border-white/10 overflow-hidden">
        {/* Décoration haut */}
        <svg viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full opacity-25 pointer-events-none">
          <circle cx="210" cy="-10" r="55" stroke="#D97773" strokeWidth="1.5" />
          <circle cx="210" cy="-10" r="35" stroke="#C8953E" strokeWidth="1" />
          <circle cx="-10" cy="80" r="45" stroke="#D97773" strokeWidth="1" />
          <circle cx="160" cy="70" r="4" fill="#C8953E" />
          <circle cx="180" cy="55" r="2.5" fill="#D97773" />
          <circle cx="195" cy="65" r="2" fill="#C8953E" />
          <circle cx="30" cy="10" r="3" fill="#D97773" />
          <circle cx="15" cy="25" r="2" fill="#C8953E" />
        </svg>
        <p className="relative font-bold text-white text-lg leading-tight tracking-wide">Instant Dessert</p>
        <p className="relative text-white/50 text-xs mt-0.5">Gestion de stock</p>
      </div>
      <nav className="py-3">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors relative
                ${active
                  ? 'bg-white/10 text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-accent'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
            >
              <Icon size={17} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Décoration bas de sidebar */}
      <div className="relative flex-1 overflow-hidden opacity-30">
        <svg viewBox="0 0 240 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
          {/* Grands cercles concentriques */}
          <circle cx="210" cy="180" r="100" stroke="#D97773" strokeWidth="1.5" />
          <circle cx="210" cy="180" r="72" stroke="#D97773" strokeWidth="1" />
          <circle cx="210" cy="180" r="45" stroke="#C8953E" strokeWidth="1" />
          {/* Cercle gauche */}
          <circle cx="20" cy="150" r="35" stroke="#C8953E" strokeWidth="1.2" />
          <circle cx="20" cy="150" r="20" stroke="#C8953E" strokeWidth="0.8" />
          {/* Courbes ondulées */}
          <path d="M 0 90 Q 60 60 120 90 Q 180 120 240 90" stroke="#D97773" strokeWidth="1" fill="none" />
          <path d="M 0 108 Q 60 78 120 108 Q 180 138 240 108" stroke="#C8953E" strokeWidth="0.7" fill="none" />
          {/* Points éparpillés */}
          <circle cx="55" cy="170" r="3.5" fill="#C8953E" />
          <circle cx="85" cy="152" r="2.5" fill="#D97773" />
          <circle cx="40" cy="130" r="2" fill="#C8953E" />
          <circle cx="140" cy="50" r="3" fill="#D97773" />
          <circle cx="165" cy="30" r="2" fill="#C8953E" />
          <circle cx="115" cy="40" r="2.5" fill="#D97773" />
          <circle cx="180" cy="110" r="2" fill="#C8953E" />
          <circle cx="70" cy="60" r="2" fill="#D97773" />
          {/* Petits losanges */}
          <path d="M 100 170 L 106 176 L 100 182 L 94 176 Z" stroke="#D97773" strokeWidth="1" />
          <path d="M 155 130 L 159 134 L 155 138 L 151 134 Z" stroke="#C8953E" strokeWidth="1" />
        </svg>
      </div>
    </aside>
  )
}
