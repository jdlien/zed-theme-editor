/**
 * JsonEditorPanel Component
 * CodeMirror 6 editor with JSON syntax highlighting and inline color swatches
 */

import { useEffect, useRef, useCallback } from 'react'
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
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  foldGutter,
  indentOnInput,
  bracketMatching,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language'
import { lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view'
import { isValidHex } from '@/lib/colorConversion'

// ============================================================================
// Types
// ============================================================================

export interface JsonEditorPanelProps {
  /** JSON content to display */
  content: string
  /** Called when content changes */
  onChange: (content: string) => void
  /** Called when a color is clicked */
  onColorClick?: (path: string, color: string, position: number) => void
  /** Currently selected color path */
  selectedColorPath?: string | null
  /** Whether to use dark theme */
  isDarkMode?: boolean
  /** Additional CSS classes */
  className?: string
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
    readonly isSelected: boolean = false
  ) {
    super()
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span')
    wrapper.className = 'cm-color-swatch-wrapper'
    wrapper.style.cssText = 'display: inline-flex; align-items: center; margin-left: 4px;'

    const swatch = document.createElement('span')
    swatch.className = `cm-color-swatch ${this.isSelected ? 'cm-color-swatch-selected' : ''}`
    swatch.style.cssText = `
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 3px;
      background-color: ${this.color};
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      vertical-align: middle;
      box-shadow: ${this.isSelected ? '0 0 0 2px #3b82f6' : 'none'};
      transition: box-shadow 0.15s ease;
    `
    swatch.title = `${this.path}: ${this.color}`

    if (this.onClick) {
      swatch.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.onClick!(this.path, this.color, this.position)
      })
    }

    wrapper.appendChild(swatch)
    return wrapper
  }

  eq(other: ColorSwatchWidget): boolean {
    return (
      other.color === this.color &&
      other.path === this.path &&
      other.isSelected === this.isSelected
    )
  }

  ignoreEvent(): boolean {
    return false
  }
}

// ============================================================================
// Color Detection and Path Building
// ============================================================================

/**
 * Find all hex color values in JSON content with their keys
 * Matches both object properties and array elements
 */
function findColors(content: string): ColorMatch[] {
  const colors: ColorMatch[] = []

  // Match hex colors in JSON string values: "key": "#RRGGBB" or "#RGB"
  const hexPattern = /"([^"]+)":\s*"(#[0-9A-Fa-f]{3,8})"/g
  let match
  while ((match = hexPattern.exec(content)) !== null) {
    const key = match[1]
    const color = match[2]

    if (isValidHex(color)) {
      const fullMatch = match[0]
      const colorIndex = fullMatch.lastIndexOf(color)
      const colorStart = match.index + colorIndex
      const colorEnd = colorStart + color.length

      colors.push({
        from: colorStart,
        to: colorEnd,
        color: color.toUpperCase(),
        key,
      })
    }
  }

  // Match hex colors in arrays: ["#RRGGBB", "#RGB"]
  // This catches colors in accents array and similar
  const arrayColorPattern = /(?:[\[,]\s*)"(#[0-9A-Fa-f]{3,8})"/g
  while ((match = arrayColorPattern.exec(content)) !== null) {
    const color = match[1]

    if (isValidHex(color)) {
      const colorStart = match.index + match[0].indexOf(color)
      const colorEnd = colorStart + color.length

      // Avoid duplicates (in case a pattern matched both)
      const isDuplicate = colors.some(
        (c) => c.from === colorStart && c.to === colorEnd
      )
      if (!isDuplicate) {
        colors.push({
          from: colorStart,
          to: colorEnd,
          color: color.toUpperCase(),
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
  let inString = false
  let currentKey = ''
  let keyStart = -1
  // Stack to track context: each entry is either -1 (object) or array index (>=0)
  const contextStack: number[] = []

  for (let i = 0; i < position && i < content.length; i++) {
    const char = content[i]

    // Handle escaped characters in strings
    if (inString) {
      if (char === '\\' && i + 1 < content.length) {
        // Skip the next character (escaped)
        i++
        continue
      }
      if (char === '"') {
        inString = false
        // Check if this is a key (followed by :)
        const rest = content.slice(i + 1).trimStart()
        if (rest.startsWith(':')) {
          currentKey = parseJsonString(content.slice(keyStart, i))
        }
      }
      continue
    }

    // Not in string
    if (char === '"') {
      inString = true
      keyStart = i + 1
    } else if (char === '{') {
      if (currentKey) {
        segments.push(currentKey)
        currentKey = ''
      }
      contextStack.push(-1) // Object context
    } else if (char === '[') {
      if (currentKey) {
        segments.push(currentKey)
        currentKey = ''
      }
      contextStack.push(0) // Array context, starting at index 0
    } else if (char === '}') {
      contextStack.pop()
      // Pop segments to match current depth
      while (segments.length > contextStack.length) {
        segments.pop()
      }
    } else if (char === ']') {
      contextStack.pop()
      // Pop segments to match current depth
      while (segments.length > contextStack.length) {
        segments.pop()
      }
    } else if (char === ',') {
      // Increment array index if we're in an array
      const lastContext = contextStack[contextStack.length - 1]
      if (lastContext !== undefined && lastContext >= 0) {
        contextStack[contextStack.length - 1] = lastContext + 1
      }
      currentKey = ''
    }
  }

  if (currentKey) {
    segments.push(currentKey)
  }

  // Build the final path with array indices where appropriate
  const result: string[] = []
  let segmentIdx = 0
  for (let i = 0; i < contextStack.length && segmentIdx < segments.length; i++) {
    const ctx = contextStack[i]
    if (ctx >= 0) {
      // This was an array - include the index
      result.push(`[${ctx}]`)
    }
    if (segmentIdx < segments.length) {
      result.push(segments[segmentIdx])
      segmentIdx++
    }
  }
  // Add remaining segments
  while (segmentIdx < segments.length) {
    result.push(segments[segmentIdx])
    segmentIdx++
  }

  return result.join('/')
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
// CodeMirror Extensions
// ============================================================================

interface DecorationConfig {
  colors: ColorMatch[]
  selectedPath: string | null
  onClick?: (path: string, color: string, position: number) => void
  docContent: string
}

const setColorDecorations = StateEffect.define<DecorationConfig>()

const colorDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setColorDecorations)) {
        const { colors, selectedPath, onClick, docContent } = effect.value
        const widgets = colors.map((c) => {
          const fullPath = buildJsonPath(docContent, c.from)
          const isSelected = fullPath === selectedPath || c.key === selectedPath
          return Decoration.widget({
            widget: new ColorSwatchWidget(c.color, fullPath, onClick, c.from, isSelected),
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
// Theme
// ============================================================================

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '8px 0',
  },
  '.cm-line': {
    padding: '0 8px',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
  },
})

// ============================================================================
// Main Component
// ============================================================================

export function JsonEditorPanel({
  content,
  onChange,
  onColorClick,
  selectedColorPath,
  isDarkMode = true,
  className = '',
}: JsonEditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onColorClickRef = useRef(onColorClick)

  // Keep refs updated
  onChangeRef.current = onChange
  onColorClickRef.current = onColorClick

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
        }),
      })
    },
    [selectedColorPath]
  )

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString()
        onChangeRef.current(newContent)
        // Update decorations after content change
        updateDecorations(update.view)
      }
    })

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      foldGutter(),
      indentOnInput(),
      bracketMatching(),
      colorDecorationsField,
      json(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
      updateListener,
      editorTheme,
      ...(isDarkMode
        ? [oneDark, syntaxHighlighting(defaultHighlightStyle, { fallback: true })]
        : [syntaxHighlighting(defaultHighlightStyle)]),
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
    updateDecorations(view)

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [isDarkMode]) // Only recreate on theme change

  // Update content when it changes externally
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
      updateDecorations(view)
    }
  }, [content, updateDecorations])

  // Update decorations when selected path changes
  useEffect(() => {
    const view = viewRef.current
    if (view) {
      updateDecorations(view)
    }
  }, [selectedColorPath, updateDecorations])

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 ${className}`}
      data-testid="json-editor-panel"
    />
  )
}

export default JsonEditorPanel
