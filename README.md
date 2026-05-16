# hexicon

A perceptual colour toolkit built on CIEDE2000 and oklab — no cloud APIs, everything runs in the browser.

## Tools

**Name** — Enter a hex code to find its closest English name using CIEDE2000 perceptual distance across a 30 000-colour database.

**Evaluate** — Paste a palette of hex codes and get a full perceptual analysis: oklab spread, lightness range, simultaneous WCAG AA/AAA contrast coverage, near-identical pair detection, and midtone gap warnings.

**Simultaneous contrast** — See how the same colour shifts perceptually on different surrounds. Demonstrates simultaneous contrast and lightness adaptation using oklch-computed complement and neutral backgrounds.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (base token layer only)
- chroma-js (colour space conversions)
- Parkinsans + Geist Mono

## Development

```bash
npm install
npm run dev
```
