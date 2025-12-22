interface ToolbarProps {
  fileName?: string
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function Toolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  isDarkMode,
  onToggleDarkMode,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Zed Theme Editor</h1>
        {fileName && (
          <span className="text-sm text-gray-400">
            {fileName}
            {hasUnsavedChanges && <span className="ml-1 text-yellow-500">*</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDarkMode}
          className="rounded px-3 py-1.5 text-sm hover:bg-gray-700"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        {onSave && (
          <button
            onClick={onSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
          >
            Save
          </button>
        )}
      </div>
    </header>
  )
}
