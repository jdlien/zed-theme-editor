/**
 * Platform-aware keyboard shortcut utilities
 */

/**
 * Detect if the user is on macOS
 * Uses navigator.platform with userAgentData fallback
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false

  // Modern API (Chrome 90+)
  if ('userAgentData' in navigator) {
    const uaData = navigator.userAgentData as { platform?: string }
    if (uaData.platform) {
      return uaData.platform.toLowerCase().includes('mac')
    }
  }

  // Fallback to navigator.platform
  return navigator.platform?.toLowerCase().includes('mac') ?? false
}

/**
 * Get the modifier key symbol for the current platform
 * Returns ⌘ on Mac, Ctrl on other platforms
 */
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

/**
 * Format a keyboard shortcut for display
 * Automatically uses the correct modifier for the platform
 *
 * @param key - The key (e.g., 'S', 'Z')
 * @param shift - Whether Shift is required
 * @returns Formatted shortcut string (e.g., '⌘+S' or 'Ctrl+S')
 */
export function formatShortcut(key: string, shift = false): string {
  const mod = getModifierKey()
  if (shift) {
    return isMac() ? `⇧${mod}+${key}` : `${mod}+Shift+${key}`
  }
  return `${mod}+${key}`
}
