/**
 * Recent Files Storage
 * Uses IndexedDB to persist FileSystemFileHandle references
 * Allows users to quickly reopen recently edited theme files
 */

const DB_NAME = 'zed-theme-editor'
const DB_VERSION = 1
const STORE_NAME = 'recent-files'
const MAX_RECENT_FILES = 5

export interface RecentFile {
  /** Unique ID (file name is used as key) */
  id: string
  /** Display name of the file */
  name: string
  /** The file handle for reopening */
  handle: FileSystemFileHandle
  /** Timestamp when file was last opened */
  lastOpened: number
}

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create the recent files store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('lastOpened', 'lastOpened', { unique: false })
      }
    }
  })
}

/**
 * Get all recent files, sorted by most recently opened
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => {
        reject(new Error('Failed to get recent files'))
      }

      request.onsuccess = () => {
        const files = request.result as RecentFile[]
        // Sort by lastOpened descending (most recent first)
        files.sort((a, b) => b.lastOpened - a.lastOpened)
        resolve(files.slice(0, MAX_RECENT_FILES))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch {
    // IndexedDB not available or error - return empty array
    console.warn('Could not access recent files from IndexedDB')
    return []
  }
}

/**
 * Add or update a file in the recent files list
 */
export async function addRecentFile(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openDatabase()

    const recentFile: RecentFile = {
      id: handle.name,
      name: handle.name,
      handle,
      lastOpened: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // First, get all files to check if we need to remove old ones
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        const files = getAllRequest.result as RecentFile[]

        // Add/update the current file
        store.put(recentFile)

        // If we have more than MAX_RECENT_FILES (excluding the one we just added),
        // remove the oldest ones
        const otherFiles = files.filter((f) => f.id !== recentFile.id)
        if (otherFiles.length >= MAX_RECENT_FILES) {
          // Sort by lastOpened ascending to find oldest
          otherFiles.sort((a, b) => a.lastOpened - b.lastOpened)
          // Remove oldest files to make room
          const filesToRemove = otherFiles.slice(
            0,
            otherFiles.length - MAX_RECENT_FILES + 1
          )
          for (const file of filesToRemove) {
            store.delete(file.id)
          }
        }
      }

      transaction.onerror = () => {
        reject(new Error('Failed to add recent file'))
      }

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.warn('Could not save recent file to IndexedDB:', error)
  }
}

/**
 * Remove a file from the recent files list
 */
export async function removeRecentFile(id: string): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(id)

      transaction.onerror = () => {
        reject(new Error('Failed to remove recent file'))
      }

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.warn('Could not remove recent file from IndexedDB:', error)
  }
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.clear()

      transaction.onerror = () => {
        reject(new Error('Failed to clear recent files'))
      }

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.warn('Could not clear recent files from IndexedDB:', error)
  }
}

/**
 * Check if the File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window
}
