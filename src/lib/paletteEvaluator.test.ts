import { describe, it, expect } from 'vitest'
import { extractHexes, evaluatePalette } from './paletteEvaluator'

describe('extractHexes', () => {
  it('extracts a single 6-char hex', () => {
    expect(extractHexes('#FF0000')).toEqual(['#ff0000'])
  })

  it('expands 3-char shorthand to 6 chars', () => {
    expect(extractHexes('#FFF')).toEqual(['#ffffff'])
    expect(extractHexes('#0A3')).toEqual(['#00aa33'])
  })

  it('extracts multiple hexes from a string', () => {
    expect(extractHexes('color: #FF0000; background: #0000FF')).toEqual(['#ff0000', '#0000ff'])
  })

  it('deduplicates case-insensitively', () => {
    expect(extractHexes('#aabbcc #AABBCC')).toEqual(['#aabbcc'])
  })

  it('returns an empty array when no hexes are present', () => {
    expect(extractHexes('no hex colors here')).toEqual([])
  })

  it('does not carry state across multiple calls', () => {
    // Would fail if module-level regex with g flag retained lastIndex
    expect(extractHexes('#111111')).toEqual(['#111111'])
    expect(extractHexes('#222222')).toEqual(['#222222'])
    expect(extractHexes('#111111')).toEqual(['#111111'])
  })

  it('handles hex values embedded in CSS properties', () => {
    const css = 'color: #ABCDEF; border-color: #123456;'
    expect(extractHexes(css)).toEqual(['#abcdef', '#123456'])
  })
})

describe('evaluatePalette', () => {
  it('returns null for a single colour', () => {
    expect(evaluatePalette(['#FF0000'])).toBeNull()
  })

  it('returns scores for two colours', () => {
    const result = evaluatePalette(['#000000', '#FFFFFF'])
    expect(result).not.toBeNull()
    expect(result!.pairs).toHaveLength(1)
  })

  it('black and white pass both WCAG AA and AAA', () => {
    const result = evaluatePalette(['#000000', '#FFFFFF'])!
    expect(result.pairs[0].passAA).toBe(true)
    expect(result.pairs[0].passAAA).toBe(true)
  })

  it('reports 100% contrast coverage for a high-contrast pair', () => {
    const result = evaluatePalette(['#000000', '#FFFFFF'])!
    expect(result.contrastCoverage).toBe(100)
  })

  it('detects near-identical colours', () => {
    const result = evaluatePalette(['#808080', '#818181'])!
    expect(result.nearIdentical).toHaveLength(1)
  })

  it('counts C(n,2) pairs for n colours', () => {
    // 3 colours → 3 pairs, 4 colours → 6 pairs
    expect(evaluatePalette(['#FF0000', '#00FF00', '#0000FF'])!.pairs).toHaveLength(3)
    expect(evaluatePalette(['#FF0000', '#00FF00', '#0000FF', '#000000'])!.pairs).toHaveLength(6)
  })

  it('returns one lightness value per colour', () => {
    const hexes = ['#FF0000', '#00FF00', '#0000FF']
    const result = evaluatePalette(hexes)!
    expect(result.lightnessValues).toHaveLength(3)
  })

  it('flags noMidtones when range is wide but middle is empty', () => {
    // Very dark + very light, no midtones
    const result = evaluatePalette(['#050505', '#FAFAFA'])!
    expect(result.noMidtones).toBe(true)
  })
})
