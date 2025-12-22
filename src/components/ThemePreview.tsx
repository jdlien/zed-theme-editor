/**
 * ThemePreview Component
 * Shows a comprehensive preview of the theme resembling a Zed IDE window
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons'
import type { ThemeStyle } from '@/types/theme'

interface ThemePreviewProps {
  style: ThemeStyle
  className?: string
}

export function ThemePreview({ style, className = '' }: ThemePreviewProps) {
  // === UI Chrome Colors ===
  const titleBarBg = style['title_bar.background'] || style.background || '#2d2d2d'
  const tabBarBg = style['tab_bar.background'] || style.background || '#252526'
  const tabActiveBg = style['tab.active_background'] || style['surface.background'] || '#1e1e1e'
  const tabInactiveBg = style['tab.inactive_background'] || 'transparent'
  const toolbarBg = style['toolbar.background'] || style['surface.background'] || '#333333'
  const statusBarBg = style['status_bar.background'] || style.background || '#007acc'
  const panelBg = style['panel.background'] || style.background || '#252526'
  const surfaceBg = style['surface.background'] || style.background || '#1e1e1e'
  const elevatedSurfaceBg = style['elevated_surface.background'] || style['surface.background'] || '#2d2d2d'

  // === Border Colors ===
  const border = style.border || '#404040'
  const borderVariant = style['border.variant'] || '#333333'
  const borderFocused = style['border.focused'] || '#007acc'
  const panelFocusedBorder = style['panel.focused_border'] || borderFocused

  // === Text Colors ===
  const text = style.text || '#cccccc'
  const textMuted = style['text.muted'] || '#808080'
  const textPlaceholder = style['text.placeholder'] || '#5a5a5a'
  const textAccent = style['text.accent'] || '#4fc1ff'

  // === Icon Colors ===
  const icon = style.icon || text
  const iconMuted = style['icon.muted'] || textMuted

  // === Element Colors ===
  const elementBg = style['element.background'] || '#3c3c3c'
  const elementHover = style['element.hover'] || '#4a4a4a'
  const elementActive = style['element.active'] || '#505050'
  const elementSelected = style['element.selected'] || '#094771'
  const ghostElementSelected = style['ghost_element.selected'] || 'rgba(255,255,255,0.12)'

  // === Editor Colors ===
  const editorBg = style['editor.background'] || surfaceBg || '#1e1e1e'
  const editorFg = style['editor.foreground'] || text || '#d4d4d4'
  const gutterBg = style['editor.gutter.background'] || editorBg
  const lineNumber = style['editor.line_number'] || '#858585'
  const activeLineNumber = style['editor.active_line_number'] || '#c6c6c6'
  const activeLine = style['editor.active_line.background'] || 'rgba(255,255,255,0.05)'
  const cursor = style['players']?.[0]?.cursor || '#aeafad'
  const indentGuide = style['editor.indent_guide'] || '#404040'
  const indentGuideActive = style['editor.indent_guide_active'] || '#707070'
  const searchMatch = style['search.match_background'] || 'rgba(234,179,8,0.3)'

  // === Scrollbar Colors ===
  const scrollbarTrack = style['scrollbar.track.background'] || 'transparent'
  const scrollbarThumb = style['scrollbar.thumb.background'] || 'rgba(121,121,121,0.4)'

  // === Terminal Colors ===
  const terminalBg = style['terminal.background'] || '#000000'
  const terminalFg = style['terminal.foreground'] || '#ffffff'
  const terminalBlack = style['terminal.ansi.black'] || '#000000'
  const terminalRed = style['terminal.ansi.red'] || '#cd3131'
  const terminalGreen = style['terminal.ansi.green'] || '#0dbc79'
  const terminalYellow = style['terminal.ansi.yellow'] || '#e5e510'
  const terminalBlue = style['terminal.ansi.blue'] || '#2472c8'
  const terminalMagenta = style['terminal.ansi.magenta'] || '#bc3fbc'
  const terminalCyan = style['terminal.ansi.cyan'] || '#11a8cd'
  const terminalWhite = style['terminal.ansi.white'] || '#e5e5e5'
  const terminalBrightBlack = style['terminal.ansi.bright_black'] || '#666666'
  const terminalBrightRed = style['terminal.ansi.bright_red'] || '#f14c4c'
  const terminalBrightGreen = style['terminal.ansi.bright_green'] || '#23d18b'
  const terminalBrightYellow = style['terminal.ansi.bright_yellow'] || '#f5f543'
  const terminalBrightBlue = style['terminal.ansi.bright_blue'] || '#3b8eea'
  const terminalBrightMagenta = style['terminal.ansi.bright_magenta'] || '#d670d6'
  const terminalBrightCyan = style['terminal.ansi.bright_cyan'] || '#29b8db'
  const terminalBrightWhite = style['terminal.ansi.bright_white'] || '#ffffff'

  // === Status Colors ===
  const errorColor = style.error || '#f14c4c'
  const errorBg = style['error.background'] || 'rgba(241,76,76,0.2)'
  const warningColor = style.warning || '#cca700'
  const warningBg = style['warning.background'] || 'rgba(204,167,0,0.2)'
  const infoColor = style.info || '#3794ff'
  const infoBg = style['info.background'] || 'rgba(55,148,255,0.2)'
  const successColor = style.success || '#89d185'
  const successBg = style['success.background'] || 'rgba(137,209,133,0.2)'
  const hintColor = style.hint || '#6c6c6c'
  const createdColor = style.created || '#73c991'
  const modifiedColor = style.modified || '#e2c08d'
  const deletedColor = style.deleted || '#c74e39'
  const conflictColor = style.conflict || '#e4676b'
  const renamedColor = style.renamed || '#73c991'
  const ignoredColor = style.ignored || '#8c8c8c'
  const hiddenColor = style.hidden || '#5c5c5c'
  const predictiveColor = style.predictive || '#6b6b6b'

  // === Syntax Colors ===
  const keyword = style.syntax?.keyword?.color || '#c586c0'
  const string = style.syntax?.string?.color || '#ce9178'
  const number = style.syntax?.number?.color || '#b5cea8'
  const variable = style.syntax?.variable?.color || '#9cdcfe'
  const fnName = style.syntax?.function?.color || '#dcdcaa'
  const comment = style.syntax?.comment?.color || '#6a9955'
  const type = style.syntax?.type?.color || '#4ec9b0'
  const operator = style.syntax?.operator?.color || editorFg
  const punctuation = style.syntax?.punctuation?.color || editorFg
  const attribute = style.syntax?.attribute?.color || '#9cdcfe'
  const tag = style.syntax?.tag?.color || '#569cd6'
  const link = style.syntax?.['link_uri']?.color || style['link_text.hover'] || '#4fc1ff'
  const boolean = style.syntax?.boolean?.color || '#569cd6'

  return (
    <div className={`p-2 pt-1 ${className}`}>
      <h3 className="mt-0 mb-1 ml-0.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Preview
      </h3>

      {/* Main IDE Window */}
      <div
        className="overflow-hidden rounded-lg text-xs"
        style={{
          backgroundColor: panelBg as string,
          border: `1px solid ${border}`,
        }}
      >
        {/* Title Bar */}
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{
            backgroundColor: titleBarBg as string,
            borderBottom: `1px solid ${borderVariant}`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: errorColor as string }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: warningColor as string }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: successColor as string }} />
            </div>
            <span className="ml-2" style={{ color: textMuted as string }}>Zed Theme Editor</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: iconMuted as string }}>
            <span>◧</span>
            <span>▢</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div
          className="flex items-end gap-px px-1 pt-1"
          style={{
            backgroundColor: tabBarBg as string,
            borderBottom: `1px solid ${borderVariant}`,
          }}
        >
          {/* Active Tab */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-t"
            style={{
              backgroundColor: tabActiveBg as string,
              color: text as string,
              borderTop: `1px solid ${borderVariant}`,
              borderLeft: `1px solid ${borderVariant}`,
              borderRight: `1px solid ${borderVariant}`,
            }}
          >
            <span style={{ color: modifiedColor as string }}>●</span>
            <span>main.tsx</span>
            <span style={{ color: textMuted as string }}>×</span>
          </div>
          {/* Inactive Tab */}
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{
              backgroundColor: tabInactiveBg as string,
              color: textMuted as string,
            }}
          >
            <span>config.json</span>
          </div>
          {/* Another Tab */}
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{
              backgroundColor: tabInactiveBg as string,
              color: textMuted as string,
            }}
          >
            <span style={{ color: createdColor as string }}>●</span>
            <span>utils.ts</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex" style={{ height: '180px' }}>
          {/* Sidebar / Project Panel */}
          <div
            className="w-36 flex-shrink-0 overflow-hidden"
            style={{
              backgroundColor: panelBg as string,
              borderRight: `1px solid ${borderVariant}`,
            }}
          >
            {/* Toolbar */}
            <div
              className="flex items-center gap-1 px-2 py-1"
              style={{
                backgroundColor: toolbarBg as string,
                borderBottom: `1px solid ${borderVariant}`,
                color: icon as string,
              }}
            >
              <span>📁</span>
              <span style={{ color: text as string }}>Project</span>
            </div>

            {/* File Tree */}
            <div className="p-1 font-mono text-[10px]">
              {/* Folder */}
              <div className="flex items-center gap-1 px-1 py-0.5" style={{ color: text as string }}>
                <span>▼</span>
                <span style={{ color: iconMuted as string }}>📁</span>
                <span>src</span>
              </div>
              {/* Active/Selected File */}
              <div
                className="ml-3 flex items-center gap-1 rounded px-1 py-0.5"
                style={{
                  backgroundColor: ghostElementSelected as string,
                  color: text as string,
                }}
              >
                <span style={{ color: type as string }}>📄</span>
                <span>main.tsx</span>
              </div>
              {/* Modified File */}
              <div
                className="ml-3 flex items-center gap-1 px-1 py-0.5"
                style={{ color: modifiedColor as string }}
              >
                <span style={{ color: type as string }}>📄</span>
                <span>config.json</span>
              </div>
              {/* Created File */}
              <div
                className="ml-3 flex items-center gap-1 px-1 py-0.5"
                style={{ color: createdColor as string }}
              >
                <span style={{ color: fnName as string }}>📄</span>
                <span>utils.ts</span>
              </div>
              {/* Deleted File */}
              <div
                className="ml-3 flex items-center gap-1 px-1 py-0.5 line-through"
                style={{ color: deletedColor as string }}
              >
                <span>📄</span>
                <span>old.ts</span>
              </div>
              {/* Ignored File */}
              <div
                className="ml-3 flex items-center gap-1 px-1 py-0.5"
                style={{ color: ignoredColor as string }}
              >
                <span>📄</span>
                <span>.gitignore</span>
              </div>
              {/* Hidden File */}
              <div
                className="ml-3 flex items-center gap-1 px-1 py-0.5"
                style={{ color: hiddenColor as string }}
              >
                <span>📄</span>
                <span>.env</span>
              </div>
            </div>
          </div>

          {/* Editor + Terminal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Editor */}
            <div
              className="flex flex-1 overflow-hidden font-mono"
              style={{ backgroundColor: editorBg as string }}
            >
              {/* Gutter (Line Numbers) */}
              <div
                className="flex-shrink-0 px-1.5 py-1 text-right select-none text-[10px]"
                style={{
                  backgroundColor: gutterBg as string,
                  color: lineNumber as string,
                  borderRight: `1px solid ${borderVariant}`,
                }}
              >
                <div>1</div>
                <div>2</div>
                <div style={{ color: activeLineNumber as string }}>3</div>
                <div>4</div>
                <div>5</div>
                <div>6</div>
                <div>7</div>
                <div>8</div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-hidden py-1 pr-1 text-[10px]">
                {/* Line 1: Import */}
                <div className="px-1">
                  <span style={{ color: keyword as string }}>import</span>{' '}
                  <span style={{ color: punctuation as string }}>{'{'}</span>
                  <span style={{ color: variable as string }}> useState </span>
                  <span style={{ color: punctuation as string }}>{'}'}</span>
                  <span style={{ color: keyword as string }}> from</span>{' '}
                  <span style={{ color: string as string }}>'react'</span>
                </div>

                {/* Line 2: Empty */}
                <div className="px-1">&nbsp;</div>

                {/* Line 3: Active Line with function def */}
                <div
                  className="px-1"
                  style={{ backgroundColor: activeLine as string }}
                >
                  <span style={{ color: keyword as string }}>export function</span>{' '}
                  <span style={{ color: fnName as string }}>App</span>
                  <span style={{ color: punctuation as string }}>()</span>
                  <span style={{ color: punctuation as string }}>:</span>{' '}
                  <span style={{ color: type as string }}>JSX.Element</span>{' '}
                  <span style={{ color: punctuation as string }}>{'{'}</span>
                  {/* Cursor */}
                  <span
                    style={{
                      borderLeft: `2px solid ${cursor}`,
                      marginLeft: '2px',
                    }}
                  />
                </div>

                {/* Line 4: const with type */}
                <div className="px-1">
                  <span style={{ color: indentGuide as string }}>│</span>
                  <span style={{ color: keyword as string }}> const</span>{' '}
                  <span style={{ color: punctuation as string }}>[</span>
                  <span style={{ color: variable as string }}>count</span>
                  <span style={{ color: punctuation as string }}>,</span>{' '}
                  <span style={{ color: fnName as string }}>setCount</span>
                  <span style={{ color: punctuation as string }}>]</span>{' '}
                  <span style={{ color: operator as string }}>=</span>{' '}
                  <span style={{ color: fnName as string }}>useState</span>
                  <span style={{ color: punctuation as string }}>&lt;</span>
                  <span style={{ color: type as string }}>number</span>
                  <span style={{ color: punctuation as string }}>&gt;(</span>
                  <span style={{ color: number as string }}>0</span>
                  <span style={{ color: punctuation as string }}>)</span>
                </div>

                {/* Line 5: const with boolean */}
                <div className="px-1">
                  <span style={{ color: indentGuideActive as string }}>│</span>
                  <span style={{ color: keyword as string }}> const</span>{' '}
                  <span style={{ color: variable as string }}>isActive</span>{' '}
                  <span style={{ color: operator as string }}>=</span>{' '}
                  <span style={{ color: boolean as string }}>true</span>
                </div>

                {/* Line 6: Comment */}
                <div className="px-1">
                  <span style={{ color: indentGuide as string }}>│</span>
                  <span style={{ color: comment as string }}> {'// TODO: Add more features'}</span>
                </div>

                {/* Line 7: Return with JSX */}
                <div className="px-1">
                  <span style={{ color: indentGuide as string }}>│</span>
                  <span style={{ color: keyword as string }}> return</span>{' '}
                  <span style={{ color: punctuation as string }}>&lt;</span>
                  <span style={{ color: tag as string }}>div</span>{' '}
                  <span style={{ color: attribute as string }}>className</span>
                  <span style={{ color: operator as string }}>=</span>
                  <span style={{ color: string as string }}>"app"</span>
                  <span style={{ color: punctuation as string }}>&gt;</span>
                  <span
                    style={{
                      backgroundColor: searchMatch as string,
                      color: variable as string,
                    }}
                  >
                    {'{count}'}
                  </span>
                  <span style={{ color: punctuation as string }}>&lt;/</span>
                  <span style={{ color: tag as string }}>div</span>
                  <span style={{ color: punctuation as string }}>&gt;</span>
                </div>

                {/* Line 8: Close brace */}
                <div className="px-1" style={{ color: punctuation as string }}>{'}'}</div>
              </div>

              {/* Scrollbar */}
              <div
                className="w-2 flex-shrink-0"
                style={{ backgroundColor: scrollbarTrack as string }}
              >
                <div
                  className="mx-0.5 mt-1 h-8 rounded-sm"
                  style={{ backgroundColor: scrollbarThumb as string }}
                />
              </div>
            </div>

            {/* Terminal */}
            <div
              className="flex-shrink-0 font-mono text-[10px]"
              style={{
                backgroundColor: terminalBg as string,
                borderTop: `1px solid ${borderVariant}`,
                height: '60px',
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 px-2 py-0.5"
                style={{
                  backgroundColor: panelBg as string,
                  borderBottom: `1px solid ${borderVariant}`,
                  color: textMuted as string,
                }}
              >
                <span>Terminal</span>
              </div>
              {/* Terminal content */}
              <div className="p-1" style={{ color: terminalFg as string }}>
                <div>
                  <span style={{ color: terminalGreen as string }}>➜</span>{' '}
                  <span style={{ color: terminalCyan as string }}>~/project</span>{' '}
                  <span style={{ color: terminalBlue as string }}>git:(</span>
                  <span style={{ color: terminalRed as string }}>main</span>
                  <span style={{ color: terminalBlue as string }}>)</span>{' '}
                  <span>npm run build</span>
                </div>
                <div>
                  <span style={{ color: terminalBrightBlack as string }}>[</span>
                  <span style={{ color: terminalBrightGreen as string }}>✓</span>
                  <span style={{ color: terminalBrightBlack as string }}>]</span>{' '}
                  <span style={{ color: terminalBrightWhite as string }}>Build</span>{' '}
                  <span style={{ color: terminalBrightGreen as string }}>successful</span>{' '}
                  <span style={{ color: terminalYellow as string }}>in 1.2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div
          className="flex items-center justify-between px-2 py-0.5 text-[10px]"
          style={{
            backgroundColor: statusBarBg as string,
            borderTop: `1px solid ${borderVariant}`,
            color: text as string,
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: infoColor as string }}>
              <FontAwesomeIcon icon={faCodeBranch} className="mr-0.5" aria-hidden="true" />
              main
            </span>
            <span>TypeScript</span>
            <span style={{ color: warningColor as string }}>⚠ 2</span>
            <span style={{ color: errorColor as string }}>✕ 0</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ln 3, Col 42</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>

      {/* Status Color Palette */}
      <div className="mt-2 rounded p-2" style={{ backgroundColor: surfaceBg as string, border: `1px solid ${border}` }}>
        <div className="mb-1 text-[10px]" style={{ color: textMuted as string }}>Status Colors</div>
        <div className="flex flex-wrap gap-1">
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: errorBg as string, color: errorColor as string }}>
            error
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: warningBg as string, color: warningColor as string }}>
            warning
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: infoBg as string, color: infoColor as string }}>
            info
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: successBg as string, color: successColor as string }}>
            success
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${hintColor}22`, color: hintColor as string }}>
            hint
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${createdColor}22`, color: createdColor as string }}>
            created
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${modifiedColor}22`, color: modifiedColor as string }}>
            modified
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${deletedColor}22`, color: deletedColor as string }}>
            deleted
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${conflictColor}22`, color: conflictColor as string }}>
            conflict
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${renamedColor}22`, color: renamedColor as string }}>
            renamed
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${ignoredColor}22`, color: ignoredColor as string }}>
            ignored
          </div>
          <div className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${predictiveColor}22`, color: predictiveColor as string }}>
            predictive
          </div>
        </div>
      </div>

      {/* Terminal ANSI Color Palette */}
      <div className="mt-2 rounded p-2" style={{ backgroundColor: terminalBg as string, border: `1px solid ${border}` }}>
        <div className="mb-1 text-[10px]" style={{ color: terminalFg as string }}>Terminal ANSI Colors</div>
        <div className="grid grid-cols-8 gap-1 text-[9px] font-mono">
          {/* Normal colors */}
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBlack as string, color: terminalWhite as string }}>blk</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalRed as string, color: '#fff' }}>red</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalGreen as string, color: '#000' }}>grn</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalYellow as string, color: '#000' }}>yel</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBlue as string, color: '#fff' }}>blu</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalMagenta as string, color: '#fff' }}>mag</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalCyan as string, color: '#000' }}>cyn</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalWhite as string, color: '#000' }}>wht</div>
          {/* Bright colors */}
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightBlack as string, color: '#fff' }}>B.blk</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightRed as string, color: '#fff' }}>B.red</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightGreen as string, color: '#000' }}>B.grn</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightYellow as string, color: '#000' }}>B.yel</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightBlue as string, color: '#fff' }}>B.blu</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightMagenta as string, color: '#fff' }}>B.mag</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightCyan as string, color: '#000' }}>B.cyn</div>
          <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: terminalBrightWhite as string, color: '#000' }}>B.wht</div>
        </div>
      </div>

      {/* UI Element Samples */}
      <div className="mt-2 rounded p-2" style={{ backgroundColor: surfaceBg as string, border: `1px solid ${border}` }}>
        <div className="mb-1 text-[10px]" style={{ color: textMuted as string }}>UI Elements</div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          {/* Buttons */}
          <button
            className="rounded px-2 py-0.5"
            style={{ backgroundColor: elementBg as string, color: text as string, border: `1px solid ${border}` }}
          >
            Button
          </button>
          <button
            className="rounded px-2 py-0.5"
            style={{ backgroundColor: elementHover as string, color: text as string, border: `1px solid ${border}` }}
          >
            Hover
          </button>
          <button
            className="rounded px-2 py-0.5"
            style={{ backgroundColor: elementActive as string, color: text as string, border: `1px solid ${border}` }}
          >
            Active
          </button>
          <button
            className="rounded px-2 py-0.5"
            style={{ backgroundColor: elementSelected as string, color: text as string, border: `1px solid ${borderFocused}` }}
          >
            Selected
          </button>
          {/* Text samples */}
          <span style={{ color: text as string }}>Text</span>
          <span style={{ color: textMuted as string }}>Muted</span>
          <span style={{ color: textPlaceholder as string }}>Placeholder</span>
          <span style={{ color: textAccent as string }}>Accent</span>
          <a href="#" style={{ color: link as string, textDecoration: 'underline' }}>Link</a>
        </div>
      </div>

      {/* Elevated Surface Sample */}
      <div className="mt-2 flex gap-2">
        <div className="flex-1 rounded p-2 text-[10px]" style={{ backgroundColor: panelBg as string, border: `1px solid ${border}`, color: text as string }}>
          <div style={{ color: textMuted as string }}>Panel</div>
        </div>
        <div className="flex-1 rounded p-2 text-[10px]" style={{ backgroundColor: elevatedSurfaceBg as string, border: `1px solid ${border}`, color: text as string }}>
          <div style={{ color: textMuted as string }}>Elevated</div>
        </div>
        <div
          className="flex-1 rounded p-2 text-[10px]"
          style={{
            backgroundColor: surfaceBg as string,
            border: `1px solid ${panelFocusedBorder}`,
            color: text as string,
          }}
        >
          <div style={{ color: textMuted as string }}>Focused</div>
        </div>
      </div>
    </div>
  )
}

export default ThemePreview
