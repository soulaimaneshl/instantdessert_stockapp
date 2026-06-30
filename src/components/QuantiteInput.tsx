import { useState } from 'react'
import type { Unite } from '../types'

// Only G and ML benefit from a bigger-unit toggle (KG / L)
const ALT: Partial<Record<Unite, string>> = { G: 'kg', ML: 'L' }

interface Props {
  unite: Unite
  value: string
  onChange: (baseVal: string) => void  // always in the MP's stored unit
  placeholder?: string
  autoFocus?: boolean
  className?: string
  allowNegative?: boolean
}

export default function QuantiteInput({
  unite, value, onChange, placeholder, autoFocus, className, allowNegative
}: Props) {
  const altLabel = ALT[unite] // e.g. "kg" for G, "L" for ML — undefined if no conversion
  const [useAlt, setUseAlt] = useState(false)
  const [display, setDisplay] = useState(value)

  const baseFromDisplay = (v: string, alt: boolean): string => {
    if (!alt || v === '' || v === '-') return v
    const n = parseFloat(v)
    return isNaN(n) ? '' : (n * 1000).toString()
  }

  const handleChange = (v: string) => {
    setDisplay(v)
    onChange(baseFromDisplay(v, useAlt))
  }

  const toggleUnit = () => {
    const toAlt = !useAlt
    // Convert displayed value between units without changing the actual base value
    const n = parseFloat(display)
    if (!isNaN(n) && display !== '') {
      const converted = toAlt ? (n / 1000) : (n * 1000)
      // Round to avoid floating-point noise (e.g. 1.999999999 → 2)
      const clean = parseFloat(converted.toPrecision(10)).toString()
      setDisplay(clean)
    }
    setUseAlt(toAlt)
  }

  const currentUnitLabel = useAlt ? altLabel! : unite.toLowerCase()
  const defaultPlaceholder = useAlt
    ? `ex: 1.5 ${altLabel}`
    : `ex: ${unite === 'G' ? '500 g' : unite === 'ML' ? '250 mL' : '1'}`

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div className="relative flex-1">
        <input
          type="number"
          value={display}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder ?? defaultPlaceholder}
          autoFocus={autoFocus}
          min={allowNegative ? undefined : 0}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm pr-12 focus:outline-none focus:border-accent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-sub font-medium pointer-events-none">
          {currentUnitLabel}
        </span>
      </div>

      {altLabel && (
        <button
          type="button"
          onClick={toggleUnit}
          title={`Basculer en ${useAlt ? unite.toLowerCase() : altLabel}`}
          className={`shrink-0 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors
            ${useAlt
              ? 'bg-accent text-white border-accent'
              : 'border-border text-text-sub hover:border-accent hover:text-accent'}`}
        >
          {useAlt ? `→ ${unite.toLowerCase()}` : `→ ${altLabel}`}
        </button>
      )}
    </div>
  )
}
