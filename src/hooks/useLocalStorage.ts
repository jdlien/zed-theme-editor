/**
 * useLocalStorage hook
 * Provides typed localStorage persistence with React state synchronization
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for syncing state with localStorage
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use default
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Use functional update to get latest state and avoid stale closures
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
            // Dispatch event for cross-tab sync
            window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }))
          }

          return valueToStore
        })
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }))
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch {
          // Ignore parse errors
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * User preferences stored in localStorage
 */
export interface UserPreferences {
  colorDisplayFormat: 'hex' | 'rgb' | 'hsl' | 'oklch'
  isDarkMode: boolean
  previewBackgroundLight: string
  previewBackgroundDark: string
  recentFiles: string[]
}

const DEFAULT_PREFERENCES: UserPreferences = {
  colorDisplayFormat: 'hex',
  isDarkMode: true,
  previewBackgroundLight: '#FFFFFF',
  previewBackgroundDark: '#1E1E1E',
  recentFiles: [],
}

const PREFERENCES_KEY = 'zed-theme-editor-preferences'

/**
 * Hook specifically for user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences, removePreferences] = useLocalStorage<UserPreferences>(
    PREFERENCES_KEY,
    DEFAULT_PREFERENCES
  )

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }))
    },
    [setPreferences]
  )

  const addRecentFile = useCallback(
    (fileName: string) => {
      setPreferences((prev) => {
        const filtered = prev.recentFiles.filter((f) => f !== fileName)
        return {
          ...prev,
          recentFiles: [fileName, ...filtered].slice(0, 10), // Keep last 10
        }
      })
    },
    [setPreferences]
  )

  return {
    preferences,
    updatePreference,
    addRecentFile,
    resetPreferences: removePreferences,
  }
}
