# hexicon — design notes

Annotated intent. What this tool does and why each significant decision was made. Not a spec engineering notes for a new contributor or future self. If something in the code looks over-engineered or under-engineered, the answer is probably here.

---

## What it is

A perceptual colour toolkit that runs entirely in the browser. Three tools: name any hex code, map a palette in OKLCH space, compare two colours with CIEDE2000 distance. No backend, no cloud APIs every computation is client-side.

---

## Colour distance: CIEDE2000 over CIE76

The core metric for everything in hexicon is CIEDE2000 (ΔE₀₀), not the simpler CIE76.

CIE76 is Euclidean distance in Lab fast and simple, but the Lab space is perceptually non-uniform. A ΔE of 5 looks very different depending on where in colour space you are. Blues compress (small perceptual changes map to large Lab distances), greens spread, and yellows sit at a hue angle where small Lab moves produce visible hue shifts.

CIEDE2000 corrects for this with three non-linear weighting functions for lightness (S_L), chroma (S_C), and hue (S_H), plus a cross-term handling the blue-yellow problematic region. Reference: Sharma, Wu & Dalal (2005), *The CIEDE2000 Color-Difference Formula*, Color Research & Application 30(1). A ΔE₀₀ of 1.0 is approximately the just-noticeable difference (JND) for an average observer under standard viewing conditions.

Accepted tradeoff: CIEDE2000 is ~8× more computation per pair than CIE76. Fine for N < 200 candidates; not for a brute-force scan of 30,000 colours.

---

## Two-pass matching

Scanning all 30,000 names with CIEDE2000 on every keystroke is too slow. The solution is two-pass:

1. **CIE76 coarse scan** with radius ΔE₇₆ < 28 narrows from 30k to ~100–200 candidates. Fast Euclidean Lab distance; good enough to find the neighbourhood.
2. **CIEDE2000 re-score** of the candidate set for final ranking, confidence bands, and runner-ups.

Lab values for all 30,000 colours are precomputed at load time so neither pass does repeated conversions. The CIE76 radius of 28 is deliberately wide it includes false positives, but missing the true best match in the coarse scan would be worse.

Known edge case: a colour can occasionally have its true nearest CIEDE2000 neighbour just outside the radius-28 sphere. In practice this is rare and the miss is a perceptually marginal difference.

---

## Confidence panel

After the two-pass match, we count how many names fall within each ΔE₀₀ band:
- `veryClose` (< 3): same-name zone human observers would likely call these the same colour
- `approximate` (3–10): related but perceptually distinct
- `distant` (10–28): within scan radius, clearly different

This is grounded in Berlin & Kay (1969) *Basic Color Terms*: colour categories have focal points and fuzzy boundaries. A colour at a focal point has few competitors in the veryClose band "unambiguous." A colour on the boundary between blue and green, or pink and red, has many "contested zone" or "disputed boundary."

The three-tier labels (≤2 veryClose → Unambiguous, ≤8 → Contested zone, >8 → Disputed boundary) are empirically calibrated against the meodai database. They're not derived from psychophysics they're thresholds chosen to produce intuitively correct labels for known edge cases like teal, coral, and cyan. They would need re-tuning if the database distribution changes significantly.

---

## Colour naming data: meodai/color-names

30,000+ hand-curated names from meodai/color-names. The main alternative would be a colorimetric standard like Pantone or NCS rigorous and systematic, but opaque (licensed, expensive) and not how people actually talk about colours.

The meodai dataset has human-given names from Crayola, Pantone where available, paint manufacturers, and community curation. The names are sometimes poetic ("Rackley", "Eerie Black") rather than systematic which is exactly what the Name tool is for. It tells you what a designer or a person would call a colour, not a spectrophotometric specification.

Accepted tradeoff: coverage is uneven. Some regions of colour space (reds, blues) are densely named; others are sparse. This means the veryClose band count correlates partly with database density, not just colour category sharpness. The confidence panel is showing the naming landscape in the database, not an objective category boundary and the About view says so.

---

## Palette analyser: OKLCH over Lab

The palette analysis (ViewStructure) works in OKLCH, not Lab or HSL.

OKLCH is the polar form of Oklab (Ottosson, 2020) a more perceptually uniform Lab variant, particularly for blues and purples where the classic CIELab model breaks down. In polar form: L is perceptual lightness, C is chroma (saturation amount), H is hue angle. Equal numeric steps in OKLCH produce equal-feeling perceptual changes across the full colour range.

HSL is not used because its lightness axis is not perceptually uniform. Two colours at HSL L=50% can look dramatically different in perceived brightness. OKLCH's L is reliable enough to sort, compare standard deviations, and flag gaps meaningfully.

The three palette metrics lightness uniformity (σ_L), chroma coherence (σ_C), and hue arc are all OKLCH-native. Stdev thresholds (σ < 5 for uniform lightness, σ < 0.04 for tight chroma) are tuned empirically against typical design system palettes; they're not derived from a standard.

---

## Polar plot

The polar plot renders the palette in OKLCH polar coordinates: hue → angle (0° at top, clockwise), chroma → radius (0–0.4 scale). This shows palette structure in a way a flat swatch strip cannot.

A principled palette following Munsell (1905) principles shows as a coherent cluster or arc consistent radius (chroma), evenly spaced angles (hue), no outliers. An ad-hoc palette scatters. The plot makes this visible immediately.

Concentric rings at C = 0.1, 0.2, 0.3, 0.4 provide chroma reference. Achromatic colours (C < 0.04) lose meaningful hue information plotting them at a random angle would be misleading, so they go to the centre.

Design choice: sRGB gamut mostly fits within C ≤ 0.37, so the outer ring at 0.4 clips almost nothing while keeping the scale readable.

---

## Simultaneous contrast panels (ViewDifference)

Beyond the raw ΔE number, the Difference view demonstrates the crispening effect: two colours appear more different when viewed against a background close to one of them, and less different against a neutral background. Reference: Whittle (1992).

This matters for design a pair that "looks fine in isolation" can fail in context. Three panels make this concrete:

1. **Neutral** (#56565A): achromatic mid-grey, no hue push. Baseline.
2. **Close to A**: shares A's hue and lightness, at half chroma. Background pulls perception towards A.
3. **Close to B**: same construction for B.

Each panel shows both swatches on that background plus the ΔE₀₀ against it. You can see the apparent difference shift without it being abstract.

The backgrounds are generated in OKLCH to guarantee they share only the intended dimensions (hue, lightness) while staying neutral enough not to overpower the comparison.

---

## Routing: no router library

ViewId is `useState<'about' | 'name' | 'structure' | 'difference'>`. No React Router, no TanStack Router, nothing.

Hexicon has four views, no deep-linkable state, no URL parsing, no history management, no nested routes. A router library adds a dependency and boilerplate for zero functional gain at this scale.

If deep-linking to a colour becomes valuable (e.g. `/name?hex=7193ED` for share links), that's the moment to add a router not before.

---

## Accepted tradeoffs

**Two-pass coverage**: rare case where the true CIEDE2000 nearest neighbour falls just outside the CIE76 radius-28 sphere. Perceptual difference at that range is marginal; not worth the cost of a larger radius.

**Confidence thresholds**: empirically chosen. Would need re-tuning against a significantly different naming database.

**No wide-gamut support**: hex input assumed sRGB. Display P3 colours from Figma or modern design tools will show clipped chroma in the palette analysis. Not a priority until CSS wide-gamut is more common in practice.

**Palette analysis limits**: metrics work best for palettes of 4–16 colours. Very small palettes (2–3) produce noisy stdev; very large ones (>20) make the polar plot crowded. The tool doesn't enforce limits results get noisier at the extremes.
