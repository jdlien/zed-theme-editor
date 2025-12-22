import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { RefObject, KeyboardEvent } from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputRef?: RefObject<HTMLInputElement | null>
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Filter...',
  className = '',
  inputRef,
}: SearchInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onChange('')
      inputRef?.current?.blur()
    }
  }

  const handleClear = () => {
    onChange('')
    inputRef?.current?.focus()
  }

  return (
    <div
      className={`relative flex items-center rounded border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800 ${className}`}
    >
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="pointer-events-none ml-2 h-3 w-3 text-neutral-400"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-2 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none dark:text-neutral-100 dark:placeholder-neutral-500"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="mr-1 flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          aria-label="Clear search"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
