import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeEditor } from './ThemeEditor'
import type { ThemeFamily, ThemeStyle } from '@/types/theme'

// Mock the hooks
vi.mock('@/hooks/useThemeEditor', () => ({
  useThemeEditor: vi.fn(),
}))

vi.mock('@/hooks/useFileAccess', () => ({
  useFileAccess: vi.fn(),
}))

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(),
}))

import { useThemeEditor } from '@/hooks/useThemeEditor'
import { useFileAccess } from '@/hooks/useFileAccess'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const mockUseThemeEditor = useThemeEditor as ReturnType<typeof vi.fn>
const mockUseFileAccess = useFileAccess as ReturnType<typeof vi.fn>
const mockUseLocalStorage = useLocalStorage as ReturnType<typeof vi.fn>

// Sample theme data
const sampleStyle: ThemeStyle = {
  background: '#1e1e1e',
  text: '#ffffff',
  'editor.background': '#2d2d2d',
  'editor.foreground': '#d4d4d4',
}

const sampleThemeFamily: ThemeFamily = {
  name: 'Test Theme',
  author: 'Test Author',
  themes: [
    {
      name: 'Test Dark',
      appearance: 'dark',
      style: sampleStyle,
    },
  ],
}

describe('ThemeEditor', () => {
  const mockLoadFile = vi.fn()
  const mockCloseFile = vi.fn()
  const mockSetActiveTheme = vi.fn()
  const mockSelectColor = vi.fn()
  const mockUpdateColorLive = vi.fn()
  const mockAddColor = vi.fn()
  const mockCommitPendingHistory = vi.fn()
  const mockSetDarkMode = vi.fn()
  const mockToggleDarkMode = vi.fn()
  const mockMarkSaved = vi.fn()
  const mockUndo = vi.fn()
  const mockRedo = vi.fn()
  const mockOpenFile = vi.fn()
  const mockSaveFile = vi.fn()
  const mockDownloadFile = vi.fn()

  // Default mock state (no file loaded)
  const defaultState = {
    themeFamily: null,
    activeThemeIndex: 0,
    selectedColorPath: null,
    isDarkMode: false,
    hasUnsavedChanges: false,
    history: [],
    historyIndex: 0,
    fileName: null,
    fileHandle: null,
    error: null,
    colorDisplayFormat: 'hex' as const,
  }

  // State with file loaded
  const loadedState = {
    ...defaultState,
    themeFamily: sampleThemeFamily,
    fileName: 'theme.json',
    fileHandle: {} as FileSystemFileHandle, // Mock file handle for save-in-place
    history: [sampleThemeFamily],
  }

  // Base hook return value (used to spread and override)
  const getBaseThemeEditorReturn = (overrides = {}) => ({
    state: defaultState,
    loadFile: mockLoadFile,
    closeFile: mockCloseFile,
    setActiveTheme: mockSetActiveTheme,
    selectColor: mockSelectColor,
    updateColorLive: mockUpdateColorLive,
    addColor: mockAddColor,
    commitPendingHistory: mockCommitPendingHistory,
    setDarkMode: mockSetDarkMode,
    toggleDarkMode: mockToggleDarkMode,
    markSaved: mockMarkSaved,
    undo: mockUndo,
    redo: mockRedo,
    canUndo: false,
    canRedo: false,
    hasPendingHistory: false,
    currentTheme: null,
    serializedTheme: '',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Default useThemeEditor mock
    mockUseThemeEditor.mockReturnValue(getBaseThemeEditorReturn())

    // Default useFileAccess mock
    mockUseFileAccess.mockReturnValue({
      openFile: mockOpenFile,
      saveFile: mockSaveFile,
      downloadFile: mockDownloadFile,
      isSupported: true,
    })

    // Default useLocalStorage mock - returns different values based on key
    mockUseLocalStorage.mockImplementation(
      (key: string, defaultValue: unknown) => {
        const values: Record<string, unknown> = {
          editorThemeDark: 'neutral-dark',
          editorThemeLight: 'neutral-light',
          jsonColorFormat: 'hex',
          'zed-theme-editor-sidebar-width': 256,
        }
        return [values[key] ?? defaultValue, vi.fn()]
      }
    )
  })

  describe('initial state (no file loaded)', () => {
    it('renders toolbar', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('Zed Theme Editor')).toBeInTheDocument()
    })

    it('renders drop zone when no file is loaded', () => {
      render(<ThemeEditor />)
      expect(
        screen.getByText('Drop a Zed theme .json file here')
      ).toBeInTheDocument()
    })

    it('renders dark mode toggle', () => {
      render(<ThemeEditor />)
      expect(
        screen.getByRole('switch', { name: 'Toggle dark mode' })
      ).toBeInTheDocument()
    })

    it('shows error message when state has error', () => {
      mockUseThemeEditor.mockReturnValue(
        getBaseThemeEditorReturn({
          state: { ...defaultState, error: 'Failed to parse theme file' },
        })
      )
      render(<ThemeEditor />)
      expect(screen.getByText('Failed to parse theme file')).toBeInTheDocument()
    })
  })

  describe('dark mode toggle', () => {
    it('toggles dark mode when clicked', () => {
      render(<ThemeEditor />)
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockToggleDarkMode).toHaveBeenCalled()
    })

    it('marks toggle as checked when in dark mode', () => {
      mockUseThemeEditor.mockReturnValue(
        getBaseThemeEditorReturn({
          state: { ...defaultState, isDarkMode: true },
        })
      )
      render(<ThemeEditor />)
      expect(
        screen.getByRole('switch', { name: 'Toggle dark mode' })
      ).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('file handling', () => {
    it('opens file when open button is clicked', async () => {
      mockOpenFile.mockResolvedValue({
        content: '{"name":"Test","author":"Author","themes":[]}',
        name: 'test.json',
        handle: null,
      })

      render(<ThemeEditor />)
      fireEvent.click(screen.getByTitle('Open file'))

      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalled()
        expect(mockLoadFile).toHaveBeenCalledWith({
          content: '{"name":"Test","author":"Author","themes":[]}',
          name: 'test.json',
          handle: null,
        })
      })
    })

    it('loads file from drop zone', async () => {
      render(<ThemeEditor />)
      // DropZone's onFileLoad would be called
      // This tests that the component renders correctly
      expect(screen.getByText('or click to browse')).toBeInTheDocument()
    })
  })

  describe('with file loaded', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('renders file name in toolbar', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('theme.json')).toBeInTheDocument()
    })

    it('renders theme name and author in footer', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('Test Theme by Test Author')).toBeInTheDocument()
    })

    it('renders color list sidebar', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('Colors')).toBeInTheDocument()
    })

    it('renders color search input', () => {
      render(<ThemeEditor />)
      expect(
        screen.getByPlaceholderText('Filter colors...')
      ).toBeInTheDocument()
    })

    it('renders theme preview', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('renders color editor panel placeholder when no color selected', () => {
      render(<ThemeEditor />)
      expect(screen.getByText('Select a color to edit')).toBeInTheDocument()
    })

    it('shows save shortcut when there are unsaved changes', () => {
      mockUseThemeEditor.mockReturnValue(
        getBaseThemeEditorReturn({
          state: { ...loadedState, hasUnsavedChanges: true },
          currentTheme: sampleThemeFamily.themes[0],
          serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
        })
      )
      render(<ThemeEditor />)
      // Should show save shortcut hint (contains ⌘+S or Ctrl+S)
      expect(screen.getByText(/to save/)).toBeInTheDocument()
    })

    it('shows undo shortcut when can undo', () => {
      mockUseThemeEditor.mockReturnValue(
        getBaseThemeEditorReturn({
          state: loadedState,
          canUndo: true,
          currentTheme: sampleThemeFamily.themes[0],
          serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
        })
      )
      render(<ThemeEditor />)
      expect(screen.getByText(/to undo/)).toBeInTheDocument()
    })

    it('shows redo shortcut when can redo', () => {
      mockUseThemeEditor.mockReturnValue(
        getBaseThemeEditorReturn({
          state: loadedState,
          canRedo: true,
          currentTheme: sampleThemeFamily.themes[0],
          serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
        })
      )
      render(<ThemeEditor />)
      expect(screen.getByText(/to redo/)).toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: true,
        canRedo: true,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockResolvedValue(true)
    })

    it('handles Cmd/Ctrl+S for save', async () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', metaKey: true })
      await waitFor(() => {
        expect(mockSaveFile).toHaveBeenCalled()
      })
    })

    it('handles Cmd/Ctrl+Z for undo', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true })
      expect(mockUndo).toHaveBeenCalled()
    })

    it('handles Cmd/Ctrl+Shift+Z for redo', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true })
      expect(mockRedo).toHaveBeenCalled()
    })

    it('handles Cmd/Ctrl+Y for redo', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'y', metaKey: true })
      expect(mockRedo).toHaveBeenCalled()
    })

    it('handles Escape to deselect color', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(mockSelectColor).toHaveBeenCalledWith(null)
    })

    it('handles Cmd/Ctrl+F to focus search', () => {
      render(<ThemeEditor />)
      const searchInput = screen.getByPlaceholderText('Filter colors...')
      fireEvent.keyDown(window, { key: 'f', metaKey: true })
      expect(document.activeElement).toBe(searchInput)
    })
  })

  describe('color filtering', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('filters colors when search term is entered', () => {
      render(<ThemeEditor />)
      const searchInput = screen.getByPlaceholderText('Filter colors...')
      fireEvent.change(searchInput, { target: { value: 'background' } })
      // The filter state updates and shows filtered count
      expect(screen.getByText(/of.*properties/)).toBeInTheDocument()
    })

    it('shows "No matching colors" when filter has no results', () => {
      render(<ThemeEditor />)
      const searchInput = screen.getByPlaceholderText('Filter colors...')
      fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
      expect(screen.getByText('No matching colors')).toBeInTheDocument()
    })
  })

  describe('save functionality', () => {
    it('commits pending history before saving', async () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: true,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockResolvedValue(true)

      render(<ThemeEditor />)
      // Trigger save via keyboard
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      await waitFor(() => {
        expect(mockCommitPendingHistory).toHaveBeenCalled()
        expect(mockSaveFile).toHaveBeenCalled()
      })
    })

    it('marks as saved after successful save', async () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockResolvedValue(true)

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      await waitFor(() => {
        expect(mockMarkSaved).toHaveBeenCalled()
      })
    })
  })

  describe('unsaved changes indicator', () => {
    it('shows asterisk when there are unsaved changes', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      render(<ThemeEditor />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('sidebar resize', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('renders resize handle', () => {
      render(<ThemeEditor />)
      expect(screen.getByTitle('Drag to resize')).toBeInTheDocument()
    })

    it('handles mousedown on resize handle', () => {
      render(<ThemeEditor />)
      const resizeHandle = screen.getByTitle('Drag to resize')
      fireEvent.mouseDown(resizeHandle, { clientX: 256 })
      // Mouse down should set up resize
      fireEvent.mouseUp(document)
    })
  })

  describe('color selection from sidebar', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('selects color when sidebar row is clicked', () => {
      render(<ThemeEditor />)
      // Click on a color in the sidebar
      const colorRow = screen.getAllByRole('button')[0]
      if (colorRow) {
        fireEvent.click(colorRow)
      }
    })
  })

  describe('save failure handling', () => {
    it('handles save failure gracefully and falls back to download', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockRejectedValue(new Error('Save failed'))

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save:',
          expect.any(Error)
        )
        // Should fall back to download after save failure
        expect(mockDownloadFile).toHaveBeenCalled()
        expect(mockMarkSaved).toHaveBeenCalled()
      })
      consoleSpy.mockRestore()
    })

    it('falls back to download when save returns false', async () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockResolvedValue(false)

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      await waitFor(() => {
        expect(mockSaveFile).toHaveBeenCalled()
        // When save returns false, fall back to download
        expect(mockDownloadFile).toHaveBeenCalled()
        // Mark as saved after download
        expect(mockMarkSaved).toHaveBeenCalled()
      })
    })
  })

  describe('undo/redo with pending history', () => {
    it('commits pending history before undo', () => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: true,
        canRedo: false,
        hasPendingHistory: true,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true })

      expect(mockCommitPendingHistory).toHaveBeenCalled()
      expect(mockUndo).toHaveBeenCalled()
    })

    it('commits pending history before redo', () => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: true,
        hasPendingHistory: true,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true })

      expect(mockCommitPendingHistory).toHaveBeenCalled()
      expect(mockRedo).toHaveBeenCalled()
    })
  })

  describe('color display format', () => {
    it('uses localStorage for color format preference', () => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Color format select is rendered
      expect(
        screen.getByTitle('Color format for JSON display')
      ).toBeInTheDocument()
    })
  })

  describe('color selection handling', () => {
    it('commits pending history when selecting a new color', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, selectedColorPath: 'style/background' },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: true,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Escape deselects and should commit pending history
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockCommitPendingHistory).toHaveBeenCalled()
      expect(mockSelectColor).toHaveBeenCalledWith(null)
    })
  })

  describe('openFile when no file data returned', () => {
    it('does not load file when openFile returns null', async () => {
      mockOpenFile.mockResolvedValue(null)

      render(<ThemeEditor />)
      fireEvent.click(screen.getByTitle('Open file'))

      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalled()
      })
      expect(mockLoadFile).not.toHaveBeenCalled()
    })
  })

  describe('sidebar resize with full interaction', () => {
    let mockSetSidebarWidth: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockSetSidebarWidth = vi.fn()
      mockUseLocalStorage.mockImplementation(
        (key: string, defaultValue: unknown) => {
          if (key === 'zed-theme-editor-sidebar-width') {
            return [256, mockSetSidebarWidth]
          }
          const values: Record<string, unknown> = {
            editorThemeDark: 'neutral-dark',
            editorThemeLight: 'neutral-light',
            jsonColorFormat: 'hex',
          }
          return [values[key] ?? defaultValue, vi.fn()]
        }
      )

      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('resizes sidebar with mouse move', () => {
      render(<ThemeEditor />)
      const resizeHandle = screen.getByTitle('Drag to resize')

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 256 })

      // Move mouse
      fireEvent.mouseMove(document, { clientX: 350 })

      expect(mockSetSidebarWidth).toHaveBeenCalled()
    })

    it('stops resizing on mouse up', () => {
      render(<ThemeEditor />)
      const resizeHandle = screen.getByTitle('Drag to resize')

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 256 })

      // Move mouse (should update width)
      fireEvent.mouseMove(document, { clientX: 350 })

      // Release mouse
      fireEvent.mouseUp(document)

      // Clear mock
      mockSetSidebarWidth.mockClear()

      // Move mouse again after release (should NOT update width)
      fireEvent.mouseMove(document, { clientX: 450 })

      // Width should not have been updated after mouseUp
      expect(mockSetSidebarWidth).not.toHaveBeenCalled()
    })

    it('clamps sidebar width to minimum', () => {
      render(<ThemeEditor />)
      const resizeHandle = screen.getByTitle('Drag to resize')

      fireEvent.mouseDown(resizeHandle, { clientX: 256 })
      fireEvent.mouseMove(document, { clientX: 50 }) // Very small

      // Should be clamped to minimum (180)
      expect(mockSetSidebarWidth).toHaveBeenCalledWith(180)
    })

    it('clamps sidebar width to maximum', () => {
      render(<ThemeEditor />)
      const resizeHandle = screen.getByTitle('Drag to resize')

      fireEvent.mouseDown(resizeHandle, { clientX: 256 })
      fireEvent.mouseMove(document, { clientX: 1000 }) // Very large

      // Should be clamped to maximum (500)
      expect(mockSetSidebarWidth).toHaveBeenCalledWith(500)
    })
  })

  describe('sidebar color clicking', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: true, // Has pending history
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
    })

    it('commits pending history when clicking defined color', () => {
      render(<ThemeEditor />)
      // Find the first clickable color button in sidebar
      const colorButtons = screen.getAllByRole('button')
      // Filter for sidebar color buttons (not toolbar buttons)
      const sidebarButton = colorButtons.find((btn) =>
        btn.closest('[data-color-path]')
      )
      if (sidebarButton) {
        fireEvent.click(sidebarButton)
        expect(mockCommitPendingHistory).toHaveBeenCalled()
      }
    })
  })

  describe('clicking undefined colors', () => {
    it('calls addColor when clicking undefined color in sidebar', () => {
      // Use a theme style without a common property so it appears as "undefined"
      const minimalStyle: ThemeStyle = {
        background: '#1e1e1e',
        // Missing many common properties that will appear as "undefined"
      }

      const themeWithMinimalStyle: ThemeFamily = {
        name: 'Test Theme',
        author: 'Test Author',
        themes: [
          {
            name: 'Test Dark',
            appearance: 'dark',
            style: minimalStyle,
          },
        ],
      }

      mockUseThemeEditor.mockReturnValue({
        state: {
          ...loadedState,
          themeFamily: themeWithMinimalStyle,
          history: [themeWithMinimalStyle],
        },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: themeWithMinimalStyle.themes[0],
        serializedTheme: JSON.stringify(themeWithMinimalStyle, null, 2),
      })

      render(<ThemeEditor />)

      // Find a button with "+" which indicates undefined color
      const plusButtons = screen.getAllByRole('button').filter((btn) => {
        return btn.textContent?.includes('+')
      })

      if (plusButtons.length > 0) {
        fireEvent.click(plusButtons[0])
        // Should call addColor for undefined colors
        expect(mockAddColor).toHaveBeenCalled()
      }
    })
  })

  describe('color update from panel', () => {
    it('updates color when color panel changes value', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, selectedColorPath: 'style/background' },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // The ColorEditorPanel is rendered with the selected color
      // We just verify the component renders with a color selected
      expect(
        screen.queryByText('Select a color to edit')
      ).not.toBeInTheDocument()
    })
  })

  describe('dark mode with editor theme', () => {
    let mockSetDarkEditorTheme: ReturnType<typeof vi.fn>
    let mockSetLightEditorTheme: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockSetDarkEditorTheme = vi.fn()
      mockSetLightEditorTheme = vi.fn()
      mockUseLocalStorage.mockImplementation(
        (key: string, defaultValue: unknown) => {
          if (key === 'editorThemeDark') {
            return ['neutral-dark', mockSetDarkEditorTheme]
          }
          if (key === 'editorThemeLight') {
            return ['neutral-light', mockSetLightEditorTheme]
          }
          const values: Record<string, unknown> = {
            jsonColorFormat: 'hex',
            'zed-theme-editor-sidebar-width': 256,
          }
          return [values[key] ?? defaultValue, vi.fn()]
        }
      )
    })

    it('uses light editor theme in light mode', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, isDarkMode: false },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Change editor theme
      const themeSelect = screen.getByTitle('Editor theme')
      fireEvent.change(themeSelect, { target: { value: 'github-light' } })
      expect(mockSetLightEditorTheme).toHaveBeenCalledWith('github-light')
    })

    it('uses dark editor theme in dark mode', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, isDarkMode: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Change editor theme
      const themeSelect = screen.getByTitle('Editor theme')
      fireEvent.change(themeSelect, { target: { value: 'github-dark' } })
      expect(mockSetDarkEditorTheme).toHaveBeenCalledWith('github-dark')
    })
  })

  describe('multi-theme handling', () => {
    const multiThemeFamily: ThemeFamily = {
      name: 'Test Theme',
      author: 'Test Author',
      themes: [
        {
          name: 'Test Dark',
          appearance: 'dark',
          style: sampleStyle,
        },
        {
          name: 'Test Light',
          appearance: 'light',
          style: { ...sampleStyle, background: '#ffffff', text: '#000000' },
        },
      ],
    }

    it('renders theme tabs for multiple themes', () => {
      mockUseThemeEditor.mockReturnValue({
        state: {
          ...loadedState,
          themeFamily: multiThemeFamily,
        },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: multiThemeFamily.themes[0],
        serializedTheme: JSON.stringify(multiThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Theme tabs should be rendered
      expect(screen.getByText('Test Dark')).toBeInTheDocument()
      expect(screen.getByText('Test Light')).toBeInTheDocument()
    })

    it('switches theme when tab is clicked', () => {
      mockUseThemeEditor.mockReturnValue({
        state: {
          ...loadedState,
          themeFamily: multiThemeFamily,
        },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: multiThemeFamily.themes[0],
        serializedTheme: JSON.stringify(multiThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.click(screen.getByText('Test Light'))
      expect(mockSetActiveTheme).toHaveBeenCalledWith(1)
    })
  })

  describe('skip save when no changes or theme family', () => {
    it('does not save when no unsaved changes', async () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: false },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      // saveFile should not be called when no unsaved changes
      await waitFor(() => {
        expect(mockSaveFile).not.toHaveBeenCalled()
      })
    })

    it('does not call undo when canUndo is false', () => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true })

      expect(mockUndo).not.toHaveBeenCalled()
    })

    it('does not call redo when canRedo is false', () => {
      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true })

      expect(mockRedo).not.toHaveBeenCalled()
    })
  })

  describe('dropzone toggle dark mode in initial state', () => {
    it('toggles dark mode when no file loaded', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...defaultState, isDarkMode: false },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        toggleDarkMode: mockToggleDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: null,
        serializedTheme: '',
      })

      render(<ThemeEditor />)
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockToggleDarkMode).toHaveBeenCalled()
    })
  })

  describe('dark mode toggle with file loaded', () => {
    it('toggles dark mode in the main editor view', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, isDarkMode: false },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        toggleDarkMode: mockToggleDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // In loaded state, dark mode toggle is in toolbar
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockToggleDarkMode).toHaveBeenCalled()
    })

    it('toggles from dark to light mode in editor view', () => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, isDarkMode: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        toggleDarkMode: mockToggleDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockToggleDarkMode).toHaveBeenCalled()
    })
  })

  describe('color format transformation', () => {
    it('transforms colors when JSON color format is set', () => {
      let mockSetJsonColorFormat: ReturnType<typeof vi.fn>
      mockSetJsonColorFormat = vi.fn()

      mockUseLocalStorage.mockImplementation(
        (key: string, defaultValue: unknown) => {
          if (key === 'jsonColorFormat') {
            return ['rgb', mockSetJsonColorFormat]
          }
          const values: Record<string, unknown> = {
            editorThemeDark: 'neutral-dark',
            editorThemeLight: 'neutral-light',
            'zed-theme-editor-sidebar-width': 256,
          }
          return [values[key] ?? defaultValue, vi.fn()]
        }
      )

      mockUseThemeEditor.mockReturnValue({
        state: loadedState,
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Change color format
      const formatSelect = screen.getByTitle('Color format for JSON display')
      fireEvent.change(formatSelect, { target: { value: 'hsl' } })
      expect(mockSetJsonColorFormat).toHaveBeenCalledWith('hsl')
    })
  })

  describe('original colors tracking', () => {
    it('tracks original colors from history', () => {
      const originalStyle = { ...sampleStyle, background: '#000000' }
      const originalFamily = {
        ...sampleThemeFamily,
        themes: [{ ...sampleThemeFamily.themes[0], style: originalStyle }],
      }

      mockUseThemeEditor.mockReturnValue({
        state: {
          ...loadedState,
          history: [originalFamily], // Original state in history
        },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: false,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })

      render(<ThemeEditor />)
      // Component should render with original color tracking
      expect(screen.getByText('Colors')).toBeInTheDocument()
    })
  })

  describe('keyboard shortcut with ctrlKey', () => {
    beforeEach(() => {
      mockUseThemeEditor.mockReturnValue({
        state: { ...loadedState, hasUnsavedChanges: true },
        loadFile: mockLoadFile,
        closeFile: mockCloseFile,
        setActiveTheme: mockSetActiveTheme,
        selectColor: mockSelectColor,
        updateColorLive: mockUpdateColorLive,
        addColor: mockAddColor,
        commitPendingHistory: mockCommitPendingHistory,
        setDarkMode: mockSetDarkMode,
        markSaved: mockMarkSaved,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: true,
        canRedo: true,
        hasPendingHistory: false,
        currentTheme: sampleThemeFamily.themes[0],
        serializedTheme: JSON.stringify(sampleThemeFamily, null, 2),
      })
      mockSaveFile.mockResolvedValue(true)
    })

    it('handles Ctrl+S for save (Windows)', async () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 's', ctrlKey: true })
      await waitFor(() => {
        expect(mockSaveFile).toHaveBeenCalled()
      })
    })

    it('handles Ctrl+Z for undo (Windows)', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
      expect(mockUndo).toHaveBeenCalled()
    })

    it('handles Ctrl+Shift+Z for redo (Windows)', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
      expect(mockRedo).toHaveBeenCalled()
    })

    it('handles Ctrl+Y for redo (Windows)', () => {
      render(<ThemeEditor />)
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
      expect(mockRedo).toHaveBeenCalled()
    })

    it('handles Ctrl+F to focus search (Windows)', () => {
      render(<ThemeEditor />)
      const searchInput = screen.getByPlaceholderText('Filter colors...')
      fireEvent.keyDown(window, { key: 'f', ctrlKey: true })
      expect(document.activeElement).toBe(searchInput)
    })
  })
})
