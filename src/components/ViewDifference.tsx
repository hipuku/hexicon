import { useState, useMemo } from 'react'
import { compareColours, BAND_LABELS, type ColourComparison, type ComparisonPanel } from '@/lib/colourDifference'
import { parseHex, isValidHex } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'
import chroma from 'chroma-js'
import { StatCard } from '@kern/molecules/StatCard'
import { CalloutCard } from '@kern/molecules/CalloutCard'
import { ViewContainer } from '@kern/templates/ViewContainer'
import { ToolView } from '@kern/organisms/ToolView'

// ─── Comparison panel ─────────────────────────────────────────────────────────

function Panel({ hexA, hexB, panel }: {
  hexA:  string
  hexB:  string
  panel: ComparisonPanel
}) {
  const { background, label, description, deA, deB } = panel
  const isOnDark = chroma(background).luminance() < 0.18

  return (
    <div className="flex flex-col gap-2">
      <h3 className="type-h6 text-void-70">{label}</h3>

      <div className="grid grid-cols-2 gap-3 items-stretch">

        {/* Col A: swatch pair on background */}
        <div
          className="flex items-center justify-center gap-4 rounded-xl border border-white/5 min-h-[120px]"
          style={{ backgroundColor: background }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg border border-white/10 shadow-md" style={{ backgroundColor: hexA }} />
            <span className={cn('type-annotation font-mono', isOnDark ? 'text-white/40' : 'text-black/40')}>A</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg border border-white/10 shadow-md" style={{ backgroundColor: hexB }} />
            <span className={cn('type-annotation font-mono', isOnDark ? 'text-white/40' : 'text-black/40')}>B</span>
          </div>
        </div>

        {/* Col B: ΔE cells + description */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-void-10 border border-void-20">
              <span className="type-annotation text-void-60">ΔE(A, bg)</span>
              <span className="type-annotation font-mono text-void-80">{deA}</span>
            </div>
            <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-void-10 border border-void-20">
              <span className="type-annotation text-void-60">ΔE(B, bg)</span>
              <span className="type-annotation font-mono text-void-80">{deB}</span>
            </div>
          </div>
          <CalloutCard colour="neutral">
            {description}
          </CalloutCard>
        </div>

      </div>
    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

const CRISPENING_COPY = 'When the background is close to one colour, that colour appears to recede while the other advances. The ΔE values show how close each colour sits to each background.'

export function ViewDifference() {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')

  const hexA = useMemo(() => isValidHex(inputA) ? parseHex(inputA) : null, [inputA])
  const hexB = useMemo(() => isValidHex(inputB) ? parseHex(inputB) : null, [inputB])

  const comparison: ColourComparison | null = useMemo(() => {
    if (!hexA || !hexB) return null
    return compareColours(hexA, hexB)
  }, [hexA, hexB])

  const bandInfo = comparison ? BAND_LABELS[comparison.band] : null

  return (
    <ViewContainer width="lg">
      <ToolView
        title="Compare two colours"
        description="Measures the perceptual distance between two colours using CIEDE2000, then shows how that perceived difference changes when background context shifts — the crispening effect."
        input={
          <div className="grid grid-cols-2 gap-4">
            <HexInput id="hex-a" label="Colour A" value={inputA} onChange={setInputA} placeholder="#A1B2C3" autoFocus />
            <HexInput id="hex-b" label="Colour B" value={inputB} onChange={setInputB} placeholder="#D4E5F6" />
          </div>
        }
      >

      {/* ── Colour pair preview ── */}
      {hexA && hexB && (
        <div className="flex rounded-xl overflow-hidden h-16 border border-void-20">
          <div className="flex-1" style={{ backgroundColor: hexA }} title={hexA} />
          <div className="flex-1" style={{ backgroundColor: hexB }} title={hexB} />
        </div>
      )}

      {comparison && bandInfo && (
        <>
          {/* ── CIEDE2000 + Crispening context row ── */}
          <div className="grid grid-cols-2 gap-4 items-stretch">
            <StatCard
              label="CIEDE2000 difference"
              value={`ΔE ${comparison.deltaE}`}
              badge={bandInfo.label}
              badgeColour={bandInfo.colour}
              sub={bandInfo.description}
            />
            <div className="rounded-xl px-4 py-3 bg-void-20 border border-void-30 flex flex-col gap-1">
              <p className="type-annotation-sc text-void-60">Crispening effect</p>
              <p className="type-annotation text-void-60">{CRISPENING_COPY}</p>
            </div>
          </div>

          {/* ── Three comparison panels ── */}
          {comparison.panels.map(panel => (
            <Panel key={panel.label} hexA={comparison.a} hexB={comparison.b} panel={panel} />
          ))}
        </>
      )}

      </ToolView>
    </ViewContainer>
  )
}
