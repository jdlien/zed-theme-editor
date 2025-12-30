import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons'

interface DarkToggleProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function DarkToggle({ isDarkMode, onToggleDarkMode }: DarkToggleProps) {
  return (
    <button
      onClick={onToggleDarkMode}
      className="shadow-rim relative inline-flex cursor-pointer gap-px rounded-full bg-neutral-200 dark:bg-neutral-700"
      role="switch"
      aria-checked={isDarkMode}
      aria-label="Toggle dark mode"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sliding indicator */}
      <span
        className="shadow-edge absolute left-0 size-8 rounded-full bg-white shadow-md transition-all! delay-0! duration-200! dark:translate-x-full dark:bg-neutral-600"
        aria-hidden="true"
      />

      {/* Sun Icon - active in light mode */}
      <span
        className="z-10 flex size-8 items-center justify-center rounded-full text-neutral-700 transition-all hover:text-black dark:text-neutral-500 dark:hover:text-neutral-200"
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={faSun} className="size-4" />
      </span>

      {/* Moon Icon - active in dark mode */}
      <span
        className="z-10 flex size-8 items-center justify-center rounded-full text-neutral-400 transition-all hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-white"
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={faMoon} className="size-4" />
      </span>
    </button>
  )
}

export default DarkToggle
