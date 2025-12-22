/**
 * JsonEditorPanel Component
 * CodeMirror 6 editor with JSON syntax highlighting and inline color swatches
 */

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { EditorState, StateEffect, StateField } from '@codemirror/state'
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  ViewUpdate,
  keymap,
} from '@codemirror/view'
import { json } from '@codemirror/lang-json'
import {
  editorThemes,
  getDefaultTheme,
  type EditorThemeName,
} from '@/lib/editorThemes'
import { toRgb } from '@/lib/colorConversion'
import { normalizeColorPath } from '@/lib/jsonParsing'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  foldGutter,
  indentOnInput,
  bracketMatching,
  foldKeymap,
  syntaxTree,
  foldEffect,
  unfoldEffect,
  ensureSyntaxTree,
} from '@codemirror/language'
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view'

// ============================================================================
// Types
// ============================================================================

export interface JsonEditorPanelProps {
  /** JSON content to display */
  content: string
  /** Called when content changes (only if readOnly is false) */
  onChange?: (content: string) => void
  /** Called when a color is clicked */
  onColorClick?: (path: string, color: string, position: number) => void
  /** Currently selected color path */
  selectedColorPath?: string | null
  /** Whether to use dark theme (used for default theme selection) */
  isDarkMode?: boolean
  /** Editor color theme name */
  editorTheme?: EditorThemeName
  /** Whether the editor is read-only (default: true to prevent data loss) */
  readOnly?: boolean
  /** Original colors map for before/after comparison */
  originalColors?: Map<string, string>
  /** Additional CSS classes */
  className?: string
  /** Active theme index for auto-folding inactive themes in multi-theme files */
  activeThemeIndex?: number
}

export interface JsonEditorPanelHandle {
  /** Scroll the editor to show the color at the given path */
  scrollToColorPath: (path: string) => void
}

interface ColorMatch {
  from: number
  to: number
  color: string
  key: string
}

// ============================================================================
// Color Swatch Widget
// ============================================================================

class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly color: string,
    readonly path: string,
    readonly onClick?: (path: string, color: string, position: number) => void,
    readonly position: number = 0,
    readonly isSelected: boolean = false,
    readonly originalColor?: string
  ) {
    super()
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span')
    wrapper.className = 'cm-color-swatch-wrapper'
    wrapper.style.cssText =
      'display: inline-flex; margin-left: 4px; vertical-align: -2px;'

    const hasChanged = this.originalColor && this.originalColor !== this.color
    const swatchWidth = hasChanged ? 28 : 14

    const swatch = document.createElement('span')
    swatch.className = `cm-color-swatch ${this.isSelected ? 'cm-color-swatch-selected' : ''}`
    swatch.style.cssText = `
      display: inline-flex;
      box-sizing: border-box;
      width: ${swatchWidth}px;
      height: 14px;
      border-radius: 3px;
      overflow: hidden;
      cursor: pointer;
      vertical-align: middle;
      box-shadow: ${this.isSelected ? '0 0 0 2px #3b82f6' : 'none'};
      transition: box-shadow 0.15s ease;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `

    if (hasChanged) {
      // Split view: original on left, current on right using gradient
      swatch.style.background = `linear-gradient(to right, ${this.originalColor} 50%, ${this.color} 50%)`
      swatch.title = `${this.path}: ${this.originalColor} → ${this.color}`
    } else {
      // Single color
      swatch.style.backgroundColor = this.color
      swatch.title = `${this.path}: ${this.color}`
    }

    if (this.onClick) {
      const onClickHandler = this.onClick
      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        onClickHandler(this.path, this.color, this.position)
      }
      swatch.addEventListener('mousedown', handleClick)
    }

    wrapper.appendChild(swatch)
    return wrapper
  }

  eq(other: ColorSwatchWidget): boolean {
    return (
      other.color === this.color &&
      other.path === this.path &&
      other.isSelected === this.isSelected &&
      other.onClick === this.onClick &&
      other.originalColor === this.originalColor
    )
  }

  ignoreEvent(event: Event): boolean {
    // Return true for mouse events to let our widget handle them, not CodeMirror
    const eventType = event.type
    return (
      eventType === 'mousedown' ||
      eventType === 'mouseup' ||
      eventType === 'click'
    )
  }
}

// ============================================================================
// Color Detection and Path Building
// ============================================================================

/**
 * Find all color values in JSON content with their keys
 * Matches hex, rgb, hsl, and oklch formats
 */
function findColors(content: string): ColorMatch[] {
  const colors: ColorMatch[] = []

  // Define patterns for each color format in JSON property context: "key": "color"
  // Each pattern captures: [1] = key, [2] = color value
  const propertyPatterns = [
    // Hex colors: "#RGB", "#RRGGBB", "#RRGGBBAA"
    /"([^"]+)":\s*"(#[0-9A-Fa-f]{3,8})"/g,
    // RGB: rgb(r, g, b) or rgba(r, g, b, a)
    /"([^"]+)":\s*"(rgba?\([^)]+\))"/g,
    // HSL: hsl(...) or hsla(...)
    /"([^"]+)":\s*"(hsla?\([^)]+\))"/g,
    // OKLCH: oklch(...)
    /"([^"]+)":\s*"(oklch\([^)]+\))"/g,
  ]

  // Process each pattern
  for (const pattern of propertyPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1]
      const color = match[2]
      const fullMatch = match[0]
      const colorIndex = fullMatch.lastIndexOf(color)
      const colorStart = match.index + colorIndex
      const colorEnd = colorStart + color.length

      // Avoid duplicates
      const isDuplicate = colors.some(
        (c) => c.from === colorStart && c.to === colorEnd
      )
      if (!isDuplicate) {
        colors.push({
          from: colorStart,
          to: colorEnd,
          color,
          key,
        })
      }
    }
  }

  // Define patterns for colors in arrays: ["#RRGGBB", "rgb(...)", etc.]
  const arrayPatterns = [
    /(?:[\[,]\s*)"(#[0-9A-Fa-f]{3,8})"/g,
    /(?:[\[,]\s*)"(rgba?\([^)]+\))"/g,
    /(?:[\[,]\s*)"(hsla?\([^)]+\))"/g,
    /(?:[\[,]\s*)"(oklch\([^)]+\))"/g,
  ]

  for (const pattern of arrayPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const color = match[1]
      const colorStart = match.index + match[0].indexOf(color)
      const colorEnd = colorStart + color.length

      // Avoid duplicates
      const isDuplicate = colors.some(
        (c) => c.from === colorStart && c.to === colorEnd
      )
      if (!isDuplicate) {
        colors.push({
          from: colorStart,
          to: colorEnd,
          color,
          key: 'array-element',
        })
      }
    }
  }

  // Sort by position
  colors.sort((a, b) => a.from - b.from)

  return colors
}

/**
 * Build full JSON path for a position in the document
 * Returns path like "style/editor.background" or "style/syntax/keyword/color"
 * Includes array indices like "[0]" for items in arrays
 */
function buildJsonPath(content: string, position: number): string {
  const segments: string[] = []
  const contextStack: Array<
    { type: 'object'; expectingKey: boolean } | { type: 'array'; index: number }
  > = []
  const valueStack: number[] = []

  let inString = false
  let stringIsKey = false
  let keyStart = -1
  let pendingKey: string | null = null
  let inPrimitive = false

  const currentContext = () => contextStack[contextStack.length - 1]

  const startValue = () => {
    const restoreLength = segments.length
    if (pendingKey) {
      segments.push(pendingKey)
      pendingKey = null
    }
    const ctx = currentContext()
    if (ctx && ctx.type === 'array') {
      segments.push(`[${ctx.index}]`)
    }
    valueStack.push(restoreLength)
  }

  const endValue = () => {
    const restoreLength = valueStack.pop()
    if (restoreLength !== undefined) {
      segments.length = restoreLength
    }
  }

  for (let i = 0; i < position && i < content.length; i++) {
    const char = content[i]

    if (inString) {
      if (char === '\\' && i + 1 < content.length) {
        i++
        continue
      }
      if (char === '"') {
        inString = false
        if (stringIsKey) {
          pendingKey = parseJsonString(content.slice(keyStart, i))
          const ctx = currentContext()
          if (ctx && ctx.type === 'object') {
            ctx.expectingKey = false
          }
        } else {
          endValue()
        }
      }
      continue
    }

    if (inPrimitive) {
      if (char === ',' || char === '}' || char === ']') {
        inPrimitive = false
        endValue()
      } else {
        continue
      }
    }

    if (char === '"') {
      const ctx = currentContext()
      stringIsKey = !!(ctx && ctx.type === 'object' && ctx.expectingKey)
      if (!stringIsKey) {
        startValue()
      }
      inString = true
      keyStart = i + 1
    } else if (char === '{') {
      startValue()
      contextStack.push({ type: 'object', expectingKey: true })
    } else if (char === '[') {
      startValue()
      contextStack.push({ type: 'array', index: 0 })
    } else if (char === '}') {
      contextStack.pop()
      endValue()
    } else if (char === ']') {
      contextStack.pop()
      endValue()
    } else if (char === ',') {
      const ctx = currentContext()
      if (ctx && ctx.type === 'array') {
        ctx.index += 1
      } else if (ctx && ctx.type === 'object') {
        ctx.expectingKey = true
      }
      pendingKey = null
    } else if (
      char === '-' ||
      (char >= '0' && char <= '9') ||
      char === 't' ||
      char === 'f' ||
      char === 'n'
    ) {
      startValue()
      inPrimitive = true
    }
  }

  if (pendingKey) {
    segments.push(pendingKey)
  }

  return segments.join('/')
}

/**
 * Parse a JSON string value, handling escape sequences
 */
function parseJsonString(str: string): string {
  try {
    // Use JSON.parse to properly handle escape sequences
    return JSON.parse(`"${str}"`)
  } catch {
    // If parsing fails, return as-is
    return str
  }
}

// ============================================================================
// Theme Folding
// ============================================================================

/**
 * Find the character ranges of each theme object in the "themes" array
 * Uses CodeMirror's syntax tree for reliable boundary detection
 * Returns "inside" ranges (content between braces) so folding shows {…}
 */
function findThemeRanges(
  state: EditorState
): Array<{ from: number; to: number }> {
  const tree = syntaxTree(state)
  const ranges: Array<{ from: number; to: number }> = []
  const doc = state.doc.toString()

  // Walk the syntax tree to find the "themes" property
  tree.iterate({
    enter: (node) => {
      if (node.name === 'Property') {
        // Get the property name node
        const propNameNode = node.node.getChild('PropertyName')
        if (propNameNode) {
          // Extract the property name (strip quotes)
          const propName = doc.slice(propNameNode.from + 1, propNameNode.to - 1)
          if (propName === 'themes') {
            // Get the Array value
            const arrayNode = node.node.getChild('Array')
            if (arrayNode) {
              // Collect all Object children (each theme)
              let child = arrayNode.firstChild
              while (child) {
                if (child.name === 'Object') {
                  // Use "inside" range: after { and before }
                  // This makes folding show {…} instead of just …
                  const innerFrom = child.from + 1 // after {
                  const innerTo = child.to - 1 // before }
                  if (innerTo > innerFrom) {
                    ranges.push({ from: innerFrom, to: innerTo })
                  }
                }
                child = child.nextSibling
              }
            }
            return false // Stop traversal, we found themes
          }
        }
      }
    },
  })

  return ranges
}

/**
 * Fold inactive themes and unfold the active theme
 * This is called when the active theme index changes
 */
function foldInactiveThemes(view: EditorView, activeIndex: number): void {
  // Ensure syntax tree is fully parsed before trying to find theme ranges
  // Wait up to 1 second for large files
  const tree = ensureSyntaxTree(view.state, view.state.doc.length, 1000)
  if (!tree) {
    // Syntax tree not ready, try again shortly
    setTimeout(() => foldInactiveThemes(view, activeIndex), 100)
    return
  }

  const ranges = findThemeRanges(view.state)

  // Guard: need at least 2 themes to fold
  if (ranges.length < 2) return

  const effects: StateEffect<{ from: number; to: number }>[] = []

  ranges.forEach((range, index) => {
    if (index === activeIndex) {
      // Unfold active theme
      effects.push(unfoldEffect.of(range))
    } else {
      // Fold inactive themes
      effects.push(foldEffect.of(range))
    }
  })

  if (effects.length > 0) {
    view.dispatch({ effects })
  }
}

// ============================================================================
// CodeMirror Extensions
// ============================================================================

interface DecorationConfig {
  colors: ColorMatch[]
  selectedPath: string | null
  onClick?: (path: string, color: string, position: number) => void
  docContent: string
  originalColors?: Map<string, string>
}

const setColorDecorations = StateEffect.define<DecorationConfig>()

const colorDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setColorDecorations)) {
        const { colors, selectedPath, onClick, docContent, originalColors } =
          effect.value
        const widgets = colors.map((c) => {
          const fullPath = buildJsonPath(docContent, c.from)
          // Normalize the path for comparison (selectedPath is already normalized)
          const { path: normalizedPath } = normalizeColorPath(fullPath)
          const isSelected =
            normalizedPath === selectedPath || c.key === selectedPath
          // Look up original color for this path
          const originalColor = originalColors?.get(normalizedPath)

          // Compare colors using RGB values with tolerance to account for
          // rounding errors when converting between formats (especially HSL)
          let displayOriginalColor: string | undefined = originalColor
          if (originalColor) {
            const currentRgb = toRgb(c.color)
            const originalRgb = toRgb(originalColor)
            // Allow ±3 tolerance per channel for rounding errors
            const isMatch =
              Math.abs(currentRgb.r - originalRgb.r) <= 3 &&
              Math.abs(currentRgb.g - originalRgb.g) <= 3 &&
              Math.abs(currentRgb.b - originalRgb.b) <= 3 &&
              Math.abs(currentRgb.alpha - originalRgb.alpha) < 0.02
            if (isMatch) {
              // Same color (within rounding tolerance) - don't show as changed
              displayOriginalColor = undefined
            }
          }

          return Decoration.widget({
            widget: new ColorSwatchWidget(
              c.color,
              fullPath,
              onClick,
              c.from,
              isSelected,
              displayOriginalColor
            ),
            side: 1,
          }).range(c.to)
        })
        return Decoration.set(widgets, true)
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

// ============================================================================
// Base Editor Styles (layout, not colors)
// ============================================================================

const baseEditorStyles = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
  },
  '.cm-scroller': {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '8px 0',
  },
  '.cm-line': {
    padding: '0 8px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
  },
})

// ============================================================================
// Main Component
// ============================================================================

/**
 * CodeMirror integration component.
 * Testing requires a real browser environment (Playwright/Cypress) because:
 * - CodeMirror creates complex DOM structures that jsdom doesn't fully support
 * - Editor lifecycle (create/destroy) depends on actual DOM measurements
 * - Scroll position and selection APIs require real layout
 */
/* v8 ignore start -- CodeMirror requires real browser for testing */
export const JsonEditorPanel = forwardRef<
  JsonEditorPanelHandle,
  JsonEditorPanelProps
>(function JsonEditorPanel(
  {
    content,
    onChange,
    onColorClick,
    selectedColorPath,
    isDarkMode = true,
    editorTheme,
    readOnly = true,
    originalColors,
    className = '',
    activeThemeIndex,
  },
  ref
) {
  // Resolve the theme to use
  const themeName = editorTheme ?? getDefaultTheme(isDarkMode)
  const themeConfig = editorThemes[themeName]
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onColorClickRef = useRef(onColorClick)
  const originalColorsRef = useRef(originalColors)

  // Keep refs updated
  onChangeRef.current = onChange
  onColorClickRef.current = onColorClick
  originalColorsRef.current = originalColors

  // Expose scroll method via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToColorPath: (path: string) => {
        const view = viewRef.current
        if (!view) return

        const docContent = view.state.doc.toString()
        const colors = findColors(docContent)

        // Find the color that matches this path
        for (const color of colors) {
          const fullPath = buildJsonPath(docContent, color.from)
          const { path: normalizedPath } = normalizeColorPath(fullPath)

          if (normalizedPath === path) {
            // Set cursor position to the color value start
            // This also sets the active line highlight
            view.dispatch({
              selection: { anchor: color.from },
              effects: EditorView.scrollIntoView(color.from, { y: 'center' }),
            })
            // Focus the editor so the cursor is visible
            view.focus()
            break
          }
        }
      },
    }),
    []
  )

  // Update color decorations
  const updateDecorations = useCallback(
    (view: EditorView) => {
      const docContent = view.state.doc.toString()
      const colors = findColors(docContent)
      view.dispatch({
        effects: setColorDecorations.of({
          colors,
          selectedPath: selectedColorPath || null,
          onClick: onColorClickRef.current,
          docContent,
          originalColors: originalColorsRef.current,
        }),
      })
    },
    [selectedColorPath]
  )

  // Initialize CodeMirror
  // Note: updateDecorations is intentionally excluded from deps to avoid recreating
  // the editor on every selection change. Decoration updates are handled separately.
  useEffect(() => {
    if (!containerRef.current) return

    // Create a local update function that doesn't depend on selectedColorPath
    const updateDecorationsLocal = (view: EditorView) => {
      const docContent = view.state.doc.toString()
      const colors = findColors(docContent)
      view.dispatch({
        effects: setColorDecorations.of({
          colors,
          selectedPath: null, // Initial state, will be updated by separate effect
          onClick: onColorClickRef.current,
          docContent,
          originalColors: originalColorsRef.current,
        }),
      })
    }

    const updateListener = EditorView.updateListener.of(
      (update: ViewUpdate) => {
        if (update.docChanged && onChangeRef.current) {
          const newContent = update.state.doc.toString()
          onChangeRef.current(newContent)
          // Update decorations after content change
          updateDecorationsLocal(update.view)
        }
      }
    )

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      foldGutter(),
      bracketMatching(),
      colorDecorationsField,
      json(),
      keymap.of([...foldKeymap]),
      updateListener,
      baseEditorStyles,
      themeConfig.extension,
      // Read-only mode by default to prevent accidental edits
      EditorState.readOnly.of(readOnly),
      // Only include editing features if not read-only
      ...(!readOnly
        ? [
            history(),
            indentOnInput(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
          ]
        : []),
    ]

    const state = EditorState.create({
      doc: content,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    // Initial decoration update
    updateDecorationsLocal(view)

    // Initial fold of inactive themes (function handles waiting for syntax tree)
    if (activeThemeIndex !== undefined) {
      foldInactiveThemes(view, activeThemeIndex)
    }

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [themeName, readOnly]) // Recreate only on theme or readOnly change

  // Update content when it changes externally
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      // Preserve scroll position and selection
      const scrollTop = view.scrollDOM.scrollTop
      const selection = view.state.selection

      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
        // Try to preserve selection if it's still valid
        selection: selection.main.to <= content.length ? selection : undefined,
      })

      // Restore scroll position after DOM update
      requestAnimationFrame(() => {
        view.scrollDOM.scrollTop = scrollTop
      })

      updateDecorations(view)
    }
  }, [content, updateDecorations])

  // Update decorations when selected path or originalColors changes
  useEffect(() => {
    const view = viewRef.current
    if (view) {
      updateDecorations(view)
    }
  }, [selectedColorPath, updateDecorations, originalColors])

  // Auto-fold inactive themes when active theme changes
  useEffect(() => {
    const view = viewRef.current
    if (!view || activeThemeIndex === undefined) return

    // Small delay to ensure syntax tree is ready after content changes
    const timeoutId = setTimeout(() => {
      foldInactiveThemes(view, activeThemeIndex)
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [activeThemeIndex, content])

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-hidden border-0 border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
      data-testid="json-editor-panel"
    />
  )
})
/* v8 ignore stop */

export default JsonEditorPanel
