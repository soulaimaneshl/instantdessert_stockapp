import {
  LayoutDashboard, PlusSquare, Package, Cake,
  FileText, BookOpen, TrendingUp, Clock, Settings, ChefHat, ScanLine
} from 'lucide-react'

const nav = [
  { id: 'accueil',      label: 'Accueil',    icon: LayoutDashboard },
  { id: 'production',   label: 'Production', icon: PlusSquare },
  { id: 'preparations', label: 'Prépas',     icon: ChefHat },
  { id: 'commandes',    label: 'Commandes',  icon: FileText },
  { id: 'stock-mp',     label: 'Stock MP',   icon: Package },
  { id: 'produits',     label: 'Produits',   icon: Cake },
  { id: 'recettes',     label: 'Recettes',   icon: BookOpen },
  { id: 'rentabilite',  label: 'Rentabilité',icon: TrendingUp },
  { id: 'historique',   label: 'Historique', icon: Clock },
  { id: 'scanner',      label: 'Scanner',    icon: ScanLine },
  { id: 'parametres',   label: 'Paramètres', icon: Settings },
]

interface Props { current: string; onChange: (id: string) => void }

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/10"
      style={{ background: '#2B1A14' }}
    >
      <div className="flex overflow-x-auto scrollbar-hide">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 shrink-0 transition-colors min-w-[64px]
                ${active ? 'text-white' : 'text-white/45'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium leading-tight">{label}</span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: '#C8953E' }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
