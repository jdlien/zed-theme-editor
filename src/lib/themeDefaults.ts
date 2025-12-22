/**
 * Theme Defaults
 * Provides default color values from Zed's One Dark and One Light themes
 */

import oneTheme from '../../themes/one.json'

type Appearance = 'dark' | 'light'

interface OneTheme {
  themes: Array<{
    name: string
    appearance: string
    style: Record<string, unknown>
  }>
}

/**
 * Recursively flattens nested style objects into dot-notation keys
 * e.g., { border: { focused: "#color" } } -> { "border.focused": "#color" }
 */
function flattenStyleColors(style: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}

  function traverse(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string' && value.startsWith('#')) {
        // It's a color value
        result[fullKey] = value
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recurse into nested objects (but skip arrays like players, accents)
        traverse(value as Record<string, unknown>, fullKey)
      }
      // Skip null, arrays, and non-color strings
    }
  }

  traverse(style)
  return result
}

// Pre-compute defaults at module load
const typedTheme = oneTheme as OneTheme
const oneDark = typedTheme.themes.find((t) => t.name === 'One Dark')
const oneLight = typedTheme.themes.find((t) => t.name === 'One Light')

/* v8 ignore next 2 -- defensive: One theme always contains these themes */
export const DARK_DEFAULTS = flattenStyleColors(oneDark?.style || {})
export const LIGHT_DEFAULTS = flattenStyleColors(oneLight?.style || {})

/**
 * Get the default color for a theme property based on appearance
 * Falls back to gray if the property isn't defined in the base theme
 */
export function getDefaultColor(key: string, appearance: Appearance): string {
  const defaults = appearance === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS
  return defaults[key] || '#808080'
}
