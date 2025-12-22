/**
 * Toolbar Component
 * Main application toolbar with file info, save button, and settings
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'

interface ToolbarProps {
  fileName?: string
  hasUnsavedChanges?: boolean
  onSave?: () => void
  canSave?: boolean
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function Toolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  canSave = true,
  isDarkMode,
  onToggleDarkMode,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Zed Theme Editor</h1>
        {fileName && (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {fileName}
            {hasUnsavedChanges && (
              <span className="ml-1 text-yellow-600 dark:text-yellow-500" title="Unsaved changes">
                *
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="h-4 w-4" />
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!canSave || !hasUnsavedChanges}
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
            Save
          </button>
        )}
      </div>
    </header>
  )
}

export default Toolbar
