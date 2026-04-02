'use client'

import { useState, useRef, useEffect } from 'react'
import { ATA_2200_CHAPTERS } from '@/lib/logbook/ata-2200'

interface AtaSearchProps {
  selected: string[]
  onChange: (values: string[]) => void
}

export function AtaSearch({ selected, onChange }: AtaSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.length >= 2
    ? ATA_2200_CHAPTERS.filter(c =>
        c.value.includes(query) || c.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15)
    : []

  function add(value: string) {
    if (!selected.includes(value)) onChange([...selected, value])
    setQuery('')
  }

  function remove(value: string) {
    onChange(selected.filter(v => v !== value))
  }

  const selectedLabels = selected.map(v => {
    const ch = ATA_2200_CHAPTERS.find(c => c.value === v)
    return { value: v, short: v, label: ch?.label ?? v }
  })

  return (
    <div ref={ref} className="relative">
      {/* Selected tags */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedLabels.map(s => (
            <span key={s.value} className="inline-flex items-center gap-1 bg-[#1565C0] text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              {s.label}
              <button type="button" onClick={() => remove(s.value)} className="text-white/70 hover:text-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder=""
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(ch => {
            const isSelected = selected.includes(ch.value)
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => add(ch.value)}
                disabled={isSelected}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  isSelected ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {ch.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
