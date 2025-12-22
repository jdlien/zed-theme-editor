import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage, usePreferences } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

    expect(result.current[0]).toBe('defaultValue')
  })

  it('returns stored value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('storedValue'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

    expect(result.current[0]).toBe('storedValue')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('testKey') || '')).toBe('updated')
  })

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(6)
  })

  it('removes value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('value'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'))

    expect(result.current[0]).toBe('value')

    act(() => {
      result.current[2]() // removeValue
    })

    expect(result.current[0]).toBe('default')
    expect(localStorage.getItem('testKey')).toBeNull()
  })

  it('handles complex objects', () => {
    const complexObject = {
      name: 'test',
      nested: { value: 42 },
      array: [1, 2, 3],
    }

    const { result } = renderHook(() => useLocalStorage('complex', complexObject))

    expect(result.current[0]).toEqual(complexObject)

    const updated = { ...complexObject, name: 'updated' }
    act(() => {
      result.current[1](updated)
    })

    expect(result.current[0]).toEqual(updated)
    expect(JSON.parse(localStorage.getItem('complex') || '')).toEqual(updated)
  })

  it('handles JSON parse errors gracefully', () => {
    // Set invalid JSON directly
    localStorage.setItem('badKey', 'not valid json')

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useLocalStorage('badKey', 'fallback'))

    expect(result.current[0]).toBe('fallback')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('syncs across storage events', () => {
    const { result } = renderHook(() => useLocalStorage('syncKey', 'initial'))

    expect(result.current[0]).toBe('initial')

    // Simulate storage event from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'syncKey',
          newValue: JSON.stringify('fromOtherTab'),
        })
      )
    })

    expect(result.current[0]).toBe('fromOtherTab')
  })

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage('myKey', 'myValue'))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'otherKey',
          newValue: JSON.stringify('differentValue'),
        })
      )
    })

    expect(result.current[0]).toBe('myValue')
  })

  it('resets to initial when storage event has null value', () => {
    localStorage.setItem('testKey', JSON.stringify('stored'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'))

    expect(result.current[0]).toBe('stored')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'testKey',
          newValue: null,
        })
      )
    })

    expect(result.current[0]).toBe('default')
  })
})

describe('usePreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns default preferences', () => {
    const { result } = renderHook(() => usePreferences())

    expect(result.current.preferences.colorDisplayFormat).toBe('hex')
    expect(result.current.preferences.isDarkMode).toBe(true)
    expect(result.current.preferences.previewBackgroundLight).toBe('#FFFFFF')
    expect(result.current.preferences.previewBackgroundDark).toBe('#1E1E1E')
    expect(result.current.preferences.recentFiles).toEqual([])
  })

  it('updates individual preference', () => {
    const { result } = renderHook(() => usePreferences())

    act(() => {
      result.current.updatePreference('colorDisplayFormat', 'oklch')
    })

    expect(result.current.preferences.colorDisplayFormat).toBe('oklch')
    // Other preferences unchanged
    expect(result.current.preferences.isDarkMode).toBe(true)
  })

  it('adds recent file to beginning of list', () => {
    const { result } = renderHook(() => usePreferences())

    act(() => {
      result.current.addRecentFile('theme1.json')
    })

    expect(result.current.preferences.recentFiles).toEqual(['theme1.json'])

    act(() => {
      result.current.addRecentFile('theme2.json')
    })

    expect(result.current.preferences.recentFiles).toEqual(['theme2.json', 'theme1.json'])
  })

  it('removes duplicate and moves to front', () => {
    const { result } = renderHook(() => usePreferences())

    act(() => {
      result.current.addRecentFile('a.json')
      result.current.addRecentFile('b.json')
      result.current.addRecentFile('c.json')
    })

    expect(result.current.preferences.recentFiles).toEqual(['c.json', 'b.json', 'a.json'])

    act(() => {
      result.current.addRecentFile('a.json') // Already exists
    })

    expect(result.current.preferences.recentFiles).toEqual(['a.json', 'c.json', 'b.json'])
  })

  it('limits recent files to 10', () => {
    const { result } = renderHook(() => usePreferences())

    // Add 12 files
    for (let i = 1; i <= 12; i++) {
      act(() => {
        result.current.addRecentFile(`file${i}.json`)
      })
    }

    expect(result.current.preferences.recentFiles).toHaveLength(10)
    expect(result.current.preferences.recentFiles[0]).toBe('file12.json')
    expect(result.current.preferences.recentFiles[9]).toBe('file3.json')
  })

  it('resets preferences to defaults', () => {
    const { result } = renderHook(() => usePreferences())

    act(() => {
      result.current.updatePreference('colorDisplayFormat', 'hsl')
      result.current.updatePreference('isDarkMode', false)
    })

    expect(result.current.preferences.colorDisplayFormat).toBe('hsl')

    act(() => {
      result.current.resetPreferences()
    })

    expect(result.current.preferences.colorDisplayFormat).toBe('hex')
    expect(result.current.preferences.isDarkMode).toBe(true)
  })
})
