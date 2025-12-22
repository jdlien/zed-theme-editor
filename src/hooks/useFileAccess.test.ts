import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useFileAccess,
  isFileSystemAccessSupported,
  readDroppedFile,
  isValidThemeFile,
} from './useFileAccess'

// Store original window properties
const originalShowOpenFilePicker = (window as unknown as Record<string, unknown>).showOpenFilePicker
const originalShowSaveFilePicker = (window as unknown as Record<string, unknown>).showSaveFilePicker

describe('isFileSystemAccessSupported', () => {
  it('returns true when API is available', () => {
    // Set up the API as available
    Object.defineProperty(window, 'showOpenFilePicker', { value: vi.fn(), configurable: true, writable: true })
    Object.defineProperty(window, 'showSaveFilePicker', { value: vi.fn(), configurable: true, writable: true })

    expect(isFileSystemAccessSupported()).toBe(true)

    // Clean up
    Object.defineProperty(window, 'showOpenFilePicker', { value: originalShowOpenFilePicker, configurable: true, writable: true })
    Object.defineProperty(window, 'showSaveFilePicker', { value: originalShowSaveFilePicker, configurable: true, writable: true })
  })

  it('returns false when API is not available', () => {
    // Save current values
    const win = window as unknown as Record<string, unknown>
    const currentOpen = win.showOpenFilePicker
    const currentSave = win.showSaveFilePicker

    // Actually delete the properties to simulate unavailable API
    delete win.showOpenFilePicker
    delete win.showSaveFilePicker

    expect(isFileSystemAccessSupported()).toBe(false)

    // Restore
    if (currentOpen !== undefined) {
      Object.defineProperty(window, 'showOpenFilePicker', { value: currentOpen, configurable: true, writable: true })
    }
    if (currentSave !== undefined) {
      Object.defineProperty(window, 'showSaveFilePicker', { value: currentSave, configurable: true, writable: true })
    }
  })
})

describe('isValidThemeFile', () => {
  it('accepts .json files', () => {
    expect(isValidThemeFile('theme.json')).toBe(true)
    expect(isValidThemeFile('my-theme.JSON')).toBe(true)
  })

  it('accepts .json5 files', () => {
    expect(isValidThemeFile('theme.json5')).toBe(true)
    expect(isValidThemeFile('my-theme.JSON5')).toBe(true)
  })

  it('rejects other extensions', () => {
    expect(isValidThemeFile('theme.txt')).toBe(false)
    expect(isValidThemeFile('theme.js')).toBe(false)
    expect(isValidThemeFile('theme')).toBe(false)
  })
})

describe('readDroppedFile', () => {
  it('reads file content', async () => {
    const content = '{"name": "test"}'
    // Mock file with text() method
    const file = {
      text: () => Promise.resolve(content),
      name: 'theme.json',
    } as unknown as File

    const result = await readDroppedFile(file)

    expect(result).not.toBeNull()
    expect(result?.content).toBe(content)
    expect(result?.name).toBe('theme.json')
    expect(result?.handle).toBeNull()
  })

  it('returns null on read error', async () => {
    // Create a file that will fail to read
    const file = {
      text: () => Promise.reject(new Error('Read error')),
      name: 'bad.json',
    } as unknown as File

    const result = await readDroppedFile(file)
    expect(result).toBeNull()
  })
})

describe('useFileAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useFileAccess())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.openFile).toBe('function')
    expect(typeof result.current.saveFile).toBe('function')
    expect(typeof result.current.saveFileAs).toBe('function')
    expect(typeof result.current.downloadFile).toBe('function')
  })

  describe('downloadFile', () => {
    it('creates and clicks a download link', () => {
      const { result } = renderHook(() => useFileAccess())

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      act(() => {
        result.current.downloadFile('{"test": true}', 'theme.json')
      })

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('theme.json')
      expect(mockLink.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalled()

      // Cleanup
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })
  })

  describe('with File System Access API available', () => {
    let mockShowOpenFilePicker: ReturnType<typeof vi.fn>
    let mockShowSaveFilePicker: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockShowOpenFilePicker = vi.fn()
      mockShowSaveFilePicker = vi.fn()

      Object.defineProperty(window, 'showOpenFilePicker', {
        value: mockShowOpenFilePicker,
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'showSaveFilePicker', {
        value: mockShowSaveFilePicker,
        writable: true,
        configurable: true,
      })
    })

    it('opens file using File System Access API', async () => {
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue({
          name: 'theme.json',
          text: vi.fn().mockResolvedValue('{"name": "test"}'),
        }),
      }

      mockShowOpenFilePicker.mockResolvedValue([mockFileHandle])

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const fileData = await result.current.openFile()
        expect(fileData).not.toBeNull()
        expect(fileData?.name).toBe('theme.json')
        expect(fileData?.content).toBe('{"name": "test"}')
        expect(fileData?.handle).toBe(mockFileHandle)
      })
    })

    it('handles user cancellation gracefully', async () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      mockShowOpenFilePicker.mockRejectedValue(abortError)

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const fileData = await result.current.openFile()
        expect(fileData).toBeNull()
      })

      expect(result.current.error).toBeNull() // Not an error
    })

    it('sets error on file read failure', async () => {
      mockShowOpenFilePicker.mockRejectedValue(new Error('Access denied'))

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        await result.current.openFile()
      })

      expect(result.current.error).toBe('Access denied')
    })

    it('saves file to existing handle', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn(),
      }

      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      }

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile(
          '{"test": true}',
          mockFileHandle as unknown as FileSystemFileHandle
        )
        expect(success).toBe(true)
      })

      expect(mockWritable.write).toHaveBeenCalledWith('{"test": true}')
      expect(mockWritable.close).toHaveBeenCalled()
    })

    it('requests permission if not granted', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn(),
      }

      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('granted'),
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      }

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        await result.current.saveFile(
          '{"test": true}',
          mockFileHandle as unknown as FileSystemFileHandle
        )
      })

      expect(mockFileHandle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
    })

    it('returns false when save permission denied', async () => {
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('denied'),
      }

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile(
          '{"test": true}',
          mockFileHandle as unknown as FileSystemFileHandle
        )
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Write permission denied')
    })

    it('saves to new file with saveFileAs', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn(),
      }

      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      }

      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle)

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const handle = await result.current.saveFileAs('{"test": true}', 'new-theme.json')
        expect(handle).toBe(mockFileHandle)
      })

      expect(mockShowSaveFilePicker).toHaveBeenCalledWith(
        expect.objectContaining({ suggestedName: 'new-theme.json' })
      )
    })
  })
})
