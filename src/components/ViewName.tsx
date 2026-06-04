import { useState, useEffect } from 'react'
import { nameColour, parseHex, type ColourResult, type ConfidenceBands } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'
import { CopyButton } from '@kern/atoms/CopyButton'
import { StatusChip, type StatusChipColour } from '@kern/atoms/StatusChip'
import { ViewHeader } from '@kern/molecules/ViewHeader'

// ─── Swatch chip ──────────────────────────────────────────────────────────────

function SwatchChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm type-annotation font-mono text-white/80 whitespace-nowrap">
      {children}
    </span>
  )
}

// ─── Confidence ───────────────────────────────────────────────────────────────

const CONFIDENCE: Record<string, string> = {
  'very close':  'Close match',
  'approximate': 'Approximate',
  'rough match': 'Rough match',
}

// ─── Confidence panel ─────────────────────────────────────────────────────────

function ConfidencePanel({ bands }: { bands: ConfidenceBands }) {
  const total = bands.veryClose + bands.approximate + bands.distant

  const { label, colour } = bands.veryClose <= 2
    ? { label: 'Unambiguous',       colour: 'pulsar' as StatusChipColour }
    : bands.veryClose <= 8
    ? { label: 'Contested zone',    colour: 'orbit'  as StatusChipColour }
    : { label: 'Disputed boundary', colour: 'flare'  as StatusChipColour }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-void-30 bg-void-20">
      <div className="flex items-center justify-between">
        <span className="type-annotation-sc text-void-60">Naming confidence</span>
        <StatusChip colour={colour}>{label}</StatusChip>
      </div>

      <div className="flex flex-col gap-2">
        <BandRow label="ΔE < 3"   count={bands.veryClose}   total={total} />
        <BandRow label="ΔE 3–10"  count={bands.approximate} total={total} />
        <BandRow label="ΔE ≥ 10"  count={bands.distant}     total={total} />
      </div>

      <p className="type-annotation text-void-60">
        {bands.veryClose === 0
          ? `No names within ΔE 3. This colour sits in a clear categorical region.`
          : bands.veryClose <= 2
          ? `Only ${bands.veryClose} name${bands.veryClose === 1 ? '' : 's'} within ΔE 3. This colour sits in a clear categorical region.`
          : `${bands.veryClose} names within ΔE 3. This colour sits near the boundary of multiple categories.`}
      </p>
    </div>
  )
}

function BandRow({ label, count, total }: {
  label: string
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.max(1, (count / total) * 100) : 0
  return (
    <div className="grid grid-cols-[4rem_1fr_2rem] items-center gap-3">
      <span className="type-annotation font-mono text-void-60">{label}</span>
      <div className="h-1 rounded-full bg-void-30 overflow-hidden">
        <div className="h-full rounded-full bg-pulsar transition-all duration-[500ms]" style={{ width: `${pct}%` }} />
      </div>
      <span className="type-annotation font-mono text-void-50 text-right">{count}</span>
    </div>
  )
}

// ─── Result ───────────────────────────────────────────────────────────────────

function Result({ result }: { result: ColourResult }) {
  const { inputHex, best, runners, confidence } = result
  const isExact = best.distance === 0
  const accuracyLabel = CONFIDENCE[best.label] ?? best.label

  return (
    <div className="flex flex-col gap-6">

      {/* ── Primary: swatch + name ── */}
      <div className="flex flex-col gap-4">

        {/* Swatch */}
        {isExact ? (
          <div className="relative flex items-end justify-center pb-3 w-full h-32 rounded-xl border border-void-20" style={{ backgroundColor: inputHex }}>
            <SwatchChip>Exact match</SwatchChip>
          </div>
        ) : (
          <div className="relative flex rounded-xl overflow-hidden h-32 border border-void-20">
            <div className="flex-1 relative" style={{ backgroundColor: inputHex }}>
              <span className="absolute bottom-3 left-3"><SwatchChip>{inputHex.toUpperCase()}</SwatchChip></span>
            </div>
            <div className="flex-1 relative" style={{ backgroundColor: best.hex }}>
              <span className="absolute bottom-3 right-3"><SwatchChip>{best.hex.toUpperCase()}</SwatchChip></span>
            </div>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <SwatchChip>ΔE {best.distance} | {accuracyLabel}</SwatchChip>
            </span>
          </div>
        )}

        {/* Name */}
        <div className="flex items-center gap-2">
          <h2 className="type-h4 text-void-90">{best.name}</h2>
          <CopyButton text={best.name} />
        </div>
      </div>

      {/* ── Context: runners-up + confidence ── */}
      {!isExact && (
        <div className={cn('grid gap-4', runners.length > 0 ? 'grid-cols-2' : 'grid-cols-1')}>

          {runners.length > 0 && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-void-30 bg-void-20">
              <span className="type-annotation-sc text-void-60">Nearby names</span>
              <div className="flex flex-col">
                {runners.map((r, i) => (
                  <div key={r.hex} className={cn(
                    'flex items-center gap-3 py-2',
                    i < runners.length - 1 && 'border-b border-void-20'
                  )}>
                    <div className="w-4 h-4 rounded-sm border border-void-30 shrink-0" style={{ backgroundColor: r.hex }} />
                    <span className="type-annotation text-void-60 flex-1 min-w-0 truncate">{r.name}</span>
                    <span className="type-annotation font-mono text-void-50 shrink-0">ΔE {r.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ConfidencePanel bands={confidence} />
        </div>
      )}

    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function ViewName() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ColourResult | null>(null)

  useEffect(() => {
    const hex = parseHex(input)
    if (!hex) { setResult(null); return }
    let cancelled = false
    nameColour(hex).then(r => { if (!cancelled) setResult(r) })
    return () => { cancelled = true }
  }, [input])

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">

      <ViewHeader
        title="Name a colour"
        description="Enter a hex code to find its closest English name using CIEDE2000 perceptual distance."
      />

      <HexInput id="hex-input" label="Hex" value={input} onChange={setInput} placeholder="#A1B2C3" autoFocus />

      {result && <Result result={result} />}

    </div>
  )
}
