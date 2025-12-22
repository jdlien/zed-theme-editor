import { ThemeEditorProvider } from '@/hooks/useThemeEditor'
import { ThemeEditor } from '@/components/ThemeEditor'
import { TooltipProvider } from '@/components/Tooltip'

function App() {
  return (
    <TooltipProvider>
      <ThemeEditorProvider>
        <ThemeEditor />
      </ThemeEditorProvider>
    </TooltipProvider>
  )
}

export default App
