interface JsonEditorPanelProps {
  content: string
  onChange: (content: string) => void
  onColorSelect: (path: string, color: string) => void
}

export function JsonEditorPanel({
  content,
  onChange: _onChange,
  onColorSelect: _onColorSelect,
}: JsonEditorPanelProps) {
  return (
    <div className="flex-1 overflow-auto border-r border-gray-700 p-4">
      <p className="text-gray-400">JSON Editor Panel (CodeMirror integration pending)</p>
      <pre className="mt-4 text-sm text-gray-300">{content.slice(0, 500)}...</pre>
    </div>
  )
}
