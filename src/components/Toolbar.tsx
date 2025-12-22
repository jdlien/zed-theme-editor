/**
 * Toolbar Component
 * Main application toolbar with file info, save button, and settings
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon, faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { formatShortcut } from '@/lib/keyboard'
import { editorThemeMeta, type EditorThemeName } from '@/lib/editorThemeMeta'
import { ZedLogo } from './ZedLogo'
import type { ColorFormat } from '@/types/theme'

const colorFormatOptions: { value: ColorFormat; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'oklch', label: 'OKLCH' },
]

interface ToolbarProps {
  fileName?: string
  hasUnsavedChanges?: boolean
  onSave?: () => void
  onOpenFile?: () => void
  canSave?: boolean
  isDarkMode: boolean
  onToggleDarkMode: () => void
  editorTheme?: EditorThemeName
  onEditorThemeChange?: (theme: EditorThemeName) => void
  colorFormat?: ColorFormat
  onColorFormatChange?: (format: ColorFormat) => void
}

export function Toolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  onOpenFile,
  canSave = true,
  isDarkMode,
  onToggleDarkMode,
  editorTheme,
  onEditorThemeChange,
  colorFormat,
  onColorFormatChange,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ZedLogo size={28} className="animate-hue-cycle text-[#084CCF]" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            <span className="hidden md:inline">Zed Theme Editor</span>
          </h1>
        </div>
        {onOpenFile && (
          <button
            onClick={onOpenFile}
            className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            title="Open file"
          >
            <FontAwesomeIcon icon={faFolderOpen} className="h-4 w-4" />
            {fileName ? (
              <span>
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
            ) : (
              <span className="text-neutral-500 dark:text-neutral-500">
                Open File
              </span>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onColorFormatChange && (
          <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="hidden font-semibold lg:inline">Color</span>
            <span className="hidden font-semibold sm:inline">Format</span>
            <select
              value={colorFormat}
              onChange={(e) =>
                onColorFormatChange(e.target.value as ColorFormat)
              }
              className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Color format for JSON display"
            >
              {colorFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {onEditorThemeChange && (
          <label className="ml-2 flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="hidden font-semibold lg:inline">Editor</span>
            <span className="hidden font-semibold sm:inline">Theme</span>
            <select
              value={editorTheme}
              onChange={(e) =>
                onEditorThemeChange(e.target.value as EditorThemeName)
              }
              className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Editor theme"
            >
              {Object.values(editorThemeMeta)
                .filter((theme) => theme.isDark === isDarkMode)
                .map((theme) => (
                  <option key={theme.name} value={theme.name}>
                    {theme.label}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div
          className="inline-flex gap-px rounded-full bg-neutral-200 inset-shadow-sm dark:bg-neutral-700"
          role="radiogroup"
          aria-label="Color scheme"
        >
          <button
            onClick={() => !isDarkMode || onToggleDarkMode()}
            className={`size-8 rounded-full transition-all ${
              !isDarkMode
                ? 'bg-white text-neutral-900 shadow-md dark:bg-neutral-600 dark:text-neutral-400'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200'
            }`}
            role="radio"
            aria-checked={!isDarkMode}
            aria-label="Light mode"
            title="Light mode"
          >
            <FontAwesomeIcon icon={faSun} className="h-4 w-4" />
          </button>
          <button
            onClick={() => isDarkMode || onToggleDarkMode()}
            className={`size-8 rounded-full transition-all ${
              isDarkMode
                ? 'bg-white shadow-md dark:bg-neutral-600 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200'
            }`}
            role="radio"
            aria-checked={isDarkMode}
            aria-label="Dark mode"
            title="Dark mode"
          >
            <FontAwesomeIcon icon={faMoon} className="h-4 w-4" />
          </button>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!canSave || !hasUnsavedChanges}
            className="flex items-center gap-2 rounded border-indigo-500 bg-indigo-600 bg-linear-to-b from-indigo-500 to-indigo-600 px-3 py-1.5 text-sm text-white transition-colors enabled:hover:bg-indigo-500 enabled:hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
