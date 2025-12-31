/**
 * ColorEditorPanel Component
 * Full color editing interface with visual picker and multi-format numeric inputs
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { ColorPicker } from './ColorPicker'
import { NumberField } from './NumberField'
import {
  isValidHex,
  normalizeHex,
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
  /** Description of the color property from schema */
  description?: string
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
          ? 'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800'
          : 'border-red-500 bg-red-100 dark:bg-red-900/20'
      }`}
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          R
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          G
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          B
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          A
        </label>
        <NumberField
          value={values.a}
          onChange={(a) => onChange({ ...values, a })}
          domain="alpha"
          precision={2}
          step={0.1} // gives ±0.01 with small range modifiers
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          H
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          S
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          L
        </label>
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
        <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          A
        </label>
        <NumberField
          value={values.a}
          onChange={(a) => onChange({ ...values, a })}
          domain="alpha"
          precision={2}
          step={0.1} // gives ±0.01 with small range modifiers
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
          <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
            L
          </label>
          <NumberField
            value={values.l}
            onChange={(l) => onChange({ ...values, l })}
            min={0}
            max={1}
            precision={3}
            step={0.05} // gives ±0.005 with small range modifiers
            label="Lightness"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
            C
          </label>
          <NumberField
            value={values.c}
            onChange={(c) => onChange({ ...values, c })}
            min={0}
            max={0.5}
            precision={3}
            step={0.01} // gives ±0.001 with small range modifiers
            label="Chroma"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
            H
          </label>
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
          <label className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
            A
          </label>
          <NumberField
            value={values.a}
            onChange={(a) => onChange({ ...values, a })}
            domain="alpha"
            precision={2}
            step={0.1} // gives ±0.01 with small range modifiers
            label="Alpha"
          />
        </div>
      </div>
      {showGamutWarning && (
        <div className="flex items-center gap-2 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
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
    <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-600">
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
  description,
  onChange,
  originalColor,
  className = '',
}: ColorEditorPanelProps) {
  // Show placeholder if no color selected
  if (!color) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-neutral-600 dark:text-neutral-500">
          Select a color to edit
        </p>
      </div>
    )
  }

  const [rgb, setRgb] = useState<RgbValues>(
    () => hexToRgb(color) ?? { r: 0, g: 0, b: 0, a: 1 }
  )
  const [hsl, setHsl] = useState<HslValues>(
    () => hexToHsl(color) ?? { h: 0, s: 100, l: 50, a: 1 }
  )
  const [oklch, setOklch] = useState<OklchValues>(
    () => hexToOklch(color) ?? { l: 0.5, c: 0.1, h: 0, a: 1 }
  )

  // Track which format is being edited to prevent sync from overwriting it
  // This prevents gamut mapping from altering OKLCH values during editing
  type EditSource = 'rgb' | 'hsl' | 'oklch' | 'picker' | null
  const editSourceRef = useRef<EditSource>(null)

  // Check if OKLCH color is out of gamut
  const isOutOfGamut = useMemo(() => {
    const oklchColor = fromOklch(oklch.l, oklch.c, oklch.h, oklch.a)
    return !isInGamut(oklchColor)
  }, [oklch])

  // Sync internal state when external value changes
  // Skip syncing the format that's currently being edited to prevent
  // gamut mapping from overwriting the user's input values
  useEffect(() => {
    const source = editSourceRef.current

    // Only sync formats that aren't the current edit source
    if (source !== 'rgb' && source !== 'picker') {
      const rgbVals = hexToRgb(color)
      if (rgbVals) setRgb(rgbVals)
    }
    if (source !== 'hsl') {
      const hslVals = hexToHsl(color)
      if (hslVals) setHsl(hslVals)
    }
    if (source !== 'oklch') {
      const oklchVals = hexToOklch(color)
      if (oklchVals) setOklch(oklchVals)
    }

    // Clear the edit source after sync
    editSourceRef.current = null
  }, [color])

  // Update handlers for each format
  // Each handler sets editSourceRef so the useEffect knows not to overwrite
  const handleRgbChange = useCallback(
    (newRgb: RgbValues) => {
      editSourceRef.current = 'rgb'
      setRgb(newRgb)
      const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b, newRgb.a)
      onChange(hex)
    },
    [onChange]
  )

  const handleHslChange = useCallback(
    (newHsl: HslValues) => {
      editSourceRef.current = 'hsl'
      setHsl(newHsl)
      const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l, newHsl.a)
      onChange(hex)
    },
    [onChange]
  )

  const handleOklchChange = useCallback(
    (newOklch: OklchValues) => {
      editSourceRef.current = 'oklch'
      setOklch(newOklch)
      const hex = oklchToHex(newOklch.l, newOklch.c, newOklch.h, newOklch.a)
      onChange(hex)
    },
    [onChange]
  )

  return (
    <div className={`flex flex-col gap-4 px-4 py-2 ${className}`}>
      {/* Header with property path and description */}
      {colorPath && (
        <div className="-mb-2 text-center">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {colorPath.replace(/^style\//, '')}
          </h3>
          {/* Relative container maintains stable height; text expands on hover */}
          <div className="relative mt-1 min-h-8">
            <p
              className={`line-clamp-2 text-xs hover:absolute hover:inset-x-0 hover:top-0 hover:z-10 hover:line-clamp-none hover:rounded hover:bg-neutral-50 hover:pb-0.5 hover:shadow-md dark:hover:bg-neutral-900 ${
                description
                  ? 'text-neutral-500 dark:text-neutral-400'
                  : 'text-neutral-300 italic dark:text-neutral-700'
              }`}
            >
              {description || 'No description'}
            </p>
          </div>
        </div>
      )}

      {/* Color comparison swatch */}
      <ColorSwatch current={color} original={originalColor} />

      {/* Visual color picker */}
      <ColorPicker
        value={color}
        onChange={(hex) => {
          editSourceRef.current = 'picker'
          onChange(hex)
        }}
        showAlpha
      />

      {/* Hex input */}
      <div className="rounded-md border border-neutral-200/40 p-1 inset-shadow-sm dark:border-neutral-800/50 dark:bg-neutral-950/40">
        <label className="mb-0 block pb-1 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          HEX <span className="font-normal">(6-8 digits)</span>
        </label>
        <HexInput value={color} onChange={onChange} />
      </div>

      {/* RGB inputs */}
      <div className="rounded-md border border-neutral-200/40 p-1 inset-shadow-sm dark:border-neutral-800/50 dark:bg-neutral-950/40">
        <label className="mb-0 block pb-1 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          RGB
        </label>
        <RgbInputs values={rgb} onChange={handleRgbChange} />
      </div>

      {/* HSL inputs */}
      <div className="rounded-md border border-neutral-200/40 p-1 inset-shadow-sm dark:border-neutral-800/50 dark:bg-neutral-950/40">
        <label className="mb-0 block pb-1 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          HSL
        </label>
        <HslInputs values={hsl} onChange={handleHslChange} />
      </div>

      {/* OKLCH inputs */}
      <div className="rounded-md border border-neutral-200/40 p-1 inset-shadow-sm dark:border-neutral-800/50 dark:bg-neutral-950/40">
        <label className="mb-0 block pb-1 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          OKLCH
        </label>
        <OklchInputs
          values={oklch}
          onChange={handleOklchChange}
          showGamutWarning={isOutOfGamut}
        />
      </div>

      {/* Gamut status - uses OKLCH state to match the OKLCH warning */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span
          className={`flex items-center gap-1 ${!isOutOfGamut ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}
        >
          <FontAwesomeIcon
            icon={!isOutOfGamut ? faCheck : faTriangleExclamation}
            className="h-3 w-3"
          />
          {!isOutOfGamut ? 'In gamut' : 'Out of gamut'}
        </span>
      </div>
    </div>
  )
}

export default ColorEditorPanel
