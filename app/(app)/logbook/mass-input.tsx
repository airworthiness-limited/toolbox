'use client'

import { useState, Fragment, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast, Toast } from '@/components/toast'
import {
  NO_AIRCRAFT_REQUIRED,
} from '@/lib/logbook/constants'
import type { MaintenanceType, AircraftCategory } from '@/lib/logbook/constants'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import { AtaSearch } from './ata-search'

const TASK_TYPES = [
  'Adjustment',
  'Ground Handling',
  'Inspect/Test',
  'Modification',
  'Other',
  'Removal/Installation',
  'Repair',
  'Servicing',
  'Troubleshooting',
] as const

const FACILITY_OPTIONS: { value: string; label: string; comingSoon?: boolean }[] = [
  { value: 'base_maintenance', label: 'Base Maintenance' },
  { value: 'line_maintenance', label: 'Line Maintenance' },
  { value: 'engine_maintenance', label: 'Engine Maintenance', comingSoon: true },
  { value: 'component_maintenance', label: 'Component Maintenance', comingSoon: true },
]

const CATEGORY_OPTIONS: { value: AircraftCategory | 'avionics'; label: string }[] = [
  { value: 'aeroplane_turbine', label: 'Aeroplane Turbine (A1/B1.1)' },
  { value: 'aeroplane_piston', label: 'Aeroplane Piston (A2/B1.2/B3)' },
  { value: 'helicopter_turbine', label: 'Helicopter Turbine (A3/B1.3)' },
  { value: 'helicopter_piston', label: 'Helicopter Piston (A4/B1.4)' },
  { value: 'avionics', label: 'Avionics (B2)' },
]

function groupToCategory(group: string): string | null {
  if (group === 'Turbine Aeroplane') return 'aeroplane_turbine'
  if (group === 'Piston Aeroplane') return 'aeroplane_piston'
  if (group === 'Turbine Helicopter') return 'helicopter_turbine'
  if (group === 'Piston Helicopter') return 'helicopter_piston'
  return null
}

function parseDateInput(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ddmmyyyy
}

function TagSelect({ options, selected, onChange, multi = false }: {
  options: readonly string[] | { value: string; label: string; comingSoon?: boolean }[]
  selected: string | string[]
  onChange: (val: string | string[]) => void
  multi?: boolean
}) {
  const items = (options as any[]).map((o: any) =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  const selectedArr = Array.isArray(selected) ? selected : [selected].filter(Boolean)

  function toggle(val: string) {
    if (multi) {
      const next = selectedArr.includes(val)
        ? selectedArr.filter(v => v !== val)
        : [...selectedArr, val]
      onChange(next)
    } else {
      onChange(val === selected ? '' : val)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item: { value: string; label: string; comingSoon?: boolean }) => {
        const isSelected = selectedArr.includes(item.value)
        if (item.comingSoon) {
          return (
            <div key={item.label} className="relative group">
              <button
                type="button"
                disabled
                className="text-xs font-semibold px-3 py-1 rounded-lg bg-muted text-muted-foreground/40 cursor-not-allowed"
              >
                {item.label}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming Soon
              </div>
            </div>
          )
        }
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => toggle(item.value)}
            className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

interface DraftRow {
  id: string
  taskDate: string
  maintenanceType: MaintenanceType
  aircraftCategory: string
  aircraftRegistration: string
  aircraftType: string
  ataChapters: string[]
  taskTypes: string[]
  jobNumber: string
  jobNumberPhotoPath: string | null
  taskDetail: string
  employer: string
  saving: boolean
  saved: boolean
  saveError: string | null
}

function newRow(defaults: Partial<DraftRow> = {}): DraftRow {
  let aircraftCategory = defaults.aircraftCategory ?? ''
  if (defaults.aircraftType && !aircraftCategory) {
    const found = UK_TYPE_RATINGS.find(t => t.rating === defaults.aircraftType)
    if (found) aircraftCategory = groupToCategory(found.group) ?? ''
  }
  return {
    id: crypto.randomUUID(),
    taskDate: defaults.taskDate ?? '',
    maintenanceType: defaults.maintenanceType ?? 'line_maintenance',
    aircraftCategory,
    aircraftRegistration: defaults.aircraftRegistration ?? '',
    aircraftType: defaults.aircraftType ?? '',
    ataChapters: [],
    taskTypes: [],
    jobNumber: '',
    jobNumberPhotoPath: null,
    taskDetail: '',
    employer: defaults.employer ?? '',
    saving: false,
    saved: false,
    saveError: null,
  }
}

function entryToDraftRow(entry: Record<string, unknown>): DraftRow {
  const desc = (entry.description as string) ?? ''
  const typeMatch = desc.match(/^\[([^\]]+)\]/)
  const taskTypes = typeMatch ? typeMatch[1].split(',').map(t => t.trim()).filter(Boolean) : []
  const taskDetail = desc.replace(/^\[[^\]]+\]\s*/, '')

  const isoDate = (entry.task_date as string) ?? ''
  const [y, m, d] = isoDate.split('-')
  const taskDate = y && m && d ? `${d}/${m}/${y}` : ''

  const ataChapters = (entry.ata_chapters as string[]) ??
    ((entry.ata_chapter as string) ? [entry.ata_chapter as string] : [])

  return {
    id: (entry.id as string) ?? crypto.randomUUID(),
    taskDate,
    maintenanceType: (entry.maintenance_type as MaintenanceType) ?? 'line_maintenance',
    aircraftCategory: (entry.aircraft_category as string) ?? '',
    aircraftRegistration: (entry.aircraft_registration as string) ?? '',
    aircraftType: (entry.aircraft_type as string) ?? '',
    ataChapters,
    taskTypes,
    jobNumber: (entry.job_number as string) ?? '',
    jobNumberPhotoPath: (entry.work_order_photo_path as string) ?? null,
    taskDetail,
    employer: (entry.employer as string) ?? '',
    saving: false,
    saved: false,
    saveError: null,
  }
}

interface MassInputProps {
  defaultEmployer: string
  lastMaintenanceType?: MaintenanceType
  editingEntry?: Record<string, unknown> | null
}

export function MassInput({ defaultEmployer, lastMaintenanceType, editingEntry }: MassInputProps) {
  const router = useRouter()
  const isEditing = !!editingEntry
  const { toast, show: showToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [rows, setRows] = useState<DraftRow[]>([
    editingEntry
      ? entryToDraftRow(editingEntry)
      : newRow({ employer: defaultEmployer, maintenanceType: lastMaintenanceType }),
  ])
  const [typeSearch, setTypeSearch] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function updateRow(id: string, field: keyof DraftRow, value: unknown) {
    setRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: value, saved: false } : r)
      const lastRow = updated[updated.length - 1]
      if (!isEditing && lastRow.id === id && !lastRow.saved) {
        const hasContent = lastRow.taskDate || lastRow.taskDetail
        if (hasContent && updated.filter(r => !r.saved).length === 1) {
          updated.push(newRow({
            employer: lastRow.employer,
            maintenanceType: lastRow.maintenanceType,
            aircraftCategory: lastRow.aircraftCategory,
            taskDate: lastRow.taskDate,
            aircraftRegistration: lastRow.aircraftRegistration,
            aircraftType: lastRow.aircraftType,
          }))
        }
      }
      return updated
    })
  }

  function updateAtaChapters(id: string, chapters: string[]) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ataChapters: chapters, saved: false } : r))
  }

  async function handleJobPhotoUpload(rowId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) return
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) return

    setUploading(prev => ({ ...prev, [rowId]: true }))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(prev => ({ ...prev, [rowId]: false })); return }

    const ext = file.name.split('.').pop() || 'jpg'
    const storagePath = `${user.id}/job-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('module-certificates')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (!error) {
      updateRow(rowId, 'jobNumberPhotoPath', storagePath)
    }
    setUploading(prev => ({ ...prev, [rowId]: false }))
  }

  async function saveRow(id: string) {
    const row = rows.find(r => r.id === id)
    if (!row || !row.taskDate) return

    const isSimple = NO_AIRCRAFT_REQUIRED.includes(row.maintenanceType)
    if (!isSimple && !row.aircraftRegistration) return

    setRows(prev => prev.map(r => r.id === id ? { ...r, saving: true } : r))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const descriptionParts = [
      row.taskTypes.length > 0 ? `[${row.taskTypes.join(', ')}]` : '',
      row.taskDetail,
    ].filter(Boolean).join(' ')

    const payload = {
      task_date: parseDateInput(row.taskDate),
      maintenance_type: row.maintenanceType,
      aircraft_category: (() => {
        const cat = row.aircraftCategory
        if (cat && cat !== 'avionics') return cat as AircraftCategory
        const found = UK_TYPE_RATINGS.find(t => t.rating === row.aircraftType)
        return (found ? groupToCategory(found.group) : null) ?? 'aeroplane_turbine' as AircraftCategory
      })(),
      aircraft_registration: isSimple ? 'N/A' : row.aircraftRegistration.toUpperCase(),
      aircraft_type: isSimple ? 'N/A' : row.aircraftType,
      ata_chapter: row.ataChapters[0] ?? '',
      ata_chapters: row.ataChapters,
      job_number: isSimple ? 'N/A' : row.jobNumber,
      description: descriptionParts,
      employer: row.employer || defaultEmployer || '',
      category: row.maintenanceType === 'base_maintenance' ? 'base_maintenance' : 'line_maintenance',
      duration_hours: 1,
      supervised: true,
      status: 'draft',
      work_order_photo_path: row.jobNumberPhotoPath,
    }

    const { error } = isEditing
      ? await supabase.from('logbook_entries').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingEntry!.id as string)
      : await supabase.from('logbook_entries').insert({ ...payload, user_id: user.id })

    if (!error) {
      if (isEditing) {
        showToast('Task updated successfully.')
        router.push('/logbook/export')
        return
      }
      setRows(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, saving: false, saved: true } : r)
        const unsaved = updated.filter(r => !r.saved)
        if (unsaved.length === 0) {
          updated.push(newRow({
            employer: row.employer || defaultEmployer,
            maintenanceType: row.maintenanceType,
            aircraftCategory: row.aircraftCategory,
            taskDate: row.taskDate,
            aircraftRegistration: row.aircraftRegistration,
            aircraftType: row.aircraftType,
          }))
        }
        return updated
      })
      showToast('Task successfully added to logbook.')
      router.refresh()
    } else {
      setRows(prev => prev.map(r => r.id === id ? { ...r, saving: false, saveError: error?.message ?? error?.code ?? 'Save failed — check all fields' } : r))
    }
  }

  function removeRow(id: string) {
    setRows(prev => {
      const updated = prev.filter(r => r.id !== id)
      if (updated.length === 0) updated.push(newRow({ employer: defaultEmployer }))
      return updated
    })
  }

  async function handleDelete() {
    if (!editingEntry) return
    const supabase = createClient()
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', editingEntry.id as string)
    if (error) {
      showToast('Failed to delete: ' + error.message, 'error')
      return
    }
    showToast('Task deleted.')
    router.push('/logbook/export')
  }

  function getTypeResults(rowId: string): typeof UK_TYPE_RATINGS {
    const q = (typeSearch[rowId] ?? '').toLowerCase()
    if (q.length < 2) return []
    return UK_TYPE_RATINGS.filter(t =>
      t.rating.toLowerCase().includes(q) ||
      t.make.toLowerCase().includes(q) ||
      t.model.toLowerCase().includes(q)
    ).slice(0, 10)
  }

  const unsavedRows = rows.filter(r => !r.saved)

  return (
    <Fragment>
    {toast && <Toast message={toast.message} variant={toast.variant} />}
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="divide-y divide-border">
        {unsavedRows.map((row) => {
          const isSimple = NO_AIRCRAFT_REQUIRED.includes(row.maintenanceType)
          const dateValid = /^\d{2}\/\d{2}\/\d{4}$/.test(row.taskDate)
          const canSave = dateValid && row.aircraftCategory && (isSimple || row.aircraftRegistration)

          return (
            <Fragment key={row.id}>
              <div className="px-6 py-6">
                {/* Date — full width */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                  <input
                    type="text"
                    value={row.taskDate}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d/]/g, '').slice(0, 10)
                      updateRow(row.id, 'taskDate', raw)
                    }}
                    onKeyDown={e => {
                      const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']
                      if (!allowed.includes(e.key) && !/^\d$/.test(e.key) && e.key !== '/') e.preventDefault()
                    }}
                    onPaste={e => {
                      e.preventDefault()
                      const pasted = e.clipboardData.getData('text').replace(/[^\d/]/g, '').slice(0, 10)
                      updateRow(row.id, 'taskDate', pasted)
                    }}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className="w-full text-sm h-12 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Experience Type */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Experience Type</label>
                  <TagSelect
                    options={FACILITY_OPTIONS}
                    selected={row.maintenanceType}
                    onChange={v => updateRow(row.id, 'maintenanceType', v as MaintenanceType)}
                  />
                </div>

                {/* Aircraft Registration — only for Base/Line */}
                {!isSimple && (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Aircraft Registration</label>
                    <input
                      type="text"
                      value={row.aircraftRegistration}
                      onChange={e => updateRow(row.id, 'aircraftRegistration', e.target.value.toUpperCase())}
                      className="w-full text-sm h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                    />
                  </div>
                )}

                {/* Aircraft Type — only for Base/Line */}
                {!isSimple && (
                  <div className="mb-5 relative">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Aircraft Type</label>
                    <input
                      type="text"
                      value={row.id in typeSearch ? typeSearch[row.id] : row.aircraftType}
                      onChange={e => {
                        setTypeSearch(prev => ({ ...prev, [row.id]: e.target.value }))
                        updateRow(row.id, 'aircraftType', e.target.value)
                      }}
                      className="w-full text-sm h-12 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {getTypeResults(row.id).length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {getTypeResults(row.id).map(t => (
                          <button
                            key={t.rating}
                            type="button"
                            onClick={() => {
                              const category = groupToCategory(t.group)
                              setRows(prev => prev.map(r => r.id === row.id ? {
                                ...r,
                                aircraftType: t.rating,
                                ...(category ? { aircraftCategory: category } : {}),
                                saved: false,
                              } : r))
                              setTypeSearch(prev => { const next = { ...prev }; delete next[row.id]; return next })
                            }}
                            className="block w-full text-left px-4 py-2.5 text-sm text-popover-foreground hover:bg-muted"
                          >
                            {t.rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Licence Category */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Licence Category</label>
                  <TagSelect
                    options={CATEGORY_OPTIONS}
                    selected={row.aircraftCategory}
                    onChange={v => updateRow(row.id, 'aircraftCategory', v as string)}
                  />
                </div>

                {/* ATA Chapter(s) */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">ATA Chapter(s)</label>
                  <AtaSearch
                    selected={row.ataChapters}
                    onChange={chapters => updateAtaChapters(row.id, chapters)}
                  />
                </div>

                {/* Job Number — only for Base/Line */}
                {!isSimple && (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Number</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[row.id]?.click()}
                        disabled={uploading[row.id]}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors flex-shrink-0 ${
                          row.jobNumberPhotoPath
                            ? 'border-green-300 bg-green-50 text-green-600'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        title={row.jobNumberPhotoPath ? 'Photo uploaded' : 'Upload job card photo'}
                      >
                        {uploading[row.id] ? (
                          <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={row.jobNumber}
                        onChange={e => updateRow(row.id, 'jobNumber', e.target.value)}
                        className="flex-1 text-sm h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <input
                        ref={el => { fileInputRefs.current[row.id] = el }}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleJobPhotoUpload(row.id, file)
                        }}
                      />
                    </div>
                    {row.jobNumberPhotoPath && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600">Photo attached</span>
                        <button
                          type="button"
                          onClick={() => updateRow(row.id, 'jobNumberPhotoPath', null)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Task Type(s) */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Task Type(s)</label>
                  <TagSelect
                    options={TASK_TYPES}
                    selected={row.taskTypes}
                    onChange={v => updateRow(row.id, 'taskTypes', v)}
                    multi
                  />
                </div>

                {/* Task Detail */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Task Detail</label>
                  <textarea
                    value={row.taskDetail}
                    onChange={e => updateRow(row.id, 'taskDetail', e.target.value)}
                    rows={3}
                    className="w-full text-sm px-3 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => saveRow(row.id)}
                    disabled={row.saving || !canSave}
                  >
                    {row.saving ? 'Saving...' : isEditing ? 'UPDATE' : 'SAVE'}
                  </Button>
                  {!isEditing && unsavedRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                  {!canSave && row.taskDate && (
                    <span className="text-xs text-amber-600">
                      {!dateValid ? 'Invalid date' : !row.aircraftCategory ? 'Select licence category' : !isSimple && !row.aircraftRegistration ? 'Enter registration' : ''}
                    </span>
                  )}
                  {row.saving && (
                    <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {row.saveError && (
                    <span className="text-xs text-red-600">{row.saveError}</span>
                  )}
                </div>

                {/* Delete — edit mode only */}
                {isEditing && (
                  <div className="flex items-center gap-3 pt-3 mt-3 border-t border-border">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete this entry
                      </button>
                    ) : (
                      <Fragment>
                        <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </Fragment>
                    )}
                  </div>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
    </Fragment>
  )
}
