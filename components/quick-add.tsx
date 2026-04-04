'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import { Plus, X, Check } from 'lucide-react'

type MaintenanceType = 'base_maintenance' | 'line_maintenance' | 'engine_maintenance' | 'component_maintenance'

const EXPERIENCE_TYPES: { value: MaintenanceType; label: string }[] = [
  { value: 'base_maintenance', label: 'Base' },
  { value: 'line_maintenance', label: 'Line' },
  { value: 'component_maintenance', label: 'Component' },
]

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

export function QuickAdd() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [taskDetail, setTaskDetail] = useState('')
  const [date, setDate] = useState(todayDDMMYYYY)
  const [aircraftType, setAircraftType] = useState('')
  const [aircraftSearch, setAircraftSearch] = useState('')
  const [registration, setRegistration] = useState('')
  const [experienceType, setExperienceType] = useState<MaintenanceType>('line_maintenance')

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
    setAircraftSearch('')
    setRegistration('')
  }

  async function handleSave() {
    if (!taskDetail.trim()) return

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Get employer
    const { data: employment } = await supabase
      .from('employment_periods')
      .select('employer')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1)

    const employer = employment?.[0]?.employer ?? ''

    // Derive aircraft category from type
    const found = UK_TYPE_RATINGS.find(t => t.rating === aircraftType)
    const aircraftCategory = found ? (groupToCategory(found.group) ?? 'aeroplane_turbine') : 'aeroplane_turbine'

    const { error } = await supabase.from('logbook_entries').insert({
      user_id: user.id,
      task_date: parseDateInput(date),
      maintenance_type: experienceType,
      aircraft_category: aircraftCategory,
      aircraft_registration: registration.toUpperCase() || 'N/A',
      aircraft_type: aircraftType || 'N/A',
      ata_chapter: '',
      ata_chapters: [],
      job_number: '',
      description: taskDetail.trim(),
      employer,
      category: experienceType === 'base_maintenance' ? 'base_maintenance' : 'line_maintenance',
      duration_hours: 1,
      supervised: true,
      status: 'draft',
    })

    setSaving(false)

    if (!error) {
      setSaved(true)
      reset()
      router.refresh()
      // Stay open for batch entry — focus back on input
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // Handle keyboard
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">
      {/* Expanded form */}
      <div className={`transition-all duration-200 ease-out origin-bottom-right ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden mb-3">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-sm font-semibold text-foreground">Quick Add Task</span>
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
              placeholder="What did you work on?"
              rows={2}
              className="w-full text-sm px-3 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
            />

            {/* Date + Experience type row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value.replace(/[^\d/]/g, '').slice(0, 10))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className="w-28 text-xs text-center px-2 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-1 flex-1">
                {EXPERIENCE_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setExperienceType(t.value)}
                    className={`flex-1 text-xs py-2 rounded-xl border transition-colors ${
                      experienceType === t.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aircraft type */}
            <div className="relative">
              <input
                type="text"
                value={aircraftType ? aircraftType : aircraftSearch}
                onChange={e => {
                  setAircraftSearch(e.target.value)
                  if (aircraftType) setAircraftType('')
                }}
                placeholder="Aircraft type"
                className="w-full text-xs px-3 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
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
                      <span className="text-muted-foreground ml-2">{r.group}</span>
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
              placeholder="Registration (e.g. G-ABCD)"
              className="w-full text-xs px-3 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring uppercase"
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
                  disabled={saving || !taskDetail.trim()}
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
        aria-label={open ? 'Close quick add' : 'Quick add task'}
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  )
}
