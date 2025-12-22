import { describe, it, expect } from 'vitest'
import { getDefaultColor, DARK_DEFAULTS, LIGHT_DEFAULTS } from './themeDefaults'

describe('themeDefaults', () => {
  describe('DARK_DEFAULTS', () => {
    it('should contain color values from One Dark theme', () => {
      expect(Object.keys(DARK_DEFAULTS).length).toBeGreaterThan(50)
    })

    it('should have background color', () => {
      expect(DARK_DEFAULTS['background']).toBeDefined()
      expect(DARK_DEFAULTS['background']).toMatch(/^#[0-9a-fA-F]+$/)
    })

    it('should have editor colors', () => {
      expect(DARK_DEFAULTS['editor.background']).toBeDefined()
      expect(DARK_DEFAULTS['editor.foreground']).toBeDefined()
    })

    it('should have terminal ANSI colors', () => {
      expect(DARK_DEFAULTS['terminal.ansi.red']).toBeDefined()
      expect(DARK_DEFAULTS['terminal.ansi.green']).toBeDefined()
      expect(DARK_DEFAULTS['terminal.ansi.blue']).toBeDefined()
    })
  })

  describe('LIGHT_DEFAULTS', () => {
    it('should contain color values from One Light theme', () => {
      expect(Object.keys(LIGHT_DEFAULTS).length).toBeGreaterThan(50)
    })

    it('should have different colors than dark theme', () => {
      // Light theme should have different background than dark
      expect(LIGHT_DEFAULTS['background']).not.toBe(DARK_DEFAULTS['background'])
    })
  })

  describe('getDefaultColor', () => {
    it('should return dark default for dark appearance', () => {
      const color = getDefaultColor('background', 'dark')
      expect(color).toBe(DARK_DEFAULTS['background'])
    })

    it('should return light default for light appearance', () => {
      const color = getDefaultColor('background', 'light')
      expect(color).toBe(LIGHT_DEFAULTS['background'])
    })

    it('should return fallback gray for unknown keys', () => {
      const color = getDefaultColor('nonexistent.color.key', 'dark')
      expect(color).toBe('#808080')
    })

    it('should return fallback gray for unknown keys in light mode', () => {
      const color = getDefaultColor('nonexistent.color.key', 'light')
      expect(color).toBe('#808080')
    })

    it('should return valid hex colors for known keys', () => {
      const editorBg = getDefaultColor('editor.background', 'dark')
      expect(editorBg).toMatch(/^#[0-9a-fA-F]+$/)

      const textColor = getDefaultColor('text', 'light')
      expect(textColor).toMatch(/^#[0-9a-fA-F]+$/)
    })
  })
})
