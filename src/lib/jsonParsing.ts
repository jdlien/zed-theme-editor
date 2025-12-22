/**
 * JSON5 parsing utilities with color normalization
 * Parses theme files and normalizes all colors to hex format
 */

import JSON5 from 'json5'
import type { ThemeFamily, ThemeStyle, HighlightStyle } from '@/types/theme'
import { isValidHex, normalizeHex } from './colorConversion'

export interface ParseResult {
  success: true
  data: ThemeFamily
  normalized: string
}

export interface ParseError {
  success: false
  error: string
  line?: number
  column?: number
}

export type ParseThemeResult = ParseResult | ParseError

/**
 * Check if a value looks like a color (hex format)
 */
export function isColorValue(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return isValidHex(value)
}

/**
 * Normalize a color value to uppercase hex format
 * Returns the original value if not a valid hex color
 */
export function normalizeColorValue(value: unknown): unknown {
  if (!isColorValue(value)) return value
  return normalizeHex(value)
}

/**
 * Recursively normalize all color values in an object
 */
export function normalizeColors<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (isColorValue(item)) {
        return normalizeColorValue(item)
      }
      return normalizeColors(item)
    }) as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (isColorValue(value)) {
        result[key] = normalizeColorValue(value)
      } else if (typeof value === 'object' && value !== null) {
        result[key] = normalizeColors(value)
      } else {
        result[key] = value
      }
    }
    return result as T
  }

  return obj
}

/**
 * Parse a JSON5 theme file and normalize colors
 */
export function parseThemeFile(content: string): ParseThemeResult {
  try {
    // Parse JSON5
    const parsed = JSON5.parse(content)

    // Validate basic structure
    if (!isValidThemeFamily(parsed)) {
      return {
        success: false,
        error: 'Invalid theme structure: missing required fields (name, author, themes)',
      }
    }

    // Normalize all colors to hex
    const normalized = normalizeColors(parsed) as ThemeFamily

    // Serialize back to JSON (not JSON5)
    const jsonString = JSON.stringify(normalized, null, 2)

    return {
      success: true,
      data: normalized,
      normalized: jsonString,
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Try to extract line/column from error message
      const match = err.message.match(/at position (\d+)/)
      const position = match ? parseInt(match[1], 10) : undefined

      let line: number | undefined
      let column: number | undefined

      if (position !== undefined) {
        const lines = content.slice(0, position).split('\n')
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }

      return {
        success: false,
        error: `JSON parse error: ${err.message}`,
        line,
        column,
      }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown parse error',
    }
  }
}

/**
 * Validate that an object has the basic ThemeFamily structure
 */
export function isValidThemeFamily(obj: unknown): obj is ThemeFamily {
  if (!obj || typeof obj !== 'object') return false

  const family = obj as Partial<ThemeFamily>

  return (
    typeof family.name === 'string' &&
    typeof family.author === 'string' &&
    Array.isArray(family.themes) &&
    family.themes.length > 0 &&
    family.themes.every(isValidTheme)
  )
}

/**
 * Validate that an object is a valid Theme
 */
function isValidTheme(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  const theme = obj as Record<string, unknown>

  return (
    typeof theme.name === 'string' &&
    (theme.appearance === 'light' || theme.appearance === 'dark') &&
    typeof theme.style === 'object' &&
    theme.style !== null
  )
}

/**
 * Extract all color entries from a theme style object
 * Returns flat list with paths for each color
 *
 * Note: Uses segment arrays to handle keys with dots (e.g., "editor.background")
 */
export interface ColorEntry {
  /** Display path for UI (uses / separator to avoid ambiguity with dotted keys) */
  path: string
  /** Array of path segments for navigation */
  segments: string[]
  /** The property key (last segment) */
  key: string
  /** The color value */
  value: string
}

/** Convert segments array to display path */
function segmentsToPath(segments: string[]): string {
  return segments.join('/')
}

export function extractColors(style: ThemeStyle, basePath: string = 'style'): ColorEntry[] {
  const colors: ColorEntry[] = []

  function traverse(obj: unknown, segments: string[]): void {
    if (obj === null || obj === undefined) return

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const currentSegments = [...segments, key]

        if (isColorValue(value)) {
          colors.push({
            path: segmentsToPath(currentSegments),
            segments: currentSegments,
            key,
            value: value as string,
          })
        } else if (key === 'accents' && Array.isArray(value)) {
          // Handle accents color array
          value.forEach((accentColor, index) => {
            if (isColorValue(accentColor)) {
              const accentSegments = [...currentSegments, `[${index}]`]
              colors.push({
                path: segmentsToPath(accentSegments),
                segments: accentSegments,
                key: `accents[${index}]`,
                value: accentColor as string,
              })
            }
          })
        } else if (key === 'syntax' && typeof value === 'object' && value !== null) {
          // Handle syntax highlighting specially
          for (const [syntaxKey, syntaxValue] of Object.entries(value as Record<string, HighlightStyle>)) {
            if (syntaxValue && typeof syntaxValue === 'object') {
              if (isColorValue(syntaxValue.color)) {
                const syntaxSegments = [...currentSegments, syntaxKey, 'color']
                colors.push({
                  path: segmentsToPath(syntaxSegments),
                  segments: syntaxSegments,
                  key: `${syntaxKey}.color`,
                  value: syntaxValue.color,
                })
              }
              if (isColorValue(syntaxValue.background_color)) {
                const syntaxSegments = [...currentSegments, syntaxKey, 'background_color']
                colors.push({
                  path: segmentsToPath(syntaxSegments),
                  segments: syntaxSegments,
                  key: `${syntaxKey}.background_color`,
                  value: syntaxValue.background_color,
                })
              }
            }
          }
        } else if (key === 'players' && Array.isArray(value)) {
          // Handle players array
          value.forEach((player, index) => {
            if (player && typeof player === 'object') {
              for (const [pKey, pValue] of Object.entries(player as Record<string, unknown>)) {
                if (isColorValue(pValue)) {
                  const playerSegments = [...currentSegments, `[${index}]`, pKey]
                  colors.push({
                    path: segmentsToPath(playerSegments),
                    segments: playerSegments,
                    key: `players[${index}].${pKey}`,
                    value: pValue as string,
                  })
                }
              }
            }
          })
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, currentSegments)
        }
      }
    }
  }

  traverse(style, [basePath])
  return colors
}

/**
 * Extract colors as a Map for quick lookup by path
 * Useful for comparing current colors to original colors
 */
export function extractColorsAsMap(style: ThemeStyle, basePath: string = 'style'): Map<string, string> {
  const colors = extractColors(style, basePath)
  return new Map(colors.map((c) => [c.path, c.value]))
}

/**
 * Update a color value at a specific path in the theme
 * Accepts either a segments array or a /-separated path string
 */
export function updateColorAtPath(
  theme: ThemeFamily,
  themeIndex: number,
  pathOrSegments: string | string[],
  newValue: string
): ThemeFamily {
  // Deep clone to avoid mutations
  const updated = JSON.parse(JSON.stringify(theme)) as ThemeFamily

  // Parse the path into segments
  const segments = Array.isArray(pathOrSegments)
    ? pathOrSegments
    : pathOrSegments.split('/').filter(Boolean)

  // Navigate to the parent and update
  let current: unknown = updated.themes[themeIndex]

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]

    // Handle array index like "[0]"
    const arrayIndexMatch = segment.match(/^\[(\d+)\]$/)
    if (arrayIndexMatch) {
      const index = parseInt(arrayIndexMatch[1], 10)
      current = (current as unknown[])[index]
    } else {
      current = (current as Record<string, unknown>)[segment]
    }

    if (current === undefined || current === null) {
      return theme // Path doesn't exist, return unchanged
    }
  }

  // Set the final value
  const lastSegment = segments[segments.length - 1]
  const arrayIndexMatch = lastSegment.match(/^\[(\d+)\]$/)

  if (arrayIndexMatch) {
    const index = parseInt(arrayIndexMatch[1], 10)
    ;(current as unknown[])[index] = newValue
  } else {
    (current as Record<string, unknown>)[lastSegment] = newValue
  }

  return updated
}

/**
 * Serialize theme to JSON string for saving
 */
export function serializeTheme(theme: ThemeFamily): string {
  return JSON.stringify(theme, null, 2)
}

/**
 * Get color statistics from a theme
 */
export interface ColorStats {
  totalColors: number
  uniqueColors: number
  colorsByCategory: Record<string, number>
}

export function getColorStats(style: ThemeStyle): ColorStats {
  const colors = extractColors(style)
  const uniqueSet = new Set(colors.map((c) => c.value.toUpperCase()))

  const categories: Record<string, number> = {}
  for (const color of colors) {
    // Extract category from the key (e.g., "editor.background" -> "editor")
    const keyParts = color.key.split('.')
    const category = keyParts.length > 1 ? keyParts[0] : 'other'
    categories[category] = (categories[category] || 0) + 1
  }

  return {
    totalColors: colors.length,
    uniqueColors: uniqueSet.size,
    colorsByCategory: categories,
  }
}
