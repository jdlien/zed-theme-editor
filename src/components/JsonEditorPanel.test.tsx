/**
 * Tests for JsonEditorPanel utility functions
 * Note: Full component tests require CodeMirror DOM mocking
 */

import { describe, it, expect } from 'vitest'
import { normalizeColorPath } from './JsonEditorPanel'

// ============================================================================
// Color Detection Tests
// ============================================================================

describe('JsonEditorPanel color detection', () => {
  // Simulate the findColors patterns
  const hexPattern = /"([^"]+)":\s*"(#[0-9A-Fa-f]{3,8})"/g
  const arrayColorPattern = /(?:[\[,]\s*)"(#[0-9A-Fa-f]{3,8})"/g

  function findColors(content: string) {
    const colors: Array<{ key: string; color: string; from: number }> = []

    // Match object property colors
    let match
    while ((match = hexPattern.exec(content)) !== null) {
      colors.push({
        key: match[1],
        color: match[2],
        from: match.index + match[0].lastIndexOf(match[2]),
      })
    }

    // Match array element colors
    while ((match = arrayColorPattern.exec(content)) !== null) {
      const colorStart = match.index + match[0].indexOf(match[1])
      // Avoid duplicates
      const isDuplicate = colors.some((c) => c.from === colorStart)
      if (!isDuplicate) {
        colors.push({
          key: 'array-element',
          color: match[1],
          from: colorStart,
        })
      }
    }

    return colors.sort((a, b) => a.from - b.from)
  }

  it('finds simple hex colors', () => {
    const json = '{"background": "#1e1e1e"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(1)
    expect(colors[0].key).toBe('background')
    expect(colors[0].color).toBe('#1e1e1e')
  })

  it('finds multiple colors', () => {
    const json = `{
      "background": "#1e1e1e",
      "foreground": "#d4d4d4",
      "accent": "#007acc"
    }`
    const colors = findColors(json)
    expect(colors).toHaveLength(3)
  })

  it('handles short hex codes', () => {
    const json = '{"color": "#fff"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(1)
    expect(colors[0].color).toBe('#fff')
  })

  it('handles 8-digit hex with alpha', () => {
    const json = '{"color": "#1e1e1eff"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(1)
    expect(colors[0].color).toBe('#1e1e1eff')
  })

  it('handles dotted keys', () => {
    const json = '{"editor.background": "#1e1e1e"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(1)
    expect(colors[0].key).toBe('editor.background')
  })

  it('ignores non-hex strings', () => {
    const json = '{"name": "dracula", "version": "1.0"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(0)
  })

  it('ignores invalid hex codes', () => {
    const json = '{"color": "#xyz123"}'
    const colors = findColors(json)
    expect(colors).toHaveLength(0)
  })

  it('finds colors in arrays', () => {
    const json = '{"accents": ["#ff0000", "#00ff00", "#0000ff"]}'
    const colors = findColors(json)
    expect(colors).toHaveLength(3)
    expect(colors.map((c) => c.color)).toEqual(['#ff0000', '#00ff00', '#0000ff'])
  })

  it('finds mixed object and array colors', () => {
    const json = `{
      "background": "#1e1e1e",
      "accents": ["#ff0000", "#00ff00"]
    }`
    const colors = findColors(json)
    expect(colors).toHaveLength(3)
    expect(colors[0].key).toBe('background')
    expect(colors[1].key).toBe('array-element')
    expect(colors[2].key).toBe('array-element')
  })
})

// ============================================================================
// Path Building Tests
// ============================================================================

describe('JSON path building', () => {
  // Simulate the improved buildJsonPath function
  function parseJsonString(str: string): string {
    try {
      return JSON.parse(`"${str}"`)
    } catch {
      return str
    }
  }

  function buildJsonPath(content: string, position: number): string {
    const segments: string[] = []
    let inString = false
    let currentKey = ''
    let keyStart = -1
    const contextStack: number[] = []

    for (let i = 0; i < position && i < content.length; i++) {
      const char = content[i]

      if (inString) {
        if (char === '\\' && i + 1 < content.length) {
          i++
          continue
        }
        if (char === '"') {
          inString = false
          const rest = content.slice(i + 1).trimStart()
          if (rest.startsWith(':')) {
            currentKey = parseJsonString(content.slice(keyStart, i))
          }
        }
        continue
      }

      if (char === '"') {
        inString = true
        keyStart = i + 1
      } else if (char === '{') {
        if (currentKey) {
          segments.push(currentKey)
          currentKey = ''
        }
        contextStack.push(-1)
      } else if (char === '[') {
        if (currentKey) {
          segments.push(currentKey)
          currentKey = ''
        }
        contextStack.push(0)
      } else if (char === '}') {
        contextStack.pop()
        while (segments.length > contextStack.length) {
          segments.pop()
        }
      } else if (char === ']') {
        contextStack.pop()
        while (segments.length > contextStack.length) {
          segments.pop()
        }
      } else if (char === ',') {
        const lastContext = contextStack[contextStack.length - 1]
        if (lastContext !== undefined && lastContext >= 0) {
          contextStack[contextStack.length - 1] = lastContext + 1
        }
        currentKey = ''
      }
    }

    if (currentKey) {
      segments.push(currentKey)
    }

    // Build the final path with array indices
    const result: string[] = []
    let segmentIdx = 0
    for (let i = 0; i < contextStack.length && segmentIdx < segments.length; i++) {
      const ctx = contextStack[i]
      if (ctx >= 0) {
        result.push(`[${ctx}]`)
      }
      if (segmentIdx < segments.length) {
        result.push(segments[segmentIdx])
        segmentIdx++
      }
    }
    while (segmentIdx < segments.length) {
      result.push(segments[segmentIdx])
      segmentIdx++
    }

    return result.join('/')
  }

  it('builds path for top-level key', () => {
    const json = '{"background": "#fff"}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('background')
  })

  it('builds path for nested key', () => {
    const json = '{"style": {"background": "#fff"}}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('style/background')
  })

  it('builds path for deeply nested key', () => {
    const json = '{"style": {"syntax": {"keyword": {"color": "#fff"}}}}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('style/syntax/keyword/color')
  })

  it('handles dotted keys correctly', () => {
    const json = '{"editor.background": "#fff"}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('editor.background')
  })

  it('handles escaped quotes in keys', () => {
    const json = '{"key\\"with\\"quotes": "#fff"}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('key"with"quotes')
  })

  it('handles escaped backslashes in keys', () => {
    const json = '{"path\\\\to\\\\key": "#fff"}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('path\\to\\key')
  })

  it('includes array indices in path', () => {
    const json = '{"themes": [{"style": {"background": "#fff"}}]}'
    const position = json.indexOf('#fff')
    const path = buildJsonPath(json, position)
    expect(path).toBe('themes/[0]/style/background')
  })

  it('handles multiple array items', () => {
    const json = '{"items": [{"color": "#aaa"}, {"color": "#bbb"}]}'
    const position = json.indexOf('#bbb')
    const path = buildJsonPath(json, position)
    expect(path).toBe('items/[1]/color')
  })
})

// ============================================================================
// Path Normalization Tests
// ============================================================================

describe('normalizeColorPath', () => {
  it('normalizes full document path with array index', () => {
    const result = normalizeColorPath('themes/[0]/style/background')
    expect(result.path).toBe('style/background')
    expect(result.themeIndex).toBe(0)
  })

  it('normalizes path with different theme index', () => {
    const result = normalizeColorPath('themes/[2]/style/syntax/keyword/color')
    expect(result.path).toBe('style/syntax/keyword/color')
    expect(result.themeIndex).toBe(2)
  })

  it('handles legacy format without array index', () => {
    const result = normalizeColorPath('themes/style/background')
    expect(result.path).toBe('style/background')
    expect(result.themeIndex).toBeNull()
  })

  it('returns theme-relative path unchanged', () => {
    const result = normalizeColorPath('style/background')
    expect(result.path).toBe('style/background')
    expect(result.themeIndex).toBeNull()
  })

  it('handles simple path unchanged', () => {
    const result = normalizeColorPath('background')
    expect(result.path).toBe('background')
    expect(result.themeIndex).toBeNull()
  })

  it('handles nested accents path', () => {
    const result = normalizeColorPath('themes/[0]/style/accents/[2]')
    expect(result.path).toBe('style/accents/[2]')
    expect(result.themeIndex).toBe(0)
  })

  it('handles players array path', () => {
    const result = normalizeColorPath('themes/[1]/style/players/[0]/cursor')
    expect(result.path).toBe('style/players/[0]/cursor')
    expect(result.themeIndex).toBe(1)
  })
})
