import { ThemeEditorProvider } from '@/hooks/useThemeEditor'
import { ThemeEditor } from '@/components/ThemeEditor'

function App() {
  return (
    <ThemeEditorProvider>
      <ThemeEditor />
    </ThemeEditorProvider>
  )
}

export default App
