import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DropZone } from './DropZone'

// Mock useFileAccess hook
vi.mock('@/hooks/useFileAccess', () => ({
  useFileAccess: vi.fn(() => ({
    openFile: vi.fn(),
    isLoading: false,
    error: null,
    isSupported: true,
  })),
  readDroppedFile: vi.fn(),
  isValidThemeFile: vi.fn(
    (name: string) => name.endsWith('.json') || name.endsWith('.json5')
  ),
}))

import {
  useFileAccess,
  readDroppedFile,
  isValidThemeFile,
} from '@/hooks/useFileAccess'

const mockUseFileAccess = useFileAccess as ReturnType<typeof vi.fn>
const mockReadDroppedFile = readDroppedFile as ReturnType<typeof vi.fn>
const mockIsValidThemeFile = isValidThemeFile as ReturnType<typeof vi.fn>

describe('DropZone', () => {
  const mockOnFileLoad = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFileAccess.mockReturnValue({
      openFile: vi.fn(),
      isLoading: false,
      error: null,
      isSupported: true,
    })
    mockIsValidThemeFile.mockImplementation(
      (name: string) => name.endsWith('.json') || name.endsWith('.json5')
    )
  })

  describe('initial render', () => {
    it('renders drop zone with default message', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      expect(screen.getByText('Drop a Zed theme file here')).toBeInTheDocument()
      expect(screen.getByText('or click to browse')).toBeInTheDocument()
      expect(
        screen.getByText('Supports .json and .json5 files')
      ).toBeInTheDocument()
    })

    it('has correct accessibility attributes', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button', {
        name: 'Drop zone for theme files',
      })
      expect(dropZone).toHaveAttribute('tabIndex', '0')
    })

    it('shows browser support warning when not supported', () => {
      mockUseFileAccess.mockReturnValue({
        openFile: vi.fn(),
        isLoading: false,
        error: null,
        isSupported: false,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      expect(
        screen.getByText('Note: Save-in-place not supported in this browser')
      ).toBeInTheDocument()
    })

    it('does not show browser warning when supported', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      expect(
        screen.queryByText('Note: Save-in-place not supported in this browser')
      ).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading spinner and message when loading', () => {
      mockUseFileAccess.mockReturnValue({
        openFile: vi.fn(),
        isLoading: true,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      expect(screen.getByText('Loading file...')).toBeInTheDocument()
      expect(
        screen.queryByText('Drop a Zed theme file here')
      ).not.toBeInTheDocument()
    })

    it('applies disabled styling when loading', () => {
      mockUseFileAccess.mockReturnValue({
        openFile: vi.fn(),
        isLoading: true,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')
      expect(dropZone.className).toContain('pointer-events-none')
      expect(dropZone.className).toContain('opacity-50')
    })
  })

  describe('click handling', () => {
    it('calls openFile when clicked', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue(null)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)

      fireEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onFileLoad with file data on successful open', async () => {
      const mockFileData = {
        content: '{"themes": []}',
        name: 'theme.json',
        handle: null,
      }
      const mockOpenFile = vi.fn().mockResolvedValue(mockFileData)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)

      fireEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith(
          '{"themes": []}',
          'theme.json',
          null
        )
      })
    })

    it('calls onError when openFile fails with error', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue(null)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: 'Failed to open file',
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)

      fireEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to open file')
      })
    })
  })

  describe('keyboard handling', () => {
    it('opens file on Enter key', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue(null)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalledTimes(1)
      })
    })

    it('opens file on Space key', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue(null)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalledTimes(1)
      })
    })

    it('does not open file on other keys', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue(null)
      mockUseFileAccess.mockReturnValue({
        openFile: mockOpenFile,
        isLoading: false,
        error: null,
        isSupported: true,
      })
      render(<DropZone onFileLoad={mockOnFileLoad} />)

      fireEvent.keyDown(screen.getByRole('button'), { key: 'a' })
      await waitFor(() => {
        expect(mockOpenFile).not.toHaveBeenCalled()
      })
    })
  })

  describe('drag and drop', () => {
    // Helper to create drag event with dataTransfer
    const createDragEvent = (
      type: string,
      files: File[] = [],
      items: DataTransferItem[] = []
    ) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files,
          items:
            items.length > 0
              ? items
              : files.map(() => ({ kind: 'file' }) as DataTransferItem),
        },
      })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(event, 'stopPropagation', { value: vi.fn() })
      return event
    }

    it('changes to over state on drag enter with file', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dragEvent = createDragEvent(
        'dragenter',
        [],
        [{ kind: 'file' } as DataTransferItem]
      )
      fireEvent(dropZone, dragEvent)

      expect(screen.getByText('Drop to open file')).toBeInTheDocument()
    })

    it('prevents default on dragover', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dragOverEvent = createDragEvent('dragover')
      fireEvent(dropZone, dragOverEvent)

      expect(dragOverEvent.preventDefault).toHaveBeenCalled()
      expect(dragOverEvent.stopPropagation).toHaveBeenCalled()
    })

    it('applies over styling on drag enter', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dragEvent = createDragEvent(
        'dragenter',
        [],
        [{ kind: 'file' } as DataTransferItem]
      )
      fireEvent(dropZone, dragEvent)

      expect(dropZone.className).toContain('border-indigo-400')
      expect(dropZone.className).toContain('bg-indigo-500/10')
    })

    it('returns to idle state on drag leave', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      // Enter
      const enterEvent = createDragEvent(
        'dragenter',
        [],
        [{ kind: 'file' } as DataTransferItem]
      )
      fireEvent(dropZone, enterEvent)
      expect(screen.getByText('Drop to open file')).toBeInTheDocument()

      // Leave
      const leaveEvent = createDragEvent('dragleave')
      fireEvent(dropZone, leaveEvent)
      expect(screen.getByText('Drop a Zed theme file here')).toBeInTheDocument()
    })

    it('handles drop with valid JSON file', async () => {
      const mockFile = new File(['{}'], 'theme.json', {
        type: 'application/json',
      })
      mockReadDroppedFile.mockResolvedValue({
        content: '{}',
        name: 'theme.json',
        handle: null,
      })

      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dropEvent = createDragEvent('drop', [mockFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockReadDroppedFile).toHaveBeenCalledWith(mockFile)
        expect(mockOnFileLoad).toHaveBeenCalledWith('{}', 'theme.json', null)
      })
    })

    it('handles drop with valid JSON5 file', async () => {
      const mockFile = new File(['{}'], 'theme.json5', {
        type: 'application/json',
      })
      mockReadDroppedFile.mockResolvedValue({
        content: '{}',
        name: 'theme.json5',
        handle: null,
      })

      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dropEvent = createDragEvent('drop', [mockFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockReadDroppedFile).toHaveBeenCalledWith(mockFile)
      })
    })

    it('calls onError when dropping invalid file type', async () => {
      const mockFile = new File(['hello'], 'readme.txt', { type: 'text/plain' })
      mockIsValidThemeFile.mockReturnValue(false)

      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      const dropZone = screen.getByRole('button')

      const dropEvent = createDragEvent('drop', [mockFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'Please drop a .json or .json5 file'
        )
      })
    })

    it('calls onError when file read fails', async () => {
      const mockFile = new File(['{}'], 'theme.json', {
        type: 'application/json',
      })
      mockReadDroppedFile.mockResolvedValue(null)

      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      const dropZone = screen.getByRole('button')

      const dropEvent = createDragEvent('drop', [mockFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to read file')
      })
    })

    it('selects first valid JSON file from multiple files', async () => {
      const txtFile = new File(['hello'], 'readme.txt', { type: 'text/plain' })
      const jsonFile = new File(['{}'], 'theme.json', {
        type: 'application/json',
      })
      mockIsValidThemeFile.mockImplementation(
        (name: string) => name.endsWith('.json') || name.endsWith('.json5')
      )
      mockReadDroppedFile.mockResolvedValue({
        content: '{}',
        name: 'theme.json',
        handle: null,
      })

      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      const dropEvent = createDragEvent('drop', [txtFile, jsonFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockReadDroppedFile).toHaveBeenCalledWith(jsonFile)
      })
    })

    it('resets drag state after drop', async () => {
      const mockFile = new File(['{}'], 'theme.json', {
        type: 'application/json',
      })
      mockReadDroppedFile.mockResolvedValue({
        content: '{}',
        name: 'theme.json',
        handle: null,
      })

      render(<DropZone onFileLoad={mockOnFileLoad} />)
      const dropZone = screen.getByRole('button')

      // First enter to set over state
      const enterEvent = createDragEvent(
        'dragenter',
        [],
        [{ kind: 'file' } as DataTransferItem]
      )
      fireEvent(dropZone, enterEvent)
      expect(screen.getByText('Drop to open file')).toBeInTheDocument()

      // Drop should reset to idle
      const dropEvent = createDragEvent('drop', [mockFile])
      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(
          screen.getByText('Drop a Zed theme file here')
        ).toBeInTheDocument()
      })
    })
  })
})
