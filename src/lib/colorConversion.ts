/**
 * Color conversion utilities using Culori
 * Handles conversions between hex, RGB, HSL, and OKLCH
 */

import {
  parse,
  formatHex,
  formatHex8,
  rgb,
  hsl,
  oklch,
  displayable,
  clampRgb,
  toGamut,
  type Color,
  type Rgb,
  type Hsl,
  type Oklch,
} from 'culori'

import type { ParsedColor } from '@/types/theme'

// ============================================================================
// Precision utilities
// ============================================================================

/**
 * Round a number to specified decimal places, avoiding floating-point artifacts
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Round RGB component (0-255, integer)
 */
export function roundRgb(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)))
}

/**
 * Round HSL hue (0-360, integer, wrapping)
 */
export function roundHue(value: number): number {
  const normalized = ((value % 360) + 360) % 360
  return Math.round(normalized)
}

/**
 * Round HSL saturation/lightness (0-100, integer)
 */
export function roundPercent(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)))
}

/**
 * Round OKLCH lightness (0-1, 3 decimals)
 */
export function roundOklchL(value: number): number {
  return roundTo(Math.max(0, Math.min(1, value)), 3)
}

/**
 * Round OKLCH chroma (0+, 3 decimals)
 */
export function roundOklchC(value: number): number {
  return roundTo(Math.max(0, value), 3)
}

/**
 * Round OKLCH hue (0-360, 1 decimal, wrapping)
 */
export function roundOklchH(value: number): number {
  const normalized = ((value % 360) + 360) % 360
  return roundTo(normalized, 1)
}

/**
 * Round alpha (0-1, 2 decimals)
 */
export function roundAlpha(value: number): number {
  return roundTo(Math.max(0, Math.min(1, value)), 2)
}

// ============================================================================
// Hex parsing
// ============================================================================

/**
 * Check if a string is a valid hex color
 */
export function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)
}

/**
 * Normalize hex to 6 or 8 digit format
 */
export function normalizeHex(hex: string): string {
  if (!isValidHex(hex)) {
    return hex
  }

  const h = hex.slice(1)

  // Expand 3-digit to 6-digit
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase()
  }

  // Expand 4-digit to 8-digit
  if (h.length === 4) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`.toUpperCase()
  }

  return hex.toUpperCase()
}

/**
 * Extract alpha from hex string (returns 1 if no alpha)
 */
export function extractAlphaFromHex(hex: string): number {
  const normalized = normalizeHex(hex)
  if (normalized.length === 9) {
    const alpha = parseInt(normalized.slice(7, 9), 16) / 255
    return roundAlpha(alpha)
  }
  return 1
}

/**
 * Parse any hex format to Culori color object
 */
export function parseHex(hex: string): Color | undefined {
  const normalized = normalizeHex(hex)
  return parse(normalized)
}

// ============================================================================
// Color conversions
// ============================================================================

/**
 * Convert any color to RGB object
 */
export function toRgb(color: Color | string): { r: number; g: number; b: number; alpha: number } {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return { r: 0, g: 0, b: 0, alpha: 1 }

  const rgbColor = rgb(c) as Rgb
  return {
    r: roundRgb((rgbColor.r ?? 0) * 255),
    g: roundRgb((rgbColor.g ?? 0) * 255),
    b: roundRgb((rgbColor.b ?? 0) * 255),
    alpha: roundAlpha(rgbColor.alpha ?? 1),
  }
}

/**
 * Convert any color to HSL object
 */
export function toHsl(color: Color | string): { h: number; s: number; l: number; alpha: number } {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return { h: 0, s: 0, l: 0, alpha: 1 }

  const hslColor = hsl(c) as Hsl
  return {
    h: roundHue((hslColor.h ?? 0)),
    s: roundPercent((hslColor.s ?? 0) * 100),
    l: roundPercent((hslColor.l ?? 0) * 100),
    alpha: roundAlpha(hslColor.alpha ?? 1),
  }
}

/**
 * Convert any color to OKLCH object
 */
export function toOklch(color: Color | string): { l: number; c: number; h: number; alpha: number } {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return { l: 0, c: 0, h: 0, alpha: 1 }

  const oklchColor = oklch(c) as Oklch
  return {
    l: roundOklchL(oklchColor.l ?? 0),
    c: roundOklchC(oklchColor.c ?? 0),
    h: roundOklchH(oklchColor.h ?? 0),
    alpha: roundAlpha(oklchColor.alpha ?? 1),
  }
}

/**
 * Convert any color to hex string (6 or 8 digit)
 */
export function toHex(color: Color | string, includeAlpha: boolean = true): string {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return '#000000'

  const rgbColor = rgb(c)
  if (!rgbColor) return '#000000'

  const alpha = rgbColor.alpha ?? 1
  if (includeAlpha && alpha < 1) {
    return formatHex8(rgbColor)?.toUpperCase() ?? '#000000FF'
  }

  return formatHex(rgbColor)?.toUpperCase() ?? '#000000'
}

// ============================================================================
// Creation functions (from individual values)
// ============================================================================

/**
 * Create color from RGB values (0-255)
 */
export function fromRgb(r: number, g: number, b: number, alpha: number = 1): Color {
  return {
    mode: 'rgb',
    r: r / 255,
    g: g / 255,
    b: b / 255,
    alpha,
  }
}

/**
 * Create color from HSL values (h: 0-360, s: 0-100, l: 0-100)
 */
export function fromHsl(h: number, s: number, l: number, alpha: number = 1): Color {
  return {
    mode: 'hsl',
    h,
    s: s / 100,
    l: l / 100,
    alpha,
  }
}

/**
 * Create color from OKLCH values (l: 0-1, c: 0+, h: 0-360)
 */
export function fromOklch(l: number, c: number, h: number, alpha: number = 1): Color {
  return {
    mode: 'oklch',
    l,
    c,
    h,
    alpha,
  }
}

// ============================================================================
// Gamut handling
// ============================================================================

/**
 * Check if a color is displayable in sRGB
 */
export function isInGamut(color: Color | string): boolean {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return false
  return displayable(c)
}

/**
 * Clamp color to sRGB gamut (fast, may shift appearance)
 */
export function clampToGamut(color: Color | string): Color {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return { mode: 'rgb', r: 0, g: 0, b: 0 }

  const rgbColor = rgb(c)
  if (!rgbColor) return { mode: 'rgb', r: 0, g: 0, b: 0 }

  return clampRgb(rgbColor)
}

/**
 * Gamut map color to sRGB (slower, better appearance preservation)
 * Uses OKLCH for chroma reduction which preserves hue better
 */
export function gamutMapToSrgb(color: Color | string): Color {
  const c = typeof color === 'string' ? parse(color) : color
  if (!c) return { mode: 'rgb', r: 0, g: 0, b: 0 }

  // toGamut(dest, mode, delta, jnd) - use OKLCH as working space
  return toGamut('rgb', 'oklch')(c)
}

// ============================================================================
// Full color parsing
// ============================================================================

/**
 * Parse a hex color string into all format representations
 */
export function parseColor(hexString: string): ParsedColor | null {
  if (!isValidHex(hexString)) {
    return null
  }

  const color = parseHex(hexString)
  if (!color) {
    return null
  }

  const rgbValues = toRgb(color)
  const hslValues = toHsl(color)
  const oklchValues = toOklch(color)

  return {
    hex: normalizeHex(hexString),
    rgb: { r: rgbValues.r, g: rgbValues.g, b: rgbValues.b },
    hsl: { h: hslValues.h, s: hslValues.s, l: hslValues.l },
    oklch: { l: oklchValues.l, c: oklchValues.c, h: oklchValues.h },
    alpha: rgbValues.alpha,
    isInGamut: isInGamut(color),
  }
}

/**
 * Convert parsed color back to hex string
 */
export function colorToHex(color: ParsedColor): string {
  if (color.alpha < 1) {
    const alphaHex = Math.round(color.alpha * 255).toString(16).padStart(2, '0').toUpperCase()
    return `${color.hex.slice(0, 7)}${alphaHex}`
  }
  return color.hex.slice(0, 7)
}

// ============================================================================
// Convenience conversion functions
// ============================================================================

/**
 * Convert HSL values directly to hex string
 */
export function hslToHex(h: number, s: number, l: number, a: number = 1): string {
  const color = fromHsl(h, s, l, a)
  return toHex(color)
}

/**
 * Convert hex string to HSL values
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number; a: number } | null {
  if (!isValidHex(hex)) return null
  const color = parseHex(hex)
  if (!color) return null
  const hslColor = toHsl(color)
  return { h: hslColor.h, s: hslColor.s, l: hslColor.l, a: hslColor.alpha }
}

/**
 * Convert RGB values directly to hex string
 */
export function rgbToHex(r: number, g: number, b: number, a: number = 1): string {
  const color = fromRgb(r, g, b, a)
  return toHex(color)
}

/**
 * Convert hex string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } | null {
  if (!isValidHex(hex)) return null
  const color = parseHex(hex)
  if (!color) return null
  const rgbColor = toRgb(color)
  return { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b, a: rgbColor.alpha }
}

/**
 * Convert OKLCH values directly to hex string
 */
export function oklchToHex(l: number, c: number, h: number, a: number = 1): string {
  const color = fromOklch(l, c, h, a)
  // Gamut map to ensure displayable color
  const mappedColor = gamutMapToSrgb(color)
  return toHex(mappedColor)
}

/**
 * Convert hex string to OKLCH values
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number; a: number } | null {
  if (!isValidHex(hex)) return null
  const color = parseHex(hex)
  if (!color) return null
  const oklchColor = toOklch(color)
  return { l: oklchColor.l, c: oklchColor.c, h: oklchColor.h, a: oklchColor.alpha }
}
