'use client'

import { useState, useMemo } from 'react'
import { ATA_SUB_CHAPTER_TARGET, CATEGORY_TO_AIRCRAFT } from '@/lib/logbook/constants'

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

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'A1', label: 'A1' },
  { value: 'B1.1', label: 'B1.1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1.2', label: 'B1.2' },
  { value: 'B3', label: 'B3' },
  { value: 'A3', label: 'A3' },
  { value: 'B1.3', label: 'B1.3' },
  { value: 'A4', label: 'A4' },
  { value: 'B1.4', label: 'B1.4' },
  { value: 'B2', label: 'B2' },
]

export function AtaChart({ entries }: AtaChartProps) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = entries

    // Filter by maintenance type
    if (typeFilter === 'aircraft') {
      result = result.filter(e => e.maintenance_type === 'base_maintenance' || e.maintenance_type === 'line_maintenance')
    } else if (typeFilter !== 'all') {
      result = result.filter(e => e.maintenance_type === typeFilter)
    }

    // Filter by AML category (maps to aircraft_category values)
    if (catFilter !== 'all') {
      const cats = CATEGORY_TO_AIRCRAFT[catFilter] ?? []
      if (cats.length > 0) {
        result = result.filter(e => cats.includes(e.aircraft_category))
      }
    }

    return result
  }, [entries, typeFilter, catFilter])

  // Count tasks per ATA sub-chapter
  const ataCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of filtered) {
      const chapters = entry.ata_chapters ?? []
      for (const ch of chapters) {
        counts[ch] = (counts[ch] || 0) + 1
      }
    }
    // Sort by ATA code
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => ({ code, count }))
  }, [filtered])

  const maxCount = Math.max(ATA_SUB_CHAPTER_TARGET, ...ataCounts.map(a => a.count))

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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700">Tasks by ATA</h2>

        <div className="flex gap-2 flex-wrap">
          {/* Type filter */}
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

          <span className="text-gray-300">|</span>

          {/* Category filter */}
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCatFilter(f.value)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                catFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {ataCounts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tasks match the selected filters.</p>
      ) : (
        <div className="relative">
          {/* Y-axis label */}
          <p className="text-[10px] text-gray-400 mb-1">Tasks</p>

          {/* Chart area */}
          <div className="relative border-l border-b border-gray-200 pl-8 pb-6" style={{ minHeight: 200 }}>

            {/* Y-axis ticks */}
            {[0, Math.ceil(maxCount / 4), Math.ceil(maxCount / 2), Math.ceil(maxCount * 3 / 4), maxCount].map((tick, i) => (
              <div
                key={i}
                className="absolute left-0 text-[10px] text-gray-400 -translate-y-1/2"
                style={{ bottom: `${(tick / maxCount) * 100}%`, paddingBottom: 24 }}
              >
                {tick}
              </div>
            ))}

            {/* Target line at 10 */}
            <div
              className="absolute left-8 right-0 border-t-2 border-dashed border-green-400 z-10"
              style={{ bottom: `${(ATA_SUB_CHAPTER_TARGET / maxCount) * 100}%`, marginBottom: 24 }}
            >
              <span className="absolute -top-4 right-0 text-[10px] text-green-600 font-medium">Target: {ATA_SUB_CHAPTER_TARGET}</span>
            </div>

            {/* Bars */}
            <div className="flex items-end gap-[2px] h-[200px]">
              {ataCounts.map(({ code, count }) => {
                const height = (count / maxCount) * 100
                const meetsTarget = count >= ATA_SUB_CHAPTER_TARGET
                return (
                  <div key={code} className="flex-1 min-w-[3px] max-w-[20px] flex flex-col items-center group relative">
                    <div
                      className={`w-full rounded-t-sm transition-all ${meetsTarget ? 'bg-green-500' : 'bg-blue-400'}`}
                      style={{ height: `${height}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {code}: {count} task{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels (show every few) */}
            <div className="flex gap-[2px] mt-1">
              {ataCounts.map(({ code }, i) => (
                <div key={code} className="flex-1 min-w-[3px] max-w-[20px] text-center">
                  {(i % Math.max(1, Math.floor(ataCounts.length / 15)) === 0) && (
                    <span className="text-[8px] text-gray-400 -rotate-45 inline-block origin-top-left">{code}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis label */}
          <p className="text-[10px] text-gray-400 text-center mt-1">ATA Chapter</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        The practical experience shall involve a representative cross section of maintenance tasks on aircraft.
      </p>
    </div>
  )
}
