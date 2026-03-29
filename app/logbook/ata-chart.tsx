'use client'

import { useState, useMemo } from 'react'
import { ATA_SUB_CHAPTER_TARGET } from '@/lib/logbook/constants'
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
    const counts: Record<string, number> = {}
    for (const entry of filtered) {
      const chapters = entry.ata_chapters ?? []
      for (const ch of chapters) {
        counts[ch] = (counts[ch] || 0) + 1
      }
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => ({ code, count }))
  }, [filtered])

  // Round max up to nearest 5
  const rawMax = Math.max(ATA_SUB_CHAPTER_TARGET, ...ataCounts.map(a => a.count))
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

      {/* Category filters on second row */}
      <div className="flex gap-2 flex-wrap mb-4">
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

      {ataCounts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tasks match the selected filters.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <div className="relative border-l border-b border-gray-200 pl-8" style={{ minHeight: 220, paddingBottom: 60 }}>

            {/* Y-axis ticks (increments of 5) */}
            {yTicks.map(tick => (
              <div
                key={tick}
                className="absolute left-0 text-[10px] text-gray-400 -translate-y-1/2"
                style={{ bottom: `calc(${(tick / maxCount) * 100}% + 60px)` }}
              >
                {tick}
              </div>
            ))}

            {/* Horizontal grid lines at each 5 */}
            {yTicks.map(tick => (
              <div
                key={`grid-${tick}`}
                className="absolute left-8 right-0 border-t border-gray-100"
                style={{ bottom: `calc(${(tick / maxCount) * 100}% + 60px)` }}
              />
            ))}

            {/* Target line at 10 */}
            <div
              className="absolute left-8 right-0 border-t-2 border-dashed border-green-400 z-10"
              style={{ bottom: `calc(${(ATA_SUB_CHAPTER_TARGET / maxCount) * 100}% + 60px)` }}
            >
              <span className="absolute -top-4 right-0 text-[10px] text-green-600 font-medium">Target: {ATA_SUB_CHAPTER_TARGET}</span>
            </div>

            {/* Bars + X-axis labels */}
            <div className="flex items-end gap-[2px] ml-8" style={{ height: 220 }}>
              {ataCounts.map(({ code, count }) => {
                const height = (count / maxCount) * 100
                const meetsTarget = count >= ATA_SUB_CHAPTER_TARGET
                return (
                  <div key={code} className="flex-1 min-w-[14px] max-w-[24px] flex flex-col items-center group relative">
                    {/* Bar */}
                    <div className="w-full flex items-end" style={{ height: '160px' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${meetsTarget ? 'bg-green-500' : 'bg-blue-400'}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    {/* X label (vertical) */}
                    <div className="h-[60px] flex items-start justify-center pt-1">
                      <span className="text-[9px] text-gray-500 font-medium" style={{ writingMode: 'vertical-lr' }}>
                        {code}
                      </span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                      {code}: {count} task{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-1">ATA Chapter</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        The practical experience shall involve a representative cross section of maintenance tasks on aircraft.
      </p>
    </div>
  )
}
