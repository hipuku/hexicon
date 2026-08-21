import type { ViewId } from '../types'
import { ViewContainer } from '@kern/templates/ViewContainer'
import { Section } from '@kern/molecules/Section'
import { ToolLink } from '@kern/molecules/ToolLink'
import { DataTable } from '@kern/molecules/DataTable'
import { BulletList } from '@kern/molecules/BulletList'
import { ExternalLink } from '@kern/atoms/ExternalLink'
import { BulletItem } from '@kern/atoms/BulletItem'

interface ViewAboutProps {
  onNavigate: (view: ViewId) => void
}

export function ViewAbout({ onNavigate }: ViewAboutProps) {
  return (
    <ViewContainer width="lg" gap="lg">

      {/* ── Name a colour ── */}
      <Section title="Name a colour">
        <p className="type-p-sm text-void-60">
          Human colour perception is not uniform across the spectrum. Blues cluster more tightly than greens, yellows shift more noticeably than purples. The CIE developed perceptually uniform difference metrics to account for this.{' '}
          <ExternalLink href="https://cie.co.at/publications/improvement-industrial-colour-difference-evaluation">
            CIEDE2000 (CIE 142:2001)
          </ExternalLink>{' '}
          applies corrections for lightness, chroma, and hue non-uniformities to produce a ΔE value that closely tracks what a human observer would judge as different.
        </p>
        <p className="type-p-sm text-void-60">
          A ΔE of 1 is approximately the just-noticeable difference (JND), the smallest change the average eye can detect under controlled conditions. Below 3 is a close match within the same colour name. Above 10, the colours are perceptually distinct.
        </p>

        <DataTable
          columns={['ΔE', 'Perception']}
          rows={DE_ROWS.map(row => [
            <span className="font-mono">{row.range}</span>,
            row.label,
          ])}
        />

        <p className="type-p-sm text-void-60">
          The dataset is{' '}
          <ExternalLink href="https://github.com/meodai/color-names">meodai/color-names</ExternalLink>{' '}
          — over 30,000 hand-curated English colour names. A direct CIEDE2000 scan over 30k entries is too slow for real-time use, so the tool first narrows candidates using CIE76 (Euclidean distance in Lab), then re-scores all candidates within the radius with full CIEDE2000.
        </p>
        <p className="type-p-sm text-void-60">
          Beyond returning the closest match, the tool reports how many other names exist within each ΔE band. This <span className="text-void-80">naming confidence</span> measure draws on the insight from{' '}
          <ExternalLink href="https://www.jstor.org/stable/411222">
            Berlin &amp; Kay (1969), <em>Basic Color Terms</em>
          </ExternalLink>{' '}
          — that colour categories have focal points where naming is universal, and boundaries where it is contested. A colour with many competing names within ΔE 3 sits at one of those boundaries.
        </p>

        <ToolLink onClick={() => onNavigate('name')} colour="pulsar">
          Name a colour →
        </ToolLink>
      </Section>

      {/* ── Map a palette ── */}
      <Section title="Map a palette">
        <p className="type-p-sm text-void-60">
          RGB is convenient for screens but perceptually non-uniform — a step of 10 in red looks different from the same step in blue. OKLCH (Björn Ottosson, 2020) is a polar form of the Oklab colour space designed to be perceptually uniform: equal steps in L, C, or H produce equal-feeling changes to the eye.
        </p>
        <p className="type-p-sm text-void-60">
          The polar plot maps each colour by its hue angle (H) and chroma distance from centre (C). A palette with principled structure (described by{' '}
          <ExternalLink href="https://www.munsell.com/color-education/munsell-color-system/">
            Munsell (1905)
          </ExternalLink>{' '}
          as consistent value and chroma relationships) appears as a coherent cluster or arc. An assembled-by-eye palette scatters.
        </p>

        <BulletList>
          <BulletItem>
            <strong className="text-void-80 font-semibold">Lightness uniformity</strong> — standard deviation of the lightness steps between colours when sorted by L. Low std dev means even perceptual stepping; high means some jumps are much larger than others.
          </BulletItem>
          <BulletItem>
            <strong className="text-void-80 font-semibold">Chroma coherence</strong> — standard deviation of C values. A tight spread means colours share a consistent saturation band; a wide spread means some are vivid while others are near-neutral.
          </BulletItem>
          <BulletItem>
            <strong className="text-void-80 font-semibold">Hue arc</strong> — how many degrees of the hue wheel the palette covers, and whether the rotation is monotonic (travels in one direction without backtracking). Complements span ~180°; analogous palettes span ~60°.
          </BulletItem>
        </BulletList>

        <p className="type-p-sm text-void-60">
          Achromatic colours (neutrals, greys) have undefined hue and are excluded from the arc calculation but visible at the centre of the polar plot.
        </p>

        <ToolLink onClick={() => onNavigate('structure')} colour="orbit">
          Map a palette →
        </ToolLink>
      </Section>

      {/* ── Compare two colours ── */}
      <Section title="Compare two colours">
        <p className="type-p-sm text-void-60">
          CIEDE2000 gives a single number for the perceptual distance between two colours. But that distance is not fixed — it shifts with context. The{' '}
          <span className="text-void-80">crispening effect</span>, first documented by{' '}
          <ExternalLink href="https://doi.org/10.1364/JOSAA.9.001529">
            Whittle (1992)
          </ExternalLink>,{' '}
          describes how perceived colour differences are amplified when the surround is similar to the colours being compared. When a background is close to colour A, A recedes into it and B appears to advance — making the two colours seem further apart than they are on a neutral ground.
        </p>
        <p className="type-p-sm text-void-60">
          The tool shows both colours on three backgrounds: a neutral mid-grey (no crispening), a background similar to A in hue and lightness, and a background similar to B. For each panel, the ΔE between each colour and the background is measured — low ΔE(colour, background) predicts stronger crispening for that colour.
        </p>
        <p className="type-p-sm text-void-60">
          The ΔE thresholds follow{' '}
          <ExternalLink href="https://link.springer.com/article/10.1023/A:1020061901428">
            Sharma et al. (2005)
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink href="https://doi.org/10.1364/JOSAA.9.001529">
            MacAdam (1942)
          </ExternalLink>
          . The surround backgrounds are generated in OKLCH — matched to each colour's lightness and hue at moderated chroma — so the relationship is perceptually interpretable.
        </p>

        <ToolLink onClick={() => onNavigate('difference')} colour="tidal">
          Compare two colours →
        </ToolLink>
      </Section>

    </ViewContainer>
  )
}

// ─── ΔE reference table data ─────────────────────────────────────────────────

const DE_ROWS = [
  { range: '< 1',   label: 'Imperceptible to the average observer' },
  { range: '1–2',   label: 'Just-noticeable difference (JND threshold)' },
  { range: '2–10',  label: 'Clearly different, same colour family' },
  { range: '10–50', label: 'Perceptually distinct colours' },
  { range: '≥ 50',  label: 'Categorically different' },
]
