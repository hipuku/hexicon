import chroma from 'chroma-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaletteScores {
  hexes:           string[]
  lightnessValues: number[]                        // oklch L ×100, one per hex
  spread:          number                          // avg pairwise oklab dist ×100
  lightnessRange:  number                          // oklch L range ×100
  contrastCoverage: number                         // % of pairs passing WCAG AA
  nearIdentical:   Array<{ a: string; b: string }> // pairs below perceptual threshold
  noMidtones:      boolean                         // wide range but gap in the middle
  pairs:           ContrastPair[]
}

export interface ContrastPair {
  a:        string
  b:        string
  ratio:    number
  passAA:   boolean
  passAAA:  boolean
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

// ─── Oklab perceptual distance ────────────────────────────────────────────────

function oklabDist(a: string, b: string): number {
  const [L1, a1, b1] = chroma(a).oklab()
  const [L2, a2, b2] = chroma(b).oklab()
  return Math.sqrt((L2 - L1) ** 2 + (a2 - a1) ** 2 + (b2 - b1) ** 2)
}

// Colours within this oklab distance are flagged as near-identical.
// 0.07 ≈ a just-noticeable difference under typical viewing conditions.
const NEAR_IDENTICAL = 0.07

// ─── Evaluator ────────────────────────────────────────────────────────────────

export function evaluatePalette(hexes: string[]): PaletteScores | null {
  if (hexes.length < 2) return null

  const lightnessValues = hexes.map(h => chroma(h).oklch()[0] * 100)

  const pairs: ContrastPair[] = []
  const distances: number[] = []
  const nearIdentical: Array<{ a: string; b: string }> = []

  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const ratio = chroma.contrast(hexes[i], hexes[j])
      const dist  = oklabDist(hexes[i], hexes[j])
      pairs.push({ a: hexes[i], b: hexes[j], ratio, passAA: ratio >= 4.5, passAAA: ratio >= 7 })
      distances.push(dist)
      if (dist < NEAR_IDENTICAL) nearIdentical.push({ a: hexes[i], b: hexes[j] })
    }
  }

  const spread          = (distances.reduce((s, v) => s + v, 0) / distances.length) * 100
  const contrastCoverage = (pairs.filter(p => p.passAA).length / pairs.length) * 100
  const lightnessRange  = Math.max(...lightnessValues) - Math.min(...lightnessValues)
  const noMidtones      = lightnessRange > 40 && !lightnessValues.some(l => l >= 30 && l <= 70)

  return { hexes, lightnessValues, spread, lightnessRange, contrastCoverage, nearIdentical, noMidtones, pairs }
}
