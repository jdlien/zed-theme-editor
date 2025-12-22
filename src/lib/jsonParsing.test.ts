import { describe, it, expect } from 'vitest'
import {
  isColorValue,
  normalizeColorValue,
  normalizeColors,
  parseThemeFile,
  isValidThemeFamily,
  extractColors,
  updateColorAtPath,
  serializeTheme,
  getColorStats,
} from './jsonParsing'

describe('isColorValue', () => {
  it('recognizes valid hex colors', () => {
    expect(isColorValue('#FFF')).toBe(true)
    expect(isColorValue('#FFFF')).toBe(true)
    expect(isColorValue('#FFFFFF')).toBe(true)
    expect(isColorValue('#FFFFFFFF')).toBe(true)
    expect(isColorValue('#abc123')).toBe(true)
  })

  it('rejects non-hex strings', () => {
    expect(isColorValue('red')).toBe(false)
    expect(isColorValue('rgb(255,0,0)')).toBe(false)
    expect(isColorValue('transparent')).toBe(false)
    expect(isColorValue('opaque')).toBe(false)
    expect(isColorValue('')).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isColorValue(null)).toBe(false)
    expect(isColorValue(undefined)).toBe(false)
    expect(isColorValue(123)).toBe(false)
    expect(isColorValue({})).toBe(false)
  })
})

describe('normalizeColorValue', () => {
  it('normalizes valid hex colors', () => {
    expect(normalizeColorValue('#fff')).toBe('#FFFFFF')
    expect(normalizeColorValue('#ABC')).toBe('#AABBCC')
    expect(normalizeColorValue('#abcdef')).toBe('#ABCDEF')
  })

  it('returns non-colors unchanged', () => {
    expect(normalizeColorValue('opaque')).toBe('opaque')
    expect(normalizeColorValue(null)).toBe(null)
    expect(normalizeColorValue(123)).toBe(123)
  })
})

describe('normalizeColors', () => {
  it('normalizes colors in nested objects', () => {
    const input = {
      background: '#fff',
      nested: {
        color: '#abc',
      },
    }

    const result = normalizeColors(input)
    expect(result.background).toBe('#FFFFFF')
    expect(result.nested.color).toBe('#AABBCC')
  })

  it('handles arrays', () => {
    const input = {
      colors: ['#fff', '#000'],
    }

    const result = normalizeColors(input)
    expect(result.colors).toEqual(['#FFFFFF', '#000000'])
  })

  it('preserves non-color values', () => {
    const input = {
      name: 'Test',
      count: 42,
      enabled: true,
      empty: null,
    }

    const result = normalizeColors(input)
    expect(result).toEqual(input)
  })
})

describe('parseThemeFile', () => {
  const validTheme = `{
    "name": "Test Theme",
    "author": "Tester",
    "themes": [
      {
        "name": "Dark",
        "appearance": "dark",
        "style": {
          "background": "#121212",
          "text": "#fff"
        }
      }
    ]
  }`

  it('parses valid JSON theme', () => {
    const result = parseThemeFile(validTheme)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Test Theme')
      expect(result.data.themes[0].style.background).toBe('#121212')
      expect(result.data.themes[0].style.text).toBe('#FFFFFF')
    }
  })

  it('parses JSON5 with trailing commas', () => {
    const json5 = `{
      name: "Test",
      author: "Tester",
      themes: [{
        name: "Dark",
        appearance: "dark",
        style: {
          background: "#000",
        },
      }],
    }`

    const result = parseThemeFile(json5)
    expect(result.success).toBe(true)
  })

  it('parses JSON5 with comments', () => {
    const json5 = `{
      // Theme name
      name: "Test",
      author: "Tester",
      /* Multi-line
         comment */
      themes: [{
        name: "Dark",
        appearance: "dark",
        style: {}
      }]
    }`

    const result = parseThemeFile(json5)
    expect(result.success).toBe(true)
  })

  it('returns error for invalid JSON', () => {
    const invalid = '{ invalid json }'
    const result = parseThemeFile(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('parse error')
    }
  })

  it('returns error for missing required fields', () => {
    const incomplete = '{ "name": "Test" }'
    const result = parseThemeFile(incomplete)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid theme structure')
    }
  })

  it('normalizes colors in result', () => {
    const result = parseThemeFile(validTheme)
    expect(result.success).toBe(true)
    if (result.success) {
      // #fff should be normalized to #FFFFFF
      expect(result.data.themes[0].style.text).toBe('#FFFFFF')
    }
  })

  it('returns normalized JSON string', () => {
    const result = parseThemeFile(validTheme)
    expect(result.success).toBe(true)
    if (result.success) {
      // Should be valid JSON (not JSON5)
      expect(() => JSON.parse(result.normalized)).not.toThrow()
    }
  })
})

describe('isValidThemeFamily', () => {
  it('validates correct structure', () => {
    const valid = {
      name: 'Test',
      author: 'Tester',
      themes: [
        { name: 'Dark', appearance: 'dark', style: {} },
      ],
    }
    expect(isValidThemeFamily(valid)).toBe(true)
  })

  it('rejects missing name', () => {
    expect(isValidThemeFamily({ author: 'x', themes: [] })).toBe(false)
  })

  it('rejects missing author', () => {
    expect(isValidThemeFamily({ name: 'x', themes: [] })).toBe(false)
  })

  it('rejects empty themes array', () => {
    expect(isValidThemeFamily({ name: 'x', author: 'y', themes: [] })).toBe(false)
  })

  it('rejects invalid appearance', () => {
    const invalid = {
      name: 'Test',
      author: 'Tester',
      themes: [{ name: 'Bad', appearance: 'invalid', style: {} }],
    }
    expect(isValidThemeFamily(invalid)).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(isValidThemeFamily(null)).toBe(false)
    expect(isValidThemeFamily('string')).toBe(false)
    expect(isValidThemeFamily(123)).toBe(false)
  })
})

describe('extractColors', () => {
  it('extracts top-level colors', () => {
    const style = {
      background: '#121212',
      text: '#FFFFFF',
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(2)
    expect(colors.find((c) => c.key === 'background')?.value).toBe('#121212')
  })

  it('extracts nested colors', () => {
    const style = {
      'editor.background': '#000000',
      'terminal.ansi.red': '#FF0000',
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(2)
  })

  it('extracts syntax highlighting colors', () => {
    const style = {
      syntax: {
        keyword: { color: '#FF0000', font_style: 'italic' as const },
        string: { color: '#00FF00' },
      },
    }

    const colors = extractColors(style as Parameters<typeof extractColors>[0])
    expect(colors).toHaveLength(2)
    // Path uses / separator now
    expect(colors.find((c) => c.path.includes('keyword/color'))).toBeDefined()
  })

  it('ignores null and non-color values', () => {
    const style = {
      background: '#121212',
      appearance: 'opaque',
      empty: null,
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(1)
  })

  it('handles players array', () => {
    const style = {
      players: [
        { background: '#FF0000', cursor: '#00FF00' },
        { background: '#0000FF' },
      ],
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(3)
  })

  it('handles accents array', () => {
    const style = {
      accents: ['#FF0000', '#00FF00', '#0000FF'],
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(3)
    expect(colors[0].path).toBe('style/accents/[0]')
    expect(colors[0].key).toBe('accents[0]')
    expect(colors[0].value).toBe('#FF0000')
  })

  it('extracts dotted keys with correct segments', () => {
    const style = {
      'editor.background': '#000000',
      'comment.doc': '#888888',
    }

    const colors = extractColors(style)
    expect(colors).toHaveLength(2)

    const editorBg = colors.find((c) => c.key === 'editor.background')
    expect(editorBg).toBeDefined()
    expect(editorBg?.segments).toEqual(['style', 'editor.background'])
    expect(editorBg?.path).toBe('style/editor.background')
  })
})

describe('updateColorAtPath', () => {
  const baseTheme = {
    name: 'Test',
    author: 'Tester',
    themes: [
      {
        name: 'Dark',
        appearance: 'dark' as const,
        style: {
          background: '#121212',
          text: '#FFFFFF',
          syntax: {
            keyword: { color: '#FF0000' },
          },
        },
      },
    ],
  }

  it('updates top-level color', () => {
    const result = updateColorAtPath(baseTheme, 0, 'style/background', '#000000')
    expect(result.themes[0].style.background).toBe('#000000')
    // Original unchanged
    expect(baseTheme.themes[0].style.background).toBe('#121212')
  })

  it('updates nested syntax color', () => {
    const result = updateColorAtPath(
      baseTheme,
      0,
      'style/syntax/keyword/color',
      '#00FF00'
    )
    expect(result.themes[0].style.syntax?.keyword.color).toBe('#00FF00')
  })

  it('returns unchanged theme for invalid path', () => {
    const result = updateColorAtPath(baseTheme, 0, 'style/nonexistent/path', '#000')
    expect(result).toEqual(baseTheme)
  })

  it('updates dotted keys like editor.background', () => {
    const themeWithDottedKeys = {
      name: 'Test',
      author: 'Tester',
      themes: [
        {
          name: 'Dark',
          appearance: 'dark' as const,
          style: {
            'editor.background': '#121212',
            'editor.foreground': '#FFFFFF',
          },
        },
      ],
    }

    // Use segments array to handle dotted key
    const result = updateColorAtPath(
      themeWithDottedKeys,
      0,
      ['style', 'editor.background'],
      '#000000'
    )

    expect((result.themes[0].style as Record<string, string>)['editor.background']).toBe('#000000')
    expect((result.themes[0].style as Record<string, string>)['editor.foreground']).toBe('#FFFFFF')
  })
})

describe('serializeTheme', () => {
  it('produces valid JSON', () => {
    const theme = {
      name: 'Test',
      author: 'Tester',
      themes: [],
    }

    const json = serializeTheme(theme as any)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('is formatted with 2-space indentation', () => {
    const theme = { name: 'Test', author: 'Tester', themes: [] }
    const json = serializeTheme(theme as any)
    expect(json).toContain('\n  ')
  })
})

describe('getColorStats', () => {
  it('counts total colors', () => {
    const style = {
      background: '#121212',
      text: '#FFFFFF',
      border: '#121212', // Duplicate color
    }

    const stats = getColorStats(style)
    expect(stats.totalColors).toBe(3)
    expect(stats.uniqueColors).toBe(2)
  })

  it('groups by category', () => {
    const style = {
      background: '#000',
      'editor.background': '#111',
      'editor.foreground': '#222',
      'terminal.background': '#333',
    }

    const stats = getColorStats(style)
    expect(stats.colorsByCategory['editor']).toBe(2)
    expect(stats.colorsByCategory['terminal']).toBe(1)
  })
})
