/**
 * Tests for JsonEditorPanel utility functions
 * Note: Full component tests require CodeMirror DOM mocking
 */

import { describe, it, expect } from 'vitest'

// Test the utility functions by extracting them or testing via integration
// For now, we test the color detection regex patterns

describe('JsonEditorPanel color detection', () => {
  // Simulate the findColors regex pattern
  const hexPattern = /"([^"]+)":\s*"(#[0-9A-Fa-f]{3,8})"/g

  function findColors(content: string) {
    const colors: Array<{ key: string; color: string }> = []
    let match
    while ((match = hexPattern.exec(content)) !== null) {
      colors.push({ key: match[1], color: match[2] })
    }
    return colors
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
})

describe('JSON path building', () => {
  // Simulate the buildJsonPath function logic
  function buildJsonPath(content: string, position: number): string {
    const segments: string[] = []
    let depth = 0
    let inString = false
    let currentKey = ''
    let keyStart = -1

    for (let i = 0; i < position && i < content.length; i++) {
      const char = content[i]
      const prevChar = i > 0 ? content[i - 1] : ''

      if (char === '"' && prevChar !== '\\') {
        if (!inString) {
          inString = true
          keyStart = i + 1
        } else {
          inString = false
          const rest = content.slice(i + 1).trimStart()
          if (rest.startsWith(':')) {
            currentKey = content.slice(keyStart, i)
          }
        }
      } else if (!inString) {
        if (char === '{') {
          if (currentKey) {
            segments.push(currentKey)
            currentKey = ''
          }
          depth++
        } else if (char === '}') {
          depth--
          if (segments.length > depth) {
            segments.length = Math.max(0, depth)
          }
        } else if (char === ',') {
          currentKey = ''
        }
      }
    }

    if (currentKey) {
      segments.push(currentKey)
    }

    return segments.join('/')
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
})
