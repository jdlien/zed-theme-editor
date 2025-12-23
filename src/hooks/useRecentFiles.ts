/**
 * useRecentFiles Hook
 * Manages the list of recently opened files using IndexedDB
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getRecentFiles,
  addRecentFile,
  removeRecentFile,
  isFileSystemAccessSupported,
  type RecentFile,
} from '@/lib/recentFiles'

export interface UseRecentFilesReturn {
  /** List of recent files, sorted by most recent first */
  recentFiles: RecentFile[]
  /** Whether we're loading the recent files list */
  isLoading: boolean
  /** Add a file to the recent files list */
  addFile: (handle: FileSystemFileHandle) => Promise<void>
  /** Remove a file from the recent files list */
  removeFile: (id: string) => Promise<void>
  /** Refresh the recent files list */
  refresh: () => Promise<void>
  /** Whether the File System Access API is supported */
  isSupported: boolean
}

export function useRecentFiles(): UseRecentFilesReturn {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isSupported = isFileSystemAccessSupported()

  const refresh = useCallback(async () => {
    if (!isSupported) {
      setRecentFiles([])
      setIsLoading(false)
      return
    }

    try {
      const files = await getRecentFiles()
      setRecentFiles(files)
    } catch (error) {
      console.warn('Failed to load recent files:', error)
      setRecentFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const addFile = useCallback(
    async (handle: FileSystemFileHandle) => {
      if (!isSupported) return

      await addRecentFile(handle)
      await refresh()
    },
    [isSupported, refresh]
  )

  const removeFileHandler = useCallback(
    async (id: string) => {
      if (!isSupported) return

      await removeRecentFile(id)
      await refresh()
    },
    [isSupported, refresh]
  )

  // Load recent files on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    recentFiles,
    isLoading,
    addFile,
    removeFile: removeFileHandler,
    refresh,
    isSupported,
  }
}

export default useRecentFiles
