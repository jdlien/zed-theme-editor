import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  NumberField,
  roundToPrecision,
  clampValue,
  formatNumber,
  isPartialNumber,
  parseNumber,
  getIncrement,
  isSmallRange,
} from './NumberField'

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('roundToPrecision', () => {
  it('rounds to specified decimal places', () => {
    expect(roundToPrecision(1.2345, 2)).toBe(1.23)
    expect(roundToPrecision(1.2355, 2)).toBe(1.24)
    expect(roundToPrecision(1.999, 2)).toBe(2)
  })

  it('handles zero precision', () => {
    expect(roundToPrecision(1.5, 0)).toBe(2)
    expect(roundToPrecision(1.4, 0)).toBe(1)
  })

  it('avoids floating point errors', () => {
    // Classic floating point error case
    expect(roundToPrecision(0.1 + 0.2, 10)).toBe(0.3)
    expect(roundToPrecision(0.1 + 0.2, 2)).toBe(0.3)
  })

  it('handles negative numbers', () => {
    expect(roundToPrecision(-1.2345, 2)).toBe(-1.23)
    expect(roundToPrecision(-1.2355, 2)).toBe(-1.24)
  })
})

describe('clampValue', () => {
  it('clamps values to min/max bounds', () => {
    expect(clampValue(5, 0, 10, false)).toBe(5)
    expect(clampValue(-1, 0, 10, false)).toBe(0)
    expect(clampValue(11, 0, 10, false)).toBe(10)
  })

  it('wraps hue values correctly', () => {
    expect(clampValue(360, 0, 360, true)).toBe(0)
    expect(clampValue(361, 0, 360, true)).toBe(1)
    expect(clampValue(-1, 0, 360, true)).toBe(359)
    expect(clampValue(-10, 0, 360, true)).toBe(350)
  })

  it('handles multiple wraps', () => {
    expect(clampValue(720, 0, 360, true)).toBe(0)
    expect(clampValue(370, 0, 360, true)).toBe(10)
    expect(clampValue(-370, 0, 360, true)).toBe(350)
  })

  it('works with non-zero min', () => {
    expect(clampValue(5, 10, 20, false)).toBe(10)
    expect(clampValue(25, 10, 20, false)).toBe(20)
    expect(clampValue(15, 10, 20, false)).toBe(15)
  })
})

describe('formatNumber', () => {
  it('formats numbers with precision', () => {
    expect(formatNumber(1.234, 3)).toBe('1.234')
    expect(formatNumber(1.2, 3)).toBe('1.2')
    expect(formatNumber(1, 3)).toBe('1')
  })

  it('removes trailing zeros', () => {
    expect(formatNumber(1.1, 3)).toBe('1.1')
    expect(formatNumber(1.0, 3)).toBe('1')
    expect(formatNumber(1.23, 3)).toBe('1.23')
  })

  it('handles very small numbers', () => {
    expect(formatNumber(0.00000001, 3)).toBe('0')
    expect(formatNumber(0, 3)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-1.234, 3)).toBe('-1.234')
    expect(formatNumber(-1.0, 3)).toBe('-1')
  })
})

describe('isPartialNumber', () => {
  it('accepts valid partial inputs', () => {
    expect(isPartialNumber('')).toBe(true)
    expect(isPartialNumber('-')).toBe(true)
    expect(isPartialNumber('.')).toBe(true)
    expect(isPartialNumber('-.')).toBe(true)
    expect(isPartialNumber('1')).toBe(true)
    expect(isPartialNumber('1.')).toBe(true)
    expect(isPartialNumber('.5')).toBe(true)
    expect(isPartialNumber('-1')).toBe(true)
    expect(isPartialNumber('-1.5')).toBe(true)
  })

  it('rejects invalid inputs', () => {
    expect(isPartialNumber('abc')).toBe(false)
    expect(isPartialNumber('1.2.3')).toBe(false)
    expect(isPartialNumber('--1')).toBe(false)
    expect(isPartialNumber('1-')).toBe(false)
  })
})

describe('parseNumber', () => {
  it('parses valid numbers', () => {
    expect(parseNumber('123')).toBe(123)
    expect(parseNumber('1.5')).toBe(1.5)
    expect(parseNumber('-5')).toBe(-5)
    expect(parseNumber('.5')).toBe(0.5)
    expect(parseNumber('-.5')).toBe(-0.5)
  })

  it('returns null for partial inputs', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('-')).toBeNull()
    expect(parseNumber('.')).toBeNull()
    expect(parseNumber('-.')).toBeNull()
  })

  it('returns null for invalid inputs', () => {
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('NaN')).toBeNull()
  })
})

describe('isSmallRange', () => {
  it('returns true for range <= 1', () => {
    expect(isSmallRange(0, 1)).toBe(true)
    expect(isSmallRange(0, 0.5)).toBe(true)
    expect(isSmallRange(0.5, 1)).toBe(true)
  })

  it('returns false for range > 1', () => {
    expect(isSmallRange(0, 100)).toBe(false)
    expect(isSmallRange(0, 360)).toBe(false)
    expect(isSmallRange(0, 2)).toBe(false)
  })

  it('returns false for infinite ranges', () => {
    expect(isSmallRange(-Infinity, Infinity)).toBe(false)
    expect(isSmallRange(0, Infinity)).toBe(false)
  })
})

describe('getIncrement', () => {
  const createKeyEvent = (key: string, alt = false, shift = false) =>
    ({
      key,
      altKey: alt,
      shiftKey: shift,
    }) as React.KeyboardEvent

  describe('standard range', () => {
    it('returns base increment for no modifiers', () => {
      expect(getIncrement(createKeyEvent('ArrowUp'), 1, 'decimal')).toBe(1)
      expect(getIncrement(createKeyEvent('ArrowDown'), 1, 'decimal')).toBe(-1)
    })

    it('returns 0.1 increment with Alt', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', true, false), 1, 'decimal')).toBe(0.1)
      expect(getIncrement(createKeyEvent('ArrowDown', true, false), 1, 'decimal')).toBe(-0.1)
    })

    it('returns 10 increment with Shift', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', false, true), 1, 'decimal')).toBe(10)
      expect(getIncrement(createKeyEvent('ArrowDown', false, true), 1, 'decimal')).toBe(-10)
    })

    it('returns 0.01 increment with Alt+Shift', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', true, true), 1, 'decimal')).toBe(0.01)
      expect(getIncrement(createKeyEvent('ArrowDown', true, true), 1, 'decimal')).toBe(-0.01)
    })

    it('respects custom step size', () => {
      expect(getIncrement(createKeyEvent('ArrowUp'), 5, 'decimal')).toBe(5)
      expect(getIncrement(createKeyEvent('ArrowUp', true, false), 5, 'decimal')).toBe(0.5)
    })

    it('enforces minimum increment of 1 for integer mode', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', true, false), 1, 'integer')).toBe(1)
      expect(getIncrement(createKeyEvent('ArrowUp', true, true), 1, 'integer')).toBe(1)
    })
  })

  describe('small range (e.g., alpha 0-1)', () => {
    it('returns 0.1 increment for no modifiers', () => {
      expect(getIncrement(createKeyEvent('ArrowUp'), 1, 'decimal', true)).toBe(0.1)
      expect(getIncrement(createKeyEvent('ArrowDown'), 1, 'decimal', true)).toBe(-0.1)
    })

    it('returns 0.01 increment with Alt', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', true, false), 1, 'decimal', true)).toBe(0.01)
      expect(getIncrement(createKeyEvent('ArrowDown', true, false), 1, 'decimal', true)).toBe(-0.01)
    })

    it('returns 1 increment with Shift (full range)', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', false, true), 1, 'decimal', true)).toBe(1)
      expect(getIncrement(createKeyEvent('ArrowDown', false, true), 1, 'decimal', true)).toBe(-1)
    })

    it('returns 0.001 increment with Alt+Shift', () => {
      expect(getIncrement(createKeyEvent('ArrowUp', true, true), 1, 'decimal', true)).toBe(0.001)
      expect(getIncrement(createKeyEvent('ArrowDown', true, true), 1, 'decimal', true)).toBe(-0.001)
    })
  })
})

// ============================================================================
// Component Tests
// ============================================================================

describe('NumberField Component', () => {
  it('renders with initial value', () => {
    render(<NumberField value={42} onChange={() => {}} />)
    expect(screen.getByRole('spinbutton')).toHaveValue('42')
  })

  it('displays suffix when provided', () => {
    render(<NumberField value={50} onChange={() => {}} suffix="%" />)
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('displays prefix when provided', () => {
    render(<NumberField value={50} onChange={() => {}} prefix="#" />)
    expect(screen.getByText('#')).toBeInTheDocument()
  })

  it('calls onChange when value changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberField value={10} onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '25')

    expect(onChange).toHaveBeenCalledWith(25)
  })

  it('allows partial input during editing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberField value={10} onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '-')

    // Should not call onChange for partial input
    expect(input).toHaveValue('-')
  })

  it('clamps values on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberField value={50} onChange={onChange} min={0} max={100} />)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '150')
    await user.tab()

    expect(onChange).toHaveBeenLastCalledWith(100)
  })

  it('handles disabled state', () => {
    render(<NumberField value={42} onChange={() => {}} disabled />)
    expect(screen.getByRole('spinbutton')).toBeDisabled()
  })

  describe('Arrow Key Modifiers', () => {
    it('increments by 1 with ArrowUp', () => {
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp' })

      expect(onChange).toHaveBeenCalledWith(11)
    })

    it('decrements by 1 with ArrowDown', () => {
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowDown' })

      expect(onChange).toHaveBeenCalledWith(9)
    })

    it('increments by 0.1 with Alt+ArrowUp', () => {
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp', altKey: true })

      expect(onChange).toHaveBeenCalledWith(10.1)
    })

    it('increments by 10 with Shift+ArrowUp', () => {
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })

      expect(onChange).toHaveBeenCalledWith(20)
    })

    it('increments by 0.01 with Alt+Shift+ArrowUp', () => {
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp', altKey: true, shiftKey: true })

      expect(onChange).toHaveBeenCalledWith(10.01)
    })
  })

  describe('Hue Domain', () => {
    it('wraps at 360 boundary', () => {
      const onChange = vi.fn()
      render(<NumberField value={359} onChange={onChange} domain="hue" />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp' })

      expect(onChange).toHaveBeenCalledWith(0)
    })

    it('wraps at 0 boundary going down', () => {
      const onChange = vi.fn()
      render(<NumberField value={0} onChange={onChange} domain="hue" />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowDown' })

      expect(onChange).toHaveBeenCalledWith(359)
    })

    it('wraps with larger increments', () => {
      const onChange = vi.fn()
      render(<NumberField value={355} onChange={onChange} domain="hue" />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })

      expect(onChange).toHaveBeenCalledWith(5)
    })
  })

  describe('Other Domains', () => {
    it('clamps percentage to 0-100', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<NumberField value={50} onChange={onChange} domain="percentage" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '150')
      await user.tab()

      expect(onChange).toHaveBeenLastCalledWith(100)
    })

    it('clamps alpha to 0-1', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<NumberField value={0.5} onChange={onChange} domain="alpha" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '1.5')
      await user.tab()

      expect(onChange).toHaveBeenLastCalledWith(1)
    })

    it('clamps chroma to 0-0.5', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<NumberField value={0.2} onChange={onChange} domain="chroma" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '0.8')
      await user.tab()

      expect(onChange).toHaveBeenLastCalledWith(0.5)
    })
  })

  describe('Precision', () => {
    it('respects precision setting', () => {
      render(<NumberField value={1.23456} onChange={() => {}} precision={2} />)
      expect(screen.getByRole('spinbutton')).toHaveValue('1.23')
    })

    it('avoids floating point display errors', () => {
      const onChange = vi.fn()
      render(<NumberField value={0.1} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.keyDown(input, { key: 'ArrowUp', altKey: true })

      // Should be 0.2, not 0.20000000000000001
      expect(onChange).toHaveBeenCalledWith(0.2)
    })
  })

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<NumberField value={42} onChange={() => {}} />)
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    it('includes aria-label when provided', () => {
      render(<NumberField value={42} onChange={() => {}} label="Hue value" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-label', 'Hue value')
    })

    it('includes aria-valuenow', () => {
      render(<NumberField value={42} onChange={() => {}} />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '42')
    })

    it('includes aria-valuemin and aria-valuemax when set', () => {
      render(<NumberField value={50} onChange={() => {}} min={0} max={100} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('aria-valuemin', '0')
      expect(input).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Integer Mode', () => {
    it('enforces integer values', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<NumberField value={10} onChange={onChange} mode="integer" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10.5')
      await user.tab()

      expect(onChange).toHaveBeenLastCalledWith(11)
    })

    it('uses numeric inputMode', () => {
      render(<NumberField value={10} onChange={() => {}} mode="integer" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('inputMode', 'numeric')
    })
  })
})
