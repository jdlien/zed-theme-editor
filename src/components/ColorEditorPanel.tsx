/**
 * ColorEditorPanel Component
 * Full color editing interface with visual picker and multi-format numeric inputs
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { ColorPicker } from './ColorPicker'
import { NumberField } from './NumberField'
import {
  isValidHex,
  normalizeHex,
  parseColor,
  hexToRgb,
  hexToHsl,
  hexToOklch,
  rgbToHex,
  hslToHex,
  oklchToHex,
  isInGamut,
  fromOklch,
} from '@/lib/colorConversion'

// ============================================================================
// Types
// ============================================================================

export interface ColorEditorPanelProps {
  /** Current color in hex format (null if no color selected) */
  color: string | null
  /** Property path being edited */
  colorPath: string | null
  /** Called when color changes */
  onChange: (hex: string) => void
  /** Original color for comparison */
  originalColor?: string
  /** Additional CSS classes */
  className?: string
}

interface RgbValues {
  r: number
  g: number
  b: number
  a: number
}

interface HslValues {
  h: number
  s: number
  l: number
  a: number
}

interface OklchValues {
  l: number
  c: number
  h: number
  a: number
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Hex input field with validation
 */
function HexInput({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const [rawInput, setRawInput] = useState(value)
  const [isValid, setIsValid] = useState(true)

  // Sync with external value
  useEffect(() => {
    setRawInput(normalizeHex(value))
    setIsValid(true)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value

      // Ensure it starts with #
      if (!input.startsWith('#')) {
        input = '#' + input
      }

      setRawInput(input)

      // Validate and update
      if (isValidHex(input)) {
        setIsValid(true)
        onChange(normalizeHex(input))
      } else {
        setIsValid(false)
      }
    },
    [onChange]
  )

  const handleBlur = useCallback(() => {
    if (!isValid && isValidHex(value)) {
      // Restore to last valid value
      setRawInput(normalizeHex(value))
      setIsValid(true)
    }
  }, [isValid, value])

  return (
    <input
      type="text"
      value={rawInput}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full rounded border px-2 py-1 font-mono text-sm ${
        isValid
          ? 'border-neutral-600 bg-neutral-800'
          : 'border-red-500 bg-red-900/20'
      } focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500`}
      placeholder="#RRGGBB"
      maxLength={9}
      aria-label="Hex color"
      aria-invalid={!isValid}
    />
  )
}

/**
 * RGB input group
 */
function RgbInputs({
  values,
  onChange,
}: {
  values: RgbValues
  onChange: (values: RgbValues) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">R</label>
        <NumberField
          value={values.r}
          onChange={(r) => onChange({ ...values, r })}
          mode="integer"
          min={0}
          max={255}
          label="Red"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">G</label>
        <NumberField
          value={values.g}
          onChange={(g) => onChange({ ...values, g })}
          mode="integer"
          min={0}
          max={255}
          label="Green"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">B</label>
        <NumberField
          value={values.b}
          onChange={(b) => onChange({ ...values, b })}
          mode="integer"
          min={0}
          max={255}
          label="Blue"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">A</label>
        <NumberField
          value={values.a}
          onChange={(a) => onChange({ ...values, a })}
          domain="alpha"
          precision={2}
          label="Alpha"
        />
      </div>
    </div>
  )
}

/**
 * HSL input group
 */
function HslInputs({
  values,
  onChange,
}: {
  values: HslValues
  onChange: (values: HslValues) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">H</label>
        <NumberField
          value={values.h}
          onChange={(h) => onChange({ ...values, h })}
          domain="hue"
          mode="integer"
          suffix="°"
          label="Hue"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">S</label>
        <NumberField
          value={values.s}
          onChange={(s) => onChange({ ...values, s })}
          domain="percentage"
          mode="integer"
          suffix="%"
          label="Saturation"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">L</label>
        <NumberField
          value={values.l}
          onChange={(l) => onChange({ ...values, l })}
          domain="percentage"
          mode="integer"
          suffix="%"
          label="Lightness"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">A</label>
        <NumberField
          value={values.a}
          onChange={(a) => onChange({ ...values, a })}
          domain="alpha"
          precision={2}
          label="Alpha"
        />
      </div>
    </div>
  )
}

/**
 * OKLCH input group with gamut warning
 */
function OklchInputs({
  values,
  onChange,
  showGamutWarning,
}: {
  values: OklchValues
  onChange: (values: OklchValues) => void
  showGamutWarning: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">L</label>
          <NumberField
            value={values.l}
            onChange={(l) => onChange({ ...values, l })}
            min={0}
            max={1}
            precision={3}
            step={0.01}
            label="Lightness"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">C</label>
          <NumberField
            value={values.c}
            onChange={(c) => onChange({ ...values, c })}
            min={0}
            max={0.5}
            precision={3}
            step={0.01}
            label="Chroma"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">H</label>
          <NumberField
            value={values.h}
            onChange={(h) => onChange({ ...values, h })}
            domain="hue"
            precision={1}
            suffix="°"
            label="Hue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">A</label>
          <NumberField
            value={values.a}
            onChange={(a) => onChange({ ...values, a })}
            domain="alpha"
            precision={2}
            label="Alpha"
          />
        </div>
      </div>
      {showGamutWarning && (
        <div className="flex items-center gap-2 rounded bg-yellow-900/30 px-2 py-1 text-xs text-yellow-400">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
          <span>Color outside sRGB gamut - will be clamped</span>
        </div>
      )}
    </div>
  )
}

/**
 * Color swatch comparison showing original vs current
 */
function ColorSwatch({
  current,
  original,
}: {
  current: string
  original?: string
}) {
  return (
    <div className="flex overflow-hidden rounded border border-neutral-600">
      {original && (
        <div
          className="h-10 w-1/2"
          style={{ backgroundColor: original }}
          title={`Original: ${original}`}
        />
      )}
      <div
        className={`h-10 ${original ? 'w-1/2' : 'w-full'}`}
        style={{ backgroundColor: current }}
        title={`Current: ${current}`}
      />
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ColorEditorPanel({
  color,
  colorPath,
  onChange,
  originalColor,
  className = '',
}: ColorEditorPanelProps) {
  // Show placeholder if no color selected
  if (!color) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-neutral-500">Select a color to edit</p>
      </div>
    )
  }

  // Parse current color into all formats
  const parsed = useMemo(() => parseColor(color), [color])

  const [rgb, setRgb] = useState<RgbValues>(() => hexToRgb(color) ?? { r: 0, g: 0, b: 0, a: 1 })
  const [hsl, setHsl] = useState<HslValues>(() => hexToHsl(color) ?? { h: 0, s: 100, l: 50, a: 1 })
  const [oklch, setOklch] = useState<OklchValues>(() => hexToOklch(color) ?? { l: 0.5, c: 0.1, h: 0, a: 1 })

  // Check if OKLCH color is out of gamut
  const isOutOfGamut = useMemo(() => {
    const oklchColor = fromOklch(oklch.l, oklch.c, oklch.h, oklch.a)
    return !isInGamut(oklchColor)
  }, [oklch])

  // Sync internal state when external value changes
  useEffect(() => {
    const rgbVals = hexToRgb(color)
    const hslVals = hexToHsl(color)
    const oklchVals = hexToOklch(color)

    if (rgbVals) setRgb(rgbVals)
    if (hslVals) setHsl(hslVals)
    if (oklchVals) setOklch(oklchVals)
  }, [color])

  // Update handlers for each format
  const handleRgbChange = useCallback(
    (newRgb: RgbValues) => {
      setRgb(newRgb)
      const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b, newRgb.a)
      onChange(hex)
    },
    [onChange]
  )

  const handleHslChange = useCallback(
    (newHsl: HslValues) => {
      setHsl(newHsl)
      const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l, newHsl.a)
      onChange(hex)
    },
    [onChange]
  )

  const handleOklchChange = useCallback(
    (newOklch: OklchValues) => {
      setOklch(newOklch)
      const hex = oklchToHex(newOklch.l, newOklch.c, newOklch.h, newOklch.a)
      onChange(hex)
    },
    [onChange]
  )

  return (
    <div className={`flex flex-col gap-4 p-4 ${className}`}>
      {/* Header with property path */}
      {colorPath && (
        <div className="border-b border-neutral-700 pb-2">
          <h3 className="font-mono text-sm text-neutral-300">{colorPath}</h3>
        </div>
      )}

      {/* Color comparison swatch */}
      <ColorSwatch current={color} original={originalColor} />

      {/* Visual color picker */}
      <ColorPicker value={color} onChange={onChange} showAlpha />

      {/* Hex input */}
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">HEX</label>
        <HexInput value={color} onChange={onChange} />
      </div>

      {/* RGB inputs */}
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">RGB</label>
        <RgbInputs values={rgb} onChange={handleRgbChange} />
      </div>

      {/* HSL inputs */}
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">HSL</label>
        <HslInputs values={hsl} onChange={handleHslChange} />
      </div>

      {/* OKLCH inputs */}
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">OKLCH</label>
        <OklchInputs values={oklch} onChange={handleOklchChange} showGamutWarning={isOutOfGamut} />
      </div>

      {/* Parsed color info */}
      {parsed && (
        <div className="rounded border border-neutral-700 bg-neutral-800/50 p-2 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 ${parsed.isInGamut ? 'text-green-400' : 'text-yellow-400'}`}>
              <FontAwesomeIcon icon={parsed.isInGamut ? faCheck : faTriangleExclamation} className="h-3 w-3" />
              {parsed.isInGamut ? 'In gamut' : 'Out of gamut'}
            </span>
            {parsed.alpha < 1 && <span>• Alpha: {Math.round(parsed.alpha * 100)}%</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorEditorPanel
