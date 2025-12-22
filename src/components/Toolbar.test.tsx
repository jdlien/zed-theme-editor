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
      expect(screen.getByRole('radiogroup', { name: 'Color scheme' })).toBeInTheDocument()
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
    it('renders as a radiogroup with two options', () => {
      render(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('radiogroup', { name: 'Color scheme' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Light mode' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Dark mode' })).toBeInTheDocument()
    })

    it('marks light mode as checked when not in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={false} />)
      expect(screen.getByRole('radio', { name: 'Light mode' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'false')
    })

    it('marks dark mode as checked when in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={true} />)
      expect(screen.getByRole('radio', { name: 'Light mode' })).toHaveAttribute('aria-checked', 'false')
      expect(screen.getByRole('radio', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true')
    })

    it('calls onToggleDarkMode when clicking dark mode button while in light mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={false} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Dark mode' }))
      expect(mockOnToggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('calls onToggleDarkMode when clicking light mode button while in dark mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={true} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Light mode' }))
      expect(mockOnToggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('does not call onToggleDarkMode when clicking already selected mode', () => {
      render(<Toolbar {...defaultProps} isDarkMode={false} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Light mode' }))
      expect(mockOnToggleDarkMode).not.toHaveBeenCalled()
    })

    it('shows sun and moon icons', () => {
      render(<Toolbar {...defaultProps} />)
      const lightButton = screen.getByRole('radio', { name: 'Light mode' })
      const darkButton = screen.getByRole('radio', { name: 'Dark mode' })
      expect(lightButton.querySelector('[data-icon="sun"]')).toBeInTheDocument()
      expect(darkButton.querySelector('[data-icon="moon"]')).toBeInTheDocument()
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

    it('is disabled when canSave is false', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={mockOnSave}
          canSave={false}
          hasUnsavedChanges={true}
        />
      )
      expect(screen.getByText('Save')).toBeDisabled()
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
