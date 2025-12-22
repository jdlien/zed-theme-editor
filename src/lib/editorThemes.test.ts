import { describe, it, expect } from 'vitest'
import {
  editorThemes,
  getDefaultTheme,
  getThemeNames,
  getThemesByMode,
  type EditorThemeName,
} from './editorThemes'

describe('editorThemes', () => {
  describe('editorThemes object', () => {
    it('contains neutral-dark theme', () => {
      expect(editorThemes['neutral-dark']).toBeDefined()
      expect(editorThemes['neutral-dark'].isDark).toBe(true)
      expect(editorThemes['neutral-dark'].label).toBe('Neutral Dark')
    })

    it('contains neutral-light theme', () => {
      expect(editorThemes['neutral-light']).toBeDefined()
      expect(editorThemes['neutral-light'].isDark).toBe(false)
      expect(editorThemes['neutral-light'].label).toBe('Neutral Light')
    })

    it('contains one-dark theme', () => {
      expect(editorThemes['one-dark']).toBeDefined()
      expect(editorThemes['one-dark'].isDark).toBe(true)
      expect(editorThemes['one-dark'].label).toBe('One Dark')
    })

    it('contains github-dark theme', () => {
      expect(editorThemes['github-dark']).toBeDefined()
      expect(editorThemes['github-dark'].isDark).toBe(true)
      expect(editorThemes['github-dark'].label).toBe('GitHub Dark')
    })

    it('contains github-light theme', () => {
      expect(editorThemes['github-light']).toBeDefined()
      expect(editorThemes['github-light'].isDark).toBe(false)
      expect(editorThemes['github-light'].label).toBe('GitHub Light')
    })

    it('contains midnight theme', () => {
      expect(editorThemes['midnight']).toBeDefined()
      expect(editorThemes['midnight'].isDark).toBe(true)
      expect(editorThemes['midnight'].label).toBe('Midnight')
    })

    it('all themes have required properties', () => {
      const themeNames = Object.keys(editorThemes) as EditorThemeName[]
      for (const name of themeNames) {
        const theme = editorThemes[name]
        expect(theme.name).toBe(name)
        expect(typeof theme.label).toBe('string')
        expect(typeof theme.isDark).toBe('boolean')
        expect(Array.isArray(theme.extension)).toBe(true)
      }
    })
  })

  describe('getDefaultTheme', () => {
    it('returns neutral-dark for dark mode', () => {
      expect(getDefaultTheme(true)).toBe('neutral-dark')
    })

    it('returns neutral-light for light mode', () => {
      expect(getDefaultTheme(false)).toBe('neutral-light')
    })
  })

  describe('getThemeNames', () => {
    it('returns all theme names', () => {
      const names = getThemeNames()
      expect(names).toContain('neutral-dark')
      expect(names).toContain('neutral-light')
      expect(names).toContain('one-dark')
      expect(names).toContain('github-dark')
      expect(names).toContain('github-light')
      expect(names).toContain('midnight')
    })

    it('returns correct number of themes', () => {
      const names = getThemeNames()
      expect(names.length).toBe(6)
    })
  })

  describe('getThemesByMode', () => {
    it('returns dark themes when isDark is true', () => {
      const darkThemes = getThemesByMode(true)
      expect(darkThemes.length).toBeGreaterThan(0)
      for (const theme of darkThemes) {
        expect(theme.isDark).toBe(true)
      }
    })

    it('returns light themes when isDark is false', () => {
      const lightThemes = getThemesByMode(false)
      expect(lightThemes.length).toBeGreaterThan(0)
      for (const theme of lightThemes) {
        expect(theme.isDark).toBe(false)
      }
    })

    it('includes neutral-dark in dark themes', () => {
      const darkThemes = getThemesByMode(true)
      expect(darkThemes.some((t) => t.name === 'neutral-dark')).toBe(true)
    })

    it('includes neutral-light in light themes', () => {
      const lightThemes = getThemesByMode(false)
      expect(lightThemes.some((t) => t.name === 'neutral-light')).toBe(true)
    })

    it('dark themes count is correct', () => {
      const darkThemes = getThemesByMode(true)
      // neutral-dark, one-dark, github-dark, midnight
      expect(darkThemes.length).toBe(4)
    })

    it('light themes count is correct', () => {
      const lightThemes = getThemesByMode(false)
      // neutral-light, github-light
      expect(lightThemes.length).toBe(2)
    })
  })
})
