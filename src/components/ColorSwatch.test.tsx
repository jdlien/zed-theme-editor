import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorSwatch, ColorSwatchRow } from './ColorSwatch'
import { TooltipProvider } from './Tooltip'

describe('ColorSwatch', () => {
  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<ColorSwatch color="#FF0000" size="sm" />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.className).toContain('h-4')
      expect(swatch.className).toContain('w-4')
    })

    it('applies medium size classes by default', () => {
      render(<ColorSwatch color="#FF0000" />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.className).toContain('h-6')
      expect(swatch.className).toContain('w-6')
    })

    it('applies large size classes', () => {
      render(<ColorSwatch color="#FF0000" size="lg" />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.className).toContain('h-8')
      expect(swatch.className).toContain('w-8')
    })
  })

  describe('rendering element type', () => {
    it('renders as span when no onClick provided', () => {
      render(<ColorSwatch color="#FF0000" />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.tagName.toLowerCase()).toBe('span')
    })

    it('renders as button when onClick provided', () => {
      render(<ColorSwatch color="#FF0000" onClick={() => {}} />)
      const swatch = screen.getByRole('button')
      expect(swatch).toBeInTheDocument()
    })

    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn()
      render(<ColorSwatch color="#FF0000" onClick={handleClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('selected state', () => {
    it('does not have ring class when not selected', () => {
      render(<ColorSwatch color="#FF0000" />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.className).not.toContain('ring-2')
    })

    it('has ring class when selected', () => {
      render(<ColorSwatch color="#FF0000" isSelected />)
      const swatch = screen.getByLabelText('Color: #FF0000')
      expect(swatch.className).toContain('ring-2')
      expect(swatch.className).toContain('ring-blue-500')
    })
  })

  describe('color comparison (split view)', () => {
    it('shows single color when no originalColor', () => {
      const { container } = render(<ColorSwatch color="#FF0000" />)
      // Should have only one color div (not split)
      const colorDivs = container.querySelectorAll('[style*="background-color"]')
      // One for the color, ignore the checkerboard background
      expect(colorDivs).toHaveLength(1)
    })

    it('shows single color when originalColor equals current', () => {
      const { container } = render(
        <ColorSwatch color="#FF0000" originalColor="#FF0000" />
      )
      const colorDivs = container.querySelectorAll('[style*="background-color"]')
      expect(colorDivs).toHaveLength(1)
    })

    it('shows split view when colors differ', () => {
      const { container } = render(
        <ColorSwatch color="#00FF00" originalColor="#FF0000" />
      )
      // Should have two color divs in split view
      const colorDivs = container.querySelectorAll('[style*="background-color"]')
      expect(colorDivs).toHaveLength(2)
    })
  })

  describe('color value display', () => {
    it('does not show value by default', () => {
      render(<ColorSwatch color="#FF0000" />)
      expect(screen.queryByText('#FF0000')).not.toBeInTheDocument()
    })

    it('does not show value when showValue is true but no displayFormat', () => {
      render(<ColorSwatch color="#FF0000" showValue />)
      expect(screen.queryByText('#FF0000')).not.toBeInTheDocument()
    })

    it('shows hex value when showValue and displayFormat are set', () => {
      render(<ColorSwatch color="#FF0000" showValue displayFormat="hex" />)
      expect(screen.getByText('#FF0000')).toBeInTheDocument()
    })

    it('formats color in specified format', () => {
      render(<ColorSwatch color="#FF0000" showValue displayFormat="rgb" />)
      expect(screen.getByText('rgb(255, 0, 0)')).toBeInTheDocument()
    })

    it('shows raw value when color cannot be parsed', () => {
      // Using an invalid color string that can't be parsed
      render(<ColorSwatch color="invalid-color" showValue displayFormat="hex" />)
      // Should fall back to showing the raw color string
      expect(screen.getByText('invalid-color')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has correct aria-label', () => {
      render(<ColorSwatch color="#123ABC" />)
      expect(screen.getByLabelText('Color: #123ABC')).toBeInTheDocument()
    })

    it('button has type="button"', () => {
      render(<ColorSwatch color="#FF0000" onClick={() => {}} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('className prop', () => {
    it('applies additional className', () => {
      const { container } = render(
        <ColorSwatch color="#FF0000" className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

describe('ColorSwatchRow', () => {
  const defaultProps = {
    label: 'background',
    color: '#FF0000',
    onClick: vi.fn(),
  }

  // Wrapper with TooltipProvider for proper context
  const renderWithTooltip = (ui: React.ReactNode) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  beforeEach(() => {
    defaultProps.onClick.mockClear()
  })

  describe('basic rendering', () => {
    it('renders label text', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} />)
      expect(screen.getByText('background')).toBeInTheDocument()
    })

    it('renders color value when defined', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} defined />)
      expect(screen.getByText('#FF0000')).toBeInTheDocument()
    })

    it('renders "+" when not defined', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} defined={false} />)
      expect(screen.getByText('+')).toBeInTheDocument()
      expect(screen.queryByText('#FF0000')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} />)
      fireEvent.click(screen.getByRole('button'))
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('selected state', () => {
    it('has selection background when selected', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} isSelected />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-blue-500/20')
    })

    it('has hover styles when not selected', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} isSelected={false} />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('hover:bg-neutral-200')
      expect(button.className).not.toContain('bg-blue-500/20')
    })
  })

  describe('defined state styling', () => {
    it('has normal text style when defined', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} defined />)
      const label = screen.getByText('background')
      expect(label.className).toContain('text-neutral-700')
      expect(label.className).not.toContain('italic')
    })

    it('has muted italic style when not defined', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} defined={false} />)
      const label = screen.getByText('background')
      expect(label.className).toContain('text-neutral-400')
      expect(label.className).toContain('italic')
    })
  })

  describe('color format', () => {
    it('defaults to hex format', () => {
      renderWithTooltip(<ColorSwatchRow {...defaultProps} defined />)
      expect(screen.getByText('#FF0000')).toBeInTheDocument()
    })

    it('formats in specified format', () => {
      renderWithTooltip(
        <ColorSwatchRow {...defaultProps} defined displayFormat="rgb" />
      )
      expect(screen.getByText('rgb(255, 0, 0)')).toBeInTheDocument()
    })
  })

  describe('color comparison', () => {
    it('passes originalColor to inner ColorSwatch', () => {
      const { container } = renderWithTooltip(
        <ColorSwatchRow
          {...defaultProps}
          originalColor="#0000FF"
        />
      )
      // Split view should have two background colors
      const colorDivs = container.querySelectorAll('[style*="background-color"]')
      expect(colorDivs).toHaveLength(2)
    })
  })
})
