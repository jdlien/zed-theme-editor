import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    // Mock matchMedia for dark mode detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    localStorage.clear()
  })
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Zed Theme Editor')).toBeInTheDocument()
  })

  it('shows drop zone when no file is loaded', () => {
    render(<App />)
    expect(screen.getByText(/drop a zed theme/i)).toBeInTheDocument()
  })

  describe('dark mode persistence', () => {
    it('respects localStorage preference over system preference', () => {
      // System prefers dark, but localStorage says light
      localStorage.setItem('zed-theme-editor-dark-mode', 'false')

      render(<App />)

      // Light mode should be selected because localStorage overrides system preference
      expect(screen.getByRole('radio', { name: 'Light mode' })).toHaveAttribute('aria-checked', 'true')
    })

    it('uses system preference when no localStorage value exists', () => {
      // System prefers dark (mocked in beforeEach)
      render(<App />)

      // Dark mode should be selected based on system preference
      expect(screen.getByRole('radio', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true')
    })

    it('uses light mode when system prefers light and no localStorage', () => {
      // Override to prefer light mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: light)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<App />)

      // Light mode should be selected based on system preference
      expect(screen.getByRole('radio', { name: 'Light mode' })).toHaveAttribute('aria-checked', 'true')
    })
  })
})
