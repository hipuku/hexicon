# hexicon

Perceptual colour tools in the browser. Live at [hexicon.hipuku.dev](https://hexicon.hipuku.dev).

## Tools

**Name** — finds the closest English name for any hex code using CIEDE2000 across 30,000 colours.

**Map palette** — analyses a palette in OKLCH: lightness uniformity, chroma coherence, hue arc, WCAG AA/AAA contrast matrix, near-identical pairs.

**Compare** — CIEDE2000 distance between two colours, with crispening panels showing how context shifts apparent difference.

## Stack

- React 19 + TypeScript
- Vite, Tailwind CSS v4, [kern](https://github.com/hipuku/kern) (shared component library), shadcn/ui (token layer only)
- [haus-colour-utils](https://www.npmjs.com/package/haus-colour-utils) (my published package — CIEDE2000 ΔE and WCAG contrast power the Compare and Map tools), chroma-js (OKLCH/Lab conversions), Parkinsans + Geist Mono (Google Fonts)

## Development

```bash
npm install
npm run dev
```

See [DESIGN.md](DESIGN.md) for engineering rationale.
