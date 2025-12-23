# Zed Theme Editor

A browser-based visual editor for [Zed](https://zed.dev) IDE themes.

**Try it:** https://zed-theme-editor.vercel.app/

## Features

- Open Zed theme files (JSON/JSON5) via drag-and-drop or file picker
- Edit colors using any of multiple color formats: Hex, RGB, HSL, OKLCH
- See original vs. edited values with inline swatches
- Keyboard modifiers for precise input (Arrow ±1, Alt ±0.1, Shift ±10, Alt+Shift ±0.01)
- Live theme preview with mini editor/terminal mockup
- Save changes back to the original file (Chrome/Edge only) and see it update in Zed

## Usage

1. Open a Zed theme file wherever Zed themes are stored (e.g., `~/.config/zed/themes/`)
2. Click any color value to edit it
3. Use the color picker or type values directly
4. Save your changes

## Browser Support

- **Chrome/Edge**: Full support including save-in-place
- **Firefox/Safari**: Mostly works, but must copy contents instead of saving in-place

## Development

```bash
pnpm install
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm test       # Run tests
```

## Tech Stack

Vite, React 19, TypeScript, TailwindCSS 4, CodeMirror 6, Culori

## Notes

This project is not associated with Zed Industries.
