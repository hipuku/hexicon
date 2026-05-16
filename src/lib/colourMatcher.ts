import chroma from 'chroma-js'
import colornames from './colornames.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColourMatch {
  name: string
  hex: string       // the named colour's exact hex
  distance: number  // CIEDE2000 ΔE
  label: string     // plain-English accuracy read
}

export interface ColourResult {
  inputHex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  isLight: boolean
  best: ColourMatch
  runners: ColourMatch[]  // next 4 closest
}

interface ColourEntry {
  hex: string
  name: string
  // Lab values precomputed at module load — no repeated conversions at query time
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

// ─── Lookup table — precomputed at module load ────────────────────────────────

const COLOUR_LIST: ColourEntry[] = Object.entries(
  colornames as Record<string, string>
).map(([hex, name]) => {
  const h = hex.length === 6 ? hex : hex.padStart(6, '0')
  const [L, a, b] = chroma(`#${h}`).lab()
  return { hex: `#${h}`, name, L, a, b }
})

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

// Uses CIE76 (Euclidean in Lab) for the initial scan across 30k entries —
// fast enough for real-time use. Top-5 candidates are then re-ranked with
// CIEDE2000 via chroma.deltaE() for accurate final distances.
function findTopMatches(hex: string, count = 5): ColourMatch[] {
  const [L1, a1, b1] = chroma(hex).lab()

  // Collect top candidates by CIE76 first
  const heap: { entry: ColourEntry; dist76: number }[] = []
  let worstInHeap = Infinity

  for (const entry of COLOUR_LIST) {
    const d = Math.sqrt(
      (L1 - entry.L) ** 2 + (a1 - entry.a) ** 2 + (b1 - entry.b) ** 2
    )
    if (heap.length < count * 4) {
      heap.push({ entry, dist76: d })
      if (heap.length === count * 4) {
        worstInHeap = Math.max(...heap.map(h => h.dist76))
      }
    } else if (d < worstInHeap) {
      const idx = heap.findIndex(h => h.dist76 === worstInHeap)
      heap[idx] = { entry, dist76: d }
      worstInHeap = Math.max(...heap.map(h => h.dist76))
    }
  }

  // Re-rank with CIEDE2000 and return top `count`
  return heap
    .map(({ entry }) => {
      const distance = Math.round(chroma.deltaE(hex, entry.hex) * 10) / 10
      return {
        name: entry.name,
        hex: entry.hex,
        distance,
        label: accuracyLabel(distance),
      }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function nameColour(input: string): ColourResult | null {
  const hex = parseHex(input)
  if (!hex) return null

  const colour = chroma(hex)
  const [best, ...runners] = findTopMatches(hex, 5)

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
  }
}
