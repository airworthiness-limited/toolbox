'use client'

import { useState, useMemo } from 'react'
import { ATA_SUB_CHAPTER_TARGET } from '@/lib/logbook/constants'
import { ATA_2200_CHAPTERS } from '@/lib/logbook/ata-2200'
import type { AircraftCategory } from '@/lib/logbook/constants'

interface ChartEntry {
  maintenance_type: string
  aircraft_category: string
  ata_chapters: string[] | null
}

interface AtaChartProps {
  entries: ChartEntry[]
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'aircraft', label: 'Aircraft Maintenance' },
  { value: 'military_experience', label: 'Military' },
  { value: 'student_experience', label: 'Student' },
]

const CATEGORY_FILTERS: { value: string; label: string; cats: AircraftCategory[] }[] = [
  { value: 'all', label: 'All', cats: [] },
  { value: 'turbine_aeroplane', label: 'Turbine Aeroplane', cats: ['aeroplane_turbine'] },
  { value: 'piston_aeroplane', label: 'Piston Aeroplane', cats: ['aeroplane_piston'] },
  { value: 'turbine_helicopter', label: 'Turbine Helicopter', cats: ['helicopter_turbine'] },
  { value: 'piston_helicopter', label: 'Piston Helicopter', cats: ['helicopter_piston'] },
  { value: 'avionics', label: 'Avionics', cats: ['aeroplane_turbine', 'aeroplane_piston', 'helicopter_turbine', 'helicopter_piston'] },
]

export function AtaChart({ entries }: AtaChartProps) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'ata' | 'most' | 'least'>('ata')

  const filtered = useMemo(() => {
    let result = entries

    if (typeFilter === 'aircraft') {
      result = result.filter(e => e.maintenance_type === 'base_maintenance' || e.maintenance_type === 'line_maintenance')
    } else if (typeFilter !== 'all') {
      result = result.filter(e => e.maintenance_type === typeFilter)
    }

    const catDef = CATEGORY_FILTERS.find(f => f.value === catFilter)
    if (catDef && catDef.cats.length > 0) {
      result = result.filter(e => catDef.cats.includes(e.aircraft_category as AircraftCategory))
    }

    return result
  }, [entries, typeFilter, catFilter])

  const ataCounts = useMemo(() => {
    // Start with all ATA 2200 chapters at 0
    const counts: Record<string, number> = {}
    for (const ch of ATA_2200_CHAPTERS) {
      counts[ch.value] = 0
    }
    // Add user's entries
    for (const entry of filtered) {
      const chapters = entry.ata_chapters ?? []
      for (const ch of chapters) {
        counts[ch] = (counts[ch] || 0) + 1
      }
    }
    const result = ATA_2200_CHAPTERS.map(ch => ({ code: ch.value, count: counts[ch.value] }))
    if (sortBy === 'most') return [...result].sort((a, b) => b.count - a.count)
    if (sortBy === 'least') return [...result].sort((a, b) => a.count - b.count)
    return result
  }, [filtered, sortBy])

  // Round max up to nearest 5, minimum 15 so target line has room above
  const rawMax = Math.max(15, ...ataCounts.map(a => a.count))
  const maxCount = Math.ceil(rawMax / 5) * 5

  // Y-axis ticks in increments of 5
  const yTicks: number[] = []
  for (let i = 0; i <= maxCount; i += 5) yTicks.push(i)

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 mb-6 text-center text-gray-400">
        <p className="text-sm">Add logbook entries to see your ATA distribution chart.</p>
        <p className="text-xs mt-1">The practical experience shall involve a representative cross section of maintenance tasks on aircraft.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 mb-6">
      {/* Filters */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700">Tasks by ATA</h2>

        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters + sort on second row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCatFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                catFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {([['ata', 'ATA Order'], ['most', 'Most Tasks'], ['least', 'Least Tasks']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                sortBy === val
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable chart with fixed-width bars */}
      <div className="flex" style={{ paddingTop: 12 }}>
        {/* Y-axis labels (sticky left) */}
        <div className="relative flex-shrink-0 sticky left-0 bg-white z-10" style={{ width: 24, height: 180 }}>
          {yTicks.map(tick => {
            const pct = (1 - tick / maxCount) * 100
            return (
              <div
                key={tick}
                className="absolute text-[10px] leading-none text-gray-400 text-right flex items-center"
                style={{ top: `calc(${pct}% - 5px)`, left: 0, right: 2, height: 10 }}
              >
                {tick}
              </div>
            )
          })}
        </div>

        {/* Scrollable bar area */}
        <div className="overflow-x-auto flex-1">
          <div style={{ width: ataCounts.length * 8 + 2, minWidth: '100%' }}>
            {/* Bar area */}
            <div className="relative border-l border-b border-gray-300" style={{ height: 180 }}>

              {yTicks.filter(t => t > 0).map(tick => (
                <div
                  key={`grid-${tick}`}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ bottom: `${(tick / maxCount) * 100}%` }}
                />
              ))}

              <div
                className="absolute left-0 right-0 border-t-2 border-dashed z-10"
                style={{ bottom: `${(ATA_SUB_CHAPTER_TARGET / maxCount) * 100}%`, borderColor: '#22c55e' }}
              >
                <span className="absolute -top-4 left-2 text-[10px] font-medium" style={{ color: '#22c55e' }}>Target: {ATA_SUB_CHAPTER_TARGET}</span>
              </div>

              <div className="flex items-end h-full" style={{ gap: 1 }}>
                {ataCounts.map(({ code, count }) => {
                  const pct = count > 0 ? (count / maxCount) * 100 : 0
                  const meetsTarget = count >= ATA_SUB_CHAPTER_TARGET
                  return (
                    <div key={code} className="flex items-end group relative" style={{ width: 7 }}>
                      <div
                        className="rounded-t-sm"
                        style={{
                          width: 7,
                          height: count > 0 ? `${Math.max(2, pct)}%` : 1,
                          backgroundColor: count > 0 ? (meetsTarget ? '#22c55e' : '#60a5fa') : '#e5e7eb',
                        }}
                      />
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                        {code}: {count} task{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* X-axis labels — every single ATA shown */}
            <div className="flex" style={{ gap: 1, height: 48 }}>
              {ataCounts.map(({ code }) => (
                <div key={`label-${code}`} className="flex items-start justify-center pt-1" style={{ width: 7 }}>
                  <span className="text-[6px] text-gray-400 leading-none" style={{ writingMode: 'vertical-lr' }}>
                    {code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        The practical experience shall involve a representative cross section of maintenance tasks on aircraft.
      </p>
    </div>
  )
}
