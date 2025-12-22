# Zed Theme Editor

A browser-based visual theme editor for Zed IDE themes. Edit colors using intuitive color models (OKLCH, HSL, RGB) while saving in Zed-compatible hex format.

## Project Overview

This tool allows theme creators to:
- Open Zed theme JSON/JSON5 files via drag-and-drop or file picker
- View all colors with inline swatches showing original → edited values
- Edit colors using multiple formats simultaneously (Hex, RGB, HSL, OKLCH)
- Use keyboard modifiers for precise numeric input (Arrow ±1, Alt ±0.1, Shift ±10, Alt+Shift ±0.01)
- Save changes back to the original file in hex format
- Preview themes in a mini editor/terminal mockup

## Architecture

### Tech Stack
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: TailwindCSS 4
- **Color Library**: Culori (OKLCH support, gamut mapping)
- **Code Editor**: CodeMirror 6 (JSON syntax highlighting, inline widgets)
- **JSON Parsing**: json5 package
- **File Access**: File System Access API (Chrome/Edge)
- **Testing**: Vitest + React Testing Library

### Directory Structure
```
src/
├── components/       # React components
│   ├── DropZone.tsx
│   ├── Toolbar.tsx
│   ├── ThemeTabs.tsx
│   ├── JsonEditorPanel.tsx
│   ├── ColorEditorPanel.tsx
│   ├── ColorPicker.tsx
│   ├── NumberField.tsx
│   ├── ColorSwatch.tsx
│   └── ThemePreview.tsx
├── hooks/            # Custom React hooks
│   ├── useThemeEditor.ts
│   ├── useFileAccess.ts
│   └── useLocalStorage.ts
├── lib/              # Utility libraries
│   ├── colorConversion.ts
│   └── jsonParsing.ts
├── types/            # TypeScript types
│   └── theme.ts
└── styles/           # CSS
    └── globals.css
```

### Key Design Decisions

1. **CodeMirror as source of truth**: The editor text is canonical; parsed theme data is derived for swatches/preview.

2. **Lossy JSON5 conversion**: JSON5 files are normalized to JSON on load. Comments and trailing commas are not preserved.

3. **Hex-only color storage**: All colors are stored as hex internally and saved as hex. Other formats are for display/editing only.

4. **OKLCH for perceptual editing**: OKLCH provides perceptually uniform color editing. L: 0-1, C: 0-0.4+, H: 0-360.

5. **File System Access API**: Enables save-in-place on Chrome/Edge. Falls back to download on other browsers.

## Development

### Commands
```bash
npm run dev          # Start dev server
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
npm test             # Run tests in watch mode
npm test -- --run    # Run tests once
npm run test:coverage # Run tests with coverage
```

### Import Aliases
Use `@/` to import from `src/`:
```typescript
import { parseColor } from '@/lib/colorConversion'
import type { ThemeFamily } from '@/types/theme'
```

## Testing Requirements

### Coverage Expectations
- **lib/**: 90%+ coverage - these are pure functions, easily testable
- **hooks/**: 80%+ coverage - test state transitions and effects
- **components/**: 70%+ coverage - test user interactions and rendering

### Testing Principles

1. **Test behavior, not implementation**: Focus on what the component does, not how.

2. **Unit test utilities thoroughly**: Color conversion, parsing, and precision functions need comprehensive edge case coverage.

3. **Use React Testing Library idiomatically**: Query by role/label, not test IDs. Simulate real user interactions.

4. **Test file structure**: Place tests adjacent to source files as `*.test.ts` or `*.test.tsx`.

5. **Mock external APIs**: Mock File System Access API, not internal utilities.

### Required Test Categories

For each feature:
- Happy path tests
- Edge cases (empty input, max/min values, invalid data)
- Error handling
- Accessibility (keyboard navigation, screen reader)

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types without justification
- Prefer interfaces over types for object shapes
- Export types alongside implementations

### React
- Functional components only
- Custom hooks for reusable logic
- Props interfaces defined above components
- Avoid inline function definitions in JSX where performance matters

### Formatting
- Prettier with Tailwind plugin
- No semicolons
- Single quotes
- 2-space indentation

## Git Workflow

### Commit Messages
Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `test:` Adding/updating tests
- `refactor:` Code changes that don't add features or fix bugs
- `docs:` Documentation changes
- `chore:` Build/config changes

### Before Committing
1. Run `npm run build` - must pass
2. Run `npm test -- --run` - all tests must pass
3. No console.log statements in committed code

## Browser Support

- **Full support**: Chrome, Edge (File System Access API)
- **Degraded support**: Firefox, Safari (download instead of save-in-place)

## Key Files

- `.taskmaster/docs/prd.txt` - Full product requirements
- `.taskmaster/tasks/tasks.json` - Task tracking
- `themes/` - Sample theme files for testing
