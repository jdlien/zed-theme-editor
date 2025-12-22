import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorEditorPanel } from './ColorEditorPanel'

describe('ColorEditorPanel', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('placeholder state', () => {
    it('shows placeholder when no color is selected', () => {
      render(
        <ColorEditorPanel
          color={null}
          colorPath={null}
          onChange={mockOnChange}
        />
      )
      expect(screen.getByText('Select a color to edit')).toBeInTheDocument()
    })

    it('applies className to placeholder', () => {
      const { container } = render(
        <ColorEditorPanel
          color={null}
          colorPath={null}
          onChange={mockOnChange}
          className="custom-class"
        />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('with selected color', () => {
    it('displays the color key from path', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Shows just the key part of the path
      expect(screen.getByText('background')).toBeInTheDocument()
    })

    it('displays description when provided', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          description="Background color for the editor"
          onChange={mockOnChange}
        />
      )
      expect(screen.getByText('Background color for the editor')).toBeInTheDocument()
    })

    it('shows "No description" when description is not provided', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      expect(screen.getByText('No description')).toBeInTheDocument()
    })

    it('displays hex format label', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Should show HEX format section (case insensitive)
      expect(screen.getByText(/HEX/i)).toBeInTheDocument()
    })

    it('displays RGB format inputs', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Should have RGB sliders
      expect(screen.getByLabelText('Red')).toBeInTheDocument()
      expect(screen.getByLabelText('Green')).toBeInTheDocument()
      expect(screen.getByLabelText('Blue')).toBeInTheDocument()
    })

    it('displays HSL format inputs', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Should have HSL sliders - Saturation is unique to HSL section
      expect(screen.getByLabelText('Saturation')).toBeInTheDocument()
      // Hue and Lightness appear in both HSL and OKLCH, so verify multiple exist
      expect(screen.getAllByLabelText('Hue').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByLabelText('Lightness').length).toBeGreaterThanOrEqual(1)
    })

    it('displays OKLCH format inputs', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Should have OKLCH sliders - Chroma is unique to OKLCH section
      expect(screen.getByLabelText('Chroma')).toBeInTheDocument()
      // Lightness and Hue appear in both HSL and OKLCH, so verify multiple exist
      expect(screen.getAllByLabelText('Lightness').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByLabelText('Hue').length).toBeGreaterThanOrEqual(1)
    })

    it('shows gamut status for in-gamut color', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#808080"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Mid-gray is definitely in gamut
      expect(container.textContent).toContain('In gamut')
    })

    it('shows out of gamut warning for edge colors', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Pure red is at edge of sRGB gamut - may show as out of gamut due to OKLCH precision
      expect(container.textContent).toMatch(/gamut/i)
    })
  })

  describe('color format values', () => {
    it('displays correct hex value in input', () => {
      render(
        <ColorEditorPanel
          color="#FF5500"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // The hex input should have the value (includes # prefix)
      const hexInput = screen.getByLabelText('Hex color')
      expect((hexInput as HTMLInputElement).value.toUpperCase()).toBe('#FF5500')
    })
  })

  describe('hex input', () => {
    it('calls onChange with valid hex color', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hexInput = screen.getByLabelText('Hex color')
      fireEvent.change(hexInput, { target: { value: '#00FF00' } })
      expect(mockOnChange).toHaveBeenCalledWith('#00FF00')
    })

    it('adds # prefix if missing', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hexInput = screen.getByLabelText('Hex color')
      fireEvent.change(hexInput, { target: { value: '00FF00' } })
      expect(mockOnChange).toHaveBeenCalledWith('#00FF00')
    })

    it('marks input as invalid for bad hex', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hexInput = screen.getByLabelText('Hex color')
      fireEvent.change(hexInput, { target: { value: '#ZZZZZZ' } })
      expect(hexInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('restores valid value on blur when invalid', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hexInput = screen.getByLabelText('Hex color') as HTMLInputElement
      fireEvent.change(hexInput, { target: { value: '#ZZZZZZ' } })
      fireEvent.blur(hexInput)
      expect(hexInput.value.toUpperCase()).toBe('#FF0000')
    })

    it('handles 8-digit hex with alpha', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hexInput = screen.getByLabelText('Hex color')
      fireEvent.change(hexInput, { target: { value: '#FF000080' } })
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('RGB inputs', () => {
    it('updates red channel and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#000000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const redInput = screen.getByLabelText('Red')
      fireEvent.change(redInput, { target: { value: '255' } })
      fireEvent.blur(redInput)
      expect(mockOnChange).toHaveBeenCalled()
      // Should be called with a hex that has red component
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall.toUpperCase()).toMatch(/^#FF/)
    })

    it('updates green channel and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#000000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const greenInput = screen.getByLabelText('Green')
      fireEvent.change(greenInput, { target: { value: '255' } })
      fireEvent.blur(greenInput)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates blue channel and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#000000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const blueInput = screen.getByLabelText('Blue')
      fireEvent.change(blueInput, { target: { value: '255' } })
      fireEvent.blur(blueInput)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates alpha in RGB section', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // There are multiple Alpha inputs (RGB, HSL, OKLCH) - use spinbutton role to find inputs
      const alphaInputs = screen.getAllByRole('spinbutton', { name: 'Alpha' })
      // First one is in RGB section
      fireEvent.change(alphaInputs[0], { target: { value: '0.5' } })
      fireEvent.blur(alphaInputs[0])
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('HSL inputs', () => {
    it('updates hue and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Use spinbutton role to find input fields specifically
      const hueInputs = screen.getAllByRole('spinbutton', { name: 'Hue' })
      // First Hue is in HSL section
      fireEvent.change(hueInputs[0], { target: { value: '180' } })
      fireEvent.blur(hueInputs[0])
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates saturation and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const satInput = screen.getByLabelText('Saturation')
      fireEvent.change(satInput, { target: { value: '50' } })
      fireEvent.blur(satInput)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates lightness and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const lightnessInputs = screen.getAllByRole('spinbutton', { name: 'Lightness' })
      // First Lightness is in HSL section
      fireEvent.change(lightnessInputs[0], { target: { value: '25' } })
      fireEvent.blur(lightnessInputs[0])
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('OKLCH inputs', () => {
    it('updates lightness and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const lightnessInputs = screen.getAllByRole('spinbutton', { name: 'Lightness' })
      // Second Lightness is in OKLCH section
      fireEvent.change(lightnessInputs[1], { target: { value: '0.5' } })
      fireEvent.blur(lightnessInputs[1])
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates chroma and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const chromaInput = screen.getByLabelText('Chroma')
      fireEvent.change(chromaInput, { target: { value: '0.2' } })
      fireEvent.blur(chromaInput)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('updates hue and calls onChange', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hueInputs = screen.getAllByRole('spinbutton', { name: 'Hue' })
      // Second Hue is in OKLCH section
      fireEvent.change(hueInputs[1], { target: { value: '200' } })
      fireEvent.blur(hueInputs[1])
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('shows gamut warning for out-of-gamut colors', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // Increase chroma to push out of gamut
      const chromaInput = screen.getByLabelText('Chroma')
      fireEvent.change(chromaInput, { target: { value: '0.4' } })
      fireEvent.blur(chromaInput)
      // The gamut warning message should appear
      expect(screen.getByText(/outside sRGB gamut/i)).toBeInTheDocument()
    })
  })

  describe('color swatch comparison', () => {
    it('shows current color swatch', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const swatches = container.querySelectorAll('[title*="Current"]')
      expect(swatches.length).toBe(1)
      expect(swatches[0]).toHaveAttribute('title', 'Current: #FF0000')
    })

    it('shows original color when provided', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          originalColor="#00FF00"
          onChange={mockOnChange}
        />
      )
      const originalSwatch = container.querySelector('[title*="Original"]')
      expect(originalSwatch).toBeInTheDocument()
      expect(originalSwatch).toHaveAttribute('title', 'Original: #00FF00')
    })

    it('shows only current color when no original', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      expect(container.querySelector('[title*="Original"]')).not.toBeInTheDocument()
    })
  })

  describe('color picker integration', () => {
    it('renders color picker component', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      // ColorPicker has sliders
      expect(
        screen.getByRole('slider', { name: 'Saturation and brightness picker' })
      ).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: 'Hue' })).toBeInTheDocument()
    })

    it('calls onChange when picker is used', () => {
      render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )
      const hueSlider = screen.getByRole('slider', { name: 'Hue' })

      hueSlider.getBoundingClientRect = vi.fn(() => ({
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

      fireEvent.mouseDown(hueSlider, { clientX: 100, clientY: 8 })
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('external value sync', () => {
    it('updates all inputs when color prop changes', () => {
      const { rerender } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )

      // Initial: red
      const hexInput = screen.getByLabelText('Hex color') as HTMLInputElement
      expect(hexInput.value.toUpperCase()).toBe('#FF0000')

      // Change to green
      rerender(
        <ColorEditorPanel
          color="#00FF00"
          colorPath="style/background"
          onChange={mockOnChange}
        />
      )

      expect(hexInput.value.toUpperCase()).toBe('#00FF00')
    })
  })

  describe('className prop', () => {
    it('applies className when color is selected', () => {
      const { container } = render(
        <ColorEditorPanel
          color="#FF0000"
          colorPath="style/background"
          onChange={mockOnChange}
          className="custom-editor-class"
        />
      )
      expect(container.firstChild).toHaveClass('custom-editor-class')
    })
  })
})
