import { useState, useMemo } from 'react'
import { analysePalette, extractHexes, detectFormat, type PaletteAnalysis } from '@/lib/paletteAnalyser'
import { PolarPlot } from './PolarPlot'
import { cn } from '@/lib/utils'
import { StatCard } from '@kern/molecules/StatCard'
import { CalloutCard } from '@kern/molecules/CalloutCard'
import { StatusChip } from '@kern/atoms/StatusChip'
import { ViewHeader } from '@kern/molecules/ViewHeader'

// ─── Swatch strip ─────────────────────────────────────────────────────────────

function SwatchStrip({ hexes }: { hexes: string[] }) {
  return (
    <div className="flex h-12 rounded-xl overflow-hidden border border-void-20">
      {hexes.map(h => (
        <div key={h} className="flex-1" style={{ backgroundColor: h }} title={h.toUpperCase()} />
      ))}
    </div>
  )
}

// ─── Contrast matrix ──────────────────────────────────────────────────────────

function ContrastMatrix({ analysis }: { analysis: PaletteAnalysis }) {
  const { hexes, pairs } = analysis
  const getContrast = (a: string, b: string) =>
    pairs.find(p => (p.a === a && p.b === b) || (p.a === b && p.b === a))

  return (
    <div className="flex flex-col gap-3">
      <p className="type-annotation-sc text-void-60">Contrast matrix</p>
      <div className="overflow-x-auto">
        <table className="w-full type-annotation font-mono border-collapse">
          <thead>
            <tr>
              <th className="w-8" />
              {hexes.map(h => (
                <th key={h} className="pb-2 px-3">
                  <div className="w-6 h-6 rounded-sm border border-void-30 mx-auto" style={{ backgroundColor: h }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hexes.map((row, i) => (
              <tr key={row} className="hover:bg-void-20/50 transition-colors duration-150">
                <td className="pr-2">
                  <div className="w-6 h-6 rounded-sm border border-void-30" style={{ backgroundColor: row }} />
                </td>
                {hexes.map((col, j) => {
                  if (i === j) return <td key={col} className="px-3 py-2 text-center text-void-40 bg-void-10">—</td>
                  const pair = getContrast(row, col)
                  if (!pair) return <td key={col} />
                  return (
                    <td key={col} className={cn(
                      'px-3 py-2 text-center',
                      pair.passAAA
                        ? 'bg-nebula/10 text-nebula-light'
                        : pair.passAA
                          ? 'bg-supernova/10 text-supernova-light'
                          : 'bg-flare/10 text-flare-light'
                    )}>
                      {pair.ratio.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap type-annotation text-void-50">
          <StatusChip colour="nebula">AAA</StatusChip>
          <span>≥ 7:1</span>
          <StatusChip colour="supernova">AA</StatusChip>
          <span>≥ 4.5:1</span>
          <StatusChip colour="flare">fail</StatusChip>
        </div>
      </div>
    </div>
  )
}

// ─── Metric variant helpers ───────────────────────────────────────────────────

type MetricVariant = 'positive' | 'info' | 'warning' | 'neutral'

function ratingVariant(rating: string): MetricVariant {
  switch (rating) {
    case 'uniform': case 'tight':  return 'positive'
    case 'moderate':               return 'info'
    case 'uneven':  case 'wide':   return 'warning'
    default:                       return 'neutral'
  }
}

// ─── View ─────────────────────────────────────────────────────────────────────

const PLACEHOLDER = `/* paste CSS, JSON, Tailwind, or a plain list */
--color-background: #121213;
--color-foreground: #F1F1F4;
--color-primary: #7193ED;
--color-accent: #68D0CA;`

export function ViewStructure() {
  const [text, setText] = useState('')

  const hexes    = useMemo(() => extractHexes(text), [text])
  const analysis = useMemo(() => analysePalette(hexes), [hexes])
  const format   = useMemo(() => detectFormat(text), [text])
  const noHexes  = text.trim().length > 0 && hexes.length === 0

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">

      <ViewHeader
        title="Map a palette"
        description="Paste CSS variables, JSON, or plain hex codes. Colours are plotted in OKLCH colour space and analysed for perceptual structure."
      />

      {/* ── Input ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="palette-input" className="type-annotation-sc text-void-60">
            Palette input
          </label>
          <div className="flex items-center gap-2 type-annotation text-void-50">
            {format && <span>{format}</span>}
            {format && hexes.length > 0 && <span className="text-void-40">·</span>}
            {hexes.length > 0 && <span>{hexes.length} colour{hexes.length !== 1 ? 's' : ''} found</span>}
          </div>
        </div>
        <textarea
          id="palette-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          rows={8}
          className="type-code w-full bg-void-10 border border-void-20 focus:border-void-40 rounded-xl px-4 py-3 text-void-90 placeholder:text-void-40 outline-none resize-none transition-colors duration-150"
        />
      </div>

      {noHexes && (
        <p className="type-annotation text-void-50">No #hex codes found — ensure colour values are prefixed with #</p>
      )}
      {hexes.length === 1 && (
        <p className="type-annotation text-void-50">Add at least 2 colours to see analysis.</p>
      )}

      {hexes.length > 0 && <SwatchStrip hexes={hexes} />}

      {analysis && (
        <>
          {/* ── Row 1: Polar plot, full width ── */}
          <div className="rounded-xl border border-void-20 bg-void-10 p-4 flex flex-col gap-3">
            <p className="type-annotation-sc text-void-60">Hue arc</p>
            <div className="flex justify-center">
              <PolarPlot points={analysis.points} size={320} />
            </div>
          </div>

          {/* ── Row 2: Three metric cards ── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Lightness uniformity"
              value={`σ ${analysis.lightnessUniformity.stdDev.toFixed(1)}`}
              sub="Std dev of lightness steps. Lower = more even progression."
              badge={analysis.lightnessUniformity.rating}
              variant={ratingVariant(analysis.lightnessUniformity.rating)}
            />
            <StatCard
              label="Chroma coherence"
              value={`σ ${(analysis.chromaCoherence.stdDev * 100).toFixed(1)}`}
              sub="Std dev of chroma values. Tight = consistent saturation band."
              badge={analysis.chromaCoherence.rating}
              variant={ratingVariant(analysis.chromaCoherence.rating)}
            />
            <StatCard
              label="Hue arc"
              value={analysis.hueArc.totalAngle > 0 ? `${analysis.hueArc.totalAngle}°` : '—'}
              badge={analysis.hueArc.totalAngle === 0 ? 'achromatic' : analysis.hueArc.isMonotonic ? 'monotonic' : 'non-monotonic'}
              variant={analysis.hueArc.isMonotonic ? 'positive' : 'neutral'}
              sub={analysis.hueArc.totalAngle === 0
                ? 'No chromatic colours — palette is entirely neutral.'
                : `Colours sweep ${analysis.hueArc.totalAngle}° of the hue wheel${analysis.hueArc.hasAchromatic ? ', with neutrals excluded' : ''}.`}
            />
          </div>

          {/* ── Near-identical callout ── */}
          {analysis.nearIdentical.length > 0 && (
            <CalloutCard
              colour="supernova"
              label={`${analysis.nearIdentical.length} near-identical ${analysis.nearIdentical.length === 1 ? 'pair' : 'pairs'}`}
            >
              Colours within ΔE 2.5 may be indistinguishable at small sizes or under reduced colour sensitivity.
            </CalloutCard>
          )}

          {/* ── Row 3: Contrast matrix, full width ── */}
          {hexes.length <= 10
            ? (
              <div className="rounded-xl border border-void-20 bg-void-10 p-4">
                <ContrastMatrix analysis={analysis} />
              </div>
            )
            : (
              <div className="rounded-xl border border-void-20 bg-void-10 p-4 flex flex-col gap-3">
                <p className="type-annotation-sc text-void-60">Contrast matrix</p>
                <p className="type-annotation text-void-50">Hidden for palettes larger than 10 colours.</p>
              </div>
            )
          }
        </>
      )}

    </div>
  )
}
