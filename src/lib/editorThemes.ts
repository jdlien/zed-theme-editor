/**
 * CodeMirror editor themes
 * Custom themes designed to match the app's neutral gray aesthetic
 */

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { Extension } from '@codemirror/state'

// ============================================================================
// Theme Definitions
// ============================================================================

export type EditorThemeName =
  | 'neutral-dark'
  | 'neutral-light'
  | 'one-dark'
  | 'github-dark'
  | 'github-light'
  | 'midnight'

export interface EditorThemeConfig {
  name: string
  label: string
  isDark: boolean
  extension: Extension
}

// ============================================================================
// Neutral Dark Theme (matches app's dark mode)
// ============================================================================

const neutralDarkColors = {
  bg: '#171717',           // neutral-900
  gutterBg: '#171717',
  activeLine: 'rgba(255, 255, 255, 0.03)',
  selection: 'rgba(59, 130, 246, 0.3)',
  cursor: '#3b82f6',

  // Syntax
  comment: '#737373',      // neutral-500
  string: '#86efac',       // green-300
  keyword: '#c4b5fd',      // violet-300
  number: '#fdba74',       // orange-300
  property: '#93c5fd',     // blue-300
  punctuation: '#a3a3a3',  // neutral-400
  definition: '#fca5a5',   // red-300
}

const neutralDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: neutralDarkColors.bg,
    color: '#e5e5e5',
  },
  '.cm-content': {
    caretColor: neutralDarkColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: neutralDarkColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: neutralDarkColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: neutralDarkColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: neutralDarkColors.gutterBg,
    color: '#525252',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: neutralDarkColors.activeLine,
  },
}, { dark: true })

const neutralDarkHighlight = HighlightStyle.define([
  { tag: tags.comment, color: neutralDarkColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: neutralDarkColors.string },
  { tag: tags.keyword, color: neutralDarkColors.keyword },
  { tag: tags.number, color: neutralDarkColors.number },
  { tag: tags.propertyName, color: neutralDarkColors.property },
  { tag: tags.punctuation, color: neutralDarkColors.punctuation },
  { tag: tags.definition(tags.variableName), color: neutralDarkColors.definition },
  { tag: tags.bool, color: neutralDarkColors.number },
  { tag: tags.null, color: neutralDarkColors.keyword },
])

// ============================================================================
// Neutral Light Theme (matches app's light mode)
// ============================================================================

const neutralLightColors = {
  bg: '#fafafa',           // neutral-50
  gutterBg: '#fafafa',
  activeLine: 'rgba(0, 0, 0, 0.03)',
  selection: 'rgba(59, 130, 246, 0.2)',
  cursor: '#3b82f6',

  // Syntax
  comment: '#737373',      // neutral-500
  string: '#16a34a',       // green-600
  keyword: '#7c3aed',      // violet-600
  number: '#ea580c',       // orange-600
  property: '#2563eb',     // blue-600
  punctuation: '#525252',  // neutral-600
  definition: '#dc2626',   // red-600
}

const neutralLightTheme = EditorView.theme({
  '&': {
    backgroundColor: neutralLightColors.bg,
    color: '#171717',
  },
  '.cm-content': {
    caretColor: neutralLightColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: neutralLightColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: neutralLightColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: neutralLightColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: neutralLightColors.gutterBg,
    color: '#a3a3a3',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: neutralLightColors.activeLine,
  },
}, { dark: false })

const neutralLightHighlight = HighlightStyle.define([
  { tag: tags.comment, color: neutralLightColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: neutralLightColors.string },
  { tag: tags.keyword, color: neutralLightColors.keyword },
  { tag: tags.number, color: neutralLightColors.number },
  { tag: tags.propertyName, color: neutralLightColors.property },
  { tag: tags.punctuation, color: neutralLightColors.punctuation },
  { tag: tags.definition(tags.variableName), color: neutralLightColors.definition },
  { tag: tags.bool, color: neutralLightColors.number },
  { tag: tags.null, color: neutralLightColors.keyword },
])

// ============================================================================
// GitHub Dark Theme
// ============================================================================

const githubDarkColors = {
  bg: '#0d1117',
  gutterBg: '#0d1117',
  activeLine: 'rgba(136, 198, 255, 0.1)',
  selection: 'rgba(56, 139, 253, 0.4)',
  cursor: '#58a6ff',

  comment: '#8b949e',
  string: '#a5d6ff',
  keyword: '#ff7b72',
  number: '#79c0ff',
  property: '#79c0ff',
  punctuation: '#c9d1d9',
  definition: '#d2a8ff',
}

const githubDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: githubDarkColors.bg,
    color: '#c9d1d9',
  },
  '.cm-content': {
    caretColor: githubDarkColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: githubDarkColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: githubDarkColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: githubDarkColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: githubDarkColors.gutterBg,
    color: '#484f58',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: githubDarkColors.activeLine,
  },
}, { dark: true })

const githubDarkHighlight = HighlightStyle.define([
  { tag: tags.comment, color: githubDarkColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: githubDarkColors.string },
  { tag: tags.keyword, color: githubDarkColors.keyword },
  { tag: tags.number, color: githubDarkColors.number },
  { tag: tags.propertyName, color: githubDarkColors.property },
  { tag: tags.punctuation, color: githubDarkColors.punctuation },
  { tag: tags.definition(tags.variableName), color: githubDarkColors.definition },
  { tag: tags.bool, color: githubDarkColors.keyword },
  { tag: tags.null, color: githubDarkColors.keyword },
])

// ============================================================================
// GitHub Light Theme
// ============================================================================

const githubLightColors = {
  bg: '#ffffff',
  gutterBg: '#ffffff',
  activeLine: 'rgba(234, 238, 242, 0.5)',
  selection: 'rgba(84, 174, 255, 0.4)',
  cursor: '#0969da',

  comment: '#6e7781',
  string: '#0a3069',
  keyword: '#cf222e',
  number: '#0550ae',
  property: '#0550ae',
  punctuation: '#24292f',
  definition: '#8250df',
}

const githubLightTheme = EditorView.theme({
  '&': {
    backgroundColor: githubLightColors.bg,
    color: '#24292f',
  },
  '.cm-content': {
    caretColor: githubLightColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: githubLightColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: githubLightColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: githubLightColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: githubLightColors.gutterBg,
    color: '#8c959f',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: githubLightColors.activeLine,
  },
}, { dark: false })

const githubLightHighlight = HighlightStyle.define([
  { tag: tags.comment, color: githubLightColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: githubLightColors.string },
  { tag: tags.keyword, color: githubLightColors.keyword },
  { tag: tags.number, color: githubLightColors.number },
  { tag: tags.propertyName, color: githubLightColors.property },
  { tag: tags.punctuation, color: githubLightColors.punctuation },
  { tag: tags.definition(tags.variableName), color: githubLightColors.definition },
  { tag: tags.bool, color: githubLightColors.keyword },
  { tag: tags.null, color: githubLightColors.keyword },
])

// ============================================================================
// Midnight Theme (deep blue-black)
// ============================================================================

const midnightColors = {
  bg: '#0f172a',           // slate-900
  gutterBg: '#0f172a',
  activeLine: 'rgba(148, 163, 184, 0.1)',
  selection: 'rgba(56, 189, 248, 0.3)',
  cursor: '#38bdf8',

  comment: '#64748b',      // slate-500
  string: '#34d399',       // emerald-400
  keyword: '#f472b6',      // pink-400
  number: '#fbbf24',       // amber-400
  property: '#60a5fa',     // blue-400
  punctuation: '#94a3b8',  // slate-400
  definition: '#c084fc',   // purple-400
}

const midnightTheme = EditorView.theme({
  '&': {
    backgroundColor: midnightColors.bg,
    color: '#e2e8f0',
  },
  '.cm-content': {
    caretColor: midnightColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: midnightColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: midnightColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: midnightColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: midnightColors.gutterBg,
    color: '#475569',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: midnightColors.activeLine,
  },
}, { dark: true })

const midnightHighlight = HighlightStyle.define([
  { tag: tags.comment, color: midnightColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: midnightColors.string },
  { tag: tags.keyword, color: midnightColors.keyword },
  { tag: tags.number, color: midnightColors.number },
  { tag: tags.propertyName, color: midnightColors.property },
  { tag: tags.punctuation, color: midnightColors.punctuation },
  { tag: tags.definition(tags.variableName), color: midnightColors.definition },
  { tag: tags.bool, color: midnightColors.number },
  { tag: tags.null, color: midnightColors.keyword },
])

// ============================================================================
// One Dark (from @codemirror/theme-one-dark, recreated for consistency)
// ============================================================================

const oneDarkColors = {
  bg: '#282c34',
  gutterBg: '#282c34',
  activeLine: 'rgba(255, 255, 255, 0.05)',
  selection: 'rgba(97, 175, 239, 0.3)',
  cursor: '#528bff',

  comment: '#5c6370',
  string: '#98c379',
  keyword: '#c678dd',
  number: '#d19a66',
  property: '#61afef',
  punctuation: '#abb2bf',
  definition: '#e06c75',
}

const oneDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: oneDarkColors.bg,
    color: '#abb2bf',
  },
  '.cm-content': {
    caretColor: oneDarkColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: oneDarkColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: oneDarkColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: oneDarkColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: oneDarkColors.gutterBg,
    color: '#4b5263',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: oneDarkColors.activeLine,
  },
}, { dark: true })

const oneDarkHighlight = HighlightStyle.define([
  { tag: tags.comment, color: oneDarkColors.comment, fontStyle: 'italic' },
  { tag: tags.string, color: oneDarkColors.string },
  { tag: tags.keyword, color: oneDarkColors.keyword },
  { tag: tags.number, color: oneDarkColors.number },
  { tag: tags.propertyName, color: oneDarkColors.property },
  { tag: tags.punctuation, color: oneDarkColors.punctuation },
  { tag: tags.definition(tags.variableName), color: oneDarkColors.definition },
  { tag: tags.bool, color: oneDarkColors.number },
  { tag: tags.null, color: oneDarkColors.keyword },
])

// ============================================================================
// Theme Registry
// ============================================================================

export const editorThemes: Record<EditorThemeName, EditorThemeConfig> = {
  'neutral-dark': {
    name: 'neutral-dark',
    label: 'Neutral Dark',
    isDark: true,
    extension: [neutralDarkTheme, syntaxHighlighting(neutralDarkHighlight)],
  },
  'neutral-light': {
    name: 'neutral-light',
    label: 'Neutral Light',
    isDark: false,
    extension: [neutralLightTheme, syntaxHighlighting(neutralLightHighlight)],
  },
  'one-dark': {
    name: 'one-dark',
    label: 'One Dark',
    isDark: true,
    extension: [oneDarkTheme, syntaxHighlighting(oneDarkHighlight)],
  },
  'github-dark': {
    name: 'github-dark',
    label: 'GitHub Dark',
    isDark: true,
    extension: [githubDarkTheme, syntaxHighlighting(githubDarkHighlight)],
  },
  'github-light': {
    name: 'github-light',
    label: 'GitHub Light',
    isDark: false,
    extension: [githubLightTheme, syntaxHighlighting(githubLightHighlight)],
  },
  'midnight': {
    name: 'midnight',
    label: 'Midnight',
    isDark: true,
    extension: [midnightTheme, syntaxHighlighting(midnightHighlight)],
  },
}

/**
 * Get the appropriate theme based on dark mode preference
 * Returns 'neutral-dark' or 'neutral-light' by default
 */
export function getDefaultTheme(isDarkMode: boolean): EditorThemeName {
  return isDarkMode ? 'neutral-dark' : 'neutral-light'
}

/**
 * Get all available theme names
 */
export function getThemeNames(): EditorThemeName[] {
  return Object.keys(editorThemes) as EditorThemeName[]
}

/**
 * Get themes filtered by dark/light mode
 */
export function getThemesByMode(isDark: boolean): EditorThemeConfig[] {
  return Object.values(editorThemes).filter(t => t.isDark === isDark)
}
