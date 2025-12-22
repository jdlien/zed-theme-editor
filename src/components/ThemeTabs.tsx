/**
 * ThemeTabs Component
 * Displays tabs for switching between themes in a theme family
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'

interface Theme {
  name: string
  appearance: 'dark' | 'light'
}

interface ThemeTabsProps {
  themes: Theme[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function ThemeTabs({ themes, activeIndex, onSelect }: ThemeTabsProps) {
  if (themes.length <= 1) {
    return null
  }

  return (
    <div className="flex gap-1 border-b border-neutral-300 bg-neutral-50 px-4 dark:border-neutral-700 dark:bg-neutral-900">
      {themes.map((theme, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
            index === activeIndex
              ? 'border-b-2 border-indigo-500 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <FontAwesomeIcon
            icon={theme.appearance === 'dark' ? faMoon : faSun}
            className="h-3 w-3"
          />
          {theme.name}
        </button>
      ))}
    </div>
  )
}

export default ThemeTabs
