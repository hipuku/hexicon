import { useState, useMemo } from 'react'
import { analysePalette, extractHexes, detectFormat, type PaletteAnalysis } from '@/lib/paletteAnalyser'
import { PolarPlot } from './PolarPlot'
import { cn } from '@/lib/utils'
import { StatCard } from '@kern/molecules/StatCard'
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
              <th className="w-6" />
              {hexes.map(h => (
                <th key={h} className="pb-2 px-2">
                  <div className="w-5 h-5 rounded-sm border border-void-30 mx-auto" style={{ backgroundColor: h }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hexes.map((row, i) => (
              <tr key={row}>
                <td className="pr-2">
                  <div className="w-5 h-5 rounded-sm border border-void-30" style={{ backgroundColor: row }} />
                </td>
                {hexes.map((col, j) => {
                  if (i === j) return <td key={col} className="px-2 py-1 text-center text-void-30">—</td>
                  const pair = getContrast(row, col)
                  if (!pair) return <td key={col} />
                  return (
                    <td key={col} className={cn(
                      'px-2 py-1 text-center',
                      pair.passAAA ? 'text-nebula-light' : pair.passAA ? 'text-supernova-light' : 'text-flare-light'
                    )}>
                      {pair.ratio.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="type-annotation text-void-40 mt-2">
          <span className="text-nebula-light">green</span> ≥ 7:1 (AAA) · <span className="text-supernova-light">orange</span> ≥ 4.5:1 (AA) · <span className="text-flare-light">red</span> = fail
        </p>
      </div>
    </div>
  )
}

// ─── Metric helpers ───────────────────────────────────────────────────────────

const RATING_COLOURS = {
  uniform:  'text-pulsar-light',
  moderate: 'text-orbit',
  uneven:   'text-flare',
  tight:    'text-pulsar-light',
  wide:     'text-flare',
} as const

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
            {format && hexes.length > 0 && <span className="text-void-30">·</span>}
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
          className="type-code w-full bg-void-10 border border-void-20 focus:border-void-40 rounded-xl px-4 py-3 text-void-70 placeholder:text-void-40 outline-none resize-none transition-colors duration-150"
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
          {/* ── Polar plot + metrics ── */}
          <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
            <div className="rounded-xl border border-void-20 bg-void-10 p-2">
              <PolarPlot points={analysis.points} size={280} />
            </div>

            <div className="flex flex-col gap-3">
              <StatCard
                label="Lightness uniformity"
                value={`σ ${analysis.lightnessUniformity.stdDev.toFixed(1)}`}
                sub="Std dev of lightness steps between sorted colours. Lower = more even progression."
                badge={analysis.lightnessUniformity.rating}
                badgeColor={RATING_COLOURS[analysis.lightnessUniformity.rating]}
              />
              <StatCard
                label="Chroma coherence"
                value={`σ ${(analysis.chromaCoherence.stdDev * 100).toFixed(1)}`}
                sub="Std dev of chroma values. Tight = colours share a consistent saturation band."
                badge={analysis.chromaCoherence.rating}
                badgeColor={RATING_COLOURS[analysis.chromaCoherence.rating]}
              />
              <StatCard
                label="Hue arc"
                value={analysis.hueArc.totalAngle > 0 ? `${analysis.hueArc.totalAngle}°` : '—'}
                badge={analysis.hueArc.totalAngle === 0 ? 'achromatic' : analysis.hueArc.isMonotonic ? 'monotonic' : 'non-monotonic'}
                badgeColor="text-void-50"
                sub={analysis.hueArc.totalAngle === 0
                  ? 'No chromatic colours — palette is entirely neutral.'
                  : `Colours sweep ${analysis.hueArc.totalAngle}° of the hue wheel${analysis.hueArc.hasAchromatic ? ', with neutral(s) excluded from arc calculation' : ''}.`}
              />
            </div>
          </div>

          {/* ── Near-identical callout ── */}
          {analysis.nearIdentical.length > 0 && (
            <div className="rounded-xl px-4 py-3 bg-void-20 border border-void-30">
              <p className="type-p-sm text-void-60">
                <span className="text-void-80">{analysis.nearIdentical.length} near-identical {analysis.nearIdentical.length === 1 ? 'pair' : 'pairs'}</span> — colours within ΔE {2.5} may be indistinguishable at small sizes or under reduced colour sensitivity.
              </p>
            </div>
          )}

          {/* ── Contrast matrix ── */}
          {hexes.length <= 10
            ? <ContrastMatrix analysis={analysis} />
            : <p className="type-p-sm text-void-50">Contrast matrix hidden for palettes larger than 10 colours.</p>
          }
        </>
      )}

    </div>
  )
}
