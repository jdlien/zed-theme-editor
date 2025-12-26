/**
 * ThemeEditor Component
 * Main application layout integrating all editor components
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react'
import { useThemeEditor } from '@/hooks/useThemeEditor'
import { useFileAccess } from '@/hooks/useFileAccess'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRecentFiles } from '@/hooks/useRecentFiles'
import type { RecentFile } from '@/lib/recentFiles'
import {
  getAllThemeColors,
  extractColorsAsMap,
  transformColorsInJson,
  normalizeColorPath,
  type AllColorsEntry,
} from '@/lib/jsonParsing'
import type { ColorFormat } from '@/types/theme'
import { formatShortcut } from '@/lib/keyboard'
import type { EditorThemeName } from '@/lib/editorThemeMeta'
import { DropZone } from './DropZone'
import { Toolbar } from './Toolbar'
import { ThemeTabs } from './ThemeTabs'
import type { JsonEditorPanelHandle } from './JsonEditorPanel'

// Lazy load the JSON editor (CodeMirror is ~250KB)
const JsonEditorPanel = lazy(() => import('./JsonEditorPanel'))

import { ColorEditorPanel } from './ColorEditorPanel'
import { ThemePreview } from './ThemePreview'
import { ColorSwatchRow } from './ColorSwatch'
import { SearchInput } from './SearchInput'

export function ThemeEditor() {
  const {
    state,
    loadFile,
    closeFile,
    setActiveTheme,
    selectColor,
    updateColorLive,
    addColor,
    commitPendingHistory,
    setDarkMode,
    markSaved,
    undo,
    redo,
    canUndo,
    canRedo,
    hasPendingHistory,
    currentTheme,
    serializedTheme,
  } = useThemeEditor()

  const {
    openFile,
    openFileFromHandle,
    saveFile,
    isSupported: canSaveInPlace,
  } = useFileAccess()
  const {
    recentFiles,
    addFile: addRecentFile,
    removeFile: removeRecentFile,
  } = useRecentFiles()

  // Handle opening a new file
  const handleOpenFile = useCallback(async () => {
    const result = await openFile()
    if (result) {
      loadFile({
        content: result.content,
        name: result.name,
        handle: result.handle,
      })
      // Add to recent files if we have a handle
      if (result.handle) {
        addRecentFile(result.handle)
      }
    }
  }, [openFile, loadFile, addRecentFile])

  // Handle closing the current file
  const handleCloseFile = useCallback(() => {
    if (state.hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close this file?'
      )
      if (!confirmed) return
    }
    closeFile()
  }, [state.hasUnsavedChanges, closeFile])

  // Handle opening a recent file
  const handleRecentFileClick = useCallback(
    async (file: RecentFile) => {
      const result = await openFileFromHandle(file.handle)
      if (result) {
        loadFile({
          content: result.content,
          name: result.name,
          handle: result.handle,
        })
        // Update recency timestamp (handle is always set when using openFileFromHandle)
        if (result.handle) {
          addRecentFile(result.handle)
        }
      } else {
        // File no longer exists - remove from recent files
        removeRecentFile(file.id)
      }
    },
    [openFileFromHandle, loadFile, addRecentFile, removeRecentFile]
  )

  // Editor theme state - separate preferences for dark and light modes
  const [darkEditorTheme, setDarkEditorTheme] =
    useLocalStorage<EditorThemeName>('editorThemeDark', 'neutral-dark')
  const [lightEditorTheme, setLightEditorTheme] =
    useLocalStorage<EditorThemeName>('editorThemeLight', 'neutral-light')

  // Use the appropriate theme based on current mode
  const editorTheme = state.isDarkMode ? darkEditorTheme : lightEditorTheme
  const setEditorTheme = state.isDarkMode
    ? setDarkEditorTheme
    : setLightEditorTheme

  // Color format for JSON display (persisted)
  const [jsonColorFormat, setJsonColorFormat] = useLocalStorage<ColorFormat>(
    'jsonColorFormat',
    'hex'
  )

  // Transform serialized theme for display in selected color format
  const displayContent = useMemo(() => {
    if (!serializedTheme) return ''
    return transformColorsInJson(serializedTheme, jsonColorFormat)
  }, [serializedTheme, jsonColorFormat])

  // Color filter state
  const [colorFilter, setColorFilter] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const colorListRef = useRef<HTMLDivElement>(null)
  const jsonEditorRef = useRef<JsonEditorPanelHandle>(null)

  // Track pending scroll for newly added colors
  const pendingScrollPath = useRef<string | null>(null)

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>(
    'zed-theme-editor-sidebar-width',
    256 // 16rem = 256px (w-64)
  )
  const isResizingSidebar = useRef(false)

  const handleSidebarResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizingSidebar.current = true
      const startX = e.clientX
      const startWidth = sidebarWidth

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingSidebar.current) return
        const delta = e.clientX - startX
        const newWidth = Math.min(500, Math.max(180, startWidth + delta))
        setSidebarWidth(newWidth)
      }

      const handleMouseUp = () => {
        isResizingSidebar.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [sidebarWidth, setSidebarWidth]
  )

  // Extract ALL colors from current theme (defined + undefined from schema)
  const colors = useMemo((): AllColorsEntry[] => {
    if (!currentTheme) return []
    const appearance = currentTheme.appearance || 'dark'
    return getAllThemeColors(currentTheme.style, appearance)
  }, [currentTheme])

  // Filter colors based on search term
  const filteredColors = useMemo(() => {
    if (!colorFilter.trim()) return colors
    const term = colorFilter.toLowerCase()
    return colors.filter(
      (color) =>
        color.path.toLowerCase().includes(term) ||
        color.key.toLowerCase().includes(term) ||
        color.value.toLowerCase().includes(term) ||
        color.description?.toLowerCase().includes(term)
    )
  }, [colors, colorFilter])

  // Get original colors from initial load state (history[0])
  const originalColors = useMemo(() => {
    const originalTheme = state.history[0]
    if (!originalTheme) return new Map<string, string>()
    const originalStyle = originalTheme.themes[state.activeThemeIndex]?.style
    if (!originalStyle) return new Map<string, string>()
    return extractColorsAsMap(originalStyle)
  }, [state.history, state.activeThemeIndex])

  // Get selected color info
  const selectedColor = useMemo(() => {
    if (!state.selectedColorPath || !colors.length) return null
    return colors.find((c) => c.path === state.selectedColorPath) || null
  }, [colors, state.selectedColorPath])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!state.themeFamily || !state.hasUnsavedChanges) return

    // Commit any pending history before saving
    if (hasPendingHistory) {
      commitPendingHistory()
    }

    try {
      const success = await saveFile(serializedTheme, state.fileHandle)
      if (success) {
        markSaved(state.fileHandle || undefined)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }, [
    state.themeFamily,
    state.hasUnsavedChanges,
    state.fileHandle,
    serializedTheme,
    saveFile,
    markSaved,
    hasPendingHistory,
    commitPendingHistory,
  ])

  // Handle color selection with pending history commit
  const handleSelectColor = useCallback(
    (path: string | null) => {
      if (hasPendingHistory) {
        commitPendingHistory()
      }
      selectColor(path)
    },
    [hasPendingHistory, commitPendingHistory, selectColor]
  )

  // Scroll sidebar to show a color path
  /* v8 ignore start -- scroll behavior requires real DOM for testing */
  const scrollSidebarToPath = useCallback((path: string) => {
    const container = colorListRef.current
    if (!container) return

    requestAnimationFrame(() => {
      const selectedElement = container.querySelector(
        `[data-color-path="${CSS.escape(path)}"]`
      ) as HTMLElement | null

      if (selectedElement) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()

        // Only scroll if element is outside visible area
        if (
          elementRect.top < containerRect.top ||
          elementRect.bottom > containerRect.bottom
        ) {
          selectedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
      }
    })
  }, [])
  /* v8 ignore stop */

  // Handle color click in JSON editor - scroll sidebar to show the color
  /* v8 ignore start -- passed to JsonEditorPanel which is excluded from coverage */
  const handleColorClick = useCallback(
    (path: string, _color: string, _position: number) => {
      // Normalize path from full document format to theme-relative format
      const { path: normalizedPath, themeIndex } = normalizeColorPath(path)

      // If clicking in a different theme, switch to it
      if (themeIndex !== null && themeIndex !== state.activeThemeIndex) {
        setActiveTheme(themeIndex)
      }

      // handleSelectColor will commit pending history
      handleSelectColor(normalizedPath)

      // Scroll sidebar to show this color
      scrollSidebarToPath(normalizedPath)
    },
    [
      handleSelectColor,
      setActiveTheme,
      state.activeThemeIndex,
      scrollSidebarToPath,
    ]
  )
  /* v8 ignore stop */

  // Handle color click in sidebar - scroll JSON editor to show the color
  // If color is not defined, add it to the theme first
  const handleSidebarColorClick = useCallback(
    (path: string, defined: boolean, defaultValue: string) => {
      if (!defined) {
        // Add the color to the theme with default value
        addColor(path, defaultValue)
        // Store path for scrolling after content updates
        pendingScrollPath.current = path
      } else {
        handleSelectColor(path)
        // Scroll JSON editor to show this color
        jsonEditorRef.current?.scrollToColorPath(path)
      }
    },
    [handleSelectColor, addColor]
  )

  // Scroll to newly added color when editor content updates
  useEffect(() => {
    if (pendingScrollPath.current && displayContent) {
      const path = pendingScrollPath.current
      pendingScrollPath.current = null
      // Wait for React to render and editor to process the new content
      // Double rAF ensures both the React render and CodeMirror update complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jsonEditorRef.current?.scrollToColorPath(path)
        })
      })
    }
  }, [displayContent])

  // Handle color update from panel (uses debounced history)
  /* v8 ignore start -- forwards to updateColorLive which is tested in useThemeEditor */
  const handleColorChange = useCallback(
    (newColor: string) => {
      if (state.selectedColorPath) {
        updateColorLive(state.selectedColorPath, newColor)
      }
    },
    [state.selectedColorPath, updateColorLive]
  )
  /* v8 ignore stop */

  // Handle undo with pending history commit
  const handleUndo = useCallback(() => {
    // Commit pending changes first so they become undoable
    if (hasPendingHistory) {
      commitPendingHistory()
    }
    undo()
  }, [hasPendingHistory, commitPendingHistory, undo])

  // Handle redo with pending history commit
  const handleRedo = useCallback(() => {
    if (hasPendingHistory) {
      commitPendingHistory()
    }
    redo()
  }, [hasPendingHistory, commitPendingHistory, redo])

  // Preload the JSON editor chunk immediately (non-blocking)
  // This ensures it's ready by the time the user loads a file
  useEffect(() => {
    import('./JsonEditorPanel')
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) handleUndo()
      } else if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (canRedo) handleRedo()
      } else if (isMod && e.key === 'y') {
        e.preventDefault()
        if (canRedo) handleRedo()
      } else if (isMod && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        handleSelectColor(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleUndo, handleRedo, canUndo, canRedo, handleSelectColor])

  // Show drop zone if no file loaded
  if (!state.themeFamily) {
    return (
      <div
        className={`flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white ${state.isDarkMode ? 'dark' : ''}`}
      >
        <Toolbar
          isDarkMode={state.isDarkMode}
          onToggleDarkMode={() => setDarkMode(!state.isDarkMode)}
          onOpenFile={handleOpenFile}
          onCloseFile={handleCloseFile}
          editorTheme={editorTheme}
          onEditorThemeChange={setEditorTheme}
          colorFormat={jsonColorFormat}
          onColorFormatChange={setJsonColorFormat}
        />
        <div className="flex flex-1 items-center justify-center p-8">
          {/* v8 ignore start -- callbacks delegate to tested functions */}
          <DropZone
            onFileLoad={(content, fileName, handle) => {
              loadFile({ content, name: fileName, handle })
              // Add to recent files if we have a handle
              if (handle) {
                addRecentFile(handle)
              }
            }}
            onError={(error) => console.error('File load error:', error)}
            recentFiles={recentFiles}
            onRecentFileClick={handleRecentFileClick}
            onRecentFileRemove={removeRecentFile}
          />
          {/* v8 ignore stop */}
        </div>
        {state.error && (
          <div className="bg-red-300/50 px-4 py-2 text-center text-sm text-red-900 dark:bg-red-900/50 dark:text-red-200">
            {state.error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white ${state.isDarkMode ? 'dark' : ''}`}
    >
      {/* Toolbar */}
      <Toolbar
        fileName={state.fileName || undefined}
        hasUnsavedChanges={state.hasUnsavedChanges}
        onSave={handleSave}
        onOpenFile={handleOpenFile}
        onCloseFile={handleCloseFile}
        canSave={canSaveInPlace}
        isDarkMode={state.isDarkMode}
        onToggleDarkMode={() => setDarkMode(!state.isDarkMode)}
        editorTheme={editorTheme}
        onEditorThemeChange={setEditorTheme}
        colorFormat={jsonColorFormat}
        onColorFormatChange={setJsonColorFormat}
      />

      {/* Theme tabs */}
      <ThemeTabs
        themes={state.themeFamily.themes}
        activeIndex={state.activeThemeIndex}
        onSelect={setActiveTheme}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Color list */}
        <aside
          className="relative flex flex-col border-r border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Resize handle */}
          <div
            className="absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize bg-transparent hover:bg-indigo-500/50 active:bg-indigo-500"
            onMouseDown={handleSidebarResizeStart}
            title="Drag to resize"
          />
          <div className="border-b border-neutral-300 px-3 py-2 dark:border-neutral-700">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Colors
            </h2>
            <p className="text-xs text-neutral-500">
              {colorFilter
                ? `${filteredColors.length} of ${colors.length} properties`
                : `${colors.filter((c) => c.defined).length} defined / ${colors.length} available`}
            </p>
          </div>
          <div className="border-b border-neutral-300 px-2 py-2 dark:border-neutral-700">
            <SearchInput
              value={colorFilter}
              onChange={setColorFilter}
              placeholder="Filter colors..."
              inputRef={searchInputRef}
            />
          </div>
          <div ref={colorListRef} className="flex-1 overflow-y-auto p-2">
            {filteredColors.length === 0 && colorFilter ? (
              <p className="px-2 py-4 text-center text-sm text-neutral-500">
                No matching colors
              </p>
            ) : (
              filteredColors.map((color) => (
                <div key={color.path} data-color-path={color.path}>
                  <ColorSwatchRow
                    label={color.key}
                    color={color.value}
                    originalColor={originalColors.get(color.path)}
                    isSelected={color.path === state.selectedColorPath}
                    defined={color.defined}
                    description={color.description}
                    onClick={() =>
                      handleSidebarColorClick(
                        color.path,
                        color.defined,
                        color.value
                      )
                    }
                    displayFormat={state.colorDisplayFormat}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center: JSON Editor */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-0">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-neutral-100 dark:bg-neutral-900">
                  <span className="text-neutral-500">Loading editor...</span>
                </div>
              }
            >
              <JsonEditorPanel
                ref={jsonEditorRef}
                content={displayContent}
                onColorClick={handleColorClick}
                selectedColorPath={state.selectedColorPath}
                isDarkMode={state.isDarkMode}
                editorTheme={editorTheme}
                originalColors={originalColors}
                activeThemeIndex={state.activeThemeIndex}
              />
            </Suspense>
          </div>

          {/* Theme Preview */}
          {currentTheme && (
            <div className="border-t border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
              <ThemePreview style={currentTheme.style} />
            </div>
          )}
        </main>

        {/* Right panel: Color Editor */}
        <aside className="w-80 overflow-y-auto border-l border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
          <ColorEditorPanel
            color={selectedColor?.value || null}
            colorPath={selectedColor?.path || null}
            description={selectedColor?.description}
            originalColor={
              selectedColor ? originalColors.get(selectedColor.path) : undefined
            }
            onChange={handleColorChange}
          />
        </aside>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-neutral-300 bg-neutral-50 px-4 py-1 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        <div>
          {state.themeFamily.name} by {state.themeFamily.author}
        </div>
        <div className="flex items-center gap-4">
          {canUndo && <span>{formatShortcut('Z')} to undo</span>}
          {canRedo && <span>{formatShortcut('Z', true)} to redo</span>}
          {state.hasUnsavedChanges && (
            <span>{formatShortcut('S')} to save</span>
          )}
        </div>
      </footer>
    </div>
  )
}

export default ThemeEditor
