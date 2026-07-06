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

// Détecte et extrait la quantité + unité depuis un texte (ticket ou facture)
function extractQteUnite(text: string): { quantite: number; unite: Unite; reste: string } {
  // Supporte: 1.5KG, 500G, 397GRS, 1,5L, 33CL, 75CL, 1L, 25ML, 1.65KG
  const reg = /(\d+(?:[.,]\d+)?)\s*(kg\b|grs?\b|gr\b|g\b|litres?|l\b|ml\b|cl\b)/i
  const m = text.match(reg)
  if (!m) return { quantite: 1, unite: 'UNITE', reste: text }

  const qty = parseFloat(m[1].replace(',', '.'))
  const u = m[2].toLowerCase()
  let unite: Unite = 'UNITE'
  let quantite = qty

  if (u === 'kg') unite = 'KG'
  else if (u === 'g' || u === 'gr' || u.startsWith('grs')) unite = 'G'
  else if (u === 'l' || u.startsWith('litre')) unite = 'L'
  else if (u === 'ml') unite = 'ML'
  else if (u === 'cl') { unite = 'ML'; quantite = qty * 10 }

  const reste = text.replace(m[0], '').trim()
  return { quantite, unite, reste }
}

// ── Normalisation OCR ────────────────────────────────────────────────────────
// Supprime accents, met en minuscules, vire ponctuation → comparaison robuste
function norm(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Distance de Levenshtein (pour détecter les fautes OCR à 1-2 chars)
function lev(a: string, b: string): number {
  const m = a.length, n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1])
  return d[m][n]
}

// ── Dictionnaire tickets par enseigne ────────────────────────────────────────
// Clé : texte normalisé (sans accent, minuscule) tel qu'il apparaît sur le ticket
// Valeur : nom canonique de la matière première dans le stock
//
// Metro Cash & Carry : noms tronqués ~25 chars, MAJUSCULES, pas d'accents
// Lidl / Carrefour   : noms plus complets mais accent souvent manquant
// OCR Tesseract      : confond ê/e, é/e, ç/c, û/u, à/a, œ/oe, supprime tirets
const TICKET_DICT: Record<string, string> = {
  // ── Farines & féculents ──────────────────────────────────────────────────
  'farine t55': 'Farine T55', 'farine t 55': 'Farine T55', 'farn t55': 'Farine T55',
  'riz rond': 'Riz rond (dessert)', 'riz dessert': 'Riz rond (dessert)',
  'pate kadaif': 'Pâte kadaïf', 'kadaif': 'Pâte kadaïf', 'kadaiff': 'Pâte kadaïf',
  'perles tapioca': 'Perles de tapioca', 'tapioca': 'Perles de tapioca',
  // ── Sucres ───────────────────────────────────────────────────────────────
  'sucre poudre': 'Sucre en poudre', 'sucre en poud': 'Sucre en poudre',
  'sucre perle': 'Sucre perlé', 'sucre glace': 'Sucre glace',
  'sucre roux': 'Sucre roux', 'sucre brun': 'Sucre roux',
  'glucose sirop': 'Glucose (sirop)', 'glucose': 'Glucose (sirop)',
  // ── Levures & poudres ────────────────────────────────────────────────────
  'levure boulan': 'Levure boulangère', 'levure boulangere': 'Levure boulangère',
  'levure chimiq': 'Levure chimique', 'levure chim': 'Levure chimique',
  'bicarbonate': 'Bicarbonate de soude', 'bicarbonate soude': 'Bicarbonate de soude',
  'agar agar': 'Agar-agar', 'agaragar': 'Agar-agar',
  'pectine': 'Pectine (NH)', 'pectine nh': 'Pectine (NH)',
  'colorant rouge': 'Colorant rouge',
  // ── Épices & arômes ──────────────────────────────────────────────────────
  'cannelle': 'Cannelle poudre', 'canelle': 'Cannelle poudre', 'kanelle': 'Cannelle poudre',
  'vanille extrait': 'Vanille (extrait)', 'extrait vanille': 'Vanille (extrait)',
  'vanille': 'Vanille (extrait)',
  // ── Matières grasses ─────────────────────────────────────────────────────
  'beurre doux': 'Beurre doux', 'beurr doux': 'Beurre doux', 'beurre': 'Beurre doux',
  'huile vegetale': 'Huile végétale', 'huile veg': 'Huile végétale',
  // ── Produits laitiers ────────────────────────────────────────────────────
  'lait entier': 'Lait entier', 'lait ent': 'Lait entier',
  'creme liquide': 'Crème liquide 30%', 'creme liq': 'Crème liquide 30%',
  'creme 30': 'Crème liquide 30%', 'creme fleurette': 'Crème liquide 30%',
  'mascarpone': 'Mascarpone', 'mascarpon': 'Mascarpone', 'mascarpone it': 'Mascarpone',
  'cream cheese': 'Cream cheese', 'creamcheese': 'Cream cheese',
  'fromage blanc': 'Fromage blanc', 'frge blanc': 'Fromage blanc',
  'chantilly': 'Chantilly (bombe)', 'chantill': 'Chantilly (bombe)',
  'lait amande': "Lait d'amande", 'lait avoine': "Lait d'avoine",
  'lait coco': 'Lait de coco',
  // ── Œufs ─────────────────────────────────────────────────────────────────
  'oeufs entiers': 'Œufs entiers', 'oeufs': 'Œufs entiers', 'oeuf': 'Œufs entiers',
  'oefs': 'Œufs entiers', 'ufs': 'Œufs entiers',
  'blancs oeufs': "Blancs d'œufs pasteurisés", 'blanc oeuf': "Blancs d'œufs pasteurisés",
  'jaunes oeufs': "Jaunes d'œufs pasteurisés", 'jaune oeuf': "Jaunes d'œufs pasteurisés",
  // ── Gélatine ─────────────────────────────────────────────────────────────
  'gelatine poisson': 'Gélatine de poisson (feuilles)', 'gelatine poiss': 'Gélatine de poisson (feuilles)',
  'feuilles gelatine': 'Gélatine de poisson (feuilles)', 'gelatine': 'Gélatine de poisson (feuilles)',
  // ── Chocolats ────────────────────────────────────────────────────────────
  'chocolat noir': 'Chocolat noir 70%', 'choco noir': 'Chocolat noir 70%',
  'chocolat noir 70': 'Chocolat noir 70%', 'couverture noire': 'Chocolat noir 70%',
  'chocolat lait': 'Chocolat au lait', 'choco lait': 'Chocolat au lait',
  'chocolat blanc': 'Chocolat blanc', 'choco blanc': 'Chocolat blanc',
  'couverture blanc': 'Couverture blanche', 'couv blanche': 'Couverture blanche',
  'poudre cacao': 'Poudre de cacao', 'cacao': 'Poudre de cacao',
  'pepites chocolat': 'Pépites de chocolat', 'pepites choco': 'Pépites de chocolat',
  'chips chocolat': 'Pépites de chocolat',
  'sauce chocolat': 'Sauce chocolat', 'sauce choco': 'Sauce chocolat',
  'sauce caramel': 'Sauce caramel',
  // ── Pâtes à tartiner & confitures ────────────────────────────────────────
  'nutella': 'Nutella', 'nutela': 'Nutella', 'nuttella': 'Nutella',
  'speculoos beurre': 'Speculoos beurre', 'speculo beurre': 'Speculoos beurre',
  'pate speculoos': 'Speculoos beurre', 'pate speculos': 'Speculoos beurre',
  'creme pistache': 'Crème pistache', 'pate pistache': 'Crème pistache',
  'caramel beurre sale': 'Caramel beurre salé 2', 'caramel beurr sal': 'Caramel beurre salé 2',
  'cbs': 'Caramel beurre salé 2',
  'confiture fraise': 'Confiture fraise', 'conf fraise': 'Confiture fraise',
  'miel': 'Miel', 'miel toutes fleurs': 'Miel',
  'creme marrons': 'Crème de marrons', 'creme de marrons': 'Crème de marrons',
  'lait concentre sucre': 'Lait concentré sucré', 'lait concentre': 'Lait concentré sucré',
  'speculoos poudre': 'Spéculoos (poudre)', 'speculo poudre': 'Spéculoos (poudre)',
  // ── Fruits secs & noix ───────────────────────────────────────────────────
  'poudre amandes': "Poudre d'amandes", 'amandes poudre': "Poudre d'amandes",
  'poudre d amande': "Poudre d'amandes",
  'noix pecan': 'Noix de pécan', 'pecan': 'Noix de pécan',
  'pistaches concassees': 'Pistaches concassées', 'pistache concass': 'Pistaches concassées',
  'pistaches entieres': 'Pistaches entières', 'pistache entiere': 'Pistaches entières',
  'noisettes concassees': 'Noisettes concassées', 'noisette concass': 'Noisettes concassées',
  'amandes efilees': 'Amandes effilées', 'amandes effilees': 'Amandes effilées',
  'noix coco rapee': 'Noix de coco râpée', 'coco rapee': 'Noix de coco râpée',
  'coco rape': 'Noix de coco râpée',
  'dattes': 'Dattes',
  // ── Fruits frais & surgelés ──────────────────────────────────────────────
  'citron frais': 'Citron (frais)', 'citrons': 'Citron (frais)',
  'banane': 'Banane (fraîche)', 'bananes': 'Banane (fraîche)',
  'mangue surgelee': 'Mangue surgelée', 'mangue surgel': 'Mangue surgelée',
  'passion puree': 'Fruit de la passion (purée)', 'puree passion': 'Fruit de la passion (purée)',
  'fraises surgelees': 'Fraises surgelées', 'fraises surgel': 'Fraises surgelées',
  'fruits rouges surgeles': 'Fruits rouges surgelés', 'fruits rouges surgel': 'Fruits rouges surgelés',
  'framboises surgelees': 'Framboises surgelées', 'framboises surgel': 'Framboises surgelées',
  'myrtilles surgelees': 'Myrtilles surgelées', 'myrtilles surgel': 'Myrtilles surgelées',
  'menthe fraiche': 'Menthe fraîche', 'menthe': 'Menthe fraîche',
  // ── Biscuits & bases ─────────────────────────────────────────────────────
  'biscuit cuillere': 'Biscuit cuillere', 'biscuits cuillere': 'Biscuit cuillere',
  'boudoirs': 'Biscuit cuillere',
  'biscuits speculoos': 'Biscuits spéculoos concasse', 'speculoos concasse': 'Biscuits spéculoos concasse',
  'biscuits oreo': 'Biscuits Oréo', 'oreo': 'Biscuits Oréo',
  'brioche tranchee': 'Brioche tranchée', 'brioche': 'Brioche tranchée',
  // ── Cafés & boissons ─────────────────────────────────────────────────────
  'cafe grains': 'Café en grains', 'cafe en grains': 'Café en grains',
  'cafe moulu': 'Café moulu',
  'the noir sachets': 'Thé noir (sachets)', 'the noir': 'Thé noir (sachets)',
  'the vert sachets': 'Thé vert (sachets)', 'the vert': 'Thé vert (sachets)',
  'poudre matcha': 'Poudre de matcha', 'matcha': 'Poudre de matcha',
  'eau petillante': 'Eau pétillante', 'eau gazeuse': 'Eau pétillante',
  // ── Sirops Monin ─────────────────────────────────────────────────────────
  'sirop vanille': 'Sirop vanille (café)', 'monin vanille': 'Sirop vanille (café)',
  'sirop caramel': 'Sirop caramel (café)', 'monin caramel': 'Sirop caramel (café)',
  'sirop noisette': 'Sirop noisette (café)', 'monin noisette': 'Sirop noisette (café)',
  'sirop speculoos': 'Sirop spéculoos (Monin)', 'monin speculoos': 'Sirop spéculoos (Monin)',
  'sirop litchi': 'Sirop litchi (Monin)', 'monin litchi': 'Sirop litchi (Monin)',
  'sirop rose': 'Sirop rose (Monin)', 'sirop framboise': 'Sirop framboise (Monin)',
  'sirop peche': 'Sirop pêche (Monin)', 'sirop mojito': 'Sirop mojito (Monin)',
  'sirop cola': 'Sirop cola (Monin)',
  // ── Erreurs OCR fréquentes (Tesseract sur tickets thermiques) ────────────
  'crapes': 'Crème liquide 30%',   // "CRAPES" → probablement "CRÈME" tronquée
  'creames': 'Crème liquide 30%',
  'mascarpon ': 'Mascarpone',
  'frge bl': 'Fromage blanc',
  'chantill ': 'Chantilly (bombe)',
  'canell ': 'Cannelle poudre',
  'speculo ': 'Spéculoos (poudre)',
  'nuttela': 'Nutella', 'nutel': 'Nutella',
  'couv noir': 'Chocolat noir 70%', 'couv lait': 'Chocolat au lait',
  'pist concass': 'Pistaches concassées', 'nois concass': 'Noisettes concassées',
  'amd efilees': 'Amandes effilées',
  'frse surgel': 'Fraises surgelées', 'frbs surgel': 'Framboises surgelées',
}

// Cherche la meilleure correspondance MP avec normalisation + Levenshtein
function findMatchingMP(nom: string, rawMPs: MatierePremiere[]): MatierePremiere | undefined {
  const n = norm(nom)

  // 1. Dictionnaire exact (ticket alias)
  const alias = TICKET_DICT[n]
  if (alias) {
    const found = rawMPs.find(m => norm(m.nom) === norm(alias))
    if (found) return found
  }

  // 2. Correspondance exacte normalisée
  const exact = rawMPs.find(m => norm(m.nom) === n)
  if (exact) return exact

  // 3. Correspondance par inclusion de tokens (2+ mots communs de ≥3 chars)
  const tokens = n.split(' ').filter(w => w.length >= 3)
  const scored = rawMPs.map(m => {
    const mt = norm(m.nom).split(' ').filter(w => w.length >= 3)
    const hits = tokens.filter(w =>
      mt.some(mw => mw === w || mw.includes(w) || w.includes(mw) || (w.length >= 5 && lev(w, mw) <= 1))
    ).length
    return { m, hits }
  }).filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits)

  if (scored[0]?.hits >= 2) return scored[0].m
  if (scored[0]?.hits >= 1 && tokens.length <= 2) return scored[0].m

  // 4. Levenshtein global sur nom court (≤12 chars)
  if (n.length <= 12) {
    const fuzzy = rawMPs
      .map(m => ({ m, d: lev(n, norm(m.nom)) }))
      .filter(x => x.d <= 2)
      .sort((a, b) => a.d - b.d)
    if (fuzzy[0]) return fuzzy[0].m
  }

  return undefined
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

// Lignes à ignorer systématiquement
const SKIP_RE = [
  /^(total\b|tva\b|net\s+à|ttc\b|remise\b|dont\b|sous[\s-]total|ticket\b|merci\b|bienvenu|caissier|magasin|adresse|date\b|heure\b|siret\b|tel\b|fax\b|www\.|http)/i,
  /^(avoir\b|bon\s+de|point|fidelité|n°\s+client|numéro\s+de|réf\.?\s|désignation\s|qté?\.?\s|unit\.\s|p\.u\.|mont\.?\s|livraison\b|ht\b|page\b|commande\b|client\b)/i,
  // Sous-lignes Metro Cash & Carry
  /^(mm\s+ean|article\s+de\s+l'article|prix\s+au\s+kg|n°\s*gtin|_best_before|offre\s+achetez|lot[_-]nr|lotid|bbd\b|ean\s+numéro)/i,
  /^\*{3}\s+/,                           // *** CATEGORY Total: X,XX
  /^\d{1,3}[.,]\d{2}\s*[€%]?\s*$/,      // prix seul
  /^[\s*\-=_]{3,}$/,                     // séparateurs
]

// Ligne trop bruitée (> 60% de tokens courts non-numériques et non-acronymes)
function isGarbled(line: string): boolean {
  const words = line.replace(/[;:|]/g, ' ').split(/\s+/).filter(w => w.length > 0)
  if (words.length < 4) return false
  const noise = words.filter(w => w.length <= 2 && !/^\d+$/.test(w) && !/^[A-Z]{1,2}$/.test(w)).length
  return noise / words.length > 0.6
}

// Pattern facture/fournisseur : "50/Paquet", "125/Pièces", "1/Litre" etc.
const PACK_REG = /(\d+(?:[.,]\d+)?)\s*\/\s*(paquet|pièces?|pcs?|litres?|kg\b|g\b|ml\b|cl\b)/i

// Extrait le nom produit d'une ligne de facture avec colonnes
function cleanInvoiceNom(raw: string): string {
  const parts = raw.split('|').map(p => p.trim()).filter(p => p.length > 1)
  const scored = parts.map(p => {
    const clean = p.replace(/^[A-Z0-9.]{3,12}\s*/i, '').trim()
    const score = clean.split(/\s+/).filter(w => /[a-zA-ZéàèêëîïôùûüœçÀÉÈÊÇÔÛ]{3,}/.test(w)).length * clean.length
    return { clean, score }
  })
  const best = scored.sort((a, b) => b.score - a.score)[0]
  const nom = best?.score > 0 ? best.clean : raw.replace(/\|/g, ' ')
  return nom
    .replace(/^[a-zéàè]{1,3}\s+/i, '')
    .replace(/^[-—\s]+|[-—\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Déduit les unités totales commandées depuis (total_montant / prix_unitaire)
// Utile pour les factures Metro où l'OCR fusionne les colonnes qté × colisage
function deduireQteMetro(tokens: number[], price: number): number {
  if (price <= 0) return 1
  for (const t of [...tokens].reverse()) {
    for (const cand of [t, t / 100]) {
      if (cand < price * 0.8 || cand > price * 200) continue
      const ratio = cand / price
      if (Math.abs(ratio - Math.round(ratio)) < 0.08 && Math.round(ratio) >= 1) {
        return Math.round(ratio)
      }
    }
  }
  return 1
}

function parseOCRText(text: string, rawMPs: MatierePremiere[]): ParsedLigne[] {
  const lines = text.split('\n').map(l => l.trim())
  const interim: { rawText: string; nom: string; quantite: number; unite: Unite; mpId: string; ignore: boolean }[] = []

  for (const line of lines) {
    if (line.length < 5) continue
    if (SKIP_RE.some(re => re.test(line))) continue
    if (isGarbled(line)) continue

    let nom = ''
    let quantite = 1
    let unite: Unite = 'UNITE'

    // Supprimer artefacts OCR en début de ligne (; : | .)
    const cleaned = line.replace(/^[;:|.\s]+/, '').trim()

    // ── Format Metro Cash & Carry : ligne commence par EAN 12-14 chiffres ──
    const eanMatch = cleaned.match(/^(\d{12,14})\s+(\d{4,8})\s+(.+)$/)
    if (eanMatch) {
      const rest = eanMatch[3].trim()
      // Prix unitaire = premier X,XXX (3 décimales — format Metro)
      const priceMatch = rest.match(/\b(\d+)[,.](\d{3})\b/)
      if (!priceMatch) continue
      const price = parseFloat(priceMatch[1] + '.' + priceMatch[2])
      const namePart = rest.substring(0, rest.indexOf(priceMatch[0])).trim()
      const afterPart = rest.substring(rest.indexOf(priceMatch[0]) + priceMatch[0].length)

      // Tokens numériques après le prix (Qté / Colisage / Montant / Code TVA)
      const numTokens = afterPart
        .replace(/\s+[A-Z]\s*$/, '')   // retire lettre finale (code TVA : B, D, P…)
        .split(/\s+/)
        .map(t => parseFloat(t.replace(',', '.')))
        .filter(n => !isNaN(n) && n > 0)

      const totalUnits = deduireQteMetro(numTokens, price)

      // Taille depuis le nom (ex: 750G, 33CL, 1KG, 1.65KG, 5L)
      const { quantite: sizeQte, unite: sizeUnite, reste: nomSans } = extractQteUnite(namePart)
      quantite = Math.max(1, totalUnits * (sizeUnite !== 'UNITE' ? sizeQte : 1))
      unite = sizeUnite !== 'UNITE' ? sizeUnite : 'UNITE'
      if (unite === 'UNITE') quantite = Math.max(1, totalUnits)

      nom = nomSans
        .replace(/\s*X\d+\s*/gi, ' ')  // retire X6, X2, X12…
        .replace(/\s{2,}/g, ' ')
        .trim()

    // ── Format facture fournisseur : N/Paquet, N/Pièces ──────────────────
    } else {
      const packMatch = cleaned.match(PACK_REG)
      if (packMatch) {
        const packSize = parseFloat(packMatch[1].replace(',', '.'))
        const packUnit = packMatch[2].toLowerCase()
        if (packUnit.startsWith('kg'))     unite = 'KG'
        else if (packUnit === 'g')         unite = 'G'
        else if (packUnit.startsWith('litre') || packUnit === 'l') unite = 'L'
        else if (packUnit === 'ml')        unite = 'ML'
        else if (packUnit === 'cl')        { unite = 'ML' }

        const beforePack = cleaned.substring(0, cleaned.indexOf(packMatch[0]))
        const qteMatch = beforePack.match(/(\d+)[,.](\d{2})\s*[|]?\s*$/)
                      ?? beforePack.match(/\b(\d+)[,.](\d{2})\b/)
        const orderedQte = qteMatch ? parseFloat(qteMatch[1] + '.' + qteMatch[2]) : 1
        let totalQte = packSize * orderedQte
        if (packUnit === 'cl') totalQte *= 10
        quantite = Math.max(1, Math.round(totalQte))
        const namePart = qteMatch
          ? beforePack.substring(0, beforePack.lastIndexOf(qteMatch[0]))
          : beforePack
        nom = cleanInvoiceNom(namePart)

      // ── Format ticket de caisse standard ─────────────────────────────
      } else {
        let raw2 = cleaned
        raw2 = raw2.replace(/\s+\d+[.,]\d{2}\s*[€A-Z]?\s*$/, '').trim()
        raw2 = raw2.replace(/^\d+\s*[x×]?\s+/, '').trim()
        raw2 = raw2.replace(/[|]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
        const { quantite: q, unite: u, reste } = extractQteUnite(raw2)
        quantite = q
        unite = u
        nom = reste.replace(/^[-*\s.]+|[-*\s.]+$/g, '').trim()
      }
    }

    if (nom.length < 3) continue

    // Correspondance intelligente : dictionnaire tickets + Levenshtein
    const best = findMatchingMP(nom, rawMPs)

    interim.push({ rawText: line, nom, quantite, unite, mpId: best?.id ?? '', ignore: false })
  }

  // ── Déduplication : fusionner les doublons (même nom + même unité) ────
  const dedupMap = new Map<string, typeof interim[0]>()
  for (const l of interim) {
    const key = l.nom.toLowerCase().trim() + '|' + l.unite
    const existing = dedupMap.get(key)
    if (existing) {
      existing.quantite += l.quantite
      if (existing.rawText.length < 120) existing.rawText += ' + ' + l.rawText
    } else {
      dedupMap.set(key, { ...l })
    }
  }

  return Array.from(dedupMap.values()).map((l, i) => ({ ...l, id: i }))
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
