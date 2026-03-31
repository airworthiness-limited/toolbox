'use client'

import { useState, Fragment, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

const FACILITY_OPTIONS: { value: MaintenanceType; label: string }[] = [
  { value: 'base_maintenance', label: 'Base Maintenance' },
  { value: 'line_maintenance', label: 'Line Maintenance' },
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
  options: readonly string[] | { value: string; label: string }[]
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
      {items.map(item => {
        const isSelected = selectedArr.includes(item.value)
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => toggle(item.value)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#1565C0] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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

interface MassInputProps {
  defaultEmployer: string
  lastMaintenanceType?: MaintenanceType
}

export function MassInput({ defaultEmployer, lastMaintenanceType }: MassInputProps) {
  const router = useRouter()
  const [rows, setRows] = useState<DraftRow[]>([
    newRow({ employer: defaultEmployer, maintenanceType: lastMaintenanceType }),
  ])
  const [typeSearch, setTypeSearch] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function updateRow(id: string, field: keyof DraftRow, value: unknown) {
    setRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: value, saved: false } : r)
      const lastRow = updated[updated.length - 1]
      if (lastRow.id === id && !lastRow.saved) {
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

    const { error } = await supabase.from('logbook_entries').insert({
      user_id: user.id,
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
    })

    if (!error) {
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
      if (expandedId === id) setExpandedId(null)
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
    if (expandedId === id) setExpandedId(null)
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Date</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Reg</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Aircraft Type</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">ATA</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Detail</th>
            <th className="px-3 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {unsavedRows.map((row) => {
            const isExpanded = expandedId === row.id
            const isSimple = NO_AIRCRAFT_REQUIRED.includes(row.maintenanceType)
            const dateValid = !!row.taskDate
            const canSave = dateValid && row.aircraftCategory && (isSimple || row.aircraftRegistration)

            return (
              <Fragment key={row.id}>
                {/* Compact inline row */}
                <tr className={`${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'} transition-colors`}>
                  {/* Date */}
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={row.taskDate}
                      onChange={e => updateRow(row.id, 'taskDate', e.target.value)}
                      className="w-full text-sm h-8 px-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  {/* Registration */}
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={row.aircraftRegistration}
                      onChange={e => updateRow(row.id, 'aircraftRegistration', e.target.value.toUpperCase())}
                      placeholder={isSimple ? 'N/A' : 'G-ABCD'}
                      disabled={isSimple}
                      className="w-full text-sm h-8 px-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </td>

                  {/* Aircraft Type with autocomplete */}
                  <td className="px-2 py-2 relative">
                    <input
                      type="text"
                      value={row.id in typeSearch ? typeSearch[row.id] : row.aircraftType}
                      onChange={e => {
                        setTypeSearch(prev => ({ ...prev, [row.id]: e.target.value }))
                        updateRow(row.id, 'aircraftType', e.target.value)
                      }}
                      placeholder={isSimple ? 'N/A' : 'Search type...'}
                      disabled={isSimple}
                      className="w-full text-sm h-8 px-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {getTypeResults(row.id).length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                            className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {t.rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* ATA — click to expand */}
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      className="w-full text-left min-h-8 flex items-center"
                    >
                      {row.ataChapters.length > 0 ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {row.ataChapters[0]}{row.ataChapters.length > 1 ? ` +${row.ataChapters.length - 1}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">+ Add ATA</span>
                      )}
                    </button>
                  </td>

                  {/* Task Detail inline */}
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={row.taskDetail}
                      onChange={e => updateRow(row.id, 'taskDetail', e.target.value)}
                      placeholder="Task description..."
                      className="w-full text-sm h-8 px-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => saveRow(row.id)}
                        disabled={row.saving || !canSave}
                        className="text-xs font-bold px-2.5 py-1 bg-[#1565C0] text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1565C0]/90 transition-colors"
                      >
                        {row.saving ? '...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className={`w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                        title="Expand details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-gray-50/60 border-t border-blue-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Experience Type */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Experience Type</p>
                          <TagSelect
                            options={FACILITY_OPTIONS}
                            selected={row.maintenanceType}
                            onChange={v => updateRow(row.id, 'maintenanceType', v as MaintenanceType)}
                          />
                        </div>

                        {/* Licence Category */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Licence Category</p>
                          <TagSelect
                            options={CATEGORY_OPTIONS}
                            selected={row.aircraftCategory}
                            onChange={v => updateRow(row.id, 'aircraftCategory', v as string)}
                          />
                        </div>

                        {/* Employer */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Employer</p>
                          <input
                            type="text"
                            value={row.employer}
                            onChange={e => updateRow(row.id, 'employer', e.target.value)}
                            placeholder="Organisation / Employer"
                            className="w-full text-sm h-9 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Job Number */}
                        {!isSimple && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Job Number</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[row.id]?.click()}
                                disabled={uploading[row.id]}
                                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors flex-shrink-0 ${
                                  row.jobNumberPhotoPath
                                    ? 'border-green-300 bg-green-50 text-green-600'
                                    : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                                title={row.jobNumberPhotoPath ? 'Photo uploaded' : 'Upload job card photo'}
                              >
                                {uploading[row.id] ? (
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                  </svg>
                                )}
                              </button>
                              <input
                                type="text"
                                value={row.jobNumber}
                                onChange={e => updateRow(row.id, 'jobNumber', e.target.value)}
                                placeholder="Job card number"
                                className="flex-1 text-sm h-9 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                        {/* Task Types */}
                        <div className={!isSimple ? '' : 'sm:col-span-2'}>
                          <p className="text-xs font-medium text-gray-500 mb-2">Task Type(s)</p>
                          <TagSelect
                            options={TASK_TYPES}
                            selected={row.taskTypes}
                            onChange={v => updateRow(row.id, 'taskTypes', v)}
                            multi
                          />
                        </div>

                        {/* ATA Chapters */}
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-gray-500 mb-1.5">ATA Chapter(s)</p>
                          <AtaSearch
                            selected={row.ataChapters}
                            onChange={chapters => updateAtaChapters(row.id, chapters)}
                          />
                        </div>

                        {/* Task Detail */}
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Task Detail</p>
                          <textarea
                            value={row.taskDetail}
                            onChange={e => updateRow(row.id, 'taskDetail', e.target.value)}
                            rows={2}
                            placeholder="Full task description..."
                            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>

                      {/* Expanded actions */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => saveRow(row.id)}
                          disabled={row.saving || !canSave}
                          className="text-sm font-bold px-4 py-1.5 bg-[#1565C0] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1565C0]/90 transition-colors"
                        >
                          {row.saving ? 'Saving...' : 'Save as Draft'}
                        </button>
                        {unsavedRows.length > 1 && (
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
                            {!row.aircraftCategory ? 'Select licence category' : !isSimple && !row.aircraftRegistration ? 'Enter registration' : ''}
                          </span>
                        )}
                        {row.saveError && (
                          <span className="text-xs text-red-600">{row.saveError}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
