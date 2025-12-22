import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<SearchInput value="test query" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('test query')
  })

  it('calls onChange when typing', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<SearchInput value="" onChange={handleChange} />)

    await user.type(screen.getByRole('textbox'), 'hello')
    expect(handleChange).toHaveBeenCalledTimes(5)
    expect(handleChange).toHaveBeenLastCalledWith('o')
  })

  it('shows clear button only when value is non-empty', () => {
    const { rerender } = render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()

    rerender(<SearchInput value="test" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('clears value when clear button is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<SearchInput value="test" onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: /clear/i }))
    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('clears value when Escape is pressed', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<SearchInput value="test" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')

    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('accepts a ref for the input element', () => {
    const inputRef = createRef<HTMLInputElement>()
    render(<SearchInput value="" onChange={() => {}} inputRef={inputRef} />)

    expect(inputRef.current).toBeInstanceOf(HTMLInputElement)
  })

  it('focuses the input after clearing', async () => {
    const user = userEvent.setup()
    const inputRef = createRef<HTMLInputElement>()
    render(<SearchInput value="test" onChange={() => {}} inputRef={inputRef} />)

    await user.click(screen.getByRole('button', { name: /clear/i }))
    expect(document.activeElement).toBe(inputRef.current)
  })

  it('has accessible label', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Filter colors" />)
    expect(screen.getByRole('textbox', { name: 'Filter colors' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<SearchInput value="" onChange={() => {}} className="custom-class" />)
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass('custom-class')
  })
})
