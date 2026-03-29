import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ENTRY_STATUSES,
  MAINTENANCE_CATEGORIES,
  AIRCRAFT_CATEGORIES,
  RECENCY_TASK_THRESHOLD,
  RECENCY_DAY_THRESHOLD,
  EXPERIENCE_REQUIREMENTS,
  EXPERIENCE_VALIDITY_YEARS,
  CATEGORY_TO_AIRCRAFT,
  getAtaLabel,
} from '@/lib/logbook/constants'
import type { EntryStatus } from '@/lib/logbook/constants'
import { AdPlaceholder } from '@/components/ad-placeholder'
import { MilitaryExperience } from './military-experience'
import { MassInput } from './mass-input'
import { AtaChart } from './ata-chart'
import { BtcToggle } from '@/app/progress/btc-toggle'

const PAGE_SIZE = 25

const CATEGORY_GROUPS = [
  { label: 'Aeroplane \u2013 Turbine', cats: ['A1', 'B1.1'] },
  { label: 'Aeroplane \u2013 Piston', cats: ['A2', 'B1.2', 'B3'] },
  { label: 'Helicopter \u2013 Turbine', cats: ['A3', 'B1.3'] },
  { label: 'Helicopter \u2013 Piston', cats: ['A4', 'B1.4'] },
  { label: 'Avionics', cats: ['B2'] },
]

function getCategoryLabel(value: string) {
  return MAINTENANCE_CATEGORIES.find(c => c.value === value)?.label ?? value
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const info = ENTRY_STATUSES[status]
  return <Badge variant={info.color as 'default' | 'secondary' | 'outline' | 'destructive'}>{info.label}</Badge>
}

function calcMonths(periods: { start_date: string; end_date: string | null }[], cutoff: Date): number {
  let totalDays = 0
  for (const p of periods) {
    const start = new Date(p.start_date) < cutoff ? cutoff : new Date(p.start_date)
    const end = p.end_date ? new Date(p.end_date) : new Date()
    if (end <= start) continue
    totalDays += Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  return Math.round(totalDays / 30.44)
}

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; category?: string; sort?: string; dir?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const statusFilter = params.status || 'all'
  const selectedCategory = params.category || ''
  const allowedSorts = ['task_date', 'aircraft_type', 'ata_chapter', 'category', 'status'] as const
  const sortColumn = allowedSorts.includes(params.sort as any) ? params.sort! : 'task_date'
  const sortDir = params.dir === 'asc'
  const offset = (page - 1) * PAGE_SIZE

  // Date boundaries
  const now = new Date()
  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0]
  const tenYearsAgo = new Date(now)
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - EXPERIENCE_VALIDITY_YEARS)
  const tenYearsAgoStr = tenYearsAgo.toISOString().split('T')[0]

  // Aircraft categories relevant to selected AML category
  const relevantAircraftCats = selectedCategory ? CATEGORY_TO_AIRCRAFT[selectedCategory] ?? [] : []

  // Fetch profile, stats, recency, and employment in parallel
  const [{ data: profile }, { data: statsEntries }, { data: recencyEntries }, { data: employmentPeriods }, { data: btcRecord }] = await Promise.all([
    supabase
      .from('profiles')
      .select('aml_licence_number')
      .eq('id', user.id)
      .single(),
    supabase
      .from('logbook_entries')
      .select('status, task_date, aircraft_category, maintenance_type, ata_chapters')
      .eq('user_id', user.id),
    supabase
      .from('logbook_entries')
      .select('aircraft_category, task_date')
      .eq('user_id', user.id)
      .gte('task_date', twoYearsAgoStr),
    supabase
      .from('employment_periods')
      .select('employer, start_date, end_date, is_military')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('module_exam_progress')
      .select('is_btc')
      .eq('user_id', user.id)
      .eq('module_id', '_btc')
      .single(),
  ])

  const isAmlHolder = !!profile?.aml_licence_number
  const allStats = statsEntries ?? []
  const hasBtc = !!(btcRecord as any)?.is_btc


  // Default employer: most recent employment period with no end date
  const currentEmployer = (employmentPeriods ?? []).find(p => !p.end_date && !p.is_military)
  const defaultEmployer = currentEmployer?.employer ?? ''

  // Last maintenance type used (from most recent entry)
  const lastEntry = allStats[0] as { maintenance_type?: string } | undefined
  const lastMaintenanceType = (lastEntry as any)?.maintenance_type

  // Filter stats by category if selected
  const filteredStats = selectedCategory && relevantAircraftCats.length > 0
    ? allStats.filter(e => relevantAircraftCats.includes(e.aircraft_category))
    : allStats

  const totalCount = filteredStats.length
  const verifiedCount = filteredStats.filter(e => e.status === 'verified' || e.status === 'qc_approved' || e.status === 'pending_qc').length
  const draftCount = filteredStats.filter(e => e.status === 'draft').length
  const pendingCount = filteredStats.filter(e => e.status === 'pending_verification').length

  // Recency: filter by selected category's aircraft types
  const filteredRecency = selectedCategory && relevantAircraftCats.length > 0
    ? (recencyEntries ?? []).filter(e => relevantAircraftCats.includes(e.aircraft_category))
    : (recencyEntries ?? [])
  const recencyTasks = filteredRecency.length
  const recencyDays = new Set(filteredRecency.map(e => e.task_date)).size
  const meetsRecency = recencyTasks >= RECENCY_TASK_THRESHOLD || recencyDays >= RECENCY_DAY_THRESHOLD

  // Experience calculator (if category selected)
  const expReq = selectedCategory ? EXPERIENCE_REQUIREMENTS[selectedCategory] : null
  const allPeriods = employmentPeriods ?? []
  const civilPeriods = allPeriods.filter(p => !p.is_military)
  const militaryPeriods = allPeriods.filter(p => p.is_military)
  const civilMonths = calcMonths(civilPeriods, tenYearsAgo)
  const militaryMonths = calcMonths(militaryPeriods, tenYearsAgo)
  const totalExpMonths = civilMonths + militaryMonths

  // Civil experience: only count continuous periods where tasks are within 5 days of each other
  // Gaps > 5 days break the chain (prevents fraud: 2 tasks 5 years apart)
  const MAX_GAP_DAYS = 5
  const sortedTaskDates = allStats
    .map(e => new Date(e.task_date).getTime())
    .filter(t => t >= tenYearsAgo.getTime())
    .sort((a, b) => a - b)

  let civilExpDays = 0
  if (sortedTaskDates.length > 0) {
    let periodStart = sortedTaskDates[0]
    let periodEnd = sortedTaskDates[0]
    for (let i = 1; i < sortedTaskDates.length; i++) {
      const gap = (sortedTaskDates[i] - periodEnd) / (1000 * 60 * 60 * 24)
      if (gap <= MAX_GAP_DAYS) {
        // Continuous — extend the period
        periodEnd = sortedTaskDates[i]
      } else {
        // Gap too large — close this period and start a new one
        civilExpDays += Math.round((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
        periodStart = sortedTaskDates[i]
        periodEnd = sortedTaskDates[i]
      }
    }
    // Close the final period
    civilExpDays += Math.round((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
  }
  const civilExpMonths = Math.round(civilExpDays / 30.44)
  const cappedMilitaryMonths = Math.min(militaryMonths, 48) // Max 4 years military
  const totalCombinedMonths = civilExpMonths + cappedMilitaryMonths
  const meetsExpThreshold = totalCombinedMonths >= 60 && civilExpMonths >= 12 // 5 years total AND min 12 months civil

  // 10-year cutoff for entries
  const tenYearsAgoTime = tenYearsAgo.getTime()

  // Fetch the current page of entries with filters
  let query = supabase
    .from('logbook_entries')
    .select('id, task_date, aircraft_type, aircraft_registration, aircraft_category, ata_chapter, category, status')
    .eq('user_id', user.id)
    .order(sortColumn, { ascending: sortDir })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  if (selectedCategory && relevantAircraftCats.length > 0) {
    query = query.in('aircraft_category', relevantAircraftCats)
  }

  const { data: entries } = await query

  const pageEntries = entries ?? []
  const hasNextPage = pageEntries.length === PAGE_SIZE

  const filteredTotal = statusFilter === 'all'
    ? totalCount
    : filteredStats.filter(e => e.status === statusFilter).length

  // Build URL helper
  function buildUrl(overrides: Record<string, string>) {
    const p = { category: selectedCategory, status: statusFilter, page: String(page), sort: sortColumn, dir: sortDir ? 'asc' : 'desc', ...overrides }
    const parts = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
    return `/logbook?${parts.join('&')}`
  }

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-white">Digital Logbook (CAP 741)</h1>
            <p className="text-white/60 mt-1">Track your progress to demonstrate practical experience on a representative cross section of maintenance tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            {isAmlHolder && (
              <Link href="/logbook/verify">
                <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">Verification Queue</Button>
              </Link>
            )}
            <Link href="/logbook/export">
              <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">Print / Export</Button>
            </Link>
          </div>
        </div>

        {/* ATA Distribution Chart */}
        <AtaChart entries={allStats.map(e => ({
          maintenance_type: (e as any).maintenance_type ?? 'line_maintenance',
          aircraft_category: e.aircraft_category,
          ata_chapters: (e as any).ata_chapters ?? [],
        }))} />

        <AdPlaceholder format="banner" className="my-4" />

        {/* Stats + Experience + Recency */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-5">
            <p className="text-sm text-white/70">Tasks</p>
            <p className="text-3xl font-bold mt-1 text-white">{totalCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-5">
            <p className="text-sm text-white/70">Drafts</p>
            <p className="text-3xl font-bold mt-1 text-white">{draftCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-5">
            <p className="text-sm text-white/70">Verified</p>
            <p className="text-3xl font-bold mt-1 text-white">{verifiedCount}</p>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: meetsExpThreshold ? '#22c55e' : 'rgba(255,255,255,0.1)', borderWidth: meetsExpThreshold ? 0 : 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <p className="text-sm" style={{ color: meetsExpThreshold ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)' }}>Experience</p>
            <p className="text-3xl font-bold mt-1 text-white">
              {Math.floor(totalCombinedMonths / 12)}y {totalCombinedMonths % 12}m
            </p>
            {cappedMilitaryMonths > 0 && (
              <p className="text-[10px] mt-1" style={{ color: meetsExpThreshold ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' }}>
                {Math.floor(civilExpMonths / 12)}y {civilExpMonths % 12}m civil + {Math.floor(cappedMilitaryMonths / 12)}y {cappedMilitaryMonths % 12}m military{militaryMonths > 48 ? ' (4yr max)' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-6">

          <div className="bg-white rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Recency (6 Months / 2 Years)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks</span>
                  <span className="text-sm font-bold text-gray-900">{recencyTasks} / {RECENCY_TASK_THRESHOLD}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    style={{ width: `${Math.min(100, (recencyTasks / RECENCY_TASK_THRESHOLD) * 100)}%`, backgroundColor: recencyTasks >= RECENCY_TASK_THRESHOLD ? '#22c55e' : '#3b82f6' }}
                    className="h-1.5 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days</span>
                  <span className="text-sm font-bold text-gray-900">{recencyDays} / {RECENCY_DAY_THRESHOLD}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    style={{ width: `${Math.min(100, (recencyDays / RECENCY_DAY_THRESHOLD) * 100)}%`, backgroundColor: recencyDays >= RECENCY_DAY_THRESHOLD ? '#22c55e' : '#3b82f6' }}
                    className="h-1.5 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Training Course */}
        <div className="bg-white rounded-xl px-5 py-3 mb-4">
          <BtcToggle
            initialValue={hasBtc}
            selectedCategory={selectedCategory || 'B1.1'}
            userId={user.id}
          />
        </div>

        <AdPlaceholder format="banner" className="my-4" />

        {/* Military Experience */}
        <div className="mb-6">
          <MilitaryExperience
            selectedCategory={selectedCategory || 'B1.1'}
            hasMilitaryPeriod={militaryMonths > 0}
            militaryStart={militaryPeriods[0]?.start_date ?? ''}
            militaryEnd={militaryPeriods[0]?.end_date ?? null}
            civilMonths={civilMonths}
            militaryMonths={militaryMonths}
            totalExpMonths={totalExpMonths}
          />
        </div>

        <AdPlaceholder format="banner" className="my-4" />

        {/* Mass Input */}
        <h2 className="text-lg font-bold text-white mb-3">New Entries</h2>
        <MassInput
          defaultEmployer={defaultEmployer}
          lastMaintenanceType={lastMaintenanceType}
        />

        <AdPlaceholder format="banner" className="my-4" />

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { value: 'all', label: `All (${totalCount})` },
            { value: 'draft', label: `Drafts (${draftCount})` },
            { value: 'pending_verification', label: `Pending (${pendingCount})` },
            { value: 'verified', label: `Verified (${verifiedCount})` },
          ].map(tab => (
            <Link
              key={tab.value}
              href={buildUrl({ status: tab.value, page: '1' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <AdPlaceholder format="banner" className="my-4" />

        {/* Entries table */}
        {pageEntries.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <p>No entries{statusFilter !== 'all' ? ` with status "${ENTRY_STATUSES[statusFilter as EntryStatus]?.label ?? statusFilter}"` : ''}.</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50 select-none">
                    <Link href={buildUrl({ sort: 'task_date', dir: params.sort === 'task_date' && params.dir !== 'asc' ? 'asc' : 'desc', page: '1' })} className="flex items-center gap-1">
                      Date {params.sort === 'task_date' && <span>{params.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                    </Link>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 select-none">
                    <Link href={buildUrl({ sort: 'aircraft_type', dir: params.sort === 'aircraft_type' && params.dir !== 'asc' ? 'asc' : 'desc', page: '1' })} className="flex items-center gap-1">
                      Aircraft {params.sort === 'aircraft_type' && <span>{params.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                    </Link>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer hover:bg-gray-50 select-none">
                    <Link href={buildUrl({ sort: 'ata_chapter', dir: params.sort === 'ata_chapter' && params.dir !== 'asc' ? 'asc' : 'desc', page: '1' })} className="flex items-center gap-1">
                      ATA {params.sort === 'ata_chapter' && <span>{params.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                    </Link>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer hover:bg-gray-50 select-none">
                    <Link href={buildUrl({ sort: 'category', dir: params.sort === 'category' && params.dir !== 'asc' ? 'asc' : 'desc', page: '1' })} className="flex items-center gap-1">
                      Category {params.sort === 'category' && <span>{params.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                    </Link>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 select-none">
                    <Link href={buildUrl({ sort: 'status', dir: params.sort === 'status' && params.dir !== 'asc' ? 'asc' : 'desc', page: '1' })} className="flex items-center gap-1">
                      Status {params.sort === 'status' && <span>{params.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                    </Link>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map(entry => {
                  const isExpired = new Date(entry.task_date).getTime() < tenYearsAgoTime
                  return (
                    <TableRow key={entry.id} className={isExpired ? 'opacity-50' : ''}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(entry.task_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.aircraft_type}</div>
                        <div className="text-xs text-gray-500">{entry.aircraft_registration}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {getAtaLabel(entry.ata_chapter)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {getCategoryLabel(entry.category)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={entry.status} />
                          {isExpired && <Badge variant="destructive">EXPIRED</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/logbook/${entry.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredTotal > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            {page > 1 ? (
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Previous</Button>
              </Link>
            ) : <div />}
            <span className="text-sm text-white/60">
              Page {page} of {Math.ceil(filteredTotal / PAGE_SIZE)}
            </span>
            {hasNextPage ? (
              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Next</Button>
              </Link>
            ) : <div />}
          </div>
        )}

      </div>
    </div>
  )
}
