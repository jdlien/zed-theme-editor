interface DropZoneProps {
  onFileLoad: (content: string, fileName: string) => void
}

export function DropZone({ onFileLoad: _onFileLoad }: DropZoneProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-600 p-12 text-center transition-colors hover:border-gray-500 hover:bg-gray-800/50">
        <p className="text-lg text-gray-400">
          Drop a Zed theme file here or click to open
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Supports .json and .json5 files
        </p>
      </div>
    </div>
  )
}
