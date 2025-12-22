import { ThemeEditorProvider } from '@/hooks/useThemeEditor'
import { ThemeEditor } from '@/components/ThemeEditor'
import { TooltipProvider } from '@/components/Tooltip'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Get initial dark mode: localStorage > system preference > true
function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem('zed-theme-editor-dark-mode')
  if (stored !== null) {
    try {
      return JSON.parse(stored)
    } catch {
      return true
    }
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function App() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>(
    'zed-theme-editor-dark-mode',
    getInitialDarkMode()
  )

  return (
    <TooltipProvider>
      <ThemeEditorProvider
        initialDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      >
        <ThemeEditor />
      </ThemeEditorProvider>
    </TooltipProvider>
  )
}

export default App
