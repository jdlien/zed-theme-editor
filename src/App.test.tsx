import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Zed Theme Editor')).toBeInTheDocument()
  })

  it('shows drop zone when no file is loaded', () => {
    render(<App />)
    expect(screen.getByText(/drop a zed theme file/i)).toBeInTheDocument()
  })
})
