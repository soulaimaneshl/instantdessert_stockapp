import { useState } from 'react'

const CODE = 'gegen92!'

export default function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [erreur, setErreur] = useState(false)
  const [shake, setShake] = useState(false)

  const tenter = () => {
    if (value === CODE) {
      sessionStorage.setItem('id_unlocked', '1')
      onUnlock()
    } else {
      setErreur(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
      {/* Décoration haut */}
      <svg className="absolute top-0 right-0 pointer-events-none opacity-20" width="300" height="300" viewBox="0 0 300 300" fill="none">
        <circle cx="300" cy="0" r="150" stroke="#C8953E" strokeWidth="1.5" />
        <circle cx="300" cy="0" r="100" stroke="#2B1A14" strokeWidth="1" />
        <circle cx="300" cy="0" r="55" stroke="#C8953E" strokeWidth="1" />
        <circle cx="220" cy="80" r="5" fill="#C8953E" />
        <circle cx="180" cy="40" r="3" fill="#2B1A14" />
      </svg>

      <div
        className="w-full max-w-xs flex flex-col items-center gap-6"
        style={shake ? { animation: 'shake 0.5s ease' } : {}}
      >
        {/* Logo */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: '#2B1A14' }}
          >
            <span className="text-2xl font-bold text-white">ID</span>
          </div>
          <h1 className="text-xl font-bold text-text-main">Instant Dessert</h1>
          <p className="text-sm text-text-sub mt-1">Gestion de stock</p>
        </div>

        {/* Carte */}
        <div className="w-full bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold text-text-main text-center">Code d'accès requis</p>

          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setErreur(false) }}
            onKeyDown={e => e.key === 'Enter' && tenter()}
            placeholder="••••••••"
            autoFocus
            className={`w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-medium outline-none transition-colors
              ${erreur ? 'border-danger bg-danger-light' : 'border-border focus:border-accent'}`}
          />

          {erreur && (
            <p className="text-danger text-xs text-center font-medium">Code incorrect, réessayez.</p>
          )}

          <button
            onClick={tenter}
            disabled={value.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: '#2B1A14' }}
          >
            Accéder
          </button>
        </div>
      </div>

      {/* Décoration bas */}
      <svg className="absolute bottom-0 left-0 pointer-events-none opacity-15" width="240" height="240" viewBox="0 0 240 240" fill="none">
        <circle cx="0" cy="240" r="140" stroke="#C8953E" strokeWidth="1.5" />
        <circle cx="0" cy="240" r="90" stroke="#2B1A14" strokeWidth="1" />
        <circle cx="80" cy="180" r="5" fill="#C8953E" />
        <circle cx="50" cy="200" r="3" fill="#2B1A14" />
      </svg>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
