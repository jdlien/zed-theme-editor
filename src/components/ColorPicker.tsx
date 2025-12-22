/**
 * ColorPicker Component
 * Visual color picker with saturation-lightness square, hue slider, and alpha slider
 */

import { useRef, useCallback, useEffect, useState, type MouseEvent, type TouchEvent } from 'react'
import { hslToHex, hexToHsl, isValidHex } from '@/lib/colorConversion'

// ============================================================================
// Types
// ============================================================================

export interface ColorPickerProps {
  /** Current color in hex format (#RRGGBB or #RRGGBBAA) */
  value: string
  /** Called when color changes */
  onChange: (hex: string) => void
  /** Show alpha slider */
  showAlpha?: boolean
  /** Additional CSS classes */
  className?: string
}

interface HSLColor {
  h: number
  s: number
  l: number
  a: number
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Get position from mouse/touch event relative to element
 */
function getEventPosition(
  e: MouseEvent | TouchEvent | globalThis.MouseEvent | globalThis.TouchEvent,
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  let clientX: number, clientY: number

  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('clientX' in e) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    return { x: 0, y: 0 }
  }

  return {
    x: clamp(clientX - rect.left, 0, rect.width),
    y: clamp(clientY - rect.top, 0, rect.height),
  }
}

/**
 * Convert HSL position to S/L values
 * X axis = saturation (0-100)
 * Y axis = lightness (100-0, inverted)
 */
function positionToSL(x: number, y: number, width: number, height: number): { s: number; l: number } {
  return {
    s: (x / width) * 100,
    l: 100 - (y / height) * 100,
  }
}

/**
 * Convert S/L values to position
 */
function slToPosition(s: number, l: number, width: number, height: number): { x: number; y: number } {
  return {
    x: (s / 100) * width,
    y: ((100 - l) / 100) * height,
  }
}

// ============================================================================
// Components
// ============================================================================

/**
 * Saturation-Lightness gradient square
 */
function SaturationLightnessPicker({
  hsl,
  onChange,
}: {
  hsl: HSLColor
  onChange: (s: number, l: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent | globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!containerRef.current) return

      const pos = getEventPosition(e, containerRef.current)
      const rect = containerRef.current.getBoundingClientRect()
      const { s, l } = positionToSL(pos.x, pos.y, rect.width, rect.height)

      onChange(s, l)
    },
    [onChange]
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      handleDrag(e)
    },
    [handleDrag]
  )

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      setIsDragging(true)
      handleDrag(e)
    },
    [handleDrag]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      e.preventDefault()
      handleDrag(e)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, handleDrag])

  // Calculate cursor position
  const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 200
  const containerHeight = containerRef.current?.getBoundingClientRect().height ?? 200
  const cursorPos = slToPosition(hsl.s, hsl.l, containerWidth, containerHeight)

  // Generate gradient background
  // Base hue color at full saturation
  const hueColor = `hsl(${hsl.h}, 100%, 50%)`

  return (
    <div
      ref={containerRef}
      className="relative h-48 w-full cursor-crosshair select-none rounded-lg"
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, ${hueColor})
        `,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-label="Saturation and lightness picker"
      aria-valuenow={hsl.s}
      tabIndex={0}
    >
      {/* Cursor */}
      <div
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
        }}
      />
    </div>
  )
}

/**
 * Horizontal slider for hue or alpha
 */
function Slider({
  value,
  onChange,
  min,
  max,
  background,
  ariaLabel,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  background: string
  ariaLabel: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent | globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!containerRef.current) return

      const pos = getEventPosition(e, containerRef.current)
      const rect = containerRef.current.getBoundingClientRect()
      const newValue = (pos.x / rect.width) * (max - min) + min

      onChange(clamp(newValue, min, max))
    },
    [onChange, min, max]
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      handleDrag(e)
    },
    [handleDrag]
  )

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      setIsDragging(true)
      handleDrag(e)
    },
    [handleDrag]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      e.preventDefault()
      handleDrag(e)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, handleDrag])

  // Calculate thumb position as percentage
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div
      ref={containerRef}
      className="relative h-4 w-full cursor-pointer select-none rounded-lg"
      style={{ background }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
    >
      {/* Thumb */}
      <div
        className="pointer-events-none absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-400 bg-white shadow"
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
}

/**
 * Checkerboard pattern for alpha background
 */
function CheckerboardBackground({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)
        `,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ColorPicker({ value, onChange, showAlpha = true, className = '' }: ColorPickerProps) {
  // Parse current color to HSL
  const [hsl, setHsl] = useState<HSLColor>(() => {
    const parsed = isValidHex(value) ? hexToHsl(value) : null
    return parsed ?? { h: 0, s: 100, l: 50, a: 1 }
  })

  // Sync internal state with external value
  useEffect(() => {
    if (isValidHex(value)) {
      const parsed = hexToHsl(value)
      if (parsed) {
        // Only update if significantly different to avoid feedback loops
        // Scale alpha by 100 since it's 0-1 while H/S/L are 0-360/0-100
        const diff =
          Math.abs(parsed.h - hsl.h) +
          Math.abs(parsed.s - hsl.s) +
          Math.abs(parsed.l - hsl.l) +
          Math.abs((parsed.a ?? 1) - hsl.a) * 100
        if (diff > 1) {
          setHsl({ ...parsed, a: parsed.a ?? 1 })
        }
      }
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update handlers
  const handleSLChange = useCallback(
    (s: number, l: number) => {
      const newHsl = { ...hsl, s, l }
      setHsl(newHsl)
      onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l, newHsl.a))
    },
    [hsl, onChange]
  )

  const handleHueChange = useCallback(
    (h: number) => {
      const newHsl = { ...hsl, h }
      setHsl(newHsl)
      onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l, newHsl.a))
    },
    [hsl, onChange]
  )

  const handleAlphaChange = useCallback(
    (a: number) => {
      const newHsl = { ...hsl, a }
      setHsl(newHsl)
      onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l, newHsl.a))
    },
    [hsl, onChange]
  )

  // Generate alpha slider gradient
  const opaqueColor = hslToHex(hsl.h, hsl.s, hsl.l, 1)
  const transparentColor = hslToHex(hsl.h, hsl.s, hsl.l, 0)

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Saturation-Lightness square */}
      <SaturationLightnessPicker hsl={hsl} onChange={handleSLChange} />

      {/* Hue slider */}
      <Slider
        value={hsl.h}
        onChange={handleHueChange}
        min={0}
        max={360}
        background="linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
        ariaLabel="Hue"
      />

      {/* Alpha slider */}
      {showAlpha && (
        <CheckerboardBackground className="rounded-lg">
          <div
            className="h-4 w-full rounded-lg"
            style={{
              background: `linear-gradient(to right, ${transparentColor}, ${opaqueColor})`,
            }}
          >
            <Slider
              value={hsl.a}
              onChange={handleAlphaChange}
              min={0}
              max={1}
              background="transparent"
              ariaLabel="Alpha"
            />
          </div>
        </CheckerboardBackground>
      )}

      {/* Color preview */}
      <div className="flex gap-2">
        <CheckerboardBackground className="h-8 flex-1 rounded">
          <div
            className="h-full w-full rounded"
            style={{ backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l, hsl.a) }}
          />
        </CheckerboardBackground>
      </div>
    </div>
  )
}

export default ColorPicker
