/**
 * Toolbar Component
 * Main application toolbar with file info, save button, and settings
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { formatShortcut } from '@/lib/keyboard'
import { editorThemeMeta, type EditorThemeName } from '@/lib/editorThemeMeta'
import { ZedLogo } from './ZedLogo'
import type { ColorFormat } from '@/types/theme'
import { DarkToggle } from './DarkToggle'

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
  onCloseFile?: () => void
  canSave?: boolean
  editorTheme?: EditorThemeName
  onEditorThemeChange?: (theme: EditorThemeName) => void
  colorFormat?: ColorFormat
  onColorFormatChange?: (format: ColorFormat) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function Toolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  onOpenFile,
  onCloseFile,
  canSave = true,
  editorTheme,
  onEditorThemeChange,
  colorFormat,
  onColorFormatChange,
  isDarkMode,
  onToggleDarkMode,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCloseFile}
          className="flex items-center gap-2 rounded px-1 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          title="Close file and return to start"
        >
          <ZedLogo size={28} className="animate-hue-cycle text-[#084CCF]" />
          <h1 className="mr-1 text-xl font-semibold text-neutral-900 dark:text-white">
            <span className="hidden md:inline">Zed Theme Editor</span>
          </h1>
        </button>

        {onOpenFile && (
          <button
            onClick={onOpenFile}
            className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
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

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Settings group: format and theme selectors */}
        <div className="flex items-center gap-4">
          {onColorFormatChange && (
            <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="hidden font-semibold xl:inline">Color</span>
              <span className="hidden font-semibold sm:inline">Format</span>
              <select
                value={colorFormat}
                onChange={(e) =>
                  onColorFormatChange(e.target.value as ColorFormat)
                }
                className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
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
            <label className="hidden items-center gap-1.5 text-sm text-neutral-600 lg:flex dark:text-neutral-400">
              <span className="hidden font-semibold xl:inline">Editor</span>
              <span className="hidden font-semibold sm:inline">Theme</span>
              <select
                value={editorTheme}
                onChange={(e) =>
                  onEditorThemeChange(e.target.value as EditorThemeName)
                }
                className="min-w-[125px] rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
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
        </div>

        {/* Actions group: mode toggle and save */}
        <div className="flex items-center gap-4">
          <DarkToggle
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />

          {onSave && (
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges}
              className="btn"
              title={
                canSave
                  ? `Save (${formatShortcut('S')})`
                  : `Download (${formatShortcut('S')})`
              }
            >
              {canSave ? 'Save' : 'Download'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Toolbar
