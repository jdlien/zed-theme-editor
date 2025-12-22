import { describe, it, expect } from 'vitest'
import {
  isValidHex,
  normalizeHex,
  extractAlphaFromHex,
  parseColor,
  colorToHex,
  toRgb,
  toHsl,
  toOklch,
  toHex,
  fromRgb,
  fromHsl,
  fromOklch,
  isInGamut,
  clampToGamut,
  roundTo,
  roundRgb,
  roundHue,
  roundOklchL,
  roundOklchC,
  roundOklchH,
  roundAlpha,
} from './colorConversion'

describe('Precision utilities', () => {
  describe('roundTo', () => {
    it('rounds to specified decimals', () => {
      expect(roundTo(0.123456, 2)).toBe(0.12)
      expect(roundTo(0.125, 2)).toBe(0.13)
      expect(roundTo(0.1 + 0.2, 1)).toBe(0.3) // Avoids floating-point error
    })
  })

  describe('roundRgb', () => {
    it('rounds RGB values to integers', () => {
      expect(roundRgb(127.4)).toBe(127)
      expect(roundRgb(127.6)).toBe(128)
    })

    it('clamps to valid range', () => {
      expect(roundRgb(-10)).toBe(0)
      expect(roundRgb(300)).toBe(255)
    })
  })

  describe('roundHue', () => {
    it('wraps hue to 0-360', () => {
      expect(roundHue(0)).toBe(0)
      expect(roundHue(360)).toBe(0)
      expect(roundHue(370)).toBe(10)
      expect(roundHue(-10)).toBe(350)
      expect(roundHue(-370)).toBe(350)
    })
  })

  describe('OKLCH rounding', () => {
    it('roundOklchL clamps to 0-1 with 3 decimals', () => {
      expect(roundOklchL(0.5)).toBe(0.5)
      expect(roundOklchL(0.12345)).toBe(0.123)
      expect(roundOklchL(-0.1)).toBe(0)
      expect(roundOklchL(1.5)).toBe(1)
    })

    it('roundOklchC allows values > 0 with 3 decimals', () => {
      expect(roundOklchC(0.15)).toBe(0.15)
      expect(roundOklchC(0.12345)).toBe(0.123)
      expect(roundOklchC(-0.1)).toBe(0)
      expect(roundOklchC(0.5)).toBe(0.5) // High chroma allowed
    })

    it('roundOklchH wraps with 1 decimal', () => {
      expect(roundOklchH(180)).toBe(180)
      expect(roundOklchH(180.16)).toBe(180.2)
      expect(roundOklchH(370)).toBe(10)
    })
  })

  describe('roundAlpha', () => {
    it('clamps to 0-1 with 2 decimals', () => {
      expect(roundAlpha(0.5)).toBe(0.5)
      expect(roundAlpha(0.123)).toBe(0.12)
      expect(roundAlpha(-0.1)).toBe(0)
      expect(roundAlpha(1.5)).toBe(1)
    })
  })
})

describe('Hex validation and parsing', () => {
  describe('isValidHex', () => {
    it('accepts valid hex formats', () => {
      expect(isValidHex('#FFF')).toBe(true)
      expect(isValidHex('#FFFF')).toBe(true)
      expect(isValidHex('#FFFFFF')).toBe(true)
      expect(isValidHex('#FFFFFFFF')).toBe(true)
      expect(isValidHex('#abc')).toBe(true)
      expect(isValidHex('#AbCdEf')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(isValidHex('FFF')).toBe(false) // Missing #
      expect(isValidHex('#FF')).toBe(false) // Too short
      expect(isValidHex('#FFFFF')).toBe(false) // Wrong length
      expect(isValidHex('#FFFFFG')).toBe(false) // Invalid character
      expect(isValidHex('')).toBe(false)
    })
  })

  describe('normalizeHex', () => {
    it('expands 3-digit to 6-digit', () => {
      expect(normalizeHex('#FFF')).toBe('#FFFFFF')
      expect(normalizeHex('#abc')).toBe('#AABBCC')
    })

    it('expands 4-digit to 8-digit', () => {
      expect(normalizeHex('#FFFF')).toBe('#FFFFFFFF')
      expect(normalizeHex('#abcd')).toBe('#AABBCCDD')
    })

    it('uppercases 6 and 8 digit', () => {
      expect(normalizeHex('#ffffff')).toBe('#FFFFFF')
      expect(normalizeHex('#ffffffaa')).toBe('#FFFFFFAA')
    })

    it('returns invalid hex unchanged', () => {
      expect(normalizeHex('not-hex')).toBe('not-hex')
    })
  })

  describe('extractAlphaFromHex', () => {
    it('returns 1 for 6-digit hex', () => {
      expect(extractAlphaFromHex('#FFFFFF')).toBe(1)
    })

    it('extracts alpha from 8-digit hex', () => {
      expect(extractAlphaFromHex('#FFFFFF80')).toBe(0.5)
      expect(extractAlphaFromHex('#FFFFFFFF')).toBe(1)
      expect(extractAlphaFromHex('#FFFFFF00')).toBe(0)
    })

    it('handles shorthand with alpha', () => {
      expect(extractAlphaFromHex('#FFF8')).toBe(0.53) // 88/255 ≈ 0.345 rounded to 0.35
    })
  })
})

describe('Color conversions', () => {
  describe('toRgb', () => {
    it('converts hex to RGB', () => {
      expect(toRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0, alpha: 1 })
      expect(toRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0, alpha: 1 })
      expect(toRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255, alpha: 1 })
    })

    it('preserves alpha', () => {
      const result = toRgb('#FF000080')
      expect(result.r).toBe(255)
      expect(result.alpha).toBe(0.5)
    })
  })

  describe('toHsl', () => {
    it('converts hex to HSL', () => {
      const red = toHsl('#FF0000')
      expect(red.h).toBe(0)
      expect(red.s).toBe(100)
      expect(red.l).toBe(50)
    })

    it('handles grays (undefined hue)', () => {
      const gray = toHsl('#808080')
      expect(gray.s).toBe(0)
    })
  })

  describe('toOklch', () => {
    it('converts hex to OKLCH', () => {
      const result = toOklch('#FF0000')
      expect(result.l).toBeGreaterThan(0)
      expect(result.l).toBeLessThanOrEqual(1)
      expect(result.c).toBeGreaterThan(0)
    })
  })

  describe('toHex', () => {
    it('converts color object to hex', () => {
      const color = fromRgb(255, 0, 0)
      expect(toHex(color)).toBe('#FF0000')
    })

    it('includes alpha when less than 1', () => {
      const color = fromRgb(255, 0, 0, 0.5)
      expect(toHex(color)).toBe('#FF000080')
    })

    it('excludes alpha when 1', () => {
      const color = fromRgb(255, 0, 0, 1)
      expect(toHex(color)).toBe('#FF0000')
    })
  })
})

describe('Creation functions', () => {
  describe('fromRgb', () => {
    it('creates color from RGB values', () => {
      const color = fromRgb(255, 128, 0)
      const back = toRgb(color)
      expect(back.r).toBe(255)
      expect(back.g).toBe(128)
      expect(back.b).toBe(0)
    })
  })

  describe('fromHsl', () => {
    it('creates color from HSL values', () => {
      const color = fromHsl(0, 100, 50)
      const hex = toHex(color)
      expect(hex).toBe('#FF0000')
    })
  })

  describe('fromOklch', () => {
    it('creates color from OKLCH values', () => {
      const color = fromOklch(0.5, 0.15, 180)
      expect(color.mode).toBe('oklch')
    })
  })
})

describe('Gamut handling', () => {
  describe('isInGamut', () => {
    it('returns true for sRGB colors', () => {
      expect(isInGamut('#FF0000')).toBe(true)
      expect(isInGamut('#000000')).toBe(true)
      expect(isInGamut('#FFFFFF')).toBe(true)
    })

    it('returns false for out-of-gamut OKLCH', () => {
      // Very high chroma at high lightness is out of gamut
      const outOfGamut = fromOklch(0.9, 0.4, 150)
      expect(isInGamut(outOfGamut)).toBe(false)
    })
  })

  describe('clampToGamut', () => {
    it('clamps out-of-gamut colors', () => {
      const outOfGamut = fromOklch(0.9, 0.4, 150)
      const clamped = clampToGamut(outOfGamut)
      expect(isInGamut(clamped)).toBe(true)
    })
  })
})

describe('Full color parsing', () => {
  describe('parseColor', () => {
    it('parses valid hex to all formats', () => {
      const result = parseColor('#FF5500')
      expect(result).not.toBeNull()
      expect(result!.hex).toBe('#FF5500')
      expect(result!.rgb.r).toBe(255)
      expect(result!.rgb.g).toBe(85)
      expect(result!.rgb.b).toBe(0)
      expect(result!.alpha).toBe(1)
      expect(result!.isInGamut).toBe(true)
    })

    it('handles alpha channel', () => {
      const result = parseColor('#FF550080')
      expect(result).not.toBeNull()
      expect(result!.alpha).toBe(0.5)
    })

    it('returns null for invalid hex', () => {
      expect(parseColor('not-hex')).toBeNull()
      expect(parseColor('')).toBeNull()
    })
  })
})

describe('Bidirectional conversion accuracy', () => {
  it('RGB → hex → RGB preserves values', () => {
    const original = { r: 100, g: 150, b: 200 }
    const color = fromRgb(original.r, original.g, original.b)
    const hex = toHex(color)
    const back = toRgb(hex)
    expect(back.r).toBe(original.r)
    expect(back.g).toBe(original.g)
    expect(back.b).toBe(original.b)
  })

  it('HSL → hex → HSL preserves values (within rounding)', () => {
    const original = { h: 180, s: 50, l: 50 }
    const color = fromHsl(original.h, original.s, original.l)
    const hex = toHex(color)
    const back = toHsl(hex)
    expect(back.h).toBe(original.h)
    expect(back.s).toBe(original.s)
    expect(back.l).toBe(original.l)
  })
})

describe('colorToHex', () => {
  it('converts opaque color to 6-digit hex', () => {
    const parsed = parseColor('#FF5500')
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    expect(result).toBe('#FF5500')
  })

  it('converts color with alpha to 8-digit hex', () => {
    const parsed = parseColor('#FF550080')
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    // Alpha 0.5 (128/255) should be represented as 80 hex
    expect(result).toBe('#FF550080')
  })

  it('strips alpha channel when alpha is 1', () => {
    const parsed = parseColor('#FF5500')
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    // Should not include FF alpha suffix
    expect(result.length).toBe(7)
    expect(result).not.toMatch(/FF$/i)
  })

  it('handles fully transparent color', () => {
    const parsed = parseColor('#FF550000')
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    expect(result).toBe('#FF550000')
  })

  it('handles partially transparent color', () => {
    const parsed = parseColor('#AABBCCCC') // ~80% opacity
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    expect(result).toMatch(/^#[0-9A-F]{8}$/i)
    expect(result.length).toBe(9) // 8 digits + #
  })

  it('preserves original hex when no alpha', () => {
    const parsed = parseColor('#123456')
    expect(parsed).not.toBeNull()
    const result = colorToHex(parsed!)
    expect(result).toBe('#123456')
  })

  it('rounds alpha correctly', () => {
    // Test that alpha is correctly rounded to hex
    const parsed = parseColor('#FF5500FF') // Full opacity
    expect(parsed).not.toBeNull()
    // Should return just 6-digit hex when alpha is 1
    const result = colorToHex(parsed!)
    expect(result).toBe('#FF5500')
  })
})
