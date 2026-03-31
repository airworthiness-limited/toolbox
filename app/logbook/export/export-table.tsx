'use client'

import { useState, useMemo } from 'react'
import { getAtaLabel } from '@/lib/logbook/constants'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_ORDER = [
  'aeroplane_turbine',
  'aeroplane_piston',
  'helicopter_turbine',
  'helicopter_piston',
]

const CATEGORY_LABELS: Record<string, string> = {
  aeroplane_turbine: 'Aeroplane Turbine (A1/B1.1)',
  aeroplane_piston: 'Aeroplane Piston (A2/B1.2/B3)',
  helicopter_turbine: 'Helicopter Turbine (A3/B1.3)',
  helicopter_piston: 'Helicopter Piston (A4/B1.4)',
}

const FACILITY_LABELS: Record<string, string> = {
  base_maintenance: 'Base',
  line_maintenance: 'Line',
}

export interface ExportEntry {
  id: string
  task_date: string
  aircraft_type: string
  aircraft_registration: string
  job_number: string | null
  description: string | null
  ata_chapter: string | null
  maintenance_type: string | null
  aircraft_category: string | null
  work_order_photo_path: string | null
}

type ColKey = 'date' | 'facility' | 'aircraft_type' | 'registration' | 'job_number' | 'task_detail' | 'supervisor'

const DEFAULT_COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'facility', label: 'Base/Line' },
  { key: 'aircraft_type', label: 'Aircraft Type' },
  { key: 'registration', label: 'Aircraft Reg.' },
  { key: 'job_number', label: 'Job Number' },
  { key: 'task_detail', label: 'Task Detail' },
  { key: 'supervisor', label: 'Supervisor' },
]

function getCellValue(entry: ExportEntry, key: ColKey): string {
  switch (key) {
    case 'date': return new Date(entry.task_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    case 'facility': return FACILITY_LABELS[entry.maintenance_type ?? ''] ?? entry.maintenance_type ?? '-'
    case 'aircraft_type': return entry.aircraft_type ?? '-'
    case 'registration': return entry.aircraft_registration ?? '-'
    case 'job_number': return entry.job_number ?? '-'
    case 'task_detail': return entry.description ?? '-'
    case 'supervisor': return ''
  }
}


export function ExportTable({ entries }: { entries: ExportEntry[] }) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [showColPanel, setShowColPanel] = useState(false)
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set())
  const [dragOver, setDragOver] = useState<ColKey | null>(null)
  const [dragging, setDragging] = useState<ColKey | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  async function loadSignedUrl(path: string) {
    if (signedUrls[path]) return
    const supabase = createClient()
    const { data } = await supabase.storage.from('module-certificates').createSignedUrl(path, 3600)
    if (data?.signedUrl) setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }))
  }

  // Filters
  const allCategories = Array.from(new Set(entries.map(e => e.aircraft_category).filter(Boolean))) as string[]
  const allAta = Array.from(new Set(entries.map(e => e.ata_chapter?.split('-')[0]).filter(Boolean))).sort() as string[]

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER))
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set(['base_maintenance', 'line_maintenance']))
  const [selectedAta, setSelectedAta] = useState<Set<string>>(new Set(allAta))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (!selectedCategories.has(e.aircraft_category ?? '')) return false
      if (!selectedFacilities.has(e.maintenance_type ?? '')) return false
      const main = e.ata_chapter?.split('-')[0] ?? ''
      if (selectedAta.size < allAta.length && !selectedAta.has(main)) return false
      if (dateFrom && e.task_date < dateFrom) return false
      if (dateTo && e.task_date > dateTo) return false
      return true
    })
  }, [entries, selectedCategories, selectedFacilities, selectedAta, dateFrom, dateTo, allAta.length])

  // Group: by category → by full sub-chapter (XX-XX)
  const grouped = useMemo(() => {
    const catOrder = CATEGORY_ORDER.filter(c => selectedCategories.has(c))
    return catOrder.map(cat => {
      const catEntries = filtered.filter(e => e.aircraft_category === cat)
      if (catEntries.length === 0) return null
      const subChapters = Array.from(new Set(catEntries.map(e => e.ata_chapter ?? ''))).sort()
      return {
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        ataGroups: subChapters.map(chapter => ({
          ata: chapter,
          entries: catEntries.filter(e => (e.ata_chapter ?? '') === chapter).sort((a, b) => a.task_date.localeCompare(b.task_date)),
        })),
      }
    }).filter(Boolean) as { category: string; label: string; ataGroups: { ata: string; entries: ExportEntry[] }[] }[]
  }, [filtered, selectedCategories])

  const visibleCols = columns.filter(c => !hiddenCols.has(c.key))

  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleFacility(f: string) {
    setSelectedFacilities(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  function toggleAta(ata: string) {
    setSelectedAta(prev => {
      const next = new Set(prev)
      next.has(ata) ? next.delete(ata) : next.add(ata)
      return next
    })
  }

  function toggleCol(key: ColKey) {
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function moveCol(key: ColKey, dir: -1 | 1) {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.key === key)
      if (idx === -1) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  // Drag-and-drop column reorder
  function handleDragStart(key: ColKey) { setDragging(key) }
  function handleDragOver(e: React.DragEvent, key: ColKey) { e.preventDefault(); setDragOver(key) }
  function handleDrop(targetKey: ColKey) {
    if (!dragging || dragging === targetKey) { setDragging(null); setDragOver(null); return }
    setColumns(prev => {
      const next = [...prev]
      const fromIdx = next.findIndex(c => c.key === dragging)
      const toIdx = next.findIndex(c => c.key === targetKey)
      const [col] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, col)
      return next
    })
    setDragging(null)
    setDragOver(null)
  }

  const totalFiltered = filtered.length

  return (
    <div>
      {/* Filter + column panel — hidden on print */}
      <div className="print:hidden mb-6 space-y-4">

        {/* Licence Category */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Licence Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${selectedCategories.has(cat) ? 'bg-[#1565C0] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Facility */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facility</p>
          <div className="flex flex-wrap gap-2">
            {['base_maintenance', 'line_maintenance'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFacility(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${selectedFacilities.has(f) ? 'bg-[#1565C0] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {FACILITY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* ATA Group */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ATA Group</p>
            <button type="button" onClick={() => setSelectedAta(new Set(allAta))} className="text-xs text-[#1565C0] hover:underline">All</button>
            <button type="button" onClick={() => setSelectedAta(new Set())} className="text-xs text-gray-400 hover:underline">None</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allAta.map(ata => (
              <button
                key={ata}
                type="button"
                onClick={() => toggleAta(ata)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${selectedAta.has(ata) ? 'bg-[#1565C0] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {ata}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date Range</p>
          <div className="flex items-center gap-3">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {(dateFrom || dateTo) && (
              <button type="button" onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            )}
          </div>
        </div>

        {/* Columns toggle */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Columns</p>
            <button type="button" onClick={() => setShowColPanel(v => !v)} className="text-xs text-[#1565C0] hover:underline">{showColPanel ? 'Hide' : 'Customise'}</button>
          </div>
          {showColPanel && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
              {columns.map((col, idx) => (
                <div key={col.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    id={`col-${col.key}`}
                    className="rounded"
                  />
                  <label htmlFor={`col-${col.key}`} className="text-sm text-gray-700 flex-1 cursor-pointer">{col.label}</label>
                  <button type="button" disabled={idx === 0} onClick={() => moveCol(col.key, -1)} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1">▲</button>
                  <button type="button" disabled={idx === columns.length - 1} onClick={() => moveCol(col.key, 1)} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1">▼</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">{totalFiltered} entries shown</p>
      </div>

      {/* Grouped table */}
      {grouped.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No entries match the selected filters.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.category}>
              {/* Category heading */}
              <h2 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-300 print:text-sm">
                {group.label}
              </h2>

              <div className="space-y-4">
                {group.ataGroups.map(({ ata, entries: ataEntries }) => (
                  <div key={ata}>
                    {/* ATA subheading */}
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 print:text-[10px]">
                      {ata ? getAtaLabel(ata) : 'Uncategorised'}
                    </h3>
                    <div className="border rounded-lg overflow-hidden print:border-black">
                      <table className="w-full text-sm print:text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b divide-x divide-gray-200 print:divide-gray-800">
                            {visibleCols.map(col => (
                              <th
                                key={col.key}
                                draggable
                                onDragStart={() => handleDragStart(col.key)}
                                onDragOver={e => handleDragOver(e, col.key)}
                                onDrop={() => handleDrop(col.key)}
                                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                                className={`text-center px-3 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap cursor-grab print:cursor-default print:px-1 select-none ${dragOver === col.key ? 'bg-blue-50' : ''} ${dragging === col.key ? 'opacity-50' : ''}`}
                              >
                                <span className="print:hidden mr-1 text-gray-300">⠿</span>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                          {ataEntries.map(entry => (
                            <tr key={entry.id} className="divide-x divide-gray-200 print:divide-gray-800">
                              {visibleCols.map(col => (
                                <td
                                  key={col.key}
                                  className={`px-3 py-2 print:px-1 text-center ${col.key === 'task_detail' ? 'max-w-xs' : 'whitespace-nowrap'} ${col.key === 'supervisor' ? 'w-32 min-w-[8rem]' : ''}`}
                                >
                                  {col.key === 'job_number' && entry.work_order_photo_path ? (
                                    <span className="inline-flex items-center gap-1.5 justify-center">
                                      <span>{getCellValue(entry, col.key)}</span>
                                      <div className="relative group/photo print:hidden">
                                        <button
                                          type="button"
                                          onMouseEnter={() => loadSignedUrl(entry.work_order_photo_path!)}
                                          className="text-gray-400 hover:text-blue-500 transition-colors"
                                          title="View evidence"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                          </svg>
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/photo:block z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5">
                                          {signedUrls[entry.work_order_photo_path] ? (
                                            <img src={signedUrls[entry.work_order_photo_path]} alt="Evidence" className="max-w-[220px] max-h-[220px] object-contain rounded" />
                                          ) : (
                                            <div className="w-24 h-24 flex items-center justify-center text-xs text-gray-400">Loading...</div>
                                          )}
                                        </div>
                                      </div>
                                    </span>
                                  ) : getCellValue(entry, col.key)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
