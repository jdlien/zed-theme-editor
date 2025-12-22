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
    <div className="flex gap-1 border-b border-gray-700 px-4">
      {themes.map((theme, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`px-3 py-2 text-sm ${
            index === activeIndex
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {theme.appearance === 'dark' ? '🌙' : '☀️'} {theme.name}
        </button>
      ))}
    </div>
  )
}
