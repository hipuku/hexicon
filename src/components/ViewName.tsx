import { useState, useMemo } from 'react'
import { nameColour, parseHex, type ColourResult, type ConfidenceBands } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'
import { CopyButton } from '@kern/atoms/CopyButton'
import { ViewHeader } from '@kern/molecules/ViewHeader'

// ─── Swatch chip ──────────────────────────────────────────────────────────────

function SwatchChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm type-p-sm font-mono text-white/80 whitespace-nowrap">
      {children}
    </span>
  )
}

// ─── Confidence ───────────────────────────────────────────────────────────────

const CONFIDENCE: Record<string, { label: string; colour: string }> = {
  'very close':  { label: 'Close match',  colour: 'text-pulsar-light' },
  'approximate': { label: 'Approximate',  colour: 'text-orbit' },
  'rough match': { label: 'Rough match',  colour: 'text-flare' },
}

// ─── Confidence panel ─────────────────────────────────────────────────────────

function ConfidencePanel({ bands }: { bands: ConfidenceBands }) {
  const total = bands.veryClose + bands.approximate + bands.distant

  // Derive a qualitative read from the veryClose count
  const { label, colour } = bands.veryClose <= 2
    ? { label: 'Unambiguous',       colour: 'text-pulsar-light' }
    : bands.veryClose <= 8
    ? { label: 'Contested zone',    colour: 'text-orbit'        }
    : { label: 'Disputed boundary', colour: 'text-flare'        }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-void-30 bg-void-20">
      <div className="flex items-center justify-between">
        <span className="type-annotation-sc text-void-60">Naming confidence</span>
        <span className={cn('type-annotation font-medium', colour)}>{label}</span>
      </div>

      {/* Band bars */}
      <div className="flex flex-col gap-1.5">
        <BandRow label="ΔE < 3 — very close"   count={bands.veryClose}   total={total} colour="bg-pulsar"      />
        <BandRow label="ΔE 3–10 — approximate" count={bands.approximate} total={total} colour="bg-orbit"       />
        <BandRow label="ΔE ≥ 10 — distant"     count={bands.distant}     total={total} colour="bg-void-40"     />
      </div>

      <p className="type-annotation text-void-50">
        {bands.veryClose <= 2
          ? `Only ${bands.veryClose} name${bands.veryClose === 1 ? '' : 's'} within ΔE 3 — this colour sits in a clear categorical region.`
          : `${bands.veryClose} names within ΔE 3 — this colour sits near the boundary of multiple categories.`}
      </p>
    </div>
  )
}

function BandRow({ label, count, total, colour }: {
  label:  string
  count:  number
  total:  number
  colour: string
}) {
  const pct = total > 0 ? Math.max(2, (count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-void-30 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', colour)} style={{ width: `${pct}%` }} />
      </div>
      <span className="type-annotation font-mono text-void-50 w-28 shrink-0">{label}</span>
      <span className="type-annotation font-mono text-void-60 w-6 text-right shrink-0">{count}</span>
    </div>
  )
}

// ─── Result ───────────────────────────────────────────────────────────────────

function Result({ result }: { result: ColourResult }) {
  const { inputHex, best, runners, confidence } = result
  const isExact = best.distance === 0
  const accuracyStyle = CONFIDENCE[best.label]

  return (
    <div className="flex flex-col gap-4">

      {/* ── Swatch ── */}
      {isExact ? (
        <div className="relative flex items-end justify-center pb-3 w-full h-40 rounded-xl border border-void-20" style={{ backgroundColor: inputHex }}>
          <SwatchChip>Exact match</SwatchChip>
        </div>
      ) : (
        <div className="relative flex rounded-xl overflow-hidden h-40 border border-void-20">
          <div className="flex-1 relative" style={{ backgroundColor: inputHex }}>
            <span className="absolute bottom-3 left-3"><SwatchChip>{inputHex.toUpperCase()}</SwatchChip></span>
          </div>
          <div className="w-px bg-void-0 shrink-0" />
          <div className="flex-1 relative" style={{ backgroundColor: best.hex }}>
            <span className="absolute bottom-3 right-3"><SwatchChip>{best.hex.toUpperCase()}</SwatchChip></span>
          </div>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <SwatchChip>ΔE {best.distance}</SwatchChip>
          </span>
        </div>
      )}

      {/* ── Name + copy ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="type-h4 text-void-90">{best.name}</h2>
          <CopyButton text={best.name} />
        </div>
        {isExact ? (
          <span className="type-p-sm text-pulsar-light">Exact match</span>
        ) : (
          <span className={cn('type-p-sm', accuracyStyle?.colour ?? 'text-void-50')}>
            {accuracyStyle?.label ?? best.label}
          </span>
        )}
      </div>

      {/* ── Runners-up ── */}
      {!isExact && runners.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="type-annotation-sc text-void-60">Nearby names</span>
          <div className="flex flex-col gap-1">
            {runners.map(r => (
              <div key={r.hex} className="flex items-center gap-3 py-1.5">
                <div className="w-5 h-5 rounded-sm border border-void-30 shrink-0" style={{ backgroundColor: r.hex }} />
                <span className="type-p-sm text-void-70 flex-1">{r.name}</span>
                <span className="type-annotation font-mono text-void-40">ΔE {r.distance}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confidence ── */}
      {!isExact && <ConfidencePanel bands={confidence} />}

    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function ViewName() {
  const [input, setInput] = useState('')

  const result: ColourResult | null = useMemo(() => {
    const hex = parseHex(input)
    if (!hex) return null
    return nameColour(hex)
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
