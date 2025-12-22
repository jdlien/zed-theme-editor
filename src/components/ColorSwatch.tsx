/**
 * ColorSwatch Component
 * Displays a color swatch with optional before/after comparison and format display
 */

import type { ColorFormat } from '@/types/theme'
import { parseColor, formatColorAs } from '@/lib/colorConversion'
import { Tooltip } from './Tooltip'

// ============================================================================
// Types
// ============================================================================

export interface ColorSwatchProps {
  /** Current color value (hex) */
  color: string
  /** Original color for comparison (optional) */
  originalColor?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the swatch is selected */
  isSelected?: boolean
  /** Click handler */
  onClick?: () => void
  /** Color format to display as label */
  displayFormat?: ColorFormat
  /** Show the color value as text */
  showValue?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

function formatColorValue(hex: string, format: ColorFormat): string {
  const parsed = parseColor(hex)
  if (!parsed) return hex

  return formatColorAs(parsed, format)
}

// ============================================================================
// Component
// ============================================================================

export function ColorSwatch({
  color,
  originalColor,
  size = 'md',
  isSelected = false,
  onClick,
  displayFormat,
  showValue = false,
  className = '',
}: ColorSwatchProps) {
  const hasChanged = originalColor && originalColor !== color

  const swatchStyles = `
    ${sizeClasses[size]}
    relative overflow-hidden rounded border
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900' : ''}
    ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-neutral-900' : ''}
    border-neutral-400 dark:border-neutral-600 transition-shadow
  `

  const swatchContent = (
    <>
      {/* Checkerboard background for transparency */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #333 25%, transparent 25%),
            linear-gradient(-45deg, #333 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #333 75%),
            linear-gradient(-45deg, transparent 75%, #333 75%)
          `,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        }}
      />

      {/* Color display */}
      {hasChanged ? (
        // Split view: original on left, current on right
        <div className="pointer-events-none relative flex h-full w-full">
          <div className="h-full w-1/2" style={{ backgroundColor: originalColor }} />
          <div className="h-full w-1/2" style={{ backgroundColor: color }} />
        </div>
      ) : (
        // Single color
        <div className="pointer-events-none relative h-full w-full" style={{ backgroundColor: color }} />
      )}
    </>
  )

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Render as button only when interactive, otherwise as span to avoid nested buttons */}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={swatchStyles}
          aria-label={`Color: ${color}`}
        >
          {swatchContent}
        </button>
      ) : (
        <span className={swatchStyles} aria-label={`Color: ${color}`}>
          {swatchContent}
        </span>
      )}

      {/* Color value text */}
      {showValue && displayFormat && (
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
          {formatColorValue(color, displayFormat)}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Color Swatch Row (for use in color lists)
// ============================================================================

export interface ColorSwatchRowProps {
  /** Property key/name */
  label: string
  /** Current color value */
  color: string
  /** Original color for comparison */
  originalColor?: string
  /** Whether this row is selected */
  isSelected?: boolean
  /** Whether this color is defined in the theme (false = placeholder) */
  defined?: boolean
  /** Description/tooltip text from schema */
  description?: string
  /** Click handler */
  onClick?: () => void
  /** Color format to display */
  displayFormat?: ColorFormat
}

export function ColorSwatchRow({
  label,
  color,
  originalColor,
  isSelected = false,
  defined = true,
  description,
  onClick,
  displayFormat = 'hex',
}: ColorSwatchRowProps) {
  return (
    <Tooltip
      content={description || 'No description'}
      position="right"
      muted={!description}
    >
      <button
        type="button"
        onClick={onClick}
        className={`
          flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors
          ${isSelected ? 'bg-blue-500/20 dark:bg-blue-900/30' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}
          ${!defined ? 'opacity-50' : ''}
        `}
      >
        <div className={`relative ${!defined ? 'rounded border border-dashed border-neutral-400 dark:border-neutral-600' : ''}`}>
          <ColorSwatch
            color={color}
            originalColor={originalColor}
            size="sm"
            isSelected={isSelected}
            className={!defined ? 'opacity-70' : ''}
          />
        </div>
        <span
          className={`flex-1 truncate text-sm ${
            defined
              ? 'text-neutral-700 dark:text-neutral-300'
              : 'italic text-neutral-500 dark:text-neutral-500'
          }`}
        >
          {label}
        </span>
        {defined ? (
          <span className="font-mono text-xs text-neutral-500">
            {formatColorValue(color, displayFormat)}
          </span>
        ) : (
          <span className="text-xs text-neutral-400 dark:text-neutral-600">+</span>
        )}
      </button>
    </Tooltip>
  )
}

export default ColorSwatch
