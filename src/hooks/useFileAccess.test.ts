import { describe, it, expect, vi, beforeEach } from 'vitest'
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

    it('saveFileAs uses default name when none provided', async () => {
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
        await result.current.saveFileAs('{"test": true}')
      })

      expect(mockShowSaveFilePicker).toHaveBeenCalledWith(
        expect.objectContaining({ suggestedName: 'theme.json' })
      )
    })

    it('saveFileAs handles user cancellation', async () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      mockShowSaveFilePicker.mockRejectedValue(abortError)

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const handle = await result.current.saveFileAs('{"test": true}')
        expect(handle).toBeNull()
      })

      expect(result.current.error).toBeNull() // Cancellation is not an error
    })

    it('saveFileAs sets error on failure', async () => {
      mockShowSaveFilePicker.mockRejectedValue(new Error('Save failed'))

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const handle = await result.current.saveFileAs('{"test": true}')
        expect(handle).toBeNull()
      })

      expect(result.current.error).toBe('Save failed')
    })

    it('saveFile returns false when handle is null', async () => {
      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile('{"test": true}', null)
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('No file handle available')
    })

    it('saveFile sets error on write failure', async () => {
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        createWritable: vi.fn().mockRejectedValue(new Error('Write error')),
      }

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile(
          '{"test": true}',
          mockFileHandle as unknown as FileSystemFileHandle
        )
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Write error')
    })

    it('openFile handles non-Error exceptions', async () => {
      mockShowOpenFilePicker.mockRejectedValue('string error')

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const fileData = await result.current.openFile()
        expect(fileData).toBeNull()
      })

      expect(result.current.error).toBe('Failed to open file')
    })

    it('saveFile handles non-Error exceptions', async () => {
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        createWritable: vi.fn().mockRejectedValue('string error'),
      }

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile(
          '{"test": true}',
          mockFileHandle as unknown as FileSystemFileHandle
        )
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Failed to save file')
    })

    it('saveFileAs handles non-Error exceptions', async () => {
      mockShowSaveFilePicker.mockRejectedValue('string error')

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const handle = await result.current.saveFileAs('{"test": true}')
        expect(handle).toBeNull()
      })

      expect(result.current.error).toBe('Failed to save file')
    })
  })

  describe('without File System Access API', () => {
    beforeEach(() => {
      // Remove the API
      const win = window as unknown as Record<string, unknown>
      delete win.showOpenFilePicker
      delete win.showSaveFilePicker
    })

    it('saveFile returns false when API not supported', async () => {
      const mockFileHandle = {} as FileSystemFileHandle

      const { result } = renderHook(() => useFileAccess())

      await act(async () => {
        const success = await result.current.saveFile('{"test": true}', mockFileHandle)
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Save in place not supported in this browser')
    })

    it('saveFileAs falls back to download', async () => {
      // Render hook first before mocking createElement
      const { result } = renderHook(() => useFileAccess())

      // Mock DOM methods for download AFTER hook is rendered
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLAnchorElement
        }
        return originalCreateElement(tagName)
      })
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      await act(async () => {
        const handle = await result.current.saveFileAs('{"test": true}', 'theme.json')
        expect(handle).toBeNull() // Returns null in fallback mode
      })

      expect(mockLink.click).toHaveBeenCalled()

      // Cleanup
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('openFile uses fallback input when API not supported', async () => {
      // Render hook first before mocking createElement
      const { result } = renderHook(() => useFileAccess())

      // Create a mock file input
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        oncancel: null as (() => void) | null,
        click: vi.fn(),
        files: null as FileList | null,
      }

      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as unknown as HTMLInputElement
        }
        return originalCreateElement(tagName)
      })

      // Start the open file operation
      let openPromise: Promise<unknown>
      act(() => {
        openPromise = result.current.openFile()
      })

      // Simulate user selecting a file
      const mockFile = {
        text: vi.fn().mockResolvedValue('{"name": "test"}'),
        name: 'theme.json',
      }
      mockInput.files = [mockFile] as unknown as FileList

      // Trigger the onchange callback
      await act(async () => {
        if (mockInput.onchange) {
          await mockInput.onchange(new Event('change'))
        }
      })

      const fileData = await openPromise!
      expect(fileData).toEqual({
        content: '{"name": "test"}',
        name: 'theme.json',
        handle: null,
      })

      createElementSpy.mockRestore()
    })

    it('openFile fallback returns null when no file selected', async () => {
      // Render hook first before mocking createElement
      const { result } = renderHook(() => useFileAccess())

      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        oncancel: null as (() => void) | null,
        click: vi.fn(),
        files: [] as unknown as FileList,
      }

      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as unknown as HTMLInputElement
        }
        return originalCreateElement(tagName)
      })

      let openPromise: Promise<unknown>
      act(() => {
        openPromise = result.current.openFile()
      })

      // Simulate empty file list
      await act(async () => {
        if (mockInput.onchange) {
          await mockInput.onchange(new Event('change'))
        }
      })

      const fileData = await openPromise!
      expect(fileData).toBeNull()

      createElementSpy.mockRestore()
    })

    it('openFile fallback returns null on file read error', async () => {
      // Render hook first before mocking createElement
      const { result } = renderHook(() => useFileAccess())

      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        oncancel: null as (() => void) | null,
        click: vi.fn(),
        files: null as FileList | null,
      }

      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as unknown as HTMLInputElement
        }
        return originalCreateElement(tagName)
      })

      let openPromise: Promise<unknown>
      act(() => {
        openPromise = result.current.openFile()
      })

      // Simulate file that fails to read
      const mockFile = {
        text: vi.fn().mockRejectedValue(new Error('Read failed')),
        name: 'theme.json',
      }
      mockInput.files = [mockFile] as unknown as FileList

      await act(async () => {
        if (mockInput.onchange) {
          await mockInput.onchange(new Event('change'))
        }
      })

      const fileData = await openPromise!
      expect(fileData).toBeNull()

      createElementSpy.mockRestore()
    })

    it('openFile fallback handles user cancel', async () => {
      // Render hook first before mocking createElement
      const { result } = renderHook(() => useFileAccess())

      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        oncancel: null as (() => void) | null,
        click: vi.fn(),
        files: null as FileList | null,
      }

      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as unknown as HTMLInputElement
        }
        return originalCreateElement(tagName)
      })

      let openPromise: Promise<unknown>
      act(() => {
        openPromise = result.current.openFile()
      })

      // Simulate user cancelling
      await act(async () => {
        if (mockInput.oncancel) {
          mockInput.oncancel()
        }
      })

      const fileData = await openPromise!
      expect(fileData).toBeNull()

      createElementSpy.mockRestore()
    })
  })
})
