import { useState, useMemo } from 'react'
import { compareColours, BAND_LABELS, type ColourComparison, type ComparisonPanel } from '@/lib/colourDifference'
import { parseHex, isValidHex } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'
import chroma from 'chroma-js'
import { ViewHeader } from '@kern/molecules/ViewHeader'

// ─── ΔE readout ───────────────────────────────────────────────────────────────

function DeltaEReadout({ comparison }: { comparison: ColourComparison }) {
  const { deltaE, band } = comparison
  const { label, description, colour } = BAND_LABELS[band]

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-void-30 bg-void-20">
      <span className="type-annotation-sc text-void-60">CIEDE2000 difference</span>
      <div className="flex items-baseline gap-3">
        <span className="type-display font-mono">ΔE {deltaE}</span>
        <span className={cn('type-p-sm font-medium', colour)}>{label}</span>
      </div>
      <p className="type-p-sm text-void-60">{description}</p>
    </div>
  )
}

// ─── Comparison panel ─────────────────────────────────────────────────────────

function Panel({ hexA, hexB, panel }: {
  hexA:  string
  hexB:  string
  panel: ComparisonPanel
}) {
  const { background, label, description, deA, deB } = panel
  const isOnDark = chroma(background).luminance() < 0.18

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="type-annotation-sc text-void-50">{label}</span>
      </div>

      {/* Swatch pair on background */}
      <div
        className="relative flex items-center justify-center gap-6 rounded-xl h-36 border border-white/5"
        style={{ backgroundColor: background }}
      >
        {/* A swatch */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-lg border border-white/10 shadow-md" style={{ backgroundColor: hexA }} />
          <span className={cn('type-annotation font-mono', isOnDark ? 'text-white/40' : 'text-black/40')}>A</span>
        </div>
        {/* B swatch */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-lg border border-white/10 shadow-md" style={{ backgroundColor: hexB }} />
          <span className={cn('type-annotation font-mono', isOnDark ? 'text-white/40' : 'text-black/40')}>B</span>
        </div>
      </div>

      {/* ΔE measurements */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-void-20 border border-void-30">
          <span className="type-annotation text-void-40">ΔE(A, bg)</span>
          <span className="type-p-sm font-mono text-void-80">{deA}</span>
        </div>
        <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-void-20 border border-void-30">
          <span className="type-annotation text-void-40">ΔE(B, bg)</span>
          <span className="type-p-sm font-mono text-void-80">{deB}</span>
        </div>
      </div>

      <p className="type-annotation text-void-50">{description}</p>
    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function ViewDifference() {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')

  const hexA = isValidHex(inputA) ? parseHex(inputA) : null
  const hexB = isValidHex(inputB) ? parseHex(inputB) : null

  const comparison: ColourComparison | null = useMemo(() => {
    if (!hexA || !hexB) return null
    return compareColours(hexA, hexB)
  }, [hexA, hexB])

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">

      <ViewHeader
        title="Compare two colours"
        description="Measures the perceptual distance between two colours using CIEDE2000, then shows how that perceived difference changes when background context shifts — the crispening effect."
      />

      {/* ── Inputs ── */}
      <div className="grid grid-cols-2 gap-4">
        <HexInput id="hex-a" label="Colour A" value={inputA} onChange={setInputA} placeholder="#A1B2C3" autoFocus />
        <HexInput id="hex-b" label="Colour B" value={inputB} onChange={setInputB} placeholder="#D4E5F6" />
      </div>

      {/* ── Colour pair preview ── */}
      {hexA && hexB && (
        <div className="flex rounded-xl overflow-hidden h-16 border border-void-20">
          <div className="flex-1" style={{ backgroundColor: hexA }} title={hexA} />
          <div className="flex-1" style={{ backgroundColor: hexB }} title={hexB} />
        </div>
      )}

      {/* ── ΔE readout ── */}
      {comparison && <DeltaEReadout comparison={comparison} />}

      {/* ── Three comparison panels ── */}
      {comparison && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="type-annotation-sc text-void-60">Crispening effect</p>
            <p className="type-p-sm text-void-60">
              The same two colours look different depending on what surrounds them. When a background is close to one colour, that colour recedes and the other appears to advance — the <span className="text-void-80">crispening effect</span>. The ΔE numbers below each panel show how close each colour is to its background.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {comparison.panels.map(panel => (
              <Panel key={panel.label} hexA={comparison.a} hexB={comparison.b} panel={panel} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
