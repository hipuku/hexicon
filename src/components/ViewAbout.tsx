import type { ReactNode } from 'react'
import type { ViewId } from './AppSidebar'

interface ViewAboutProps {
  onNavigate: (view: ViewId) => void
}

export function ViewAbout({ onNavigate }: ViewAboutProps) {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-12">

      {/* ── Name a colour ── */}
      <Section title="Name a colour">
        <p className="text-p-sm text-void-60 leading-[1.7]">
          Human colour perception is not uniform across the spectrum — blues cluster more tightly than greens, yellows shift more noticeably than purples. The CIE developed perceptually uniform difference metrics to account for this.{' '}
          <ExternalLink href="https://cie.co.at/publications/improvement-industrial-colour-difference-evaluation">
            CIEDE2000 (CIE 142:2001)
          </ExternalLink>{' '}
          applies corrections for lightness, chroma, and hue non-uniformities to produce a ΔE value that closely tracks what a human observer would judge as different.
        </p>
        <p className="text-p-sm text-void-60 leading-[1.7]">
          A ΔE of 1 is approximately the just-noticeable difference (JND) — the smallest change the average eye can detect under controlled conditions. Below 2 is a close match. Above 10, the colours are perceptually distinct.
        </p>

        <DeltaETable />

        <p className="text-p-sm text-void-60 leading-[1.7]">
          The dataset is{' '}
          <ExternalLink href="https://github.com/meodai/color-names">meodai/color-names</ExternalLink>{' '}
          — over 30,000 hand-curated English colour names. A direct CIEDE2000 scan over 30k entries is too slow for real-time use, so the tool first narrows candidates using CIE76 (Euclidean distance in Lab), then re-scores the top results with full CIEDE2000.
        </p>

        <ToolLink onClick={() => onNavigate('name')} colour="text-pulsar hover:text-pulsar-light">
          Name a colour →
        </ToolLink>
      </Section>

      {/* ── Simultaneous contrast ── */}
      <Section title="Simultaneous contrast">
        <p className="text-p-sm text-void-60 leading-[1.7]">
          Josef Albers demonstrated in <em>Interaction of Color</em> (1963) that colour has no absolute appearance — it is always perceived relative to its surround. The same hex value can look warmer, cooler, lighter, or darker depending on what surrounds it. This is not an optical illusion. It is the normal operation of the visual system.
        </p>
        <p className="text-p-sm text-void-60 leading-[1.7]">
          The mechanism is lateral inhibition: retinal ganglion cells respond to the difference between the signal at their centre and the signal from surrounding cells — not to absolute luminance or hue. The strongest perceptual shift occurs when the surround is the complementary hue at a similar lightness — the two signals are maximally opposed. On a neutral grey at the same lightness, there is no hue push and the colour appears as a baseline.
        </p>

        <ContrastDemo />

        <p className="text-p-sm text-void-60 leading-[1.7]">
          The lightness axis below the primary comparison demonstrates the same phenomenon on a dark-to-light dimension — the same colour appears lighter against dark surrounds and darker against light ones.
        </p>

        <ToolLink onClick={() => onNavigate('context')} colour="text-tidal hover:text-tidal-light">
          Simultaneous contrast →
        </ToolLink>
      </Section>

      {/* ── Evaluate a palette ── */}
      <Section title="Evaluate a palette">
        <p className="text-p-sm text-void-60 leading-[1.7]">
          RGB is convenient for screens but perceptually non-uniform — a step of 10 units in red looks different from the same step in blue. CIE Lab was designed to be approximately uniform, and{' '}
          <ExternalLink href="https://bottosson.github.io/posts/oklab/">oklab (Ottosson, 2020)</ExternalLink>{' '}
          improves on it further: Euclidean distance in oklab correlates more consistently with perceived difference, particularly in blues and purples where LCH hue angles shift unexpectedly. All perceptual distance calculations use oklab.
        </p>

        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          <BulletItem>
            <strong className="text-void-80">Perceptual spread</strong> — average oklab distance between all colour pairs, scaled 0–100. Higher means the colours occupy more distinct regions of perceptual space.
          </BulletItem>
          <BulletItem>
            <strong className="text-void-80">Lightness range</strong> — oklch L distance from darkest to lightest on a 0–100 scale. A wide range gives the palette the tonal steps needed for visual hierarchy.
          </BulletItem>
          <BulletItem>
            <strong className="text-void-80">Contrast coverage</strong> — percentage of colour pairs meeting the{' '}
            <ExternalLink href="https://www.w3.org/TR/WCAG21/#contrast-minimum">WCAG 2.1 AA threshold of 4.5:1</ExternalLink>.
            Most meaningful when colours will appear as text on backgrounds in a design system.
          </BulletItem>
        </ul>

        <p className="text-p-sm text-void-60 leading-[1.7]">
          The WCAG contrast formula — (L₁ + 0.05) / (L₂ + 0.05) — is a simplified model optimised for black text on white. It is less accurate for saturated colour combinations. WCAG 3.0 proposes APCA as a replacement, though it has not yet reached standard status.
        </p>

        <ToolLink onClick={() => onNavigate('palette')} colour="text-orbit hover:text-orbit-light">
          Evaluate a palette →
        </ToolLink>
      </Section>

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4 font-semibold text-void-90">{title}</h2>
      {children}
    </section>
  )
}

function ToolLink({ onClick, colour, children }: {
  onClick:  () => void
  colour:   string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer text-p-sm font-medium transition-colors duration-150 text-left ${colour}`}
    >
      {children}
    </button>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-pointer text-pulsar underline underline-offset-[3px] hover:text-pulsar-light transition-colors duration-150"
    >
      {children}
    </a>
  )
}

function BulletItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="mt-[0.55em] w-[5px] h-[5px] rounded-full bg-void-40 shrink-0" />
      <p className="text-p-sm text-void-60 leading-[1.7] m-0">{children}</p>
    </li>
  )
}

// ─── ΔE reference table ───────────────────────────────────────────────────────

const DE_ROWS = [
  { range: '< 1',  label: 'Imperceptible to the average observer' },
  { range: '1–2',  label: 'Just noticeable difference (JND threshold)' },
  { range: '2–10', label: 'Clearly different, same colour family' },
  { range: '> 10', label: 'Perceptually distinct colours' },
]

function DeltaETable() {
  return (
    <div className="rounded-xl border border-void-30 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-void-20">
            <th className="text-left px-4 py-2 text-annotation text-void-40 font-medium w-24">ΔE</th>
            <th className="text-left px-4 py-2 text-annotation text-void-40 font-medium">Perception</th>
          </tr>
        </thead>
        <tbody>
          {DE_ROWS.map((row, i) => (
            <tr key={i} className={i < DE_ROWS.length - 1 ? 'border-b border-void-20' : ''}>
              <td className="px-4 py-2.5 font-mono text-annotation text-void-60">{row.range}</td>
              <td className="px-4 py-2.5 text-p-sm text-void-60">{row.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Static contrast demo ─────────────────────────────────────────────────────

function ContrastDemo() {
  const fg     = '#7193ED'
  const panels = [
    { bg: '#6B5500', label: 'Complement' },
    { bg: '#737375', label: 'Neutral' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {panels.map(({ bg, label }) => (
        <div
          key={label}
          className="relative flex items-center justify-center rounded-xl h-28 border border-white/5"
          style={{ backgroundColor: bg }}
        >
          <div className="w-12 h-12" style={{ backgroundColor: fg }} />
          <span className="absolute bottom-3 left-3 text-annotation text-white/40">{label}</span>
        </div>
      ))}
    </div>
  )
}
