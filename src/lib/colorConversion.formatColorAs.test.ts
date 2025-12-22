/**
 * Tests for formatColorAs function
 */

import { describe, it, expect } from 'vitest'
import { formatColorAs, parseColor } from './colorConversion'

describe('formatColorAs', () => {
  it('formats as hex', () => {
    const parsed = parseColor('#ff0000')!
    expect(formatColorAs(parsed, 'hex')).toBe('#FF0000')
  })

  it('formats as rgb', () => {
    const parsed = parseColor('#ff0000')!
    expect(formatColorAs(parsed, 'rgb')).toBe('rgb(255, 0, 0)')
  })

  it('formats as rgba with alpha', () => {
    const parsed = parseColor('#ff000080')!
    const result = formatColorAs(parsed, 'rgb')
    expect(result).toMatch(/^rgba\(255, 0, 0, 0\.5\d*\)$/)
  })

  it('formats as hsl', () => {
    const parsed = parseColor('#ff0000')!
    expect(formatColorAs(parsed, 'hsl')).toBe('hsl(000 100% 50%)')
  })

  it('formats as hsla with alpha', () => {
    const parsed = parseColor('#ff000080')!
    const result = formatColorAs(parsed, 'hsl')
    // Modern HSL syntax with zero-padded hue and slash for alpha
    expect(result).toMatch(/^hsl\(000 100% 50% \/ 0\.5\d*\)$/)
  })

  it('formats as oklch', () => {
    const parsed = parseColor('#ff0000')!
    const result = formatColorAs(parsed, 'oklch')
    expect(result).toMatch(/^oklch\(0\.\d+ 0\.\d+ \d+\.\d\)$/)
  })

  it('formats as oklch with alpha', () => {
    const parsed = parseColor('#ff000080')!
    const result = formatColorAs(parsed, 'oklch')
    expect(result).toMatch(/oklch\(.+ \/ 0\.5\d*\)$/)
  })

  it('returns hex for unknown format', () => {
    const parsed = parseColor('#ff0000')!
    expect(formatColorAs(parsed, 'unknown' as 'hex')).toBe('#FF0000')
  })

  it('handles white color', () => {
    const parsed = parseColor('#ffffff')!
    expect(formatColorAs(parsed, 'rgb')).toBe('rgb(255, 255, 255)')
    expect(formatColorAs(parsed, 'hsl')).toBe('hsl(000 0% 100%)')
  })

  it('handles black color', () => {
    const parsed = parseColor('#000000')!
    expect(formatColorAs(parsed, 'rgb')).toBe('rgb(0, 0, 0)')
    expect(formatColorAs(parsed, 'hsl')).toBe('hsl(000 0% 0%)')
  })
})
