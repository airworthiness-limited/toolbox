'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAtaLabel } from '@/lib/logbook/constants'
import { createClient } from '@/lib/supabase/client'

function parseDateFilter(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ''
}

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

function extractTaskTypes(description: string | null): string[] {
  if (!description) return []
  const match = description.match(/^\[([^\]]+)\]/)
  return match ? match[1].split(',').map(t => t.trim()).filter(Boolean) : []
}

function stripTaskTypePrefix(description: string | null): string {
  return description?.replace(/^\[[^\]]+\]\s*/, '') || '-'
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

type ColKey = 'date' | 'facility' | 'aircraft_type' | 'registration' | 'job_number' | 'task_type' | 'task_detail' | 'supervisor'

const DEFAULT_COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'aircraft_type', label: 'Aircraft Type' },
  { key: 'registration', label: 'Registration' },
  { key: 'job_number', label: 'Job Number' },
  { key: 'task_type', label: 'Task Type' },
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
    case 'task_type': return extractTaskTypes(entry.description).join(', ') || '-'
    case 'task_detail': return stripTaskTypePrefix(entry.description)
    case 'supervisor': return ''
  }
}


export function ExportTable({ entries }: { entries: ExportEntry[] }) {
  const router = useRouter()
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
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (!selectedCategories.has(e.aircraft_category ?? '')) return false
      if (!selectedFacilities.has(e.maintenance_type ?? '')) return false
      const main = e.ata_chapter?.split('-')[0] ?? ''
      if (selectedAta.size < allAta.length && !selectedAta.has(main)) return false
      const fromIso = parseDateFilter(dateFrom)
      const toIso = parseDateFilter(dateTo)
      if (fromIso && e.task_date < fromIso) return false
      if (toIso && e.task_date > toIso) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = [
          e.description,
          e.aircraft_type,
          e.aircraft_registration,
          e.job_number,
          e.ata_chapter,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, selectedCategories, selectedFacilities, selectedAta, dateFrom, dateTo, search, allAta.length])

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
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Licence Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${selectedCategories.has(cat) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Facility */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Facility</p>
          <div className="flex flex-wrap gap-2">
            {['base_maintenance', 'line_maintenance'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFacility(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${selectedFacilities.has(f) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {FACILITY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* ATA Group */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ATA Group</p>
            <button type="button" onClick={() => setSelectedAta(new Set(allAta))} className="text-xs text-primary hover:underline">All</button>
            <button type="button" onClick={() => setSelectedAta(new Set())} className="text-xs text-muted-foreground hover:underline">None</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allAta.map(ata => (
              <button
                key={ata}
                type="button"
                onClick={() => toggleAta(ata)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${selectedAta.has(ata) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {ata}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value.replace(/[^\d/]/g, '').slice(0, 10))}
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className="text-sm h-10 px-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring w-32"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="text"
              value={dateTo}
              onChange={e => setDateTo(e.target.value.replace(/[^\d/]/g, '').slice(0, 10))}
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className="text-sm h-10 px-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring w-32"
            />
            {(dateFrom || dateTo) && (
              <button type="button" onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            )}
          </div>
        </div>

        {/* Search */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Search</p>
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder=""
              className="w-full text-sm h-9 pl-8 pr-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Columns toggle */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Columns</p>
            <button type="button" onClick={() => setShowColPanel(v => !v)} className="text-xs text-primary hover:underline">{showColPanel ? 'Hide' : 'Customise'}</button>
          </div>
          {showColPanel && (
            <div className="bg-muted border rounded-lg p-3 space-y-1">
              {columns.map((col, idx) => (
                <div key={col.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    id={`col-${col.key}`}
                    className="rounded"
                  />
                  <label htmlFor={`col-${col.key}`} className="text-sm text-foreground flex-1 cursor-pointer">{col.label}</label>
                  <button type="button" disabled={idx === 0} onClick={() => moveCol(col.key, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs px-1">▲</button>
                  <button type="button" disabled={idx === columns.length - 1} onClick={() => moveCol(col.key, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs px-1">▼</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{totalFiltered} entries shown</p>
      </div>

      {/* Grouped table */}
      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No entries match the selected filters.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.category}>
              {/* Category heading */}
              <h2 className="text-base font-bold text-foreground mb-3 pb-1 border-b-2 border-border print:text-sm">
                {group.label}
              </h2>

              <div className="space-y-4">
                {group.ataGroups.map(({ ata, entries: ataEntries }, ataIdx) => (
                  <div key={ata}>
                    {/* ATA subheading */}
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 print:text-[10px]">
                      {ata ? getAtaLabel(ata) : 'Uncategorised'}
                    </h3>
                    <div className="border rounded-lg print:border-black">
                      <table className="w-full text-sm print:text-xs border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-muted">
                            <th className="w-8 px-1 py-2 border-b border-border print:hidden rounded-tl-lg" />
                            {visibleCols.map((col, colIdx) => (
                              <th
                                key={col.key}
                                draggable
                                onDragStart={() => handleDragStart(col.key)}
                                onDragOver={e => handleDragOver(e, col.key)}
                                onDrop={() => handleDrop(col.key)}
                                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                                className={`text-center px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-grab print:cursor-default print:px-1 select-none border-b border-l border-border print:border-gray-800 ${colIdx === visibleCols.length - 1 ? 'rounded-tr-lg' : ''} ${colIdx === 0 ? 'border-l-0' : ''} ${dragOver === col.key ? 'bg-accent' : ''} ${dragging === col.key ? 'opacity-50' : ''}`}
                              >
                                <span className="print:hidden mr-1 text-muted-foreground/40">⠿</span>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ataEntries.map(entry => (
                            <tr key={entry.id}>
                              <td className="px-1 py-2 text-center print:hidden border-t border-border">
                                <button
                                  type="button"
                                  onClick={() => router.push('/logbook?edit=' + entry.id)}
                                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                                  title="Edit entry"
                                >
                                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                </button>
                              </td>
                              {visibleCols.map(col => (
                                <td
                                  key={col.key}
                                  className={`px-3 py-2 print:px-1 text-center align-middle border-t border-l border-border print:border-gray-800 ${col.key === 'task_detail' ? 'max-w-xs' : col.key === 'task_type' ? 'max-w-[160px] w-[160px]' : 'whitespace-nowrap'} ${col.key === 'supervisor' ? 'w-32 min-w-[8rem]' : ''}`}
                                >
                                  {col.key === 'task_type' ? (() => {
                                    const types = extractTaskTypes(entry.description)
                                    if (types.length === 0) return <span className="text-muted-foreground/40">—</span>
                                    return (
                                      <div className="flex flex-wrap gap-1 justify-center items-center mx-auto">
                                        {types.map(t => (
                                          <span key={t} className="inline-block text-xs bg-muted text-foreground border border-border rounded px-1.5 py-0.5 leading-tight">{t}</span>
                                        ))}
                                      </div>
                                    )
                                  })() : col.key === 'job_number' && entry.work_order_photo_path ? (
                                    <span className="inline-flex items-center gap-1.5 justify-center">
                                      <span>{getCellValue(entry, col.key)}</span>
                                      <div className="relative inline-flex items-center group/photo print:hidden">
                                        <button
                                          type="button"
                                          onMouseEnter={() => loadSignedUrl(entry.work_order_photo_path!)}
                                          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                                          title="View evidence"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                          </svg>
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/photo:block z-50 bg-popover border rounded-lg shadow-xl p-1.5">
                                          {signedUrls[entry.work_order_photo_path] ? (
                                            <img src={signedUrls[entry.work_order_photo_path]} alt="Evidence" className="max-w-[220px] max-h-[220px] object-contain rounded" />
                                          ) : (
                                            <div className="w-24 h-24 flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
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
