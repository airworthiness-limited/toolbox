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
  ATA_CHAPTERS,
  AIRCRAFT_CATEGORIES,
  RECENCY_TASK_THRESHOLD,
  RECENCY_DAY_THRESHOLD,
  SCOPE_OF_WORK,
} from '@/lib/logbook/constants'
import type { EntryStatus } from '@/lib/logbook/constants'
import { AdPlaceholder } from '@/components/ad-placeholder'

const PAGE_SIZE = 25

function getCategoryLabel(value: string) {
  return MAINTENANCE_CATEGORIES.find(c => c.value === value)?.label ?? value
}

function getAtaLabel(value: string) {
  return ATA_CHAPTERS.find(c => c.value === value)?.label ?? `ATA ${value}`
}

function getAircraftCategoryLabel(value: string) {
  return AIRCRAFT_CATEGORIES.find(c => c.value === value)?.label ?? value
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const info = ENTRY_STATUSES[status]
  return <Badge variant={info.color as 'default' | 'secondary' | 'outline' | 'destructive'}>{info.label}</Badge>
}

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const statusFilter = params.status || 'all'
  const offset = (page - 1) * PAGE_SIZE

  // Two years ago from today
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0]

  // Fetch profile, all stats, and recency data in parallel
  const [{ data: profile }, { data: statsEntries }, { data: recencyEntries }] = await Promise.all([
    supabase
      .from('profiles')
      .select('aml_licence_number')
      .eq('id', user.id)
      .single(),
    supabase
      .from('logbook_entries')
      .select('status')
      .eq('user_id', user.id),
    supabase
      .from('logbook_entries')
      .select('aircraft_category, task_date')
      .eq('user_id', user.id)
      .in('status', ['verified', 'qc_approved', 'pending_qc'])
      .gte('task_date', twoYearsAgoStr),
  ])

  const isAmlHolder = !!profile?.aml_licence_number

  const allStats = statsEntries ?? []
  const totalCount = allStats.length
  const verifiedCount = allStats.filter(e => e.status === 'verified' || e.status === 'qc_approved' || e.status === 'pending_qc').length
  const pendingCount = allStats.filter(e => e.status === 'pending_verification').length
  const draftCount = allStats.filter(e => e.status === 'draft').length

  // Calculate recency per aircraft type
  const recencyData = AIRCRAFT_CATEGORIES.map(cat => {
    const catEntries = (recencyEntries ?? []).filter(e => e.aircraft_category === cat.value)
    const tasks = catEntries.length
    const uniqueDays = new Set(catEntries.map(e => e.task_date)).size
    const meetsRecency = tasks >= RECENCY_TASK_THRESHOLD || uniqueDays >= RECENCY_DAY_THRESHOLD
    return { ...cat, tasks, days: uniqueDays, meetsRecency }
  }).filter(cat => cat.tasks > 0)

  // Fetch the current page of entries with the active filter
  let query = supabase
    .from('logbook_entries')
    .select('id, task_date, aircraft_type, aircraft_registration, ata_chapter, category, status')
    .eq('user_id', user.id)
    .order('task_date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: entries } = await query

  const pageEntries = entries ?? []
  const hasNextPage = pageEntries.length === PAGE_SIZE

  const filteredTotal = statusFilter === 'all'
    ? totalCount
    : allStats.filter(e => e.status === statusFilter).length

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-white">Digital Logbook (CAP 741)</h1>
            <p className="text-white/60 mt-1">Track your maintenance tasks in the CAP 741 format.</p>
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
            <Link href="/logbook/new">
              <Button>New Entry</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <p className="text-sm text-white/70">Tasks</p>
            <p className="text-3xl font-bold mt-1 text-white">{totalCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <p className="text-sm text-white/70">Verified</p>
            <p className="text-3xl font-bold mt-1 text-white">{verifiedCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <p className="text-sm text-white/70">Drafts</p>
            <p className="text-3xl font-bold mt-1 text-white">{draftCount}</p>
          </div>
        </div>

        {/* Recency Tracking */}
        {recencyData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Recency (Last 2 Years)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recencyData.map(cat => (
                <div
                  key={cat.value}
                  className={`bg-white rounded-xl p-5 border-2 ${
                    cat.meetsRecency ? 'border-green-300' : 'border-amber-300'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat.label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tasks</span>
                      <span className={`text-sm font-bold ${cat.tasks >= RECENCY_TASK_THRESHOLD ? 'text-green-600' : 'text-gray-900'}`}>
                        {cat.tasks} / {RECENCY_TASK_THRESHOLD}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${cat.tasks >= RECENCY_TASK_THRESHOLD ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (cat.tasks / RECENCY_TASK_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Days</span>
                      <span className={`text-sm font-bold ${cat.days >= RECENCY_DAY_THRESHOLD ? 'text-green-600' : 'text-gray-900'}`}>
                        {cat.days} / {RECENCY_DAY_THRESHOLD}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${cat.days >= RECENCY_DAY_THRESHOLD ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (cat.days / RECENCY_DAY_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className={`text-xs font-bold mt-3 ${cat.meetsRecency ? 'text-green-600' : 'text-amber-600'}`}>
                    {cat.meetsRecency ? 'Recent' : 'Not yet recent'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-3 mb-6 text-sm">
          <Link href="/logbook/employment" className="text-white/70 hover:text-white underline">
            Employment History
          </Link>
          <Link href="/profile" className="text-white/70 hover:text-white underline">
            AML Profile
          </Link>
        </div>

        <AdPlaceholder format="inline" className="my-6" />

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
              href={`/logbook?status=${tab.value}`}
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

        {/* Entries table */}
        {pageEntries.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <p>No entries{statusFilter !== 'all' ? ` with status "${ENTRY_STATUSES[statusFilter as EntryStatus]?.label ?? statusFilter}"` : ''}.</p>
            {statusFilter === 'all' && (
              <p className="text-sm mt-1">
                <Link href="/logbook/new" className="text-blue-600 hover:underline">Create your first entry</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead className="hidden md:table-cell">ATA</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map(entry => (
                  <TableRow key={entry.id}>
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
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/logbook/${entry.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredTotal > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            {page > 1 ? (
              <Link href={`/logbook?status=${statusFilter}&page=${page - 1}`}>
                <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Previous</Button>
              </Link>
            ) : <div />}
            <span className="text-sm text-white/60">
              Page {page} of {Math.ceil(filteredTotal / PAGE_SIZE)}
            </span>
            {hasNextPage ? (
              <Link href={`/logbook?status=${statusFilter}&page=${page + 1}`}>
                <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Next</Button>
              </Link>
            ) : <div />}
          </div>
        )}

      </div>
    </div>
  )
}
