import { useState, useMemo } from 'react'
import chroma from 'chroma-js'
import { isValidHex, parseHex } from '@/lib/colourMatcher'
import { HexInput } from './HexInput'
import { cn } from '@/lib/utils'

// ─── Swatch panel ─────────────────────────────────────────────────────────────

function SwatchPanel({ fg, bg, label, hero = false }: {
  fg:     string | null
  bg:     string
  label?: string
  hero?:  boolean
}) {
  const isOnDark = chroma(bg).luminance() < 0.25

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl border border-white/5 overflow-hidden',
        hero ? 'min-h-64' : 'min-h-40',
      )}
      style={{ backgroundColor: bg }}
    >
      {fg && (
        <div
          className={cn(hero ? 'w-28 h-28' : 'w-14 h-14')}
          style={{ backgroundColor: fg }}
        />
      )}

      {label && (
        <span className={cn(
          'absolute bottom-3 left-3 text-annotation',
          isOnDark ? 'text-white/40' : 'text-black/40',
        )}>
          {label}
        </span>
      )}
    </div>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

const LIGHTNESS_BACKGROUNDS = [
  { label: 'Near black', hex: '#121213' },
  { label: 'Mid grey',   hex: '#838385' },
  { label: 'Near white', hex: '#F1F1F4' },
]

export function ViewContext() {
  const [fgInput, setFgInput] = useState('')

  const fgHex = isValidHex(fgInput) ? parseHex(fgInput)! : null

  // Complement bg at fg's own lightness — maximises lateral inhibition push.
  // Neutral at the same lightness gives a clean baseline with zero hue push.
  // oklch gives more reliable hue linearity, especially in blues/purples.
  const [complementBg, neutralBg] = useMemo(() => {
    if (!fgHex) return ['#4A3070', '#838385']
    try {
      const [l, , h] = chroma(fgHex).oklch()
      const bgL = Math.max(0.30, Math.min(0.70, l))
      return [
        chroma.oklch(bgL, 0.15, (h + 180) % 360).hex(),
        chroma.oklch(bgL, 0, 0).hex(),
      ]
    } catch (err) { console.error('[ViewContext] chroma conversion failed', err); return ['#4A3070', '#838385'] }
  }, [fgHex])

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-h4 font-semibold text-void-90">Simultaneous contrast</h1>
        <p className="text-p-sm text-void-60">
          The swatches in the panels below are identical, the same hex value on different backgrounds.
        </p>
      </div>

      {/* ── Input ── */}
      <HexInput
        id="fg-input"
        label="Colour"
        value={fgInput}
        onChange={setFgInput}
        placeholder="#A1B2C3"
        autoFocus
      />

      {/* ── Primary comparison ── */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <SwatchPanel fg={fgHex} bg={complementBg} label="Complement" hero />
          <SwatchPanel fg={fgHex} bg={neutralBg}    label="Neutral"    hero />
        </div>
        {fgHex && (
          <div className="rounded-xl px-6 py-4 bg-void-20 border border-void-30">
            <p className="text-p-sm text-void-60">
              On the <span className="text-void-80">complement</span> surround, the eye is pushed away from the background hue, the swatch appears shifted. On <span className="text-void-80">neutral</span>, there is no push. This is the baseline.
            </p>
          </div>
        )}
      </div>

      {/* ── Lightness axis ── */}
      <div className="flex flex-col gap-2">
        <p className="text-annotation text-void-40 uppercase tracking-[0.08em]">Lightness axis</p>
        <div className="grid grid-cols-3 gap-2">
          {LIGHTNESS_BACKGROUNDS.map(bg => (
            <SwatchPanel key={bg.label} fg={fgHex} bg={bg.hex} label={bg.label} />
          ))}
        </div>
        {fgHex && (
          <div className="rounded-xl px-6 py-4 bg-void-20 border border-void-30">
            <p className="text-p-sm text-void-60">
              The same swatch appears <span className="text-void-80">lighter</span> on dark surrounds and <span className="text-void-80">darker</span> on light, the eye adjusts relative to the surround's luminance.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
