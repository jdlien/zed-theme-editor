/**
 * Tooltip Component
 * Uses CSS Anchor Positioning API for modern browsers with native title fallback
 */

import { useId, useState, useRef, useEffect } from 'react'

export interface TooltipProps {
  /** The content to show in the tooltip */
  content?: string
  /** The element to attach the tooltip to */
  children: React.ReactNode
  /** Position preference */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Additional class for the wrapper */
  className?: string
}

// Check if anchor positioning is supported (cached)
let anchorSupported: boolean | null = null
function isAnchorPositioningSupported(): boolean {
  if (anchorSupported === null) {
    anchorSupported =
      typeof CSS !== 'undefined' && CSS.supports && CSS.supports('anchor-name', '--test')
  }
  return anchorSupported
}

export function Tooltip({
  content,
  children,
  position = 'right',
  className = '',
}: TooltipProps) {
  const id = useId()
  const anchorName = `--tooltip-${id.replace(/:/g, '')}`
  const [isVisible, setIsVisible] = useState(false)
  const [supportsAnchor] = useState(isAnchorPositioningSupported)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // If no content, just render children
  if (!content) {
    return <>{children}</>
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), 400)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  // Position styles for the tooltip
  const getPositionStyles = (): React.CSSProperties => {
    if (!supportsAnchor) return {}

    const styles: Record<string, React.CSSProperties> = {
      top: {
        positionAnchor: anchorName,
        bottom: `anchor(top)`,
        left: `anchor(center)`,
        translate: '-50% -6px',
      } as React.CSSProperties,
      bottom: {
        positionAnchor: anchorName,
        top: `anchor(bottom)`,
        left: `anchor(center)`,
        translate: '-50% 6px',
      } as React.CSSProperties,
      left: {
        positionAnchor: anchorName,
        right: `anchor(left)`,
        top: `anchor(center)`,
        translate: '-6px -50%',
      } as React.CSSProperties,
      right: {
        positionAnchor: anchorName,
        left: `anchor(right)`,
        top: `anchor(center)`,
        translate: '6px -50%',
      } as React.CSSProperties,
    }
    return styles[position]
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Anchor element - with native title fallback */}
      <div
        style={supportsAnchor ? ({ anchorName } as React.CSSProperties) : undefined}
        title={!supportsAnchor ? content : undefined}
      >
        {children}
      </div>

      {/* Tooltip - only rendered when anchor positioning is supported */}
      {supportsAnchor && isVisible && (
        <div
          role="tooltip"
          className="
            pointer-events-none fixed z-[9999] max-w-xs
            rounded-md bg-neutral-800 px-2.5 py-1.5
            text-xs leading-relaxed text-neutral-100 shadow-lg
            dark:bg-neutral-200 dark:text-neutral-900
          "
          style={{
            position: 'fixed',
            ...getPositionStyles(),
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
