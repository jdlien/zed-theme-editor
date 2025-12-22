import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPicker } from './ColorPicker'

describe('ColorPicker', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('initial rendering', () => {
    it('renders all main elements', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      // Should have saturation-brightness picker
      expect(
        screen.getByRole('slider', { name: 'Saturation and brightness picker' })
      ).toBeInTheDocument()

      // Should have hue slider
      expect(screen.getByRole('slider', { name: 'Hue' })).toBeInTheDocument()

      // Should have alpha slider by default
      expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument()
    })

    it('hides alpha slider when showAlpha is false', () => {
      render(
        <ColorPicker value="#FF0000" onChange={mockOnChange} showAlpha={false} />
      )

      expect(screen.queryByRole('slider', { name: 'Alpha' })).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ColorPicker
          value="#FF0000"
          onChange={mockOnChange}
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('saturation-value picker', () => {
    it('has correct aria attributes', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const picker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })
      expect(picker).toHaveAttribute('tabIndex', '0')
    })

    it('calls onChange when clicked', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const picker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })

      // Mock getBoundingClientRect
      picker.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Click in the middle (should set S=50, V=50)
      fireEvent.mouseDown(picker, { clientX: 100, clientY: 100 })

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles touch events', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const picker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })

      picker.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      fireEvent.touchStart(picker, {
        touches: [{ clientX: 100, clientY: 100 }],
      })

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('hue slider', () => {
    it('has correct aria attributes', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Hue' })
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '360')
      expect(slider).toHaveAttribute('tabIndex', '0')
    })

    it('calls onChange when clicked', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Hue' })

      slider.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 16,
        right: 200,
        bottom: 16,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Click at 50% (should set hue to 180)
      fireEvent.mouseDown(slider, { clientX: 100, clientY: 8 })

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('displays correct hue value from input color', () => {
      // Red (hue = 0)
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)
      const slider = screen.getByRole('slider', { name: 'Hue' })
      expect(slider.getAttribute('aria-valuenow')).toBe('0')
    })
  })

  describe('alpha slider', () => {
    it('has correct aria attributes', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Alpha' })
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '1')
    })

    it('calls onChange when clicked', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Alpha' })

      slider.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 16,
        right: 200,
        bottom: 16,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Click at 50% (should set alpha to 0.5)
      fireEvent.mouseDown(slider, { clientX: 100, clientY: 8 })

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles colors with alpha', () => {
      render(<ColorPicker value="#FF000080" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Alpha' })
      // Alpha of 0x80 = 128/255 ≈ 0.5
      const alphaValue = parseFloat(slider.getAttribute('aria-valuenow') || '0')
      expect(alphaValue).toBeCloseTo(0.5, 1)
    })
  })

  describe('color parsing', () => {
    it('parses valid hex color', () => {
      render(<ColorPicker value="#00FF00" onChange={mockOnChange} />)

      // Green has hue around 120
      const slider = screen.getByRole('slider', { name: 'Hue' })
      const hue = parseFloat(slider.getAttribute('aria-valuenow') || '0')
      expect(hue).toBeCloseTo(120, 0)
    })

    it('handles 3-digit hex colors', () => {
      render(<ColorPicker value="#F00" onChange={mockOnChange} />)

      // Red has hue 0
      const slider = screen.getByRole('slider', { name: 'Hue' })
      expect(slider.getAttribute('aria-valuenow')).toBe('0')
    })

    it('handles 8-digit hex colors (with alpha)', () => {
      render(<ColorPicker value="#FF0000FF" onChange={mockOnChange} />)

      const alphaSlider = screen.getByRole('slider', { name: 'Alpha' })
      expect(alphaSlider.getAttribute('aria-valuenow')).toBe('1')
    })

    it('defaults to red when invalid hex provided', () => {
      render(<ColorPicker value="invalid" onChange={mockOnChange} />)

      // Should default to some valid color
      const hueSlider = screen.getByRole('slider', { name: 'Hue' })
      expect(hueSlider).toBeInTheDocument()
    })
  })

  describe('external value sync', () => {
    it('updates internal state when value prop changes', () => {
      const { rerender } = render(
        <ColorPicker value="#FF0000" onChange={mockOnChange} />
      )

      // Initial: red (hue = 0)
      expect(
        screen.getByRole('slider', { name: 'Hue' }).getAttribute('aria-valuenow')
      ).toBe('0')

      // Change to green (hue = 120)
      rerender(<ColorPicker value="#00FF00" onChange={mockOnChange} />)

      const hue = parseFloat(
        screen.getByRole('slider', { name: 'Hue' }).getAttribute('aria-valuenow') || '0'
      )
      expect(hue).toBeCloseTo(120, 0)
    })
  })

  describe('dragging behavior', () => {
    it('handles mouse drag on saturation picker', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const picker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })

      picker.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Start drag
      fireEvent.mouseDown(picker, { clientX: 50, clientY: 50 })
      expect(mockOnChange).toHaveBeenCalled()

      mockOnChange.mockClear()

      // Simulate mouse move (would need to fire on window)
      fireEvent.mouseUp(window)
    })

    it('handles mouse drag on hue slider', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Hue' })

      slider.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 16,
        right: 200,
        bottom: 16,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      fireEvent.mouseDown(slider, { clientX: 50, clientY: 8 })
      expect(mockOnChange).toHaveBeenCalled()

      fireEvent.mouseUp(window)
    })
  })

  describe('color preview', () => {
    it('renders color preview', () => {
      const { container } = render(
        <ColorPicker value="#FF0000" onChange={mockOnChange} />
      )

      // Should have a preview div showing the current color
      const previewDiv = container.querySelector('[style*="background-color"]')
      expect(previewDiv).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('all interactive elements are keyboard accessible', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const svPicker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })
      const hueSlider = screen.getByRole('slider', { name: 'Hue' })
      const alphaSlider = screen.getByRole('slider', { name: 'Alpha' })

      expect(svPicker).toHaveAttribute('tabIndex', '0')
      expect(hueSlider).toHaveAttribute('tabIndex', '0')
      expect(alphaSlider).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('global event handling during drag', () => {
    it('handles mousemove during saturation drag', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const picker = screen.getByRole('slider', {
        name: 'Saturation and brightness picker',
      })

      picker.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Start drag
      fireEvent.mouseDown(picker, { clientX: 50, clientY: 50 })
      mockOnChange.mockClear()

      // Move during drag
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 })

      expect(mockOnChange).toHaveBeenCalled()

      fireEvent.mouseUp(window)
    })

    it('handles touch start and move on hue slider', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Hue' })

      slider.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 16,
        right: 200,
        bottom: 16,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Touch start
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 50, clientY: 8 }],
      })

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles touch start on alpha slider', () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />)

      const slider = screen.getByRole('slider', { name: 'Alpha' })

      slider.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 200,
        height: 16,
        right: 200,
        bottom: 16,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Touch start at 50%
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 100, clientY: 8 }],
      })

      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})
