'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MAINTENANCE_TYPES,
  AIRCRAFT_CATEGORIES,
  NO_AIRCRAFT_REQUIRED,
} from '@/lib/logbook/constants'
import type { MaintenanceType, AircraftCategory } from '@/lib/logbook/constants'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import { AtaSearch } from './ata-search'

interface DraftRow {
  id: string
  taskDate: string
  maintenanceType: MaintenanceType
  aircraftCategory: AircraftCategory | ''
  aircraftRegistration: string
  aircraftType: string
  ataChapters: string[]
  jobNumber: string
  taskDetail: string
  employer: string
  saving: boolean
  saved: boolean
}

function newRow(defaults: Partial<DraftRow> = {}): DraftRow {
  return {
    id: crypto.randomUUID(),
    taskDate: '',
    maintenanceType: defaults.maintenanceType ?? 'line_maintenance',
    aircraftCategory: defaults.aircraftCategory ?? '',
    aircraftRegistration: '',
    aircraftType: '',
    ataChapters: [],
    jobNumber: '',
    taskDetail: '',
    employer: defaults.employer ?? '',
    saving: false,
    saved: false,
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

  function updateRow(id: string, field: keyof DraftRow, value: unknown) {
    setRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: value, saved: false } : r)
      // If editing the last row, add a blank row below
      const lastRow = updated[updated.length - 1]
      if (lastRow.id === id && !lastRow.saved) {
        const hasContent = lastRow.taskDate || lastRow.jobNumber || lastRow.taskDetail
        if (hasContent && updated.filter(r => !r.saved).length === 1) {
          updated.push(newRow({
            employer: lastRow.employer,
            maintenanceType: lastRow.maintenanceType,
            aircraftCategory: lastRow.aircraftCategory,
          }))
        }
      }
      return updated
    })
  }

  function updateAtaChapters(id: string, chapters: string[]) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ataChapters: chapters, saved: false } : r))
  }

  async function saveRow(id: string) {
    const row = rows.find(r => r.id === id)
    if (!row || !row.taskDate || !row.jobNumber) return

    const isNoAircraft = NO_AIRCRAFT_REQUIRED.includes(row.maintenanceType)

    setRows(prev => prev.map(r => r.id === id ? { ...r, saving: true } : r))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('logbook_entries').insert({
      user_id: user.id,
      task_date: row.taskDate,
      maintenance_type: row.maintenanceType,
      aircraft_category: isNoAircraft ? 'aeroplane_turbine' : (row.aircraftCategory || 'aeroplane_turbine'),
      aircraft_registration: isNoAircraft ? 'N/A' : row.aircraftRegistration.toUpperCase(),
      aircraft_type: isNoAircraft ? 'N/A' : row.aircraftType,
      ata_chapter: row.ataChapters[0] ?? '',
      ata_chapters: row.ataChapters,
      job_number: row.jobNumber,
      description: row.taskDetail,
      employer: row.employer,
      category: row.maintenanceType === 'base_maintenance' ? 'base_maintenance' : 'line_maintenance',
      duration_hours: 0,
      supervised: true,
      status: 'draft',
    })

    if (!error) {
      setRows(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, saving: false, saved: true } : r)
        // Ensure there's always a blank row at the end
        const unsaved = updated.filter(r => !r.saved)
        if (unsaved.length === 0) {
          updated.push(newRow({
            employer: row.employer,
            maintenanceType: row.maintenanceType,
            aircraftCategory: row.aircraftCategory,
          }))
        }
        return updated
      })
      router.refresh()
    } else {
      setRows(prev => prev.map(r => r.id === id ? { ...r, saving: false } : r))
    }
  }

  function removeRow(id: string) {
    setRows(prev => {
      const updated = prev.filter(r => r.id !== id)
      if (updated.length === 0) updated.push(newRow({ employer: defaultEmployer }))
      return updated
    })
  }

  // Aircraft type search filtered results
  function getTypeResults(rowId: string): typeof UK_TYPE_RATINGS {
    const q = (typeSearch[rowId] ?? '').toLowerCase()
    if (q.length < 2) return []
    return UK_TYPE_RATINGS.filter(t =>
      t.rating.toLowerCase().includes(q) ||
      t.make.toLowerCase().includes(q) ||
      t.model.toLowerCase().includes(q)
    ).slice(0, 10)
  }

  return (
    <div className="space-y-3">
      {rows.filter(r => !r.saved).map(row => {
        const isNoAircraft = NO_AIRCRAFT_REQUIRED.includes(row.maintenanceType)
        const canSave = row.taskDate && row.jobNumber && (isNoAircraft || row.aircraftRegistration)

        return (
          <div key={row.id} className="bg-white rounded-xl p-4 border border-gray-200">
            {/* Row 1: Date, Maintenance Type, Category, Employer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <Input
                  type="date"
                  value={row.taskDate}
                  onChange={e => updateRow(row.id, 'taskDate', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance Type</label>
                <Select value={row.maintenanceType} onValueChange={v => updateRow(row.id, 'maintenanceType', v)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map(mt => (
                      <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isNoAircraft && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <Select value={row.aircraftCategory} onValueChange={v => updateRow(row.id, 'aircraftCategory', v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {AIRCRAFT_CATEGORIES.map(ac => (
                        <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Employer</label>
                <Input
                  type="text"
                  value={row.employer}
                  onChange={e => updateRow(row.id, 'employer', e.target.value)}
                  placeholder="Current employer"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Row 2: Aircraft Reg, Aircraft Type (if applicable) */}
            {!isNoAircraft && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Aircraft Registration</label>
                  <Input
                    type="text"
                    value={row.aircraftRegistration}
                    onChange={e => updateRow(row.id, 'aircraftRegistration', e.target.value.toUpperCase())}
                    placeholder="e.g. G-ABCD"
                    className="text-sm uppercase"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Aircraft Type</label>
                  <Input
                    type="text"
                    value={typeSearch[row.id] ?? row.aircraftType}
                    onChange={e => {
                      setTypeSearch(prev => ({ ...prev, [row.id]: e.target.value }))
                      updateRow(row.id, 'aircraftType', e.target.value)
                    }}
                    placeholder="Search aircraft type..."
                    className="text-sm"
                  />
                  {getTypeResults(row.id).length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {getTypeResults(row.id).map(t => (
                        <button
                          key={t.rating}
                          type="button"
                          onClick={() => {
                            updateRow(row.id, 'aircraftType', t.rating)
                            setTypeSearch(prev => ({ ...prev, [row.id]: '' }))
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {t.rating}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Row 3: ATA Chapters, Job Number */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ATA Chapters</label>
                <AtaSearch
                  selected={row.ataChapters}
                  onChange={chapters => updateAtaChapters(row.id, chapters)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Job Number</label>
                <Input
                  type="text"
                  value={row.jobNumber}
                  onChange={e => updateRow(row.id, 'jobNumber', e.target.value)}
                  placeholder="Work order reference"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Row 4: Task Detail */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Task Detail</label>
              <Input
                type="text"
                value={row.taskDetail}
                onChange={e => updateRow(row.id, 'taskDetail', e.target.value)}
                placeholder="Description of work carried out"
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                onClick={() => saveRow(row.id)}
                disabled={row.saving || !canSave}
              >
                {row.saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              {rows.filter(r => !r.saved).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
