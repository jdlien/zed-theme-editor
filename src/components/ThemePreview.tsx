/**
 * ThemePreview Component
 * Shows a mini preview of the theme with editor and terminal mockups
 */

import type { ThemeStyle } from '@/types/theme'

interface ThemePreviewProps {
  style: ThemeStyle
  className?: string
}

export function ThemePreview({ style, className = '' }: ThemePreviewProps) {
  // Extract colors with fallbacks
  const editorBg = style['editor.background'] || style.background || '#1e1e1e'
  const editorFg = style['editor.foreground'] || style.text || '#d4d4d4'
  const lineNumber = style['editor.line_number'] || '#858585'
  const activeLineNumber = style['editor.active_line_number'] || '#c6c6c6'
  const activeLine = style['editor.active_line.background'] || 'rgba(255,255,255,0.05)'
  const selection = style['players']?.[0]?.selection || 'rgba(38,79,120,0.5)'

  const terminalBg = style['terminal.background'] || '#000000'
  const terminalFg = style['terminal.foreground'] || '#ffffff'
  const terminalGreen = style['terminal.ansi.green'] || '#4ec9b0'
  const terminalYellow = style['terminal.ansi.yellow'] || '#dcdcaa'
  const terminalBlue = style['terminal.ansi.blue'] || '#569cd6'

  // Syntax colors
  const keyword = style.syntax?.keyword?.color || '#c586c0'
  const string = style.syntax?.string?.color || '#ce9178'
  const variable = style.syntax?.variable?.color || '#9cdcfe'
  const fnName = style.syntax?.function?.color || '#dcdcaa'
  const comment = style.syntax?.comment?.color || '#6a9955'

  return (
    <div className={`rounded-lg border border-neutral-700 bg-neutral-800 p-3 ${className}`}>
      <h3 className="mb-2 text-xs font-medium text-neutral-400">Preview</h3>

      <div className="flex gap-2">
        {/* Editor preview */}
        <div
          className="flex-1 overflow-hidden rounded font-mono text-xs"
          style={{ backgroundColor: editorBg as string }}
        >
          {/* Editor content */}
          <div className="flex">
            {/* Line numbers */}
            <div
              className="select-none px-2 py-1 text-right"
              style={{ color: lineNumber as string }}
            >
              <div>1</div>
              <div style={{ color: activeLineNumber as string }}>2</div>
              <div>3</div>
              <div>4</div>
              <div>5</div>
            </div>

            {/* Code */}
            <div className="flex-1 py-1 pr-2">
              <div style={{ color: comment as string }}>// Theme preview</div>
              <div style={{ backgroundColor: activeLine as string }}>
                <span style={{ color: keyword as string }}>const</span>{' '}
                <span style={{ color: variable as string }}>theme</span>{' '}
                <span style={{ color: editorFg as string }}>=</span>{' '}
                <span style={{ color: string as string }}>"dracula"</span>
              </div>
              <div>
                <span style={{ color: keyword as string }}>function</span>{' '}
                <span style={{ color: fnName as string }}>apply</span>
                <span style={{ color: editorFg as string }}>()</span>{' '}
                <span style={{ color: editorFg as string }}>{'{'}</span>
              </div>
              <div>
                <span style={{ color: editorFg as string }}>{'  '}</span>
                <span style={{ color: keyword as string }}>return</span>{' '}
                <span
                  style={{
                    backgroundColor: selection as string,
                    color: variable as string,
                  }}
                >
                  theme
                </span>
              </div>
              <div style={{ color: editorFg as string }}>{'}'}</div>
            </div>
          </div>
        </div>

        {/* Terminal preview */}
        <div
          className="w-32 overflow-hidden rounded p-2 font-mono text-xs"
          style={{ backgroundColor: terminalBg as string, color: terminalFg as string }}
        >
          <div>
            <span style={{ color: terminalGreen as string }}>$</span> npm run build
          </div>
          <div style={{ color: terminalYellow as string }}>Building...</div>
          <div style={{ color: terminalBlue as string }}>Done in 1.2s</div>
        </div>
      </div>
    </div>
  )
}

export default ThemePreview
