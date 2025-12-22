/**
 * Tooltip Component
 * Single tooltip element that positions dynamically on hover
 * Uses data attributes to avoid rendering 100+ tooltip elements
 */

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

// ============================================================================
// Tooltip Context - Single tooltip instance for the entire app
// ============================================================================

interface TooltipState {
  content: string
  x: number
  y: number
  visible: boolean
  muted: boolean
}

interface TooltipContextValue {
  show: (content: string, rect: DOMRect, muted?: boolean) => void
  hide: () => void
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TooltipState>({
    content: '',
    x: 0,
    y: 0,
    visible: false,
    muted: false,
  })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((content: string, rect: DOMRect, muted = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setState({
        content,
        // Position to the right of the element
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
        visible: true,
        muted,
      })
    }, 50)
  }, [])

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      {createPortal(
        <div
          role="tooltip"
          className={`
            pointer-events-none fixed z-[9999] max-w-xs
            rounded-md px-2.5 py-1.5 shadow-lg
            text-xs leading-relaxed
            bg-neutral-800 border border-neutral-600
            dark:bg-neutral-700 dark:border-neutral-500
            transition-opacity duration-100 ease-out
            ${state.muted ? 'text-neutral-400 italic' : 'text-neutral-100'}
            ${state.visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          style={{
            left: state.x,
            top: state.y,
            transform: 'translateY(-50%)',
          }}
        >
          {state.content}
        </div>,
        document.body
      )}
    </TooltipContext.Provider>
  )
}

// ============================================================================
// Tooltip trigger component
// ============================================================================

export interface TooltipProps {
  /** The content to show in the tooltip */
  content?: string
  /** The element to attach the tooltip to */
  children: React.ReactNode
  /** Position preference (currently only 'right' is implemented) */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Use muted/subdued text styling */
  muted?: boolean
  /** Additional class for the wrapper */
  className?: string
}

export function Tooltip({
  content,
  children,
  muted = false,
  className = '',
}: TooltipProps) {
  const context = useContext(TooltipContext)
  const ref = useRef<HTMLDivElement>(null)

  // If no context (provider not set up) or no content, just render children with title fallback
  if (!context || !content) {
    return (
      <div className={className} title={content}>
        {children}
      </div>
    )
  }

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      context.show(content, rect, muted)
    }
  }

  const handleMouseLeave = () => {
    context.hide()
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

export default Tooltip
