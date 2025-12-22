/**
 * useFileAccess hook
 * Provides file opening and saving functionality using File System Access API
 * with fallback for unsupported browsers
 */

import { useState, useCallback } from 'react'

export interface FileData {
  content: string
  name: string
  handle: FileSystemFileHandle | null
}

export interface UseFileAccessReturn {
  isSupported: boolean
  isLoading: boolean
  error: string | null
  openFile: () => Promise<FileData | null>
  saveFile: (content: string, handle: FileSystemFileHandle | null) => Promise<boolean>
  saveFileAs: (content: string, suggestedName?: string) => Promise<FileSystemFileHandle | null>
  downloadFile: (content: string, fileName: string) => void
}

// File type filters for theme files
const THEME_FILE_TYPES: FilePickerAcceptType[] = [
  {
    description: 'Theme files',
    accept: {
      'application/json': ['.json', '.json5'],
    },
  },
]

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'showSaveFilePicker' in window
  )
}

/**
 * Hook for file operations with File System Access API and fallbacks
 */
export function useFileAccess(): UseFileAccessReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSupported = isFileSystemAccessSupported()

  /**
   * Open a file using File System Access API or fallback
   */
  const openFile = useCallback(async (): Promise<FileData | null> => {
    setError(null)
    setIsLoading(true)

    try {
      if (isSupported) {
        // Use File System Access API
        const [handle] = await window.showOpenFilePicker({
          types: THEME_FILE_TYPES,
          multiple: false,
        })

        const file = await handle.getFile()
        const content = await file.text()

        return {
          content,
          name: file.name,
          handle,
        }
      } else {
        // Fallback: use hidden file input
        return await openFileFallback()
      }
    } catch (err) {
      // User cancelled - not an error
      if (err instanceof Error && err.name === 'AbortError') {
        return null
      }

      const message = err instanceof Error ? err.message : 'Failed to open file'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  /**
   * Save content to an existing file handle
   */
  const saveFile = useCallback(
    async (content: string, handle: FileSystemFileHandle | null): Promise<boolean> => {
      setError(null)
      setIsLoading(true)

      try {
        if (!handle) {
          setError('No file handle available')
          return false
        }

        if (!isSupported) {
          // Can't save in place without API support
          setError('Save in place not supported in this browser')
          return false
        }

        // Request write permission if needed
        const permission = await handle.queryPermission({ mode: 'readwrite' })
        if (permission !== 'granted') {
          const requested = await handle.requestPermission({ mode: 'readwrite' })
          if (requested !== 'granted') {
            setError('Write permission denied')
            return false
          }
        }

        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save file'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isSupported]
  )

  /**
   * Save content to a new file (Save As)
   */
  const saveFileAs = useCallback(
    async (content: string, suggestedName?: string): Promise<FileSystemFileHandle | null> => {
      setError(null)
      setIsLoading(true)

      try {
        if (!isSupported) {
          // Fallback: trigger download
          downloadFile(content, suggestedName || 'theme.json')
          return null
        }

        const handle = await window.showSaveFilePicker({
          types: THEME_FILE_TYPES,
          suggestedName: suggestedName || 'theme.json',
        })

        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()

        return handle
      } catch (err) {
        // User cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return null
        }

        const message = err instanceof Error ? err.message : 'Failed to save file'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isSupported]
  )

  /**
   * Download file (fallback for browsers without File System Access API)
   */
  const downloadFile = useCallback((content: string, fileName: string): void => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return {
    isSupported,
    isLoading,
    error,
    openFile,
    saveFile,
    saveFileAs,
    downloadFile,
  }
}

/**
 * Fallback file opening using hidden input element
 */
function openFileFallback(): Promise<FileData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.json5'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const content = await file.text()
        resolve({
          content,
          name: file.name,
          handle: null, // No handle in fallback mode
        })
      } catch {
        resolve(null)
      }
    }

    input.oncancel = () => {
      resolve(null)
    }

    input.click()
  })
}

/**
 * Read a dropped file
 */
export async function readDroppedFile(file: File): Promise<FileData | null> {
  try {
    const content = await file.text()
    return {
      content,
      name: file.name,
      handle: null, // Dropped files don't have handles
    }
  } catch {
    return null
  }
}

/**
 * Check if a file is a valid theme file by extension
 */
export function isValidThemeFile(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return lower.endsWith('.json') || lower.endsWith('.json5')
}
