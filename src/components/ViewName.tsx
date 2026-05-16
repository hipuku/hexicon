import { useState, useMemo, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { nameColour, parseHex, type ColourResult } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handle = () => {
    navigator.clipboard.writeText(text).catch((err) => { if (import.meta.env.DEV) console.warn('[CopyBtn] clipboard write failed', err) })
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handle}
      aria-label={`Copy ${text}`}
      className="cursor-pointer text-void-50 hover:text-void-90 transition-colors duration-150"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-pulsar-light" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ─── Swatch chip ──────────────────────────────────────────────────────────────

function SwatchChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-p-sm font-mono text-white/80 whitespace-nowrap">
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

// ─── Result ───────────────────────────────────────────────────────────────────

function Result({ result }: { result: ColourResult }) {
  const { inputHex, best } = result
  const isExact = best.distance === 0
  const confidence = CONFIDENCE[best.label]

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
          <h2 className="text-h4 font-semibold text-void-90 leading-tight">{best.name}</h2>
          <CopyBtn text={best.name} />
        </div>
        {isExact ? (
          <span className="text-p-sm text-pulsar-light">Exact match</span>
        ) : (
          <span className={cn('text-p-sm', confidence?.colour ?? 'text-void-50')}>
            {confidence?.label ?? best.label}
          </span>
        )}
      </div>

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

      <div className="flex flex-col gap-2">
        <h1 className="text-h4 font-semibold text-void-90">Name a colour</h1>
        <p className="text-p-sm text-void-60">
          Enter a hex code to find its closest English name using CIEDE2000 perceptual distance.
        </p>
      </div>

      <HexInput id="hex-input" label="Hex" value={input} onChange={setInput} placeholder="#A1B2C3" autoFocus />

      {result && <Result result={result} />}

    </div>
  )
}
