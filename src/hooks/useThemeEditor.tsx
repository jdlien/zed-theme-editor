/**
 * useThemeEditor hook and context
 * Central state management for the theme editor
 */

import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, ReactNode } from 'react'
import type { ThemeFamily, ColorFormat } from '@/types/theme'
import { parseThemeFile, serializeTheme, updateColorAtPath } from '@/lib/jsonParsing'
import type { FileData } from './useFileAccess'

// ============================================================================
// State Types
// ============================================================================

export interface EditorState {
  // File data
  themeFamily: ThemeFamily | null
  originalText: string
  fileName: string | null
  fileHandle: FileSystemFileHandle | null

  // Editor state
  activeThemeIndex: number
  selectedColorPath: string | null
  colorDisplayFormat: ColorFormat
  isDarkMode: boolean

  // Status
  hasUnsavedChanges: boolean
  isLoading: boolean
  error: string | null

  // History for undo/redo
  history: ThemeFamily[]
  historyIndex: number
  /** The history index that was last saved (for tracking unsaved changes) */
  savedHistoryIndex: number
  /** Pending history commit for debounced updates (stores state before rapid changes) */
  pendingHistoryCommit: ThemeFamily | null
}

const initialState: EditorState = {
  themeFamily: null,
  originalText: '',
  fileName: null,
  fileHandle: null,

  activeThemeIndex: 0,
  selectedColorPath: null,
  colorDisplayFormat: 'hex',
  isDarkMode: true,

  hasUnsavedChanges: false,
  isLoading: false,
  error: null,

  history: [],
  historyIndex: -1,
  savedHistoryIndex: -1,
  pendingHistoryCommit: null,
}

// ============================================================================
// Action Types
// ============================================================================

export type EditorAction =
  | { type: 'LOAD_FILE_START' }
  | { type: 'LOAD_FILE_SUCCESS'; payload: { themeFamily: ThemeFamily; text: string; fileName: string; handle: FileSystemFileHandle | null } }
  | { type: 'LOAD_FILE_ERROR'; payload: string }
  | { type: 'CLOSE_FILE' }
  | { type: 'SET_ACTIVE_THEME'; payload: number }
  | { type: 'SELECT_COLOR'; payload: string | null }
  | { type: 'UPDATE_COLOR'; payload: { path: string; value: string } }
  | { type: 'UPDATE_COLOR_LIVE'; payload: { path: string; value: string } }
  | { type: 'ADD_COLOR'; payload: { path: string; value: string } }
  | { type: 'COMMIT_PENDING_HISTORY' }
  | { type: 'SET_COLOR_FORMAT'; payload: ColorFormat }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'MARK_SAVED'; payload: { handle?: FileSystemFileHandle } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_ERROR' }

// ============================================================================
// Reducer
// ============================================================================

const MAX_HISTORY = 50

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_FILE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'LOAD_FILE_SUCCESS': {
      const { themeFamily, text, fileName, handle } = action.payload
      return {
        ...state,
        themeFamily,
        originalText: text,
        fileName,
        fileHandle: handle,
        activeThemeIndex: 0,
        selectedColorPath: null,
        hasUnsavedChanges: false,
        isLoading: false,
        error: null,
        history: [themeFamily],
        historyIndex: 0,
        savedHistoryIndex: 0,
        pendingHistoryCommit: null,
      }
    }

    case 'LOAD_FILE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }

    case 'CLOSE_FILE':
      return {
        ...initialState,
        colorDisplayFormat: state.colorDisplayFormat,
        isDarkMode: state.isDarkMode,
      }

    case 'SET_ACTIVE_THEME':
      return {
        ...state,
        activeThemeIndex: action.payload,
        selectedColorPath: null,
      }

    case 'SELECT_COLOR':
      return {
        ...state,
        selectedColorPath: action.payload,
      }

    case 'UPDATE_COLOR': {
      if (!state.themeFamily) return state

      const { path, value } = action.payload
      const updated = updateColorAtPath(state.themeFamily, state.activeThemeIndex, path, value)

      // Trim history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(updated)

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      return {
        ...state,
        themeFamily: updated,
        hasUnsavedChanges: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        pendingHistoryCommit: null, // Clear pending on direct update
      }
    }

    case 'UPDATE_COLOR_LIVE': {
      // Live update: changes theme immediately but defers history commit
      if (!state.themeFamily) return state

      const { path, value } = action.payload
      const updated = updateColorAtPath(state.themeFamily, state.activeThemeIndex, path, value)

      return {
        ...state,
        themeFamily: updated,
        hasUnsavedChanges: true,
        // Only capture pending state on first change in a rapid sequence
        pendingHistoryCommit: state.pendingHistoryCommit ?? state.themeFamily,
      }
    }

    case 'ADD_COLOR': {
      // Add a new color property to the theme and select it
      if (!state.themeFamily) return state

      const { path, value } = action.payload
      const updated = updateColorAtPath(state.themeFamily, state.activeThemeIndex, path, value)

      // Trim history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(updated)

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      return {
        ...state,
        themeFamily: updated,
        selectedColorPath: path,
        hasUnsavedChanges: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        pendingHistoryCommit: null,
      }
    }

    case 'COMMIT_PENDING_HISTORY': {
      // Commit pending changes to history
      if (!state.pendingHistoryCommit || !state.themeFamily) {
        return { ...state, pendingHistoryCommit: null }
      }

      // Trim history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(state.themeFamily)

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        pendingHistoryCommit: null,
      }
    }

    case 'SET_COLOR_FORMAT':
      return {
        ...state,
        colorDisplayFormat: action.payload,
      }

    case 'SET_DARK_MODE':
      return {
        ...state,
        isDarkMode: action.payload,
      }

    case 'MARK_SAVED':
      return {
        ...state,
        hasUnsavedChanges: false,
        savedHistoryIndex: state.historyIndex,
        fileHandle: action.payload.handle ?? state.fileHandle,
        originalText: state.themeFamily ? serializeTheme(state.themeFamily) : state.originalText,
      }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state

      const newIndex = state.historyIndex - 1
      return {
        ...state,
        themeFamily: state.history[newIndex],
        historyIndex: newIndex,
        hasUnsavedChanges: newIndex !== state.savedHistoryIndex,
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state

      const newIndex = state.historyIndex + 1
      return {
        ...state,
        themeFamily: state.history[newIndex],
        historyIndex: newIndex,
        hasUnsavedChanges: newIndex !== state.savedHistoryIndex,
      }
    }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    /* v8 ignore next 2 -- TypeScript ensures exhaustive case handling */
    default:
      return state
  }
}

// ============================================================================
// Context
// ============================================================================

interface ThemeEditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>

  // Convenience actions
  loadFile: (fileData: FileData) => void
  closeFile: () => void
  setActiveTheme: (index: number) => void
  selectColor: (path: string | null) => void
  updateColor: (path: string, value: string) => void
  updateColorLive: (path: string, value: string) => void
  addColor: (path: string, value: string) => void
  commitPendingHistory: () => void
  setColorFormat: (format: ColorFormat) => void
  setDarkMode: (isDark: boolean) => void
  markSaved: (handle?: FileSystemFileHandle) => void
  undo: () => void
  redo: () => void
  clearError: () => void

  // Computed values
  canUndo: boolean
  canRedo: boolean
  hasPendingHistory: boolean
  currentTheme: ThemeFamily['themes'][number] | null
  serializedTheme: string
}

const ThemeEditorContext = createContext<ThemeEditorContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface ThemeEditorProviderProps {
  children: ReactNode
  initialColorFormat?: ColorFormat
  initialDarkMode?: boolean
}

export function ThemeEditorProvider({
  children,
  initialColorFormat = 'hex',
  initialDarkMode = true,
}: ThemeEditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    colorDisplayFormat: initialColorFormat,
    isDarkMode: initialDarkMode,
  })

  // Action creators
  const loadFile = useCallback((fileData: FileData) => {
    dispatch({ type: 'LOAD_FILE_START' })

    const result = parseThemeFile(fileData.content)
    if (result.success) {
      dispatch({
        type: 'LOAD_FILE_SUCCESS',
        payload: {
          themeFamily: result.data,
          text: result.normalized,
          fileName: fileData.name,
          handle: fileData.handle,
        },
      })
    } else {
      dispatch({
        type: 'LOAD_FILE_ERROR',
        payload: result.error,
      })
    }
  }, [])

  const closeFile = useCallback(() => {
    dispatch({ type: 'CLOSE_FILE' })
  }, [])

  const setActiveTheme = useCallback((index: number) => {
    dispatch({ type: 'SET_ACTIVE_THEME', payload: index })
  }, [])

  const selectColor = useCallback((path: string | null) => {
    dispatch({ type: 'SELECT_COLOR', payload: path })
  }, [])

  const updateColor = useCallback((path: string, value: string) => {
    dispatch({ type: 'UPDATE_COLOR', payload: { path, value } })
  }, [])

  const updateColorLive = useCallback((path: string, value: string) => {
    dispatch({ type: 'UPDATE_COLOR_LIVE', payload: { path, value } })
  }, [])

  const addColor = useCallback((path: string, value: string) => {
    dispatch({ type: 'ADD_COLOR', payload: { path, value } })
  }, [])

  const commitPendingHistory = useCallback(() => {
    dispatch({ type: 'COMMIT_PENDING_HISTORY' })
  }, [])

  const setColorFormat = useCallback((format: ColorFormat) => {
    dispatch({ type: 'SET_COLOR_FORMAT', payload: format })
  }, [])

  const setDarkMode = useCallback((isDark: boolean) => {
    dispatch({ type: 'SET_DARK_MODE', payload: isDark })
  }, [])

  const markSaved = useCallback((handle?: FileSystemFileHandle) => {
    dispatch({ type: 'MARK_SAVED', payload: { handle } })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // Debounce timer for auto-committing history after 800ms of inactivity
  const HISTORY_DEBOUNCE_MS = 800

  useEffect(() => {
    if (!state.pendingHistoryCommit) return

    const timer = setTimeout(() => {
      dispatch({ type: 'COMMIT_PENDING_HISTORY' })
    }, HISTORY_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [state.themeFamily, state.pendingHistoryCommit])

  // Computed values
  const canUndo = state.historyIndex > 0 || state.pendingHistoryCommit !== null
  const canRedo = state.historyIndex < state.history.length - 1
  const hasPendingHistory = state.pendingHistoryCommit !== null
  const currentTheme = state.themeFamily?.themes[state.activeThemeIndex] ?? null
  const serializedTheme = useMemo(
    () => (state.themeFamily ? serializeTheme(state.themeFamily) : ''),
    [state.themeFamily]
  )

  const value = useMemo<ThemeEditorContextValue>(
    () => ({
      state,
      dispatch,
      loadFile,
      closeFile,
      setActiveTheme,
      selectColor,
      updateColor,
      updateColorLive,
      addColor,
      commitPendingHistory,
      setColorFormat,
      setDarkMode,
      markSaved,
      undo,
      redo,
      clearError,
      canUndo,
      canRedo,
      hasPendingHistory,
      currentTheme,
      serializedTheme,
    }),
    [
      state,
      loadFile,
      closeFile,
      setActiveTheme,
      selectColor,
      updateColor,
      updateColorLive,
      addColor,
      commitPendingHistory,
      setColorFormat,
      setDarkMode,
      markSaved,
      undo,
      redo,
      clearError,
      canUndo,
      canRedo,
      hasPendingHistory,
      currentTheme,
      serializedTheme,
    ]
  )

  return <ThemeEditorContext.Provider value={value}>{children}</ThemeEditorContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useThemeEditor(): ThemeEditorContextValue {
  const context = useContext(ThemeEditorContext)
  if (!context) {
    throw new Error('useThemeEditor must be used within a ThemeEditorProvider')
  }
  return context
}

// Export types
export type { ThemeEditorContextValue }
