/**
 * ColorSwatch Component
 * Displays a color swatch with optional before/after comparison and format display
 */

import type { ColorFormat } from '@/types/theme'
import { parseColor, formatColorAs } from '@/lib/colorConversion'

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

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          relative overflow-hidden rounded border
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-neutral-900' : ''}
          ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-neutral-900' : 'cursor-default'}
          border-neutral-600 transition-shadow
        `}
        aria-label={`Color: ${color}`}
        disabled={!onClick}
      >
        {/* Checkerboard background for transparency */}
        <div
          className="absolute inset-0"
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
          <div className="relative flex h-full w-full">
            <div className="h-full w-1/2" style={{ backgroundColor: originalColor }} />
            <div className="h-full w-1/2" style={{ backgroundColor: color }} />
          </div>
        ) : (
          // Single color
          <div className="relative h-full w-full" style={{ backgroundColor: color }} />
        )}
      </button>

      {/* Color value text */}
      {showValue && displayFormat && (
        <span className="font-mono text-xs text-neutral-400">
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
  onClick,
  displayFormat = 'hex',
}: ColorSwatchRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors
        ${isSelected ? 'bg-blue-900/30' : 'hover:bg-neutral-800'}
      `}
    >
      <ColorSwatch
        color={color}
        originalColor={originalColor}
        size="sm"
        isSelected={isSelected}
      />
      <span className="flex-1 truncate text-sm text-neutral-300">{label}</span>
      <span className="font-mono text-xs text-neutral-500">
        {formatColorValue(color, displayFormat)}
      </span>
    </button>
  )
}

export default ColorSwatch
