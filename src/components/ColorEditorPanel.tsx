interface ColorEditorPanelProps {
  color: string | null
  colorPath: string | null
  onChange: (color: string) => void
}

export function ColorEditorPanel({
  color,
  colorPath,
  onChange: _onChange,
}: ColorEditorPanelProps) {
  if (!color) {
    return (
      <div className="w-80 p-4">
        <p className="text-gray-500">Select a color to edit</p>
      </div>
    )
  }

  return (
    <div className="w-80 p-4">
      <h2 className="mb-4 text-lg font-medium">Color Editor</h2>
      <p className="text-sm text-gray-400">{colorPath}</p>
      <div
        className="mt-2 h-12 w-full rounded border border-gray-600"
        style={{ backgroundColor: color }}
      />
      <p className="mt-2 font-mono text-sm">{color}</p>
    </div>
  )
}
