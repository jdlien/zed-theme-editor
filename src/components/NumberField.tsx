/**
 * NumberField Component
 * Custom number input with arrow key modifiers and domain-specific validation
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type FocusEvent } from 'react'

// ============================================================================
// Types
// ============================================================================

export type NumberFieldMode = 'integer' | 'decimal'
export type NumberFieldDomain = 'default' | 'hue' | 'percentage' | 'alpha' | 'chroma'

export interface NumberFieldProps {
  /** Current value */
  value: number
  /** Called when value changes */
  onChange: (value: number) => void
  /** Input mode - integer or decimal */
  mode?: NumberFieldMode
  /** Domain for clamping behavior */
  domain?: NumberFieldDomain
  /** Minimum value (ignored for hue which wraps) */
  min?: number
  /** Maximum value */
  max?: number
  /** Step size for arrow keys (default 1) */
  step?: number
  /** Maximum decimal places to display (default 3) */
  precision?: number
  /** Field label for accessibility */
  label?: string
  /** Additional CSS classes */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Optional suffix (e.g., "°", "%") */
  suffix?: string
  /** Optional prefix */
  prefix?: string
  /** ID for the input element */
  id?: string
}

// ============================================================================
// Constants
// ============================================================================

/** Domain configurations with min, max, and wrapping behavior */
const DOMAIN_CONFIG: Record<NumberFieldDomain, { min: number; max: number; wraps: boolean }> = {
  default: { min: -Infinity, max: Infinity, wraps: false },
  hue: { min: 0, max: 360, wraps: true },
  percentage: { min: 0, max: 100, wraps: false },
  alpha: { min: 0, max: 1, wraps: false },
  chroma: { min: 0, max: 0.5, wraps: false },
}

/** Arrow key modifier increments for standard range (0-100 or larger) */
const MODIFIERS = {
  none: 1,
  alt: 0.1,
  shift: 10,
  altShift: 0.01,
} as const

/** Arrow key modifier increments for small range (0-1) */
const SMALL_RANGE_MODIFIERS = {
  none: 0.1,
  alt: 0.01,
  shift: 1,
  altShift: 0.001,
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round to specified decimal places, avoiding floating point errors
 */
export function roundToPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

/**
 * Clamp a value to min/max bounds, with optional wrapping for hue
 */
export function clampValue(value: number, min: number, max: number, wraps: boolean): number {
  if (wraps) {
    const range = max - min
    let result = value
    while (result >= max) result -= range
    while (result < min) result += range
    return result
  }
  return Math.max(min, Math.min(max, value))
}

/**
 * Format a number for display, removing trailing zeros after decimal
 */
export function formatNumber(value: number, precision: number): string {
  const rounded = roundToPrecision(value, precision)
  // Use toPrecision to avoid scientific notation for small numbers
  if (Math.abs(rounded) < 1e-10) return '0'
  const str = rounded.toFixed(precision)
  // Remove trailing zeros after decimal point
  return str.replace(/\.?0+$/, '')
}

/**
 * Check if a string represents a valid partial number input
 */
export function isPartialNumber(str: string): boolean {
  // Allow empty, minus, dot, minus-dot, or any valid partial/complete number
  // This covers: '', '-', '.', '-.', '1', '1.', '.5', '1.5', '-1', '-1.', '-.5', '-1.5'
  return /^-?$|^-?\d*\.?\d*$/.test(str)
}

/**
 * Parse a string to number, returning null for invalid/partial inputs
 */
export function parseNumber(str: string): number | null {
  if (str === '' || str === '-' || str === '.' || str === '-.') {
    return null
  }
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

/**
 * Determine if a range is considered "small" (needs scaled-down increments)
 * Small ranges are those where the total span is <= 1
 */
export function isSmallRange(min: number, max: number): boolean {
  if (!isFinite(min) || !isFinite(max)) return false
  return max - min <= 1
}

/**
 * Get the increment based on keyboard modifiers
 * Uses smaller increments for small-range values (like alpha 0-1)
 */
export function getIncrement(
  e: KeyboardEvent,
  baseStep: number,
  mode: NumberFieldMode,
  useSmallRange: boolean = false
): number {
  const isUp = e.key === 'ArrowUp'
  const direction = isUp ? 1 : -1

  const modifiers = useSmallRange ? SMALL_RANGE_MODIFIERS : MODIFIERS

  let multiplier: number
  if (e.altKey && e.shiftKey) {
    multiplier = modifiers.altShift
  } else if (e.shiftKey) {
    multiplier = modifiers.shift
  } else if (e.altKey) {
    multiplier = modifiers.alt
  } else {
    multiplier = modifiers.none
  }

  // For integer mode, minimum increment is 1
  let increment = baseStep * multiplier
  if (mode === 'integer') {
    increment = Math.max(1, Math.round(increment))
  }

  return increment * direction
}

// ============================================================================
// Component
// ============================================================================

export function NumberField({
  value,
  onChange,
  mode = 'decimal',
  domain = 'default',
  min,
  max,
  step = 1,
  precision = 3,
  label,
  className = '',
  disabled = false,
  suffix,
  prefix,
  id,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rawInput, setRawInput] = useState<string>(() => formatNumber(value, precision))
  const [isFocused, setIsFocused] = useState(false)

  // Get domain config, allow prop overrides
  const domainConfig = DOMAIN_CONFIG[domain]
  const effectiveMin = min ?? domainConfig.min
  const effectiveMax = max ?? domainConfig.max
  const wraps = domain === 'hue'
  const useSmallRangeIncrements = isSmallRange(effectiveMin, effectiveMax)

  // Sync rawInput with value when not focused
  useEffect(() => {
    if (!isFocused) {
      setRawInput(formatNumber(value, precision))
    }
  }, [value, precision, isFocused])

  // Handle text input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value

      // Allow partial input during editing
      if (isPartialNumber(input)) {
        setRawInput(input)
      }

      // Parse and update if valid
      const parsed = parseNumber(input)
      if (parsed !== null) {
        const clamped = clampValue(parsed, effectiveMin, effectiveMax, wraps)
        const rounded = roundToPrecision(clamped, precision)
        onChange(rounded)
      }
    },
    [effectiveMin, effectiveMax, wraps, precision, onChange]
  )

  // Handle keyboard events for arrow key modifiers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return
      }

      e.preventDefault()

      const increment = getIncrement(e, step, mode, useSmallRangeIncrements)
      let newValue = value + increment

      // Apply clamping/wrapping
      newValue = clampValue(newValue, effectiveMin, effectiveMax, wraps)
      newValue = roundToPrecision(newValue, precision)

      onChange(newValue)
      setRawInput(formatNumber(newValue, precision))
    },
    [value, step, mode, effectiveMin, effectiveMax, wraps, precision, onChange, useSmallRangeIncrements]
  )

  // Handle focus - select all text for easy replacement
  const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // Select all on focus for easy editing
    e.target.select()
  }, [])

  // Handle blur - finalize the value
  const handleBlur = useCallback(() => {
    setIsFocused(false)

    // Parse current input or fall back to current value
    const parsed = parseNumber(rawInput)
    let finalValue = parsed !== null ? parsed : value

    // Round to integer if in integer mode
    if (mode === 'integer') {
      finalValue = Math.round(finalValue)
    }

    const clamped = clampValue(finalValue, effectiveMin, effectiveMax, wraps)
    const rounded = roundToPrecision(clamped, mode === 'integer' ? 0 : precision)

    if (rounded !== value) {
      onChange(rounded)
    }
    setRawInput(formatNumber(rounded, mode === 'integer' ? 0 : precision))
  }, [rawInput, value, effectiveMin, effectiveMax, wraps, precision, mode, onChange])

  // Base styles
  const baseStyles = `
    w-full px-2 py-1 text-sm font-mono text-right
    bg-white border border-neutral-300 rounded
    dark:bg-neutral-800 dark:border-neutral-600
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-150
  `

  return (
    <div className={`relative flex items-center ${className}`}>
      {prefix && <span className="mr-1 text-sm text-neutral-600 dark:text-neutral-400">{prefix}</span>}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
        value={rawInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={baseStyles}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={effectiveMin === -Infinity ? undefined : effectiveMin}
        aria-valuemax={effectiveMax === Infinity ? undefined : effectiveMax}
        role="spinbutton"
      />
      {suffix && <span className="ml-1 text-sm text-neutral-600 dark:text-neutral-400">{suffix}</span>}
    </div>
  )
}

export default NumberField
