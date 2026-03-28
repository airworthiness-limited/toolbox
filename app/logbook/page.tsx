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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ENTRY_STATUSES,
  MAINTENANCE_CATEGORIES,
  ATA_CHAPTERS,
} from '@/lib/logbook/constants'
import type { EntryStatus } from '@/lib/logbook/constants'
import { AdPlaceholder } from '@/components/ad-placeholder'

function getCategoryLabel(value: string) {
  return MAINTENANCE_CATEGORIES.find(c => c.value === value)?.label ?? value
}

function getAtaLabel(value: string) {
  return ATA_CHAPTERS.find(c => c.value === value)?.label ?? `ATA ${value}`
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const info = ENTRY_STATUSES[status]
  return <Badge variant={info.color as 'default' | 'secondary' | 'outline' | 'destructive'}>{info.label}</Badge>
}

export default async function LogbookPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('aml_licence_number')
    .eq('id', user.id)
    .single()

  const isAmlHolder = !!profile?.aml_licence_number

  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('task_date', { ascending: false })

  const allEntries = entries ?? []
  const totalHours = allEntries.reduce((sum, e) => sum + Number(e.duration_hours), 0)
  const verifiedCount = allEntries.filter(e => e.status === 'verified' || e.status === 'qc_approved' || e.status === 'pending_qc').length
  const pendingCount = allEntries.filter(e => e.status === 'pending_verification').length
  const draftCount = allEntries.filter(e => e.status === 'draft').length

  const statuses: (EntryStatus | 'all')[] = ['all', 'draft', 'pending_verification', 'verified', 'rejected', 'pending_qc', 'qc_approved', 'qc_rejected']

  function filterEntries(status: EntryStatus | 'all') {
    if (status === 'all') return allEntries
    return allEntries.filter(e => e.status === status)
  }

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-white">Aircraft Maintenance Digital Logbook</h1>
            <p className="text-white/60 mt-1">Track your tasks in the format required by the Civil Aviation Authority.</p>
          </div>
          <div className="flex items-center gap-3">
            {isAmlHolder && (
              <Link href="/logbook/verify">
                <Button variant="outline">Verification Queue</Button>
              </Link>
            )}
            <Link href="/logbook/export">
              <Button variant="outline">Print / Export</Button>
            </Link>
            <Link href="/logbook/new">
              <Button>New Entry</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <p className="text-sm text-white/70">Total Entries</p>
            <p className="text-3xl font-bold mt-1 text-white">{allEntries.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <p className="text-sm text-white/70">Total Hours</p>
            <p className="text-3xl font-bold mt-1 text-white">{totalHours.toFixed(1)}</p>
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

        {/* Entries table */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({allEntries.length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({draftCount})</TabsTrigger>
            <TabsTrigger value="pending_verification">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({verifiedCount})</TabsTrigger>
          </TabsList>

          {['all', 'draft', 'pending_verification', 'verified'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {filterEntries(tab as EntryStatus | 'all').length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center text-gray-500 bg-white">
                  <p>No entries{tab !== 'all' ? ` with status "${ENTRY_STATUSES[tab as EntryStatus]?.label ?? tab}"` : ''}.</p>
                  {tab === 'all' && (
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
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterEntries(tab as EntryStatus | 'all').map(entry => (
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
                          <TableCell>{Number(entry.duration_hours).toFixed(1)}</TableCell>
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
            </TabsContent>
          ))}
        </Tabs>

      </div>
    </div>
  )
}
