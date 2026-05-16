import { describe, it, expect } from 'vitest'
import { parseHex, isValidHex, nameColour } from './colourMatcher'

describe('parseHex', () => {
  it('returns uppercase 6-char hex for valid input', () => {
    expect(parseHex('#a1b2c3')).toBe('#A1B2C3')
  })

  it('expands 3-char shorthand to 6 chars', () => {
    expect(parseHex('#fff')).toBe('#FFFFFF')
    expect(parseHex('#FFF')).toBe('#FFFFFF')
    expect(parseHex('#0a3')).toBe('#00AA33')
  })

  it('trims surrounding whitespace', () => {
    expect(parseHex(' #AABBCC ')).toBe('#AABBCC')
  })

  it('returns null when hash is missing', () => {
    expect(parseHex('A1B2C3')).toBeNull()
  })

  it('returns null for invalid lengths (4 and 5 chars)', () => {
    expect(parseHex('#A1B2')).toBeNull()
    expect(parseHex('#A1B2C')).toBeNull()
  })

  it('returns null for non-hex characters', () => {
    expect(parseHex('#GGHHII')).toBeNull()
  })

  it('accepts lowercase hex digits', () => {
    expect(parseHex('#abcdef')).toBe('#ABCDEF')
  })
})

describe('isValidHex', () => {
  it('returns true for a valid 6-char hex', () => {
    expect(isValidHex('#000000')).toBe(true)
  })

  it('returns true for a valid 3-char hex', () => {
    expect(isValidHex('#FFF')).toBe(true)
  })

  it('returns false for invalid strings', () => {
    expect(isValidHex('not a hex')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('')).toBe(false)
  })
})

describe('nameColour', () => {
  it('returns null for invalid hex', () => {
    expect(nameColour('invalid')).toBeNull()
  })

  it('finds an exact match for black', () => {
    const result = nameColour('#000000')
    expect(result).not.toBeNull()
    expect(result!.best.distance).toBe(0)
    expect(result!.best.name.toLowerCase()).toContain('black')
  })

  it('finds an exact match for white', () => {
    const result = nameColour('#FFFFFF')
    expect(result).not.toBeNull()
    expect(result!.best.distance).toBe(0)
    expect(result!.best.name.toLowerCase()).toContain('white')
  })

  it('returns exactly 4 runners-up', () => {
    const result = nameColour('#A1B2C3')
    expect(result!.runners).toHaveLength(4)
  })

  it('returns correct RGB components for pure red', () => {
    const result = nameColour('#FF0000')
    expect(result!.rgb).toEqual([255, 0, 0])
  })

  it('returns hue 0 for pure red', () => {
    const result = nameColour('#FF0000')
    expect(result!.hsl[0]).toBe(0)
  })

  it('marks dark colours as not light', () => {
    expect(nameColour('#111111')!.isLight).toBe(false)
  })

  it('marks light colours as light', () => {
    expect(nameColour('#EEEEEE')!.isLight).toBe(true)
  })

  it('runners are sorted by ascending distance', () => {
    const result = nameColour('#A1B2C3')!
    for (let i = 1; i < result.runners.length; i++) {
      expect(result.runners[i].distance).toBeGreaterThanOrEqual(result.runners[i - 1].distance)
    }
  })
})
