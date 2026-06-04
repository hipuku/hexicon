import chroma from 'chroma-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColourMatch {
  name: string
  hex: string       // the named colour's exact hex
  distance: number  // CIEDE2000 ΔE
  label: string     // plain-English accuracy read
}

// How many distinct named colours exist within each ΔE band around the input.
// Low veryClose count = unambiguous naming. High count = disputed zone.
export interface ConfidenceBands {
  veryClose:   number  // ΔE < 3
  approximate: number  // ΔE 3–10
  distant:     number  // ΔE ≥ 10 (within CIE76 scan radius)
}

export interface ColourResult {
  inputHex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  isLight: boolean
  best: ColourMatch
  runners: ColourMatch[]  // next 4 closest
  confidence: ConfidenceBands
}

interface ColourEntry {
  hex: string
  name: string
  // Lab values precomputed at load time — no repeated conversions at query time
  L: number
  a: number
  b: number
}

// ─── Accuracy label ───────────────────────────────────────────────────────────

function accuracyLabel(distance: number): string {
  if (distance < 3)  return 'very close'
  if (distance < 10) return 'approximate'
  return 'rough match'
}

// ─── Lazy lookup table ────────────────────────────────────────────────────────

let _colourList: ColourEntry[] | null = null

async function getColourList(): Promise<ColourEntry[]> {
  if (_colourList) return _colourList
  const { default: colornames } = await import('./colornames.json')
  _colourList = Object.entries(colornames as Record<string, string>).reduce<ColourEntry[]>((acc, [hex, name]) => {
    try {
      const h = hex.length === 6 ? hex : hex.padStart(6, '0')
      const [L, a, b] = chroma(`#${h}`).lab()
      acc.push({ hex: `#${h}`, name, L, a, b })
    } catch { /* skip malformed */ }
    return acc
  }, [])
  return _colourList
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseHex(input: string): string | null {
  const m = input.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1]
  return `#${h.toUpperCase()}`
}

export function isValidHex(input: string): boolean {
  return parseHex(input) !== null
}

// ─── Core matching ────────────────────────────────────────────────────────────

// Two-stage search: CIE76 (fast Euclidean in Lab) narrows the 30k dataset to
// candidates within a generous radius; CIEDE2000 re-scores those candidates for
// accurate final distances. The wider CIE76 radius (vs the previous top-N heap)
// captures enough neighbours to compute meaningful confidence bands.
const CIE76_RADIUS = 28

async function findMatchesWithConfidence(hex: string, topCount = 5): Promise<{
  topMatches: ColourMatch[]
  confidence: ConfidenceBands
}> {
  const colourList = await getColourList()
  const [L1, a1, b1] = chroma(hex).lab()

  // Collect all candidates within the CIE76 radius
  const candidates: ColourEntry[] = []
  for (const entry of colourList) {
    const d = Math.sqrt(
      (L1 - entry.L) ** 2 + (a1 - entry.a) ** 2 + (b1 - entry.b) ** 2
    )
    if (d < CIE76_RADIUS) candidates.push(entry)
  }

  // CIEDE2000-score every candidate and sort
  const scored: ColourMatch[] = candidates
    .map(entry => {
      const distance = Math.round(chroma.deltaE(hex, entry.hex) * 10) / 10
      return { name: entry.name, hex: entry.hex, distance, label: accuracyLabel(distance) }
    })
    .sort((a, b) => a.distance - b.distance)

  const confidence: ConfidenceBands = {
    veryClose:   scored.filter(m => m.distance < 3).length,
    approximate: scored.filter(m => m.distance >= 3 && m.distance < 10).length,
    distant:     scored.filter(m => m.distance >= 10).length,
  }

  return { topMatches: scored.slice(0, topCount), confidence }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function nameColour(input: string): Promise<ColourResult | null> {
  const hex = parseHex(input)
  if (!hex) return null

  const colour = chroma(hex)
  const { topMatches, confidence } = await findMatchesWithConfidence(hex, 5)
  const [best, ...runners] = topMatches

  const hslRaw = colour.hsl()

  return {
    inputHex: hex,
    rgb: colour.rgb().map(Math.round) as [number, number, number],
    hsl: [
      Math.round(hslRaw[0]) || 0,
      Math.round(hslRaw[1] * 100),
      Math.round(hslRaw[2] * 100),
    ],
    isLight: colour.luminance() > 0.35,
    best,
    runners,
    confidence,
  }
}
