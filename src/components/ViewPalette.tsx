import { useState, useMemo } from 'react'
import { evaluatePalette, extractHexes, type PaletteScores } from '@/lib/paletteEvaluator'
import { cn } from '@/lib/utils'

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

// ─── Lightness track ──────────────────────────────────────────────────────────

function LightnessTrack({ hexes, lightnessValues }: { hexes: string[]; lightnessValues: number[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-annotation text-void-40 uppercase tracking-[0.08em]">Lightness distribution</p>
      <div
        className="relative h-8 rounded-lg border border-void-20"
        style={{ background: 'linear-gradient(to right, #121213, #F1F1F4)' }}
      >
        {hexes.map((hex, i) => (
          <div
            key={hex}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-void-0 shadow-sm"
            style={{ left: `${Math.max(2, Math.min(98, lightnessValues[i]))}%`, backgroundColor: hex }}
            title={`${hex.toUpperCase()} — L ${lightnessValues[i].toFixed(0)}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Data card ────────────────────────────────────────────────────────────────

function DataCard({ label, value, unit, description }: {
  label:       string
  value:       string
  unit?:       string
  description: string
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-void-30 bg-void-20">
      <span className="text-annotation text-void-40 uppercase tracking-[0.08em]">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-h4 font-semibold text-void-90">{value}</span>
        {unit && <span className="text-annotation text-void-50">{unit}</span>}
      </div>
      <p className="text-p-sm text-void-60">{description}</p>
    </div>
  )
}

// ─── Callout ──────────────────────────────────────────────────────────────────

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-void-20 border border-void-30">
      <p className="text-p-sm text-void-60">{children}</p>
    </div>
  )
}

// ─── Contrast matrix ──────────────────────────────────────────────────────────

function ContrastMatrix({ scores }: { scores: PaletteScores }) {
  const { hexes, pairs } = scores
  const getContrast = (a: string, b: string) =>
    pairs.find(p => (p.a === a && p.b === b) || (p.a === b && p.b === a))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-annotation text-void-40 uppercase tracking-[0.08em]">Contrast matrix</p>
      <div className="overflow-x-auto">
        <table className="w-full text-annotation font-mono border-collapse">
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
        <p className="text-annotation text-void-40 mt-2">
          <span className="text-nebula-light">green</span> ≥ 7:1 (AAA) · <span className="text-supernova-light">orange</span> ≥ 4.5:1 (AA) · <span className="text-flare-light">red</span> = fail
        </p>
      </div>
    </div>
  )
}

// ─── Format detection ─────────────────────────────────────────────────────────

function detectFormat(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  if (/--[\w-]+\s*:/.test(t))         return 'CSS variables'
  if (/colors\s*:|theme\s*:/.test(t)) return 'Tailwind config'
  if (t.startsWith('{') || t.startsWith('[')) return 'JSON'
  return 'plain hex'
}

function jsonError(input: string): string | null {
  try { JSON.parse(input); return null }
  catch (e) { return e instanceof Error ? e.message : 'Invalid JSON' }
}

// ─── View ─────────────────────────────────────────────────────────────────────

const PLACEHOLDER = `/* paste CSS, JSON, Tailwind, or a plain list */
--color-background: #121213;
--color-foreground: #F1F1F4;
--color-primary: #7193ED;
--color-accent: #68D0CA;`

export function ViewPalette() {
  const [text, setText] = useState('')

  const hexes   = useMemo(() => extractHexes(text), [text])
  const scores  = useMemo(() => evaluatePalette(hexes), [hexes])
  const format  = useMemo(() => detectFormat(text), [text])
  const jsonErr = useMemo(() => format === 'JSON' ? jsonError(text) : null, [format, text])
  const noHexes = text.trim().length > 0 && hexes.length === 0

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">

      <div className="flex flex-col gap-2">
        <h1 className="text-h4 font-semibold text-void-90">Evaluate a palette</h1>
        <p className="text-p-sm text-void-60">
          Paste CSS variables, JSON, or Tailwind config. Any format — hex codes prefixed with # are extracted automatically.
        </p>
      </div>

      {/* ── Input ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="palette-input" className="text-annotation text-void-40 uppercase tracking-[0.08em]">
            Palette input
          </label>
          <div className="flex items-center gap-2 text-annotation text-void-50">
            {format && <span>{format}</span>}
            {format && hexes.length > 0 && <span className="text-void-30">·</span>}
            {hexes.length > 0 && <span>{hexes.length} colours found</span>}
          </div>
        </div>
        <textarea
          id="palette-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          rows={8}
          className="w-full bg-void-10 border border-void-20 focus:border-void-40 rounded-xl px-4 py-3 font-mono text-code text-void-70 placeholder:text-void-40 outline-none resize-none transition-colors duration-150 leading-relaxed"
        />
      </div>

      {jsonErr && (
        <p className="text-annotation text-flare">{jsonErr}</p>
      )}
      {noHexes && !jsonErr && (
        <p className="text-annotation text-void-50">No #hex codes found — ensure colour values are prefixed with #</p>
      )}
      {hexes.length === 1 && (
        <p className="text-annotation text-void-50">Add at least 2 colours to see analysis.</p>
      )}

      {/* ── Swatch strip ── */}
      {hexes.length > 0 && <SwatchStrip hexes={hexes} />}

      {scores && (
        <>
          {/* ── Lightness distribution ── */}
          <LightnessTrack hexes={scores.hexes} lightnessValues={scores.lightnessValues} />

          {/* ── Contrast matrix (full width) ── */}
          {hexes.length <= 10
            ? <ContrastMatrix scores={scores} />
            : <p className="text-p-sm text-void-50">Contrast matrix hidden for palettes larger than 10 colours.</p>
          }

          {/* ── Data cards + callouts ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <DataCard
                label="Perceptual spread"
                value={scores.spread.toFixed(1)}
                unit="avg ΔE"
                description="Average oklab distance between all colour pairs. Higher means colours occupy more distinct regions of perceptual space."
              />
              <DataCard
                label="Lightness range"
                value={scores.lightnessRange.toFixed(1)}
                unit="L pts"
                description="oklch L range from darkest to lightest on a 0–100 scale. A wide range gives the palette good hierarchical flexibility."
              />
              <DataCard
                label="Contrast coverage"
                value={`${scores.contrastCoverage.toFixed(0)}%`}
                description="Percentage of colour pairs that pass WCAG AA (4.5:1). Relevant for text-on-background use cases."
              />
            </div>

            {scores.nearIdentical.length > 0 && (
              <Callout>
                <span className="text-void-80">{scores.nearIdentical.length} {scores.nearIdentical.length === 1 ? 'pair' : 'pairs'}</span> of colours are perceptually very similar and may be difficult to distinguish at small sizes or for users with reduced colour sensitivity.
              </Callout>
            )}
            {scores.noMidtones && (
              <Callout>
                The palette has <span className="text-void-80">no mid-tones</span> — colours cluster at the dark and light ends with a gap between. This limits the number of distinct lightness steps available for visual hierarchy.
              </Callout>
            )}
          </div>
        </>
      )}

    </div>
  )
}
