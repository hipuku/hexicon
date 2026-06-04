import chroma from 'chroma-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OklchPoint {
  hex: string
  L: number   // 0–1
  C: number   // 0–0.4
  H: number   // 0–360; NaN for achromatic colours (C < ACHROMATIC_THRESHOLD)
}

export interface LightnessUniformity {
  sortedHexes: string[]
  deltaLValues: number[]   // ΔL between consecutive colours sorted by L (×100 scale)
  stdDev: number
  rating: 'uniform' | 'moderate' | 'uneven'
}

export interface ChromaCoherence {
  mean: number    // mean C value
  stdDev: number
  rating: 'tight' | 'moderate' | 'wide'
}

export interface HueArc {
  totalAngle: number     // degrees of colour wheel covered (0 if achromatic)
  isMonotonic: boolean   // hues increase/decrease without backtracking
  hasAchromatic: boolean // palette contains neutral(s) with no meaningful hue
}

export interface NearIdenticalPair {
  a: string
  b: string
  de: number
}

export interface ContrastPair {
  a: string
  b: string
  ratio: number
  passAA:  boolean
  passAAA: boolean
}

export interface PaletteAnalysis {
  hexes:              string[]
  points:             OklchPoint[]
  lightnessUniformity: LightnessUniformity
  chromaCoherence:    ChromaCoherence
  hueArc:             HueArc
  nearIdentical:      NearIdenticalPair[]
  pairs:              ContrastPair[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Colours with chroma below this are treated as achromatic for hue calculations
const ACHROMATIC_THRESHOLD = 0.04

// Pairs within this ΔE are flagged as near-identical
const NEAR_IDENTICAL_DE = 2.5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
}

// Signed angular difference on a circle, shortest path
function angularDiff(from: number, to: number): number {
  let d = ((to - from) % 360 + 360) % 360
  if (d > 180) d -= 360
  return d
}

// ─── Lightness uniformity ─────────────────────────────────────────────────────

function analyseLightness(points: OklchPoint[]): LightnessUniformity {
  const sorted = [...points].sort((a, b) => a.L - b.L)
  const sortedHexes = sorted.map(p => p.hex)

  const deltaLValues: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    deltaLValues.push((sorted[i].L - sorted[i - 1].L) * 100)
  }

  const sd = stdDev(deltaLValues)
  const rating: LightnessUniformity['rating'] =
    sd < 5  ? 'uniform'  :
    sd < 12 ? 'moderate' : 'uneven'

  return { sortedHexes, deltaLValues, stdDev: sd, rating }
}

// ─── Chroma coherence ─────────────────────────────────────────────────────────

function analyseChroma(points: OklchPoint[]): ChromaCoherence {
  const cValues = points.map(p => p.C)
  const mean = cValues.reduce((s, v) => s + v, 0) / cValues.length
  const sd = stdDev(cValues)

  const rating: ChromaCoherence['rating'] =
    sd < 0.04 ? 'tight'    :
    sd < 0.10 ? 'moderate' : 'wide'

  return { mean, stdDev: sd, rating }
}

// ─── Hue arc ─────────────────────────────────────────────────────────────────

function analyseHueArc(points: OklchPoint[]): HueArc {
  const chromatic = points.filter(p => p.C >= ACHROMATIC_THRESHOLD && !isNaN(p.H))
  const hasAchromatic = chromatic.length < points.length

  if (chromatic.length < 2) {
    return { totalAngle: 0, isMonotonic: true, hasAchromatic }
  }

  // Find the largest gap in the circle of hues; the arc is its complement
  const hues = [...chromatic.map(p => p.H)].sort((a, b) => a - b)

  // Find the largest gap (including wrap-around) to determine arc span and start
  let maxGap = hues[0] + 360 - hues[hues.length - 1]
  let arcStartIdx = 0

  for (let i = 1; i < hues.length; i++) {
    const gap = hues[i] - hues[i - 1]
    if (gap > maxGap) {
      maxGap = gap
      arcStartIdx = i
    }
  }

  const totalAngle = Math.round(360 - maxGap)

  // Reorder starting from the hue right after the largest gap, then check
  // that all angular steps travel in the same direction (no backtracking).
  const reordered = [...hues.slice(arcStartIdx), ...hues.slice(0, arcStartIdx)]
  const steps = reordered.map((h, i) => i === 0 ? 0 : angularDiff(reordered[i - 1], h))
  const allSameSign = steps.slice(1).every(s => s >= 0) || steps.slice(1).every(s => s <= 0)

  return { totalAngle, isMonotonic: allSameSign, hasAchromatic }
}

// ─── Near-identical pairs ─────────────────────────────────────────────────────

function findNearIdentical(hexes: string[]): NearIdenticalPair[] {
  const pairs: NearIdenticalPair[] = []
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const de = chroma.deltaE(hexes[i], hexes[j])
      if (de < NEAR_IDENTICAL_DE) pairs.push({ a: hexes[i], b: hexes[j], de: Math.round(de * 10) / 10 })
    }
  }
  return pairs
}

// ─── Contrast pairs ───────────────────────────────────────────────────────────

function buildContrastPairs(hexes: string[]): ContrastPair[] {
  const pairs: ContrastPair[] = []
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const ratio = Math.round(chroma.contrast(hexes[i], hexes[j]) * 10) / 10
      pairs.push({ a: hexes[i], b: hexes[j], ratio, passAA: ratio >= 4.5, passAAA: ratio >= 7 })
    }
  }
  return pairs
}

// ─── Format detection ─────────────────────────────────────────────────────────

export function detectFormat(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  if (/--[\w-]+\s*:/.test(t))         return 'CSS variables'
  if (/colors\s*:|theme\s*:/.test(t)) return 'Tailwind config'
  if (t.startsWith('{') || t.startsWith('[')) return 'JSON'
  return 'plain hex'
}

// ─── Hex extraction ───────────────────────────────────────────────────────────

export function extractHexes(input: string): string[] {
  const seen = new Set<string>()
  const results: string[] = []
  for (const m of input.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const raw  = m[1]
    const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
    const hex  = `#${full.toLowerCase()}`
    if (!seen.has(hex)) { seen.add(hex); results.push(hex) }
  }
  return results
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function analysePalette(hexes: string[]): PaletteAnalysis | null {
  if (hexes.length < 2) return null

  const points: OklchPoint[] = hexes.map(hex => {
    const [L, C, H] = chroma(hex).oklch()
    return { hex, L, C, H }
  })

  return {
    hexes,
    points,
    lightnessUniformity: analyseLightness(points),
    chromaCoherence:     analyseChroma(points),
    hueArc:              analyseHueArc(points),
    nearIdentical:       findNearIdentical(hexes),
    pairs:               buildContrastPairs(hexes),
  }
}
