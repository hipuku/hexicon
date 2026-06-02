import type { OklchPoint } from '@/lib/paletteAnalyser'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHROMA = 0.4
const CHROMA_RINGS = [0.1, 0.2, 0.3, 0.4]
const HUE_LABELS: { angle: number; label: string }[] = [
  { angle: 0,   label: '0°'   },
  { angle: 90,  label: '90°'  },
  { angle: 180, label: '180°' },
  { angle: 270, label: '270°' },
]

// ─── Coordinate helpers ───────────────────────────────────────────────────────

// OKLCH hue 0° = top of the circle, increasing clockwise
function toXY(C: number, H: number, R: number, cx: number, cy: number) {
  const rad = ((H - 90) * Math.PI) / 180
  const r   = (Math.min(C, MAX_CHROMA) / MAX_CHROMA) * R
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PolarPlotProps {
  points: OklchPoint[]
  size?:  number
}

export function PolarPlot({ points, size = 300 }: PolarPlotProps) {
  const pad = 28           // padding for labels
  const cx  = size / 2
  const cy  = size / 2
  const R   = size / 2 - pad

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Polar plot of palette colours in OKLCH colour space"
    >
      {/* ── Grid rings ── */}
      {CHROMA_RINGS.map(c => (
        <circle
          key={c}
          cx={cx} cy={cy}
          r={(c / MAX_CHROMA) * R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* ── Axis spokes ── */}
      {[0, 90, 180, 270].map(deg => {
        const rad = ((deg - 90) * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={cx} y1={cy}
            x2={cx + R * Math.cos(rad)}
            y2={cy + R * Math.sin(rad)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        )
      })}

      {/* ── Hue angle labels ── */}
      {HUE_LABELS.map(({ angle, label }) => {
        const rad = ((angle - 90) * Math.PI) / 180
        const lx  = cx + (R + 16) * Math.cos(rad)
        const ly  = cy + (R + 16) * Math.sin(rad)
        return (
          <text
            key={angle}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="rgba(255,255,255,0.2)"
            fontFamily="'Geist Mono', monospace"
          >
            {label}
          </text>
        )
      })}

      {/* ── Chroma ring labels ── */}
      {CHROMA_RINGS.map(c => (
        <text
          key={c}
          x={cx + 4}
          y={cy - (c / MAX_CHROMA) * R - 3}
          fontSize={8}
          fill="rgba(255,255,255,0.18)"
          fontFamily="'Geist Mono', monospace"
        >
          {c}
        </text>
      ))}

      {/* ── Centre dot ── */}
      <circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.15)" />

      {/* ── Colour points ── */}
      {points.map(pt => {
        const { x, y } = toXY(pt.C, pt.H, R, cx, cy)
        return (
          <g key={pt.hex}>
            {/* Drop shadow ring */}
            <circle cx={x} cy={y} r={10} fill="rgba(0,0,0,0.4)" />
            <circle
              cx={x} cy={y} r={9}
              fill={pt.hex}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
            />
          </g>
        )
      })}
    </svg>
  )
}
