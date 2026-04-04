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

const btnClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
  }`

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
    } else if (typeFilter === 'military_student') {
      result = result.filter(e => e.maintenance_type === 'military_experience' || e.maintenance_type === 'student_experience')
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
    const subCounts: Record<string, number> = {}
    for (const entry of filtered) {
      const chapters = entry.ata_chapters ?? []
      for (const ch of chapters) {
        subCounts[ch] = (subCounts[ch] || 0) + 1
      }
    }

    const mainChapters = new Map<string, string>()
    for (const ch of ATA_2200_CHAPTERS) {
      const main = ch.value.split('-')[0]
      if (!mainChapters.has(main)) {
        mainChapters.set(main, ch.label.split(':')[0])
      }
    }

    const result = Array.from(mainChapters.entries()).map(([main, name]) => {
      const subs = ATA_2200_CHAPTERS.filter(ch => ch.value.startsWith(main + '-'))
      const total = subs.reduce((sum, ch) => sum + (subCounts[ch.value] || 0), 0)
      const breakdown = subs
        .filter(ch => (subCounts[ch.value] || 0) > 0)
        .map(ch => ({ code: ch.value, label: ch.label, count: subCounts[ch.value] }))
      return { code: main, name, count: total, breakdown }
    })

    if (sortBy === 'most') return [...result].sort((a, b) => b.count - a.count)
    if (sortBy === 'least') return [...result].sort((a, b) => a.count - b.count)
    return result
  }, [filtered, sortBy])

  const rawMax = Math.max(15, ...ataCounts.map(a => a.count))
  const maxCount = Math.ceil(rawMax / 5) * 5

  const yTicks: number[] = []
  for (let i = 0; i <= maxCount; i += 5) yTicks.push(i)

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 mb-6 text-center text-muted-foreground">
        <p className="text-sm">Add logbook entries to see your ATA distribution chart.</p>
        <p className="text-xs mt-1">The practical experience shall involve a representative cross section of maintenance tasks on aircraft.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl p-5 mb-6">

      {/* Licence Categories */}
      <div className="mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Licence Categories</p>
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_FILTERS.map(f => (
            <button key={f.value} onClick={() => setCatFilter(f.value)} className={btnClass(catFilter === f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>


      {/* Arrange */}
      <div className="mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Arrange</p>
        <div className="flex gap-2 flex-wrap">
          {([['ata', 'ATA Order'], ['most', 'Most Tasks'], ['least', 'Least Tasks']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)} className={btnClass(sortBy === val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex" style={{ paddingTop: 12 }}>
        {/* Y-axis title + labels */}
        <div className="flex flex-col items-center mr-1">
          <span className="text-[8px] text-muted-foreground font-medium" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', marginBottom: 4 }}>Amount of Tasks</span>
        </div>
        <div className="relative flex-shrink-0" style={{ width: 24, height: 250 }}>
          {yTicks.map(tick => {
            const pct = (1 - tick / maxCount) * 100
            return (
              <div
                key={tick}
                className="absolute text-[10px] leading-none text-muted-foreground text-right flex items-center"
                style={{ top: `calc(${pct}% - 5px)`, left: 0, right: 2, height: 10 }}
              >
                {tick}
              </div>
            )
          })}
        </div>

        {/* Bar area */}
        <div className="flex-1 min-w-0">
          <div className="relative border-l border-b border-border" style={{ height: 250 }}>

            {yTicks.filter(t => t > 0).map(tick => (
              <div
                key={`grid-${tick}`}
                className="absolute left-0 right-0 border-t border-border"
                style={{ bottom: `${(tick / maxCount) * 100}%` }}
              />
            ))}

            <div className="flex items-end gap-1 px-1" style={{ height: 250 }}>
              {ataCounts.map(({ code, count, breakdown }) => {
                const barPx = count > 0 ? Math.max(8, Math.round((count / maxCount) * 250)) : 0
                const meetsTarget = count >= ATA_SUB_CHAPTER_TARGET
                return (
                  <div key={code} className="flex-1 flex items-end group relative" style={{ height: 250 }}>
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: barPx,
                        backgroundColor: count > 0 ? (meetsTarget ? '#22c55e' : '#3b82f6') : undefined,
                      }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-lg pointer-events-none" style={{ minWidth: 160 }}>
                      <div className="font-semibold mb-1">ATA {code}: {count} task{count !== 1 ? 's' : ''}</div>
                      {breakdown.length > 0 ? (
                        <div className="space-y-0.5">
                          {breakdown.map(sub => (
                            <div key={sub.code} className="flex justify-between gap-3">
                              <span className="text-white/70">{sub.code}</span>
                              <span>{sub.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/50">No tasks recorded</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1 px-1" style={{ height: 24 }}>
            {ataCounts.map(({ code }) => (
              <div key={`label-${code}`} className="flex-1 flex items-start justify-center pt-1">
                <span className="text-[9px] text-muted-foreground font-medium">{code}</span>
              </div>
            ))}
          </div>
          {/* X-axis title */}
          <p className="text-[8px] text-muted-foreground font-medium text-center">ATA Chapters</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        The practical experience shall involve a representative cross section of maintenance tasks on aircraft.
      </p>
    </div>
  )
}
