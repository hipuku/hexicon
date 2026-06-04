import chroma from 'chroma-js'
import type { StatusChipColour } from '@kern/atoms/StatusChip'

// ─── Types ────────────────────────────────────────────────────────────────────

// Named ΔE threshold bands from CIEDE2000 literature.
// Source: Sharma et al. (2005), "The CIEDE2000 Color-Difference Formula"
export type DeltaEBand =
  | 'imperceptible'  // ΔE < 1   — below JND for average observer
  | 'jnd'            // ΔE 1–2   — just-noticeable difference threshold
  | 'noticeable'     // ΔE 2–10  — clearly different, same colour family
  | 'distinct'       // ΔE 10–50 — perceptually distinct colours
  | 'different'      // ΔE ≥ 50  — categorically different

export interface ComparisonPanel {
  background:  string   // hex
  label:       string
  description: string   // explains why this background was chosen
  deA:         number   // CIEDE2000 ΔE(A, background)
  deB:         number   // CIEDE2000 ΔE(B, background)
}

export interface ColourComparison {
  a:       string
  b:       string
  deltaE:  number
  band:    DeltaEBand
  panels:  ComparisonPanel[]
}

// ─── Band classification ──────────────────────────────────────────────────────

export function classifyDeltaE(de: number): DeltaEBand {
  if (de < 1)  return 'imperceptible'
  if (de < 2)  return 'jnd'
  if (de < 10) return 'noticeable'
  if (de < 50) return 'distinct'
  return 'different'
}

export const BAND_LABELS: Record<DeltaEBand, { label: string; description: string; colour: StatusChipColour }> = {
  imperceptible: {
    label:       'Imperceptible',
    description: 'Below the just-noticeable difference for the average observer.',
    colour:      'neutral',
  },
  jnd: {
    label:       'Just noticeable',
    description: 'At the JND threshold. Visible under controlled conditions, easy to miss in context.',
    colour:      'orbit',
  },
  noticeable: {
    label:       'Noticeable',
    description: 'Clearly different colours, likely within the same perceptual category.',
    colour:      'supernova',
  },
  distinct: {
    label:       'Distinct',
    description: 'Perceptually distinct. Likely perceived as different colour categories.',
    colour:      'pulsar',
  },
  different: {
    label:       'Categorically different',
    description: 'Far apart in colour space. Categorically different to any observer.',
    colour:      'nebula',
  },
}

// ─── Background generation ───────────────────────────────────────────────────

// Generates a background similar to the given hex in hue and lightness,
// at moderate chroma — close enough to trigger crispening for that colour.
function nearBackground(hex: string): string {
  try {
    const [L, C, H] = chroma(hex).oklch()
    // Push lightness toward the mid range so the background is usable
    const bgL = Math.max(0.28, Math.min(0.72, L))
    // Half the source chroma — related but not identical
    const bgC = Math.max(0.06, Math.min(C * 0.55, 0.18))
    return chroma.oklch(bgL, bgC, isNaN(H) ? 0 : H).hex()
  } catch {
    return '#737375'
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const NEUTRAL_BG = '#56565A'

export function compareColours(hexA: string, hexB: string): ColourComparison {
  const deltaE = Math.round(chroma.deltaE(hexA, hexB) * 10) / 10
  const band   = classifyDeltaE(deltaE)

  const bgA = nearBackground(hexA)
  const bgB = nearBackground(hexB)

  const de = (a: string, b: string) => Math.round(chroma.deltaE(a, b) * 10) / 10

  const panels: ComparisonPanel[] = [
    {
      background:  NEUTRAL_BG,
      label:       'Neutral',
      description: 'Achromatic mid-grey. No hue push from the surround.',
      deA:         de(hexA, NEUTRAL_BG),
      deB:         de(hexB, NEUTRAL_BG),
    },
    {
      background:  bgA,
      label:       'Close to A',
      description: 'Background shares A\'s hue and lightness. Crispening amplifies perceived differences near B.',
      deA:         de(hexA, bgA),
      deB:         de(hexB, bgA),
    },
    {
      background:  bgB,
      label:       'Close to B',
      description: 'Background shares B\'s hue and lightness. Crispening amplifies perceived differences near A.',
      deA:         de(hexA, bgB),
      deB:         de(hexB, bgB),
    },
  ]

  return { a: hexA, b: hexB, deltaE, band, panels }
}
