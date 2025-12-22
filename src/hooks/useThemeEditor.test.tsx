import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeEditorProvider, useThemeEditor } from './useThemeEditor'
import type { ThemeFamily } from '@/types/theme'
import type { FileData } from './useFileAccess'
import type { ReactNode } from 'react'

// Mock theme data
const mockThemeFamily: ThemeFamily = {
  name: 'Test Theme',
  author: 'Test Author',
  themes: [
    {
      name: 'Dark',
      appearance: 'dark',
      style: {
        background: '#1E1E1E',
        text: '#FFFFFF',
        'editor.background': '#252526',
      },
    },
    {
      name: 'Light',
      appearance: 'light',
      style: {
        background: '#FFFFFF',
        text: '#1E1E1E',
        'editor.background': '#F3F3F3',
      },
    },
  ],
}

const mockThemeJson = JSON.stringify(mockThemeFamily, null, 2)

const createFileData = (content: string = mockThemeJson, name: string = 'theme.json'): FileData => ({
  content,
  name,
  handle: null,
})

// Wrapper component for testing
function createWrapper(props?: { initialColorFormat?: 'hex' | 'rgb' | 'hsl' | 'oklch'; initialDarkMode?: boolean }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ThemeEditorProvider {...props}>{children}</ThemeEditorProvider>
  }
}

describe('useThemeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      expect(result.current.state.themeFamily).toBeNull()
      expect(result.current.state.fileName).toBeNull()
      expect(result.current.state.activeThemeIndex).toBe(0)
      expect(result.current.state.selectedColorPath).toBeNull()
      expect(result.current.state.colorDisplayFormat).toBe('hex')
      expect(result.current.state.isDarkMode).toBe(true)
      expect(result.current.state.hasUnsavedChanges).toBe(false)
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.error).toBeNull()
    })

    it('respects initial color format', () => {
      const { result } = renderHook(() => useThemeEditor(), {
        wrapper: createWrapper({ initialColorFormat: 'oklch' }),
      })

      expect(result.current.state.colorDisplayFormat).toBe('oklch')
    })

    it('respects initial dark mode', () => {
      const { result } = renderHook(() => useThemeEditor(), {
        wrapper: createWrapper({ initialDarkMode: false }),
      })

      expect(result.current.state.isDarkMode).toBe(false)
    })
  })

  describe('file loading', () => {
    it('loads valid theme file', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      expect(result.current.state.themeFamily).not.toBeNull()
      expect(result.current.state.themeFamily?.name).toBe('Test Theme')
      expect(result.current.state.fileName).toBe('theme.json')
      expect(result.current.state.hasUnsavedChanges).toBe(false)
      expect(result.current.state.error).toBeNull()
    })

    it('sets error for invalid theme file', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData('not valid json {{{'))
      })

      expect(result.current.state.themeFamily).toBeNull()
      expect(result.current.state.error).toContain('JSON parse error')
    })

    it('sets error for missing required fields', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })
      const invalidTheme = { name: 'Test' } // Missing author and themes

      act(() => {
        result.current.loadFile(createFileData(JSON.stringify(invalidTheme)))
      })

      expect(result.current.state.error).toContain('Invalid theme structure')
    })

    it('resets state when loading new file', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      // Load first file
      act(() => {
        result.current.loadFile(createFileData())
      })

      // Make some changes
      act(() => {
        result.current.setActiveTheme(1)
        result.current.selectColor('style.background')
      })

      // Load another file
      act(() => {
        result.current.loadFile(createFileData(mockThemeJson, 'other-theme.json'))
      })

      expect(result.current.state.fileName).toBe('other-theme.json')
      expect(result.current.state.activeThemeIndex).toBe(0)
      expect(result.current.state.selectedColorPath).toBeNull()
    })
  })

  describe('file closing', () => {
    it('resets state but preserves preferences', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
        result.current.setColorFormat('oklch')
        result.current.setDarkMode(false)
      })

      act(() => {
        result.current.closeFile()
      })

      expect(result.current.state.themeFamily).toBeNull()
      expect(result.current.state.fileName).toBeNull()
      expect(result.current.state.colorDisplayFormat).toBe('oklch')
      expect(result.current.state.isDarkMode).toBe(false)
    })
  })

  describe('theme selection', () => {
    it('changes active theme', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      expect(result.current.state.activeThemeIndex).toBe(0)
      expect(result.current.currentTheme?.name).toBe('Dark')

      act(() => {
        result.current.setActiveTheme(1)
      })

      expect(result.current.state.activeThemeIndex).toBe(1)
      expect(result.current.currentTheme?.name).toBe('Light')
    })

    it('clears selected color when changing theme', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
        result.current.selectColor('style.background')
      })

      expect(result.current.state.selectedColorPath).toBe('style.background')

      act(() => {
        result.current.setActiveTheme(1)
      })

      expect(result.current.state.selectedColorPath).toBeNull()
    })
  })

  describe('color selection', () => {
    it('selects and deselects colors', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      act(() => {
        result.current.selectColor('style.background')
      })

      expect(result.current.state.selectedColorPath).toBe('style.background')

      act(() => {
        result.current.selectColor(null)
      })

      expect(result.current.state.selectedColorPath).toBeNull()
    })
  })

  describe('color updates', () => {
    it('updates color value', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      const originalBg = result.current.currentTheme?.style.background

      act(() => {
        result.current.updateColor('style.background', '#FF0000')
      })

      expect(result.current.currentTheme?.style.background).toBe('#FF0000')
      expect(result.current.currentTheme?.style.background).not.toBe(originalBg)
      expect(result.current.state.hasUnsavedChanges).toBe(true)
    })

    it('does nothing when no theme loaded', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.updateColor('style.background', '#FF0000')
      })

      expect(result.current.state.themeFamily).toBeNull()
    })
  })

  describe('undo/redo', () => {
    it('can undo color changes', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      const originalBg = result.current.currentTheme?.style.background

      act(() => {
        result.current.updateColor('style.background', '#FF0000')
      })

      expect(result.current.currentTheme?.style.background).toBe('#FF0000')
      expect(result.current.canUndo).toBe(true)

      act(() => {
        result.current.undo()
      })

      expect(result.current.currentTheme?.style.background).toBe(originalBg)
      expect(result.current.canUndo).toBe(false)
    })

    it('can redo undone changes', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      act(() => {
        result.current.updateColor('style.background', '#FF0000')
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      act(() => {
        result.current.redo()
      })

      expect(result.current.currentTheme?.style.background).toBe('#FF0000')
      expect(result.current.canRedo).toBe(false)
    })

    it('clears redo history when new change is made', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      act(() => {
        result.current.updateColor('style.background', '#FF0000')
        result.current.updateColor('style.background', '#00FF00')
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      // Make new change
      act(() => {
        result.current.updateColor('style.background', '#0000FF')
      })

      expect(result.current.canRedo).toBe(false)
    })

    it('limits history size', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
      })

      // Make 60 changes (max is 50)
      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.updateColor('style.background', `#${i.toString(16).padStart(6, '0')}`)
        })
      }

      // Should still be able to undo many times
      let undoCount = 0
      while (result.current.canUndo) {
        act(() => {
          result.current.undo()
        })
        undoCount++
      }

      // Should be limited to MAX_HISTORY - 1 undos (we start with 1 item in history)
      expect(undoCount).toBeLessThanOrEqual(50)
    })
  })

  describe('preferences', () => {
    it('updates color format', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.setColorFormat('oklch')
      })

      expect(result.current.state.colorDisplayFormat).toBe('oklch')
    })

    it('updates dark mode', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      expect(result.current.state.isDarkMode).toBe(true)

      act(() => {
        result.current.setDarkMode(false)
      })

      expect(result.current.state.isDarkMode).toBe(false)
    })
  })

  describe('save marking', () => {
    it('marks changes as saved', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData())
        result.current.updateColor('style.background', '#FF0000')
      })

      expect(result.current.state.hasUnsavedChanges).toBe(true)

      act(() => {
        result.current.markSaved()
      })

      expect(result.current.state.hasUnsavedChanges).toBe(false)
    })

    it('updates file handle when provided', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })
      const mockHandle = { name: 'test' } as unknown as FileSystemFileHandle

      act(() => {
        result.current.loadFile(createFileData())
      })

      expect(result.current.state.fileHandle).toBeNull()

      act(() => {
        result.current.markSaved(mockHandle)
      })

      expect(result.current.state.fileHandle).toBe(mockHandle)
    })
  })

  describe('error handling', () => {
    it('clears error', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      act(() => {
        result.current.loadFile(createFileData('invalid json'))
      })

      expect(result.current.state.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })
  })

  describe('computed values', () => {
    it('returns current theme', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      expect(result.current.currentTheme).toBeNull()

      act(() => {
        result.current.loadFile(createFileData())
      })

      expect(result.current.currentTheme).not.toBeNull()
      expect(result.current.currentTheme?.name).toBe('Dark')
    })

    it('returns serialized theme', () => {
      const { result } = renderHook(() => useThemeEditor(), { wrapper: createWrapper() })

      expect(result.current.serializedTheme).toBe('')

      act(() => {
        result.current.loadFile(createFileData())
      })

      expect(result.current.serializedTheme).toContain('Test Theme')
      expect(result.current.serializedTheme).toContain('"name"')
    })
  })

  describe('context requirement', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useThemeEditor())
      }).toThrow('useThemeEditor must be used within a ThemeEditorProvider')
    })
  })
})
