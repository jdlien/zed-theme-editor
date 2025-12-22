import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemePreview } from './ThemePreview'
import type { ThemeStyle } from '@/types/theme'

// Mock useLocalStorage
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [false, vi.fn()]),
}))

import { useLocalStorage } from '@/hooks/useLocalStorage'
const mockUseLocalStorage = useLocalStorage as ReturnType<typeof vi.fn>

describe('ThemePreview', () => {
  const mockSetIsFullPreview = vi.fn()

  const minimalStyle: ThemeStyle = {
    background: '#1e1e1e',
    text: '#ffffff',
  }

  const completeStyle: ThemeStyle = {
    background: '#1e1e1e',
    text: '#ffffff',
    'title_bar.background': '#2d2d2d',
    'tab_bar.background': '#252526',
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'terminal.background': '#000000',
    'terminal.foreground': '#ffffff',
    border: '#404040',
    error: '#f14c4c',
    warning: '#cca700',
    success: '#89d185',
    syntax: {
      keyword: { color: '#c586c0' },
      string: { color: '#ce9178' },
      comment: { color: '#6a9955' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
  })

  describe('initial rendering', () => {
    it('renders preview heading', () => {
      render(<ThemePreview style={minimalStyle} />)
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('renders toggle button', () => {
      render(<ThemePreview style={minimalStyle} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows "Full" text when in compact mode', () => {
      mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)
      expect(screen.getByText('Full')).toBeInTheDocument()
    })

    it('shows "Compact" text when in full mode', () => {
      mockUseLocalStorage.mockReturnValue([true, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)
      expect(screen.getByText('Compact')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ThemePreview style={minimalStyle} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('compact preview mode', () => {
    beforeEach(() => {
      mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
    })

    it('renders compact preview content', () => {
      render(<ThemePreview style={completeStyle} />)

      // Check for compact preview elements
      expect(screen.getByText('main.ts')).toBeInTheDocument()
      expect(screen.getByText('// Theme preview')).toBeInTheDocument()
    })

    it('renders terminal section', () => {
      render(<ThemePreview style={completeStyle} />)
      // Text is split across elements, so check for parts
      expect(screen.getByText('npm build')).toBeInTheDocument()
    })

    it('renders line numbers', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('full preview mode', () => {
    beforeEach(() => {
      mockUseLocalStorage.mockReturnValue([true, mockSetIsFullPreview])
    })

    it('renders full preview content', () => {
      render(<ThemePreview style={completeStyle} />)

      // Check for full preview specific elements
      expect(screen.getByText('Zed Theme Editor')).toBeInTheDocument()
      expect(screen.getByText('Project')).toBeInTheDocument()
    })

    it('renders status colors palette', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('Status Colors')).toBeInTheDocument()
      expect(screen.getByText('error')).toBeInTheDocument()
      expect(screen.getByText('warning')).toBeInTheDocument()
      expect(screen.getByText('success')).toBeInTheDocument()
    })

    it('renders terminal ANSI colors palette', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('Terminal ANSI Colors')).toBeInTheDocument()
    })

    it('renders UI elements section', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('UI Elements')).toBeInTheDocument()
      expect(screen.getByText('Button')).toBeInTheDocument()
    })

    it('renders file tree with different file states', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('src')).toBeInTheDocument()
      expect(screen.getByText('.gitignore')).toBeInTheDocument()
      expect(screen.getByText('.env')).toBeInTheDocument()
    })

    it('renders tab bar with multiple tabs', () => {
      render(<ThemePreview style={completeStyle} />)
      // All of these appear in tabs or file tree
      expect(screen.getAllByText('main.tsx').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('config.json').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('utils.ts').length).toBeGreaterThanOrEqual(1)
    })

    it('renders status bar', () => {
      render(<ThemePreview style={completeStyle} />)
      // "main" appears in both git branch and file tree
      expect(screen.getAllByText('main').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
    })

    it('renders elevated surface samples', () => {
      render(<ThemePreview style={completeStyle} />)
      expect(screen.getByText('Panel')).toBeInTheDocument()
      expect(screen.getByText('Elevated')).toBeInTheDocument()
      expect(screen.getByText('Focused')).toBeInTheDocument()
    })
  })

  describe('toggle button', () => {
    it('has correct title in compact mode', () => {
      mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Switch to full preview')
    })

    it('has correct title in full mode', () => {
      mockUseLocalStorage.mockReturnValue([true, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)

      const button = screen.getByTitle('Switch to compact preview')
      expect(button).toBeInTheDocument()
    })

    it('calls setIsFullPreview when clicked', () => {
      mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)

      fireEvent.click(screen.getByTitle('Switch to full preview'))
      expect(mockSetIsFullPreview).toHaveBeenCalledWith(true)
    })

    it('toggles from full to compact', () => {
      mockUseLocalStorage.mockReturnValue([true, mockSetIsFullPreview])
      render(<ThemePreview style={minimalStyle} />)

      fireEvent.click(screen.getByTitle('Switch to compact preview'))
      expect(mockSetIsFullPreview).toHaveBeenCalledWith(false)
    })
  })

  describe('localStorage persistence', () => {
    it('uses correct localStorage key', () => {
      render(<ThemePreview style={minimalStyle} />)

      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'zed-theme-editor-full-preview',
        false
      )
    })
  })

  describe('color fallbacks', () => {
    it('uses background as fallback for title_bar.background', () => {
      const { container } = render(
        <ThemePreview style={{ background: '#123456', text: '#ffffff' }} />
      )

      // The title bar should use the background color as fallback
      const titleBar = container.querySelector('[style*="background-color"]')
      expect(titleBar).toBeInTheDocument()
    })

    it('renders with minimal style without errors', () => {
      expect(() => {
        render(<ThemePreview style={minimalStyle} />)
      }).not.toThrow()
    })

    it('renders with empty style object using defaults', () => {
      expect(() => {
        render(<ThemePreview style={{}} />)
      }).not.toThrow()
    })
  })

  describe('syntax highlighting display', () => {
    it('displays syntax colored code in compact mode', () => {
      mockUseLocalStorage.mockReturnValue([false, mockSetIsFullPreview])
      render(<ThemePreview style={completeStyle} />)

      // Should show keywords, strings, etc.
      expect(screen.getByText('const')).toBeInTheDocument()
      expect(screen.getByText('"My Theme"')).toBeInTheDocument()
    })

    it('displays syntax colored code in full mode', () => {
      mockUseLocalStorage.mockReturnValue([true, mockSetIsFullPreview])
      render(<ThemePreview style={completeStyle} />)

      // Full mode has more detailed code
      expect(screen.getByText('import')).toBeInTheDocument()
      expect(screen.getByText('export function')).toBeInTheDocument()
    })
  })
})
