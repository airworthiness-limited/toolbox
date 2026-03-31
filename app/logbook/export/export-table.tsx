'use client'

import { useState, useMemo } from 'react'

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
  base_maintenance: 'Base Maintenance',
  line_maintenance: 'Line Maintenance',
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
}

type ColKey = 'date' | 'facility' | 'aircraft_type' | 'registration' | 'job_number' | 'ata_group' | 'task_detail' | 'supervisor'

const DEFAULT_COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'facility', label: 'Facility' },
  { key: 'aircraft_type', label: 'Aircraft Type' },
  { key: 'registration', label: 'Aircraft Registration' },
  { key: 'job_number', label: 'Job Number' },
  { key: 'ata_group', label: 'ATA Group' },
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
    case 'ata_group': return entry.ata_chapter ?? '-'
    case 'task_detail': return entry.description ?? '-'
    case 'supervisor': return ''
  }
}

function mainAta(chapter: string | null): string {
  if (!chapter) return 'Uncategorised'
  const main = chapter.split('-')[0]
  return `ATA ${main}`
}

export function ExportTable({ entries }: { entries: ExportEntry[] }) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [showColPanel, setShowColPanel] = useState(false)
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set())
  const [dragOver, setDragOver] = useState<ColKey | null>(null)
  const [dragging, setDragging] = useState<ColKey | null>(null)

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

  // Group: by category → by main ATA chapter
  const grouped = useMemo(() => {
    const catOrder = CATEGORY_ORDER.filter(c => selectedCategories.has(c))
    return catOrder.map(cat => {
      const catEntries = filtered.filter(e => e.aircraft_category === cat)
      if (catEntries.length === 0) return null
      const ataGroups = Array.from(new Set(catEntries.map(e => e.ata_chapter?.split('-')[0] ?? ''))).sort((a, b) => Number(a) - Number(b))
      return {
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        ataGroups: ataGroups.map(ata => ({
          ata,
          entries: catEntries.filter(e => (e.ata_chapter?.split('-')[0] ?? '') === ata).sort((a, b) => a.task_date.localeCompare(b.task_date)),
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
                      ATA {ata}
                    </h3>
                    <div className="border rounded-lg overflow-hidden print:border-black">
                      <table className="w-full text-sm print:text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            {visibleCols.map(col => (
                              <th
                                key={col.key}
                                draggable
                                onDragStart={() => handleDragStart(col.key)}
                                onDragOver={e => handleDragOver(e, col.key)}
                                onDrop={() => handleDrop(col.key)}
                                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                                className={`text-left px-3 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap cursor-grab print:cursor-default print:px-1 select-none ${dragOver === col.key ? 'bg-blue-50' : ''} ${dragging === col.key ? 'opacity-50' : ''}`}
                              >
                                <span className="print:hidden mr-1 text-gray-300">⠿</span>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                          {ataEntries.map(entry => (
                            <tr key={entry.id}>
                              {visibleCols.map(col => (
                                <td
                                  key={col.key}
                                  className={`px-3 py-2 print:px-1 ${col.key === 'task_detail' ? 'max-w-xs' : 'whitespace-nowrap'} ${col.key === 'supervisor' ? 'border-l border-gray-200 print:border-black w-32 min-w-[8rem]' : ''}`}
                                >
                                  {getCellValue(entry, col.key)}
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
