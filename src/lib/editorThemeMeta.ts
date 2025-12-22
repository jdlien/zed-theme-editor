/**
 * Editor theme metadata (no CodeMirror dependency)
 * Used by UI components for theme selection dropdown
 */

export type EditorThemeName =
  | 'neutral-dark'
  | 'neutral-light'
  | 'one-dark'
  | 'github-dark'
  | 'github-light'
  | 'midnight'

export interface EditorThemeMeta {
  name: EditorThemeName
  label: string
  isDark: boolean
}

// Theme metadata for UI components (dropdown, etc.)
export const editorThemeMeta: Record<EditorThemeName, EditorThemeMeta> = {
  'neutral-dark': { name: 'neutral-dark', label: 'Neutral Dark', isDark: true },
  'neutral-light': { name: 'neutral-light', label: 'Neutral Light', isDark: false },
  'one-dark': { name: 'one-dark', label: 'One Dark', isDark: true },
  'github-dark': { name: 'github-dark', label: 'GitHub Dark', isDark: true },
  'github-light': { name: 'github-light', label: 'GitHub Light', isDark: false },
  'midnight': { name: 'midnight', label: 'Midnight', isDark: true },
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
  return Object.keys(editorThemeMeta) as EditorThemeName[]
}

/**
 * Get themes filtered by dark/light mode
 */
export function getThemesByMode(isDark: boolean): EditorThemeMeta[] {
  return Object.values(editorThemeMeta).filter(t => t.isDark === isDark)
}
