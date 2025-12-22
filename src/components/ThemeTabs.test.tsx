import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeTabs } from './ThemeTabs'

describe('ThemeTabs', () => {
  const mockOnSelect = vi.fn()

  const darkTheme = { name: 'Dark Theme', appearance: 'dark' as const }
  const lightTheme = { name: 'Light Theme', appearance: 'light' as const }

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('rendering conditions', () => {
    it('returns null when themes array is empty', () => {
      const { container } = render(
        <ThemeTabs themes={[]} activeIndex={0} onSelect={mockOnSelect} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null when there is only one theme', () => {
      const { container } = render(
        <ThemeTabs
          themes={[darkTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders tabs when there are two or more themes', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      expect(
        screen.getByRole('button', { name: /Dark Theme/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Light Theme/i })
      ).toBeInTheDocument()
    })

    it('renders correct number of tabs', () => {
      const themes = [
        { name: 'Theme 1', appearance: 'dark' as const },
        { name: 'Theme 2', appearance: 'light' as const },
        { name: 'Theme 3', appearance: 'dark' as const },
      ]
      render(
        <ThemeTabs themes={themes} activeIndex={0} onSelect={mockOnSelect} />
      )
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })
  })

  describe('appearance icons', () => {
    it('shows moon icon for dark theme', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      // FontAwesome renders SVG with data-icon attribute
      const darkButton = screen.getByRole('button', { name: /Dark Theme/i })
      expect(darkButton.querySelector('[data-icon="moon"]')).toBeInTheDocument()
    })

    it('shows sun icon for light theme', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      const lightButton = screen.getByRole('button', { name: /Light Theme/i })
      expect(lightButton.querySelector('[data-icon="sun"]')).toBeInTheDocument()
    })
  })

  describe('active state', () => {
    it('applies active styling to selected tab', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      const activeButton = screen.getByRole('button', { name: /Dark Theme/i })
      expect(activeButton.className).toContain('border-indigo-500')
    })

    it('applies inactive styling to non-selected tabs', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )
      const inactiveButton = screen.getByRole('button', {
        name: /Light Theme/i,
      })
      expect(inactiveButton.className).toContain('text-neutral-500')
      expect(inactiveButton.className).not.toContain('border-indigo-500')
    })

    it('updates active styling when activeIndex changes', () => {
      const { rerender } = render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )

      // Initially first tab is active
      expect(
        screen.getByRole('button', { name: /Dark Theme/i }).className
      ).toContain('border-indigo-500')

      // Rerender with second tab active
      rerender(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={1}
          onSelect={mockOnSelect}
        />
      )

      expect(
        screen.getByRole('button', { name: /Dark Theme/i }).className
      ).not.toContain('border-indigo-500')
      expect(
        screen.getByRole('button', { name: /Light Theme/i }).className
      ).toContain('border-indigo-500')
    })
  })

  describe('interactions', () => {
    it('calls onSelect with correct index when tab is clicked', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /Light Theme/i }))
      expect(mockOnSelect).toHaveBeenCalledWith(1)
    })

    it('calls onSelect with index 0 when first tab is clicked', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={1}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /Dark Theme/i }))
      expect(mockOnSelect).toHaveBeenCalledWith(0)
    })

    it('calls onSelect once per click', () => {
      render(
        <ThemeTabs
          themes={[darkTheme, lightTheme]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /Light Theme/i }))
      fireEvent.click(screen.getByRole('button', { name: /Dark Theme/i }))

      expect(mockOnSelect).toHaveBeenCalledTimes(2)
    })
  })

  describe('theme names', () => {
    it('displays theme names correctly', () => {
      render(
        <ThemeTabs
          themes={[
            { name: 'Custom Dark', appearance: 'dark' },
            { name: 'Custom Light', appearance: 'light' },
          ]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Custom Dark')).toBeInTheDocument()
      expect(screen.getByText('Custom Light')).toBeInTheDocument()
    })

    it('handles special characters in theme names', () => {
      render(
        <ThemeTabs
          themes={[
            { name: 'Theme & More', appearance: 'dark' },
            { name: "Theme's Light", appearance: 'light' },
          ]}
          activeIndex={0}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Theme & More')).toBeInTheDocument()
      expect(screen.getByText("Theme's Light")).toBeInTheDocument()
    })
  })
})
