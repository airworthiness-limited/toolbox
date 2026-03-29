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
    return ATA_2200_CHAPTERS.map(ch => ({ code: ch.value, count: counts[ch.value] }))
  }, [filtered])

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

      <div className="overflow-x-auto">
        {/* Chart wrapper: bar area is 160px tall, labels 40px below */}
        <div className="flex" style={{ paddingTop: 12 }}>
          {/* Left: Y-axis labels */}
          <div className="relative flex-shrink-0" style={{ width: 24, height: 160 }}>
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

          {/* Middle: bars + x labels */}
          <div className="flex-1 min-w-0">
            {/* Bar area with grid lines inside */}
            <div className="relative border-l border-b border-gray-300" style={{ height: 160 }}>

              {/* Grid lines inside bar area */}
              {yTicks.filter(t => t > 0).map(tick => (
                <div
                  key={`grid-${tick}`}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ bottom: `${(tick / maxCount) * 100}%` }}
                />
              ))}

              {/* Target line inside bar area */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-green-400 z-10"
                style={{ bottom: `${(ATA_SUB_CHAPTER_TARGET / maxCount) * 100}%` }}
              >
                <span className="absolute -top-4 left-2 text-[10px] text-green-600 font-medium">Target: {ATA_SUB_CHAPTER_TARGET}</span>
              </div>

              {/* Bars */}
              <div className="flex items-end gap-0 h-full">
                {ataCounts.map(({ code, count }) => {
                  const pct = count > 0 ? (count / maxCount) * 100 : 0
                  const meetsTarget = count >= ATA_SUB_CHAPTER_TARGET
                  return (
                    <div key={code} className="flex-1 min-w-[1px] flex items-end group relative">
                      <div
                        className="w-full"
                        style={{
                          height: count > 0 ? `${Math.max(1, pct)}%` : 0,
                          backgroundColor: count > 0 ? (meetsTarget ? '#22c55e' : '#60a5fa') : undefined,
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

            {/* X-axis labels */}
            <div className="flex gap-0" style={{ height: 40 }}>
              {ataCounts.map(({ code }, i) => {
                const showLabel = i % Math.max(1, Math.floor(ataCounts.length / 25)) === 0
                return (
                  <div key={`label-${code}`} className="flex-1 min-w-[1px] flex items-start justify-center pt-1">
                    {showLabel && (
                      <span className="text-[7px] text-gray-400 leading-none" style={{ writingMode: 'vertical-lr' }}>
                        {code}
                      </span>
                    )}
                  </div>
                )
              })}
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
