import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isMac, getModifierKey, formatShortcut } from './keyboard'

describe('keyboard utilities', () => {
  // Store original navigator
  const originalNavigator = globalThis.navigator

  beforeEach(() => {
    // Reset navigator mocks before each test
    vi.stubGlobal('navigator', {})
  })

  afterEach(() => {
    // Restore original navigator
    vi.stubGlobal('navigator', originalNavigator)
  })

  describe('isMac', () => {
    it('returns false when navigator is undefined (SSR)', () => {
      vi.stubGlobal('navigator', undefined)
      expect(isMac()).toBe(false)
    })

    it('detects Mac via userAgentData (modern Chrome)', () => {
      vi.stubGlobal('navigator', {
        userAgentData: { platform: 'macOS' },
      })
      expect(isMac()).toBe(true)
    })

    it('detects non-Mac via userAgentData', () => {
      vi.stubGlobal('navigator', {
        userAgentData: { platform: 'Windows' },
      })
      expect(isMac()).toBe(false)
    })

    it('handles case-insensitive userAgentData platform', () => {
      vi.stubGlobal('navigator', {
        userAgentData: { platform: 'MACOS' },
      })
      expect(isMac()).toBe(true)
    })

    it('falls back to navigator.platform when userAgentData has no platform', () => {
      vi.stubGlobal('navigator', {
        userAgentData: {},
        platform: 'MacIntel',
      })
      expect(isMac()).toBe(true)
    })

    it('detects Mac via navigator.platform fallback', () => {
      vi.stubGlobal('navigator', {
        platform: 'MacIntel',
      })
      expect(isMac()).toBe(true)
    })

    it('detects non-Mac via navigator.platform fallback', () => {
      vi.stubGlobal('navigator', {
        platform: 'Win32',
      })
      expect(isMac()).toBe(false)
    })

    it('handles case-insensitive platform check', () => {
      vi.stubGlobal('navigator', {
        platform: 'MACINTEL',
      })
      expect(isMac()).toBe(true)
    })

    it('returns false when navigator.platform is undefined', () => {
      vi.stubGlobal('navigator', {
        platform: undefined,
      })
      expect(isMac()).toBe(false)
    })

    it('returns false for Linux', () => {
      vi.stubGlobal('navigator', {
        platform: 'Linux x86_64',
      })
      expect(isMac()).toBe(false)
    })
  })

  describe('getModifierKey', () => {
    it('returns ⌘ on Mac', () => {
      vi.stubGlobal('navigator', {
        platform: 'MacIntel',
      })
      expect(getModifierKey()).toBe('⌘')
    })

    it('returns Ctrl on Windows', () => {
      vi.stubGlobal('navigator', {
        platform: 'Win32',
      })
      expect(getModifierKey()).toBe('Ctrl')
    })

    it('returns Ctrl on Linux', () => {
      vi.stubGlobal('navigator', {
        platform: 'Linux x86_64',
      })
      expect(getModifierKey()).toBe('Ctrl')
    })

    it('returns Ctrl when navigator is undefined', () => {
      vi.stubGlobal('navigator', undefined)
      expect(getModifierKey()).toBe('Ctrl')
    })
  })

  describe('formatShortcut', () => {
    describe('on Mac', () => {
      beforeEach(() => {
        vi.stubGlobal('navigator', {
          platform: 'MacIntel',
        })
      })

      it('formats basic shortcut', () => {
        expect(formatShortcut('S')).toBe('⌘+S')
      })

      it('formats shortcut with shift', () => {
        expect(formatShortcut('Z', true)).toBe('⇧⌘+Z')
      })

      it('formats shortcut without shift explicitly', () => {
        expect(formatShortcut('O', false)).toBe('⌘+O')
      })
    })

    describe('on Windows/Linux', () => {
      beforeEach(() => {
        vi.stubGlobal('navigator', {
          platform: 'Win32',
        })
      })

      it('formats basic shortcut', () => {
        expect(formatShortcut('S')).toBe('Ctrl+S')
      })

      it('formats shortcut with shift', () => {
        expect(formatShortcut('Z', true)).toBe('Ctrl+Shift+Z')
      })

      it('formats shortcut without shift explicitly', () => {
        expect(formatShortcut('O', false)).toBe('Ctrl+O')
      })
    })

    it('handles various key names', () => {
      vi.stubGlobal('navigator', {
        platform: 'MacIntel',
      })
      expect(formatShortcut('F1')).toBe('⌘+F1')
      expect(formatShortcut('Enter')).toBe('⌘+Enter')
      expect(formatShortcut('/')).toBe('⌘+/')
    })
  })
})
