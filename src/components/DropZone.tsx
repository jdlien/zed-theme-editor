import { useState, useCallback, useRef, type DragEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileImport } from '@fortawesome/free-solid-svg-icons'
import {
  useFileAccess,
  readDroppedFile,
  isValidThemeFile,
} from '@/hooks/useFileAccess'

interface DropZoneProps {
  onFileLoad: (
    content: string,
    fileName: string,
    handle: FileSystemFileHandle | null
  ) => void
  onError?: (error: string) => void
}

type DragState = 'idle' | 'over' | 'invalid'

export function DropZone({ onFileLoad, onError }: DropZoneProps) {
  const [dragState, setDragState] = useState<DragState>('idle')
  const dragCounter = useRef(0)
  const { openFile, isLoading, error, isSupported } = useFileAccess()

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++

    if (e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      // Check if it's a file (type will be empty for files during drag)
      if (item.kind === 'file') {
        setDragState('over')
      }
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--

    if (dragCounter.current === 0) {
      setDragState('idle')
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setDragState('idle')

      const files = Array.from(e.dataTransfer.files)
      const themeFile = files.find((f) => isValidThemeFile(f.name))

      if (!themeFile) {
        onError?.('Please drop a .json or .json5 file')
        return
      }

      const fileData = await readDroppedFile(themeFile)
      if (fileData) {
        onFileLoad(fileData.content, fileData.name, fileData.handle)
      } else {
        onError?.('Failed to read file')
      }
    },
    [onFileLoad, onError]
  )

  const handleClick = useCallback(async () => {
    const fileData = await openFile()
    if (fileData) {
      onFileLoad(fileData.content, fileData.name, fileData.handle)
    } else if (error) {
      onError?.(error)
    }
  }, [openFile, onFileLoad, onError, error])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  return (
    <div className="flex flex-1 items-center justify-center py-4">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex min-h-64 w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-all ${
          dragState === 'over'
            ? 'border-indigo-400 bg-indigo-500/10'
            : dragState === 'invalid'
              ? 'border-red-400 bg-red-500/10'
              : 'border-neutral-400 hover:border-neutral-500 hover:bg-neutral-200/50 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/50'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''} `}
        aria-label="Drop zone for theme files"
      >
        {isLoading ? (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-400 border-t-indigo-500" />
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Loading file...
            </p>
          </>
        ) : (
          <>
            <FontAwesomeIcon
              icon={faFileImport}
              size="2x"
              className="mb-4 text-neutral-400 dark:text-neutral-500"
              aria-hidden="true"
            />
            <p className="text-lg text-neutral-700 dark:text-neutral-300">
              {dragState === 'over'
                ? 'Drop to open file'
                : 'Drop a Zed theme .json file here'}
            </p>
            <p className="mt-2 text-sm text-neutral-500">or click to browse</p>
            {/*<p className="mt-4 text-xs text-neutral-500 dark:text-neutral-600">
              Supports .json and .json5 files
            </p>*/}
            {!isSupported && (
              <p className="mt-2 text-xs text-yellow-600">
                Note: Save-in-place not supported in this browser
              </p>
            )}
            <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-600">
              Your file stays on your device — nothing is uploaded.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
