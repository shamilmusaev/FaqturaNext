'use client'

import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import type { LineSuggestion } from '../actions'
import { PolishButton } from './polish-button'

interface Props {
  value: string
  onChange: (text: string) => void
  /** Accept a ghost suggestion: parent fills description + price + unit + VAT. */
  onAccept: (suggestion: LineSuggestion) => void
  /** Past line items used to offer ghost-text completion. */
  suggestions: LineSuggestion[]
  /** Other line descriptions, passed to the polish button for consistency. */
  siblings: string[]
  required?: boolean
}

/**
 * Description input with Copilot-style ghost autocomplete from past invoices.
 * As you type, the best matching past line is previewed in grey; Tab accepts it
 * and fills the row's price, unit and VAT. Also hosts the polish button.
 */
export function LineDescriptionField({
  value,
  onChange,
  onAccept,
  suggestions,
  siblings,
  required,
}: Props) {
  const [atEnd, setAtEnd] = useState(true)

  const match = useMemo(() => {
    const q = value.toLowerCase()
    if (q.length < 2) return undefined
    return suggestions.find((s) => {
      const d = s.description.toLowerCase()
      return d.startsWith(q) && s.description.length > value.length
    })
  }, [value, suggestions])

  const ghostSuffix = match && atEnd ? match.description.slice(value.length) : ''

  const syncCaret = (el: HTMLInputElement) => {
    setAtEnd(el.selectionStart === el.value.length && el.selectionEnd === el.value.length)
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setAtEnd(true)
        }}
        onSelect={(e) => syncCaret(e.currentTarget)}
        onKeyUp={(e) => syncCaret(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && match && atEnd) {
            e.preventDefault()
            onAccept(match)
          }
        }}
        className="pr-9"
        required={required}
        autoComplete="off"
        spellCheck={false}
      />
      {ghostSuffix && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre px-3 text-[15px]"
        >
          <span className="invisible">{value}</span>
          <span className="text-ink/35">{ghostSuffix}</span>
          <span className="ml-1.5 shrink-0 rounded border border-line-1 px-1 text-[10px] leading-tight text-ink/40">
            Tab
          </span>
        </div>
      )}
      <PolishButton
        value={value}
        context="line"
        siblings={siblings}
        onReplace={onChange}
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      />
    </div>
  )
}
