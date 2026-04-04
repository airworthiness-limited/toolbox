'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import { Plus, X, Check } from 'lucide-react'

function groupToCategory(group: string): string | null {
  if (group === 'Turbine Aeroplane') return 'aeroplane_turbine'
  if (group === 'Piston Aeroplane') return 'aeroplane_piston'
  if (group === 'Turbine Helicopter') return 'helicopter_turbine'
  if (group === 'Piston Helicopter') return 'helicopter_piston'
  return null
}

function todayDDMMYYYY(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function parseDateInput(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ddmmyyyy
}

function validateDate(display: string): string | null {
  const digits = display.replace(/[^\d]/g, '')
  if (digits.length === 0) return null
  if (digits.length < 8) return 'Invalid date'
  const d = parseInt(digits.slice(0, 2), 10)
  const m = parseInt(digits.slice(2, 4), 10)
  const y = parseInt(digits.slice(4, 8), 10)
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return 'Invalid date'
  const parsed = new Date(y, m - 1, d)
  if (isNaN(parsed.getTime()) || parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) return 'Invalid date'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (parsed > today) return 'Invalid date'
  return null
}

export function QuickAdd() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [taskDetail, setTaskDetail] = useState('')
  const [date, setDate] = useState(todayDDMMYYYY)
  const [dateError, setDateError] = useState<string | null>(null)
  const [aircraftType, setAircraftType] = useState('')
  const [aircraftSearch, setAircraftSearch] = useState('')
  const [registration, setRegistration] = useState('')

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Clear saved indicator
  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [saved])

  // Aircraft type search
  const filteredTypes = useMemo(() => {
    if (!aircraftSearch.trim()) return []
    const q = aircraftSearch.toLowerCase()
    return UK_TYPE_RATINGS
      .filter(r => r.rating.toLowerCase().includes(q) || r.make.toLowerCase().includes(q) || r.model.toLowerCase().includes(q))
      .slice(0, 8)
  }, [aircraftSearch])

  function reset() {
    setTaskDetail('')
    setDate(todayDDMMYYYY())
    setDateError(null)
    setAircraftType('')
    setAircraftSearch('')
    setRegistration('')
  }

  function handleDateBlur() {
    const err = validateDate(date)
    setDateError(err)
  }

  async function handleSave() {
    if (!taskDetail.trim()) return
    const err = validateDate(date)
    if (err) { setDateError(err); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: employment } = await supabase
      .from('employment_periods')
      .select('employer')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1)

    const employer = employment?.[0]?.employer ?? ''

    const found = UK_TYPE_RATINGS.find(t => t.rating === aircraftType)
    const aircraftCategory = found ? (groupToCategory(found.group) ?? 'aeroplane_turbine') : 'aeroplane_turbine'

    const { error } = await supabase.from('logbook_entries').insert({
      user_id: user.id,
      task_date: parseDateInput(date),
      maintenance_type: 'line_maintenance',
      aircraft_category: aircraftCategory,
      aircraft_registration: registration.toUpperCase() || 'N/A',
      aircraft_type: aircraftType || 'N/A',
      ata_chapter: '',
      ata_chapters: [],
      job_number: '',
      description: taskDetail.trim(),
      employer,
      category: 'line_maintenance',
      duration_hours: 1,
      supervised: true,
      status: 'draft',
    })

    setSaving(false)

    if (!error) {
      setSaved(true)
      reset()
      router.refresh()
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const hasDateError = dateError !== null

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">
      {/* Expanded form */}
      <div className={`transition-all duration-200 ease-out origin-bottom-right ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden mb-3">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-sm font-semibold text-foreground">Add Logbook Task</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-4 pb-4 space-y-3" onKeyDown={handleKeyDown}>
            {/* Task detail */}
            <textarea
              ref={inputRef}
              value={taskDetail}
              onChange={e => setTaskDetail(e.target.value)}
              placeholder="I performed [Task Type] on [Part or System] in accordance with [Maintenance Data]."
              rows={3}
              className="w-full text-sm px-3 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/40 placeholder:text-xs text-center"
            />

            {/* Date */}
            <div>
              <input
                type="text"
                value={date}
                onChange={e => { setDate(e.target.value.replace(/[^\d/]/g, '').slice(0, 10)); setDateError(null) }}
                onBlur={handleDateBlur}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className={`w-full text-xs text-center px-3 py-2 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring ${hasDateError ? 'border-red-400 bg-red-50 text-red-700' : 'border-border'}`}
              />
              {hasDateError && (
                <div className="flex items-center justify-end mt-1">
                  <X className="w-3 h-3 text-red-500" strokeWidth={2} />
                </div>
              )}
            </div>

            {/* Aircraft type */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={aircraftType ? aircraftType : aircraftSearch}
                  onChange={e => {
                    setAircraftSearch(e.target.value)
                    if (aircraftType) setAircraftType('')
                  }}
                  placeholder="Aircraft Type"
                  className="w-full text-xs px-3 py-2 pr-8 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring text-center"
                />
                {(aircraftType || aircraftSearch) && (
                  <button
                    type="button"
                    onClick={() => { setAircraftType(''); setAircraftSearch('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {filteredTypes.length > 0 && !aircraftType && (
                <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredTypes.map(r => (
                    <button
                      key={`${r.category}-${r.rating}`}
                      type="button"
                      onClick={() => {
                        setAircraftType(r.rating)
                        setAircraftSearch('')
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0"
                    >
                      <span className="font-medium">{r.rating}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Registration */}
            <input
              type="text"
              value={registration}
              onChange={e => setRegistration(e.target.value)}
              placeholder="Aircraft Registration"
              className="w-full text-xs px-3 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring uppercase text-center"
            />

            {/* Save */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground/50">
                {saved ? '' : 'Ctrl+Enter to save'}
              </span>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !taskDetail.trim() || hasDateError}
                  className="px-4 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-40 transition-colors"
                >
                  {saving ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ml-auto ${
          open
            ? 'bg-muted text-muted-foreground rotate-45'
            : 'bg-foreground text-background hover:bg-foreground/90'
        }`}
        aria-label={open ? 'Close quick add' : 'Add logbook task'}
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  )
}
