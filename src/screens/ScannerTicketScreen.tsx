import { useState, useRef, useCallback } from 'react'
import { ScanLine, Camera, Upload, Loader2, CheckCircle2, X, RefreshCw, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { MatierePremiere, Unite } from '../types'

const UNITES: Unite[] = ['KG', 'G', 'L', 'ML', 'UNITE']

type Step = 'upload' | 'processing' | 'review' | 'done'

interface ParsedLigne {
  id: number
  rawText: string
  nom: string
  quantite: number
  unite: Unite
  mpId: string
  ignore: boolean
}

// Détecte et extrait la quantité + unité d'un texte de ticket de caisse
function extractQteUnite(text: string): { quantite: number; unite: Unite; reste: string } {
  // Pattern: "1.5KG", "500G", "1,5L", "33CL", "75CL", "1L", "25ML"
  const reg = /(\d+(?:[.,]\d+)?)\s*(kg\b|g\b|litres?|l\b|ml\b|cl\b)/i
  const m = text.match(reg)
  if (!m) return { quantite: 1, unite: 'UNITE', reste: text }

  const qty = parseFloat(m[1].replace(',', '.'))
  const u = m[2].toLowerCase()
  let unite: Unite = 'UNITE'
  let quantite = qty

  if (u === 'kg') unite = 'KG'
  else if (u === 'g') unite = 'G'
  else if (u === 'l' || u.startsWith('litre')) unite = 'L'
  else if (u === 'ml') unite = 'ML'
  else if (u === 'cl') { unite = 'ML'; quantite = qty * 10 }

  const reste = text.replace(m[0], '').trim()
  return { quantite, unite, reste }
}

// Conversion d'unité lors de l'ajout au stock (ex: ticket KG → MP en G)
function convertQte(qte: number, from: Unite, to: Unite): number {
  if (from === to) return qte
  if (from === 'KG' && to === 'G') return qte * 1000
  if (from === 'G' && to === 'KG') return qte / 1000
  if (from === 'L' && to === 'ML') return qte * 1000
  if (from === 'ML' && to === 'L') return qte / 1000
  if (from === 'KG' && to === 'ML') return qte * 1000 * 1000 // incompatible, garder
  return qte
}

// Lignes à ignorer sur un ticket de caisse
const SKIP_RE = [
  /^(total|tva|net\s+à|ttc|remise|dont|sous[\s-]total|ticket|merci|bienvenu|caissier|magasin|adresse|date|heure|siret|tel|fax|www\.|http|n°|numéro|facture|avoir|bon|point|fidelité)/i,
  /^[\s*\-=_]{3,}$/,
  /^\d{4,}\s/, // code-barres ou article
  /^\d{1,3}[.,]\d{2}\s*[€%]?\s*$/, // juste un prix
]

function parseOCRText(text: string, rawMPs: MatierePremiere[]): ParsedLigne[] {
  const lines = text.split('\n').map(l => l.trim())
  const result: ParsedLigne[] = []
  let id = 0

  for (const line of lines) {
    if (line.length < 4) continue
    if (SKIP_RE.some(re => re.test(line))) continue

    // Enlever le prix en fin de ligne (ex: "1.89", "1,89 €", "1.89 A")
    let nom = line.replace(/\s+\d+[.,]\d{2}\s*[€A-Z]?\s*$/, '').trim()
    // Enlever un compteur en début "2 BEURRE..." ou "1× FARINE..."
    nom = nom.replace(/^\d+\s*[x×]?\s+/, '').trim()
    // Enlever les artefacts OCR courants
    nom = nom.replace(/[|_]{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim()

    const { quantite, unite, reste } = extractQteUnite(nom)
    nom = reste
      .replace(/\s{2,}/g, ' ')
      .replace(/^[-*\s.]+|[-*\s.]+$/g, '')
      .trim()

    if (nom.length < 3) continue

    // Correspondance floue avec les MPs existantes
    const nl = nom.toLowerCase()
    const mots = nl.split(/\s+/).filter(w => w.length >= 3)
    const best = rawMPs.find(m => {
      const ml = m.nom.toLowerCase()
      const motsMp = ml.split(/\s+/)
      return (
        ml === nl ||
        mots.some(w => ml.includes(w)) ||
        motsMp.some(w => w.length >= 4 && nl.includes(w))
      )
    })

    result.push({
      id: id++,
      rawText: line,
      nom,
      quantite,
      unite,
      mpId: best?.id ?? '',
      ignore: false,
    })
  }

  return result
}

export default function ScannerTicketScreen() {
  const { matieres, ajusterStock, saveMatiere } = useAppStore()
  const [step, setStep] = useState<Step>('upload')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [lignes, setLignes] = useState<ParsedLigne[]>([])
  const [nbAjoutes, setNbAjoutes] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const rawMPs = matieres.filter(m => !m.estPreparation)

  const handleFile = useCallback(async (file: File) => {
    setStep('processing')
    setProgress(0)
    setProgressLabel('Chargement…')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('fra', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'loading language traineddata') {
            setProgressLabel('Téléchargement de la langue française…')
            setProgress(10)
          } else if (m.status === 'initializing api') {
            setProgressLabel('Initialisation…')
            setProgress(30)
          } else if (m.status === 'recognizing text') {
            setProgressLabel('Lecture du ticket…')
            setProgress(40 + Math.round(m.progress * 60))
          }
        }
      })
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      const parsed = parseOCRText(text, rawMPs)
      setLignes(parsed)
      setStep('review')
    } catch {
      setStep('upload')
      alert("Erreur lors de l'analyse. Vérifiez que l'image est nette et bien éclairée.")
    }
  }, [rawMPs])

  const handleConfirm = async () => {
    const actifs = lignes.filter(l => !l.ignore && l.nom.trim())
    for (const l of actifs) {
      if (l.mpId) {
        // MP existante → ajouter au stock
        const mp = matieres.find(m => m.id === l.mpId)!
        const qte = convertQte(l.quantite, l.unite, mp.unite)
        await ajusterStock(l.mpId, qte, `Réappro ticket — ${l.nom}`)
      } else {
        // MP inexistante → créer puis ajouter au stock
        await saveMatiere({
          nom: l.nom.trim(),
          unite: l.unite,
          categorie: '',
          stockActuel: 0,
          seuilTampon: 1,
          prixAchat: 0,
          estPreparation: false,
        })
        // Récupère la MP fraîchement créée depuis le store
        const fresh = useAppStore.getState().matieres
        const newMP = fresh.find(m => m.nom === l.nom.trim())
        if (newMP) await ajusterStock(newMP.id, l.quantite, `Réappro ticket — ${l.nom}`)
      }
    }
    setNbAjoutes(actifs.length)
    setStep('done')
  }

  const reset = () => {
    setStep('upload')
    setProgress(0)
    setProgressLabel('')
    setLignes([])
    setNbAjoutes(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const updateLigne = (id: number, patch: Partial<ParsedLigne>) =>
    setLignes(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))

  const confirmeCount = lignes.filter(l => !l.ignore && l.nom.trim()).length
  const nouveauxCount = lignes.filter(l => !l.ignore && l.nom.trim() && !l.mpId).length

  // ─── Upload ───────────────────────────────────────────────────────────────
  if (step === 'upload') return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Scanner un ticket</h1>
        <p className="text-text-sub text-sm mt-1">
          Photographiez votre ticket de caisse pour mettre à jour le stock automatiquement.
        </p>
      </div>

      {/* Zone de dépôt */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-accent/40 p-10 flex flex-col items-center gap-5">
        <div className="w-16 h-16 bg-accent-light rounded-2xl flex items-center justify-center">
          <ScanLine size={32} className="text-accent" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-text-main">Photo de votre ticket de caisse</p>
          <p className="text-sm text-text-sub mt-1">Leclerc · Lidl · Metro · Aldi · Carrefour…</p>
          <p className="text-xs text-text-sub mt-0.5 opacity-80">Le texte doit être net et bien éclairé</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Bouton principal : caméra arrière sur mobile */}
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.setAttribute('capture', 'environment')
                fileRef.current.click()
              }
            }}
            className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-semibold text-sm">
            <Camera size={18} /> Prendre une photo
          </button>
          {/* Bouton secondaire : galerie */}
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.removeAttribute('capture')
                fileRef.current.click()
              }
            }}
            className="flex items-center justify-center gap-2 border border-border text-text-main px-5 py-3 rounded-xl font-medium text-sm">
            <Upload size={18} /> Choisir depuis la galerie
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <p className="text-xs text-text-sub text-center opacity-70">
          JPG · PNG · HEIC — Analyse par OCR (Tesseract, aucun envoi de données)
        </p>
      </div>

      {/* Conseils */}
      <div className="bg-accent-light rounded-xl p-4 flex flex-col gap-2">
        <p className="font-medium text-accent text-sm">Conseils pour un meilleur résultat</p>
        <ul className="text-sm text-text-sub flex flex-col gap-1">
          <li>• Photographiez à plat, sans pli ni froissure</li>
          <li>• Bon éclairage uniforme (pas de flash direct)</li>
          <li>• Cadrez bien tout le ticket, sans découper de lignes</li>
          <li>• Vous pourrez corriger les articles détectés avant validation</li>
        </ul>
      </div>
    </div>
  )

  // ─── Processing ───────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <div className="p-4 flex flex-col items-center justify-center gap-6 min-h-[70vh]">
      <div className="w-20 h-20 bg-accent-light rounded-2xl flex items-center justify-center">
        <Loader2 size={40} className="text-accent animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-text-main text-lg">Analyse en cours…</p>
        <p className="text-text-sub text-sm mt-1">{progressLabel || 'Initialisation…'}</p>
      </div>
      <div className="w-64 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="bg-accent h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-accent font-bold text-lg">{progress}%</p>
      <p className="text-xs text-text-sub text-center max-w-xs opacity-70">
        Le premier lancement télécharge les données de langue française (~10 Mo). Les fois suivantes, c'est instantané.
      </p>
    </div>
  )

  // ─── Review ───────────────────────────────────────────────────────────────
  if (step === 'review') return (
    <div className="p-4 md:p-8 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Vérifier les articles</h1>
        <p className="text-text-sub text-sm mt-1 flex flex-wrap gap-x-2">
          <span>{lignes.length} ligne(s) détectée(s)</span>
          <span className="text-accent font-semibold">· {confirmeCount} à valider</span>
          {nouveauxCount > 0 && <span className="text-success font-semibold">· {nouveauxCount} nouvelle(s) MP</span>}
        </p>
      </div>

      {lignes.length === 0 ? (
        <div className="bg-warning-light rounded-xl p-6 text-center flex flex-col items-center gap-3">
          <p className="font-semibold text-warning text-lg">Aucun article détecté</p>
          <p className="text-sm text-text-sub">L'image est peut-être floue, trop sombre, ou le format de ticket n'est pas reconnu.</p>
          <button onClick={reset} className="bg-accent text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
            <RefreshCw size={15} /> Réessayer avec une autre photo
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 pb-28">
            {lignes.map(l => {
              const mp = rawMPs.find(m => m.id === l.mpId)
              const stockApres = mp ? (mp.stockActuel + convertQte(l.quantite, l.unite, mp.unite)) : null
              return (
                <div key={l.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-opacity ${l.ignore ? 'opacity-35' : 'border-border'}`}>
                  {/* En-tête: texte brut OCR + bouton ignorer */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-text-sub truncate flex-1 font-mono">{l.rawText}</p>
                    <button
                      onClick={() => updateLigne(l.id, { ignore: !l.ignore })}
                      title={l.ignore ? 'Réactiver' : 'Ignorer cette ligne'}
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${l.ignore ? 'bg-gray-100 text-text-sub hover:bg-gray-200' : 'bg-danger-light text-danger hover:bg-danger/20'}`}>
                      <X size={13} />
                    </button>
                  </div>

                  {!l.ignore && (
                    <>
                      {/* Nom du produit (modifiable) */}
                      <input
                        value={l.nom}
                        onChange={e => updateLigne(l.id, { nom: e.target.value })}
                        className="font-semibold text-text-main border-b border-border focus:border-accent focus:outline-none bg-transparent w-full py-0.5"
                        placeholder="Nom du produit"
                      />

                      {/* Quantité + unité + correspondance MP */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          type="number" min="0" step="any"
                          value={l.quantite}
                          onChange={e => updateLigne(l.id, { quantite: +e.target.value || 0 })}
                          className="w-20 border border-border rounded-lg px-2 py-1.5 text-sm text-center font-semibold"
                        />
                        <div className="relative">
                          <select
                            value={l.unite}
                            onChange={e => updateLigne(l.id, { unite: e.target.value as Unite })}
                            className="border border-border rounded-lg pl-2 pr-7 py-1.5 text-sm bg-white appearance-none font-medium">
                            {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" />
                        </div>
                        <span className="text-text-sub text-sm">→</span>
                        <div className="relative flex-1 min-w-[150px]">
                          <select
                            value={l.mpId}
                            onChange={e => updateLigne(l.id, { mpId: e.target.value })}
                            className={`w-full border rounded-lg pl-2 pr-7 py-1.5 text-sm bg-white appearance-none ${
                              l.mpId ? 'border-border' : 'border-success bg-success-light text-success font-medium'
                            }`}>
                            <option value="">✦ Nouvelle MP (créer)</option>
                            {rawMPs.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.nom} ({m.unite.toLowerCase()})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" />
                        </div>
                      </div>

                      {/* Aperçu */}
                      {mp && stockApres !== null ? (
                        <p className="text-xs font-medium text-success">
                          ✓ {mp.nom} : {mp.stockActuel} {mp.unite.toLowerCase()} → <strong>{stockApres.toFixed(1)} {mp.unite.toLowerCase()}</strong>
                          {l.unite !== mp.unite && (
                            <span className="text-text-sub font-normal ml-1">
                              ({l.quantite} {l.unite.toLowerCase()} converti)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-accent">
                          + Sera créée : <strong>"{l.nom}"</strong> · {l.quantite} {l.unite.toLowerCase()} · unité : {l.unite}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Actions flottantes */}
          <div className="fixed bottom-16 md:bottom-0 left-0 md:left-60 right-0 p-4 bg-bg border-t border-border flex gap-3">
            <button onClick={reset}
              className="border border-border text-text-sub px-4 py-3 rounded-xl font-medium flex items-center gap-2 text-sm shrink-0">
              <RefreshCw size={15} /> Recommencer
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmeCount === 0}
              className="flex-1 bg-accent text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
              <CheckCircle2 size={17} />
              Valider {confirmeCount} article{confirmeCount > 1 ? 's' : ''}
              {nouveauxCount > 0 && ` (${nouveauxCount} nouvelle${nouveauxCount > 1 ? 's' : ''})`}
            </button>
          </div>
        </>
      )}
    </div>
  )

  // ─── Done ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 flex flex-col items-center justify-center gap-6 min-h-[70vh]">
      <div className="w-20 h-20 bg-success-light rounded-2xl flex items-center justify-center">
        <CheckCircle2 size={40} className="text-success" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-text-main text-2xl">Stock mis à jour !</p>
        <p className="text-text-sub mt-2 text-lg">
          {nbAjoutes} matière{nbAjoutes > 1 ? 's premières' : ' première'} réapprovisionnée{nbAjoutes > 1 ? 's' : ''}
        </p>
      </div>
      <button onClick={reset}
        className="bg-accent text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
        <ScanLine size={18} /> Scanner un autre ticket
      </button>
    </div>
  )
}
