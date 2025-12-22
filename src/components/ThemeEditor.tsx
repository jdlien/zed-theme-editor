/**
 * ThemeEditor Component
 * Main application layout integrating all editor components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useThemeEditor } from '@/hooks/useThemeEditor'
import { useFileAccess } from '@/hooks/useFileAccess'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { extractColors, extractColorsAsMap } from '@/lib/jsonParsing'
import { formatShortcut } from '@/lib/keyboard'
import { getDefaultTheme, type EditorThemeName } from '@/lib/editorThemes'
import { DropZone } from './DropZone'
import { Toolbar } from './Toolbar'
import { ThemeTabs } from './ThemeTabs'
import { JsonEditorPanel, normalizeColorPath } from './JsonEditorPanel'
import { ColorEditorPanel } from './ColorEditorPanel'
import { ThemePreview } from './ThemePreview'
import { ColorSwatchRow } from './ColorSwatch'
import { SearchInput } from './SearchInput'

export function ThemeEditor() {
  const {
    state,
    loadFile,
    setActiveTheme,
    selectColor,
    updateColor,
    setDarkMode,
    markSaved,
    undo,
    redo,
    canUndo,
    canRedo,
    currentTheme,
    serializedTheme,
  } = useThemeEditor()

  const { saveFile, isSupported: canSaveInPlace } = useFileAccess()

  // Editor theme state (persisted to localStorage)
  const [editorTheme, setEditorTheme] = useLocalStorage<EditorThemeName>(
    'editorTheme',
    getDefaultTheme(state.isDarkMode)
  )

  // Color filter state
  const [colorFilter, setColorFilter] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Extract colors from current theme
  const colors = useMemo(() => {
    if (!currentTheme) return []
    return extractColors(currentTheme.style)
  }, [currentTheme])

  // Filter colors based on search term
  const filteredColors = useMemo(() => {
    if (!colorFilter.trim()) return colors
    const term = colorFilter.toLowerCase()
    return colors.filter(
      (color) =>
        color.path.toLowerCase().includes(term) ||
        color.key.toLowerCase().includes(term) ||
        color.value.toLowerCase().includes(term)
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
  ])

  // Handle color click in editor
  const handleColorClick = useCallback(
    (path: string, _color: string, _position: number) => {
      // Normalize path from full document format to theme-relative format
      const { path: normalizedPath, themeIndex } = normalizeColorPath(path)

      // If clicking in a different theme, switch to it
      if (themeIndex !== null && themeIndex !== state.activeThemeIndex) {
        setActiveTheme(themeIndex)
      }

      selectColor(normalizedPath)
    },
    [selectColor, setActiveTheme, state.activeThemeIndex]
  )

  // Handle color update from panel
  const handleColorChange = useCallback(
    (newColor: string) => {
      if (state.selectedColorPath) {
        updateColor(state.selectedColorPath, newColor)
      }
    },
    [state.selectedColorPath, updateColor]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) undo()
      } else if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (canRedo) redo()
      } else if (isMod && e.key === 'y') {
        e.preventDefault()
        if (canRedo) redo()
      } else if (isMod && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        selectColor(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, undo, redo, canUndo, canRedo, selectColor])

  // Show drop zone if no file loaded
  if (!state.themeFamily) {
    return (
      <div
        className={`flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white ${state.isDarkMode ? 'dark' : ''}`}
      >
        <Toolbar
          isDarkMode={state.isDarkMode}
          onToggleDarkMode={() => setDarkMode(!state.isDarkMode)}
          editorTheme={editorTheme}
          onEditorThemeChange={setEditorTheme}
        />
        <div className="flex flex-1 items-center justify-center p-8">
          <DropZone
            onFileLoad={(content, fileName, handle) => {
              loadFile({ content, name: fileName, handle })
            }}
            onError={(error) => console.error('File load error:', error)}
          />
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
        canSave={canSaveInPlace}
        isDarkMode={state.isDarkMode}
        onToggleDarkMode={() => setDarkMode(!state.isDarkMode)}
        editorTheme={editorTheme}
        onEditorThemeChange={setEditorTheme}
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
        <aside className="flex w-64 flex-col border-r border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-neutral-300 px-3 py-2 dark:border-neutral-700">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Colors
            </h2>
            <p className="text-xs text-neutral-500">
              {colorFilter
                ? `${filteredColors.length} of ${colors.length} properties`
                : `${colors.length} properties`}
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
          <div className="flex-1 overflow-y-auto p-2">
            {filteredColors.length === 0 && colorFilter ? (
              <p className="px-2 py-4 text-center text-sm text-neutral-500">
                No matching colors
              </p>
            ) : (
              filteredColors.map((color) => (
                <ColorSwatchRow
                  key={color.path}
                  label={color.key}
                  color={color.value}
                  originalColor={originalColors.get(color.path)}
                  isSelected={color.path === state.selectedColorPath}
                  onClick={() => selectColor(color.path)}
                  displayFormat={state.colorDisplayFormat}
                />
              ))
            )}
          </div>
        </aside>

        {/* Center: JSON Editor */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-0">
            <JsonEditorPanel
              content={serializedTheme}
              onColorClick={handleColorClick}
              selectedColorPath={state.selectedColorPath}
              isDarkMode={state.isDarkMode}
              editorTheme={editorTheme}
              originalColors={originalColors}
            />
          </div>

          {/* Theme Preview */}
          {currentTheme && (
            <div className="border-t border-neutral-300 p-4 dark:border-neutral-700">
              <ThemePreview style={currentTheme.style} />
            </div>
          )}
        </main>

        {/* Right panel: Color Editor */}
        <aside className="w-80 overflow-y-auto border-l border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
          <ColorEditorPanel
            color={selectedColor?.value || null}
            colorPath={selectedColor?.path || null}
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
          {state.hasUnsavedChanges && <span>{formatShortcut('S')} to save</span>}
        </div>
      </footer>
    </div>
  )
}

export default ThemeEditor
