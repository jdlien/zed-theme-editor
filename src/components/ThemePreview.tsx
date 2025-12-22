interface ThemePreviewProps {
  colors: Record<string, string>
}

export function ThemePreview({ colors }: ThemePreviewProps) {
  const editorBg = colors['editor.background'] || colors['background'] || '#1e1e1e'
  const editorFg = colors['editor.foreground'] || colors['text'] || '#d4d4d4'
  const terminalBg = colors['terminal.background'] || '#000000'

  return (
    <div className="border-t border-gray-700 p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-400">Preview</h3>
      <div className="flex gap-2">
        <div
          className="flex-1 rounded p-2 font-mono text-xs"
          style={{ backgroundColor: editorBg, color: editorFg }}
        >
          <div className="opacity-50">1</div>
          <div className="opacity-50">2</div>
          <div>const theme = "dracula"</div>
        </div>
        <div
          className="w-24 rounded p-2 font-mono text-xs"
          style={{ backgroundColor: terminalBg, color: '#ffffff' }}
        >
          $ npm run
        </div>
      </div>
    </div>
  )
}
