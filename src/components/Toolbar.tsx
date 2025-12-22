/**
 * Toolbar Component
 * Main application toolbar with file info, save button, and settings
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import { formatShortcut } from '@/lib/keyboard'
import { editorThemes, type EditorThemeName } from '@/lib/editorThemes'
import { ZedLogo } from './ZedLogo'

interface ToolbarProps {
  fileName?: string
  hasUnsavedChanges?: boolean
  onSave?: () => void
  canSave?: boolean
  isDarkMode: boolean
  onToggleDarkMode: () => void
  editorTheme?: EditorThemeName
  onEditorThemeChange?: (theme: EditorThemeName) => void
}

export function Toolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  canSave = true,
  isDarkMode,
  onToggleDarkMode,
  editorTheme,
  onEditorThemeChange,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ZedLogo size={28} className="animate-hue-cycle text-[#084CCF]" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Zed Theme Editor
          </h1>
        </div>
        {fileName && (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {fileName}
            {hasUnsavedChanges && (
              <span
                className="ml-1 text-yellow-600 dark:text-yellow-500"
                title="Unsaved changes"
              >
                *
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onEditorThemeChange && (
          <select
            value={editorTheme}
            onChange={(e) =>
              onEditorThemeChange(e.target.value as EditorThemeName)
            }
            className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            title="Editor theme"
          >
            {Object.values(editorThemes)
              .filter((theme) => theme.isDark === isDarkMode)
              .map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.label}
                </option>
              ))}
          </select>
        )}
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <FontAwesomeIcon
            icon={isDarkMode ? faSun : faMoon}
            className="h-4 w-4"
          />
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!canSave || !hasUnsavedChanges}
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            title={`Save (${formatShortcut('S')})`}
          >
            Save
          </button>
        )}
      </div>
    </header>
  )
}

export default Toolbar
