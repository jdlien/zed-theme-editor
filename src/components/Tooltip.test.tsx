import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Tooltip, TooltipProvider } from './Tooltip'

describe('Tooltip', () => {
  describe('without TooltipProvider', () => {
    it('renders children', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      )
      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
    })

    it('falls back to native title attribute', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      )
      const wrapper = screen.getByRole('button', { name: 'Hover me' }).parentElement
      expect(wrapper).toHaveAttribute('title', 'Test tooltip')
    })

    it('renders children without wrapper when no content', () => {
      render(
        <Tooltip>
          <button>No tooltip</button>
        </Tooltip>
      )
      expect(screen.getByRole('button', { name: 'No tooltip' })).toBeInTheDocument()
    })
  })

  describe('with TooltipProvider', () => {
    it('renders children', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </TooltipProvider>
      )
      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
    })

    it('shows tooltip on hover after delay', async () => {
      render(
        <TooltipProvider>
          <Tooltip content="Tooltip text">
            <button>Hover me</button>
          </Tooltip>
        </TooltipProvider>
      )

      const button = screen.getByRole('button', { name: 'Hover me' })
      fireEvent.mouseEnter(button.parentElement!)

      // Tooltip should appear after delay
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('opacity-100')
      }, { timeout: 200 })

      expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text')
    })

    it('hides tooltip on mouse leave', async () => {
      render(
        <TooltipProvider>
          <Tooltip content="Tooltip text">
            <button>Hover me</button>
          </Tooltip>
        </TooltipProvider>
      )

      const button = screen.getByRole('button', { name: 'Hover me' })
      const wrapper = button.parentElement!

      // Show tooltip
      fireEvent.mouseEnter(wrapper)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('opacity-100')
      }, { timeout: 200 })

      // Hide tooltip
      fireEvent.mouseLeave(wrapper)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('opacity-0')
      })
    })

    it('applies muted styling when muted prop is true', async () => {
      render(
        <TooltipProvider>
          <Tooltip content="Muted tooltip" muted>
            <button>Hover me</button>
          </Tooltip>
        </TooltipProvider>
      )

      const button = screen.getByRole('button', { name: 'Hover me' })
      fireEvent.mouseEnter(button.parentElement!)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('opacity-100')
      }, { timeout: 200 })

      expect(screen.getByRole('tooltip')).toHaveClass('italic')
    })
  })
})
