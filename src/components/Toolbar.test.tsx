import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  const mockOnToggleDarkMode = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnOpenFile = vi.fn()
  const mockOnEditorThemeChange = vi.fn()
  const mockOnColorFormatChange = vi.fn()

  const defaultProps = {
    isDarkMode: false,
    onToggleDarkMode: mockOnToggleDarkMode,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('renders the title', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.getByText('Zed Theme Editor')).toBeInTheDocument()
    })

    it('renders the Zed logo', () => {
      const { container } = render(<Toolbar {...defaultProps} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders dark mode toggle', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('switch', { name: 'Toggle dark mode' })).toBeInTheDocument()
    })
  })

  describe('open file button', () => {
    it('does not render when onOpenFile is not provided', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.queryByTitle('Open file')).not.toBeInTheDocument()
    })

    it('renders when onOpenFile is provided', () => {
      render(<Toolbar {...defaultProps} onOpenFile={mockOnOpenFile} />)
      expect(screen.getByTitle('Open file')).toBeInTheDocument()
    })

    it('calls onOpenFile when clicked', () => {
      render(<Toolbar {...defaultProps} onOpenFile={mockOnOpenFile} />)
      fireEvent.click(screen.getByTitle('Open file'))
      expect(mockOnOpenFile).toHaveBeenCalledTimes(1)
    })

    it('displays file name when provided', () => {
      render(
        <Toolbar
          {...defaultProps}
          onOpenFile={mockOnOpenFile}
          fileName="theme.json"
        />
      )
      expect(screen.getByText('theme.json')).toBeInTheDocument()
    })

    it('shows unsaved indicator when hasUnsavedChanges is true', () => {
      render(
        <Toolbar
          {...defaultProps}
          onOpenFile={mockOnOpenFile}
          fileName="theme.json"
          hasUnsavedChanges={true}
        />
      )
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByTitle('Unsaved changes')).toBeInTheDocument()
    })

    it('does not show unsaved indicator when hasUnsavedChanges is false', () => {
      render(
        <Toolbar
          {...defaultProps}
          onOpenFile={mockOnOpenFile}
          fileName="theme.json"
          hasUnsavedChanges={false}
        />
      )
      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })
  })

  describe('dark mode toggle', () => {
    it('renders as a switch', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('switch', { name: 'Toggle dark mode' })).toBeInTheDocument()
    })

    it('marks switch as unchecked when not in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={false} />)
      expect(screen.getByRole('switch', { name: 'Toggle dark mode' })).toHaveAttribute('aria-checked', 'false')
    })

    it('marks switch as checked when in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={true} />)
      expect(screen.getByRole('switch', { name: 'Toggle dark mode' })).toHaveAttribute('aria-checked', 'true')
    })

    it('calls onToggleDarkMode when clicking toggle while in light mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={false} />)
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockOnToggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('calls onToggleDarkMode when clicking toggle while in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={true} />)
      fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }))
      expect(mockOnToggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('shows sun and moon icons', () => {
      render(<Toolbar {...defaultProps} />)
      const toggle = screen.getByRole('switch', { name: 'Toggle dark mode' })
      expect(toggle.querySelector('[data-icon="sun"]')).toBeInTheDocument()
      expect(toggle.querySelector('[data-icon="moon"]')).toBeInTheDocument()
    })
  })

  describe('save button', () => {
    it('does not render when onSave is not provided', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.queryByText('Save')).not.toBeInTheDocument()
    })

    it('renders when onSave is provided', () => {
      render(<Toolbar {...defaultProps} onSave={mockOnSave} />)
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('shows Download button when canSave is false', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={mockOnSave}
          canSave={false}
          hasUnsavedChanges={true}
        />
      )
      expect(screen.getByText('Download')).toBeInTheDocument()
      expect(screen.getByText('Download')).not.toBeDisabled()
    })

    it('is disabled when hasUnsavedChanges is false', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={mockOnSave}
          canSave={true}
          hasUnsavedChanges={false}
        />
      )
      expect(screen.getByText('Save')).toBeDisabled()
    })

    it('is enabled when canSave and hasUnsavedChanges are both true', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={mockOnSave}
          canSave={true}
          hasUnsavedChanges={true}
        />
      )
      expect(screen.getByText('Save')).not.toBeDisabled()
    })

    it('calls onSave when clicked', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={mockOnSave}
          canSave={true}
          hasUnsavedChanges={true}
        />
      )
      fireEvent.click(screen.getByText('Save'))
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    it('shows keyboard shortcut in title', () => {
      render(<Toolbar {...defaultProps} onSave={mockOnSave} />)
      const saveButton = screen.getByText('Save')
      // Title should contain either ⌘+S (Mac) or Ctrl+S
      expect(saveButton.title).toMatch(/Save \((⌘\+S|Ctrl\+S)\)/)
    })
  })

  describe('color format select', () => {
    it('does not render when onColorFormatChange is not provided', () => {
      render(<Toolbar {...defaultProps} />)
      expect(
        screen.queryByTitle('Color format for JSON display')
      ).not.toBeInTheDocument()
    })

    it('renders when onColorFormatChange is provided', () => {
      render(
        <Toolbar
          {...defaultProps}
          onColorFormatChange={mockOnColorFormatChange}
          colorFormat="hex"
        />
      )
      expect(
        screen.getByTitle('Color format for JSON display')
      ).toBeInTheDocument()
    })

    it('has all format options', () => {
      render(
        <Toolbar
          {...defaultProps}
          onColorFormatChange={mockOnColorFormatChange}
          colorFormat="hex"
        />
      )
      expect(screen.getByRole('option', { name: 'Hex' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'RGB' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'HSL' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'OKLCH' })).toBeInTheDocument()
    })

    it('calls onColorFormatChange when selection changes', () => {
      render(
        <Toolbar
          {...defaultProps}
          onColorFormatChange={mockOnColorFormatChange}
          colorFormat="hex"
        />
      )
      fireEvent.change(screen.getByTitle('Color format for JSON display'), {
        target: { value: 'rgb' },
      })
      expect(mockOnColorFormatChange).toHaveBeenCalledWith('rgb')
    })
  })

  describe('editor theme select', () => {
    it('does not render when onEditorThemeChange is not provided', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.queryByTitle('Editor theme')).not.toBeInTheDocument()
    })

    it('renders when onEditorThemeChange is provided', () => {
      render(
        <Toolbar
          {...defaultProps}
          onEditorThemeChange={mockOnEditorThemeChange}
          editorTheme="neutral-dark"
        />
      )
      expect(screen.getByTitle('Editor theme')).toBeInTheDocument()
    })

    it('filters themes by dark mode', () => {
      // In light mode, should show light themes
      const { rerender } = render(
        <Toolbar
          {...defaultProps}
          isDarkMode={false}
          onEditorThemeChange={mockOnEditorThemeChange}
          editorTheme="neutral-light"
        />
      )
      expect(
        screen.getByRole('option', { name: 'Neutral Light' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'GitHub Light' })
      ).toBeInTheDocument()

      // In dark mode, should show dark themes
      rerender(
        <Toolbar
          {...defaultProps}
          isDarkMode={true}
          onEditorThemeChange={mockOnEditorThemeChange}
          editorTheme="neutral-dark"
        />
      )
      expect(
        screen.getByRole('option', { name: 'Neutral Dark' })
      ).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'One Dark' })).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'GitHub Dark' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Midnight' })
      ).toBeInTheDocument()
    })

    it('calls onEditorThemeChange when selection changes', () => {
      render(
        <Toolbar
          {...defaultProps}
          isDarkMode={true}
          onEditorThemeChange={mockOnEditorThemeChange}
          editorTheme="neutral-dark"
        />
      )
      fireEvent.change(screen.getByTitle('Editor theme'), {
        target: { value: 'github-dark' },
      })
      expect(mockOnEditorThemeChange).toHaveBeenCalledWith('github-dark')
    })
  })
})
