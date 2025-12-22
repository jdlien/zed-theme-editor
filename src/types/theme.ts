/**
 * Zed Theme Types
 * Based on https://zed.dev/schema/themes/v0.2.0.json
 */

export type Appearance = 'light' | 'dark'
export type BackgroundAppearance = 'opaque' | 'transparent' | 'blurred'
export type FontStyle = 'normal' | 'italic' | 'oblique'
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

/** Hex color string (e.g., "#RRGGBB" or "#RRGGBBAA") or null */
export type ColorValue = string | null

/** Highlight style for syntax tokens */
export interface HighlightStyle {
  color?: ColorValue
  background_color?: ColorValue
  font_style?: FontStyle | null
  font_weight?: FontWeight | null
}

/** Player colors for multiplayer/collaboration */
export interface PlayerColor {
  background?: ColorValue
  cursor?: ColorValue
  selection?: ColorValue
}

/** Theme style properties - all the color variables */
export interface ThemeStyle {
  // Background appearance
  'background.appearance'?: BackgroundAppearance

  // Accent colors
  accents?: (string | null)[]

  // Backgrounds
  background?: ColorValue
  'surface.background'?: ColorValue
  'elevated_surface.background'?: ColorValue
  'panel.background'?: ColorValue
  'panel.focused_border'?: ColorValue
  'pane.focused_border'?: ColorValue
  'pane_group.border'?: ColorValue

  // Borders
  border?: ColorValue
  'border.variant'?: ColorValue
  'border.focused'?: ColorValue
  'border.selected'?: ColorValue
  'border.transparent'?: ColorValue
  'border.disabled'?: ColorValue

  // Drop target
  'drop_target.background'?: ColorValue

  // Elements
  'element.background'?: ColorValue
  'element.hover'?: ColorValue
  'element.active'?: ColorValue
  'element.selected'?: ColorValue
  'element.disabled'?: ColorValue

  // Ghost elements
  'ghost_element.background'?: ColorValue
  'ghost_element.hover'?: ColorValue
  'ghost_element.active'?: ColorValue
  'ghost_element.selected'?: ColorValue
  'ghost_element.disabled'?: ColorValue

  // Text
  text?: ColorValue
  'text.muted'?: ColorValue
  'text.placeholder'?: ColorValue
  'text.disabled'?: ColorValue
  'text.accent'?: ColorValue

  // Icons
  icon?: ColorValue
  'icon.muted'?: ColorValue
  'icon.placeholder'?: ColorValue
  'icon.disabled'?: ColorValue
  'icon.accent'?: ColorValue

  // Status bar
  'status_bar.background'?: ColorValue

  // Title bar
  'title_bar.background'?: ColorValue
  'title_bar.inactive_background'?: ColorValue

  // Toolbar
  'toolbar.background'?: ColorValue

  // Tabs
  'tab_bar.background'?: ColorValue
  'tab.inactive_background'?: ColorValue
  'tab.active_background'?: ColorValue

  // Search
  'search.match_background'?: ColorValue

  // Scrollbar
  'scrollbar.track.background'?: ColorValue
  'scrollbar.track.border'?: ColorValue
  'scrollbar.thumb.background'?: ColorValue
  'scrollbar.thumb.border'?: ColorValue
  'scrollbar.thumb.hover_background'?: ColorValue

  // Editor
  'editor.foreground'?: ColorValue
  'editor.background'?: ColorValue
  'editor.gutter.background'?: ColorValue
  'editor.subheader.background'?: ColorValue
  'editor.active_line.background'?: ColorValue
  'editor.highlighted_line.background'?: ColorValue
  'editor.line_number'?: ColorValue
  'editor.active_line_number'?: ColorValue
  'editor.invisible'?: ColorValue
  'editor.wrap_guide'?: ColorValue
  'editor.active_wrap_guide'?: ColorValue
  'editor.indent_guide'?: ColorValue
  'editor.indent_guide_active'?: ColorValue
  'editor.document_highlight.read_background'?: ColorValue
  'editor.document_highlight.write_background'?: ColorValue
  'editor.document_highlight.bracket_background'?: ColorValue

  // Terminal
  'terminal.background'?: ColorValue
  'terminal.foreground'?: ColorValue
  'terminal.bright_foreground'?: ColorValue
  'terminal.dim_foreground'?: ColorValue
  'terminal.ansi.black'?: ColorValue
  'terminal.ansi.bright_black'?: ColorValue
  'terminal.ansi.dim_black'?: ColorValue
  'terminal.ansi.red'?: ColorValue
  'terminal.ansi.bright_red'?: ColorValue
  'terminal.ansi.dim_red'?: ColorValue
  'terminal.ansi.green'?: ColorValue
  'terminal.ansi.bright_green'?: ColorValue
  'terminal.ansi.dim_green'?: ColorValue
  'terminal.ansi.yellow'?: ColorValue
  'terminal.ansi.bright_yellow'?: ColorValue
  'terminal.ansi.dim_yellow'?: ColorValue
  'terminal.ansi.blue'?: ColorValue
  'terminal.ansi.bright_blue'?: ColorValue
  'terminal.ansi.dim_blue'?: ColorValue
  'terminal.ansi.magenta'?: ColorValue
  'terminal.ansi.bright_magenta'?: ColorValue
  'terminal.ansi.dim_magenta'?: ColorValue
  'terminal.ansi.cyan'?: ColorValue
  'terminal.ansi.bright_cyan'?: ColorValue
  'terminal.ansi.dim_cyan'?: ColorValue
  'terminal.ansi.white'?: ColorValue
  'terminal.ansi.bright_white'?: ColorValue
  'terminal.ansi.dim_white'?: ColorValue

  // Link
  'link_text.hover'?: ColorValue

  // Status colors
  conflict?: ColorValue
  'conflict.background'?: ColorValue
  'conflict.border'?: ColorValue
  created?: ColorValue
  'created.background'?: ColorValue
  'created.border'?: ColorValue
  deleted?: ColorValue
  'deleted.background'?: ColorValue
  'deleted.border'?: ColorValue
  error?: ColorValue
  'error.background'?: ColorValue
  'error.border'?: ColorValue
  hidden?: ColorValue
  'hidden.background'?: ColorValue
  'hidden.border'?: ColorValue
  hint?: ColorValue
  'hint.background'?: ColorValue
  'hint.border'?: ColorValue
  ignored?: ColorValue
  'ignored.background'?: ColorValue
  'ignored.border'?: ColorValue
  info?: ColorValue
  'info.background'?: ColorValue
  'info.border'?: ColorValue
  modified?: ColorValue
  'modified.background'?: ColorValue
  'modified.border'?: ColorValue
  predictive?: ColorValue
  'predictive.background'?: ColorValue
  'predictive.border'?: ColorValue
  renamed?: ColorValue
  'renamed.background'?: ColorValue
  'renamed.border'?: ColorValue
  success?: ColorValue
  'success.background'?: ColorValue
  'success.border'?: ColorValue
  unreachable?: ColorValue
  'unreachable.background'?: ColorValue
  'unreachable.border'?: ColorValue
  warning?: ColorValue
  'warning.background'?: ColorValue
  'warning.border'?: ColorValue

  // Players (multiplayer colors)
  players?: PlayerColor[]

  // Syntax highlighting
  syntax?: Record<string, HighlightStyle>

  // Allow additional properties for forward compatibility
  [key: string]: unknown
}

/** Individual theme within a theme family */
export interface Theme {
  name: string
  appearance: Appearance
  style: ThemeStyle
}

/** Root theme file structure */
export interface ThemeFamily {
  $schema?: string
  name: string
  author: string
  themes: Theme[]
  id?: string
}

/** Color format types for display/editing */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch'

/** Parsed color with all format representations */
export interface ParsedColor {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  oklch: { l: number; c: number; h: number }
  alpha: number
  isInGamut: boolean
}

/** Color entry in the theme with path information */
export interface ColorEntry {
  path: string
  key: string
  originalValue: string
  currentValue: string
  parsed: ParsedColor | null
}
