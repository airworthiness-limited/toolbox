export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ATA_CHAPTERS, MAINTENANCE_CATEGORIES } from '@/lib/logbook/constants'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function QcPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  // Get user's employment periods to scope QC to same employer
  const userEmployers = await queryAll<{ employer: string; start_date: string; end_date: string | null }>(
    'SELECT employer, start_date, end_date FROM employment_periods WHERE user_id = $1',
    [user.id]
  )

  // Fetch all pending_qc entries (not owned by this user, not verified by this user)
  const pendingEntries = await queryAll<Record<string, any>>(
    'SELECT le.*, json_build_object(\'full_name\', p.full_name) as profiles FROM logbook_entries le LEFT JOIN profiles p ON p.id = le.user_id WHERE le.status = $1 AND le.user_id != $2 AND le.verifier_id != $3 ORDER BY le.task_date DESC',
    ['pending_qc', user.id, user.id]
  )

  // Filter by employer overlap
  const filteredEntries = (pendingEntries ?? []).filter(entry => {
    const taskDate = new Date(entry.task_date)
    return (userEmployers ?? []).some(period => {
      if (period.employer !== entry.employer) return false
      const start = new Date(period.start_date)
      const end = period.end_date ? new Date(period.end_date) : new Date()
      return taskDate >= start && taskDate <= end
    })
  })

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="flex items-center gap-3 mb-6">
          <SidebarTriggerInline />
          <Link href="/logbook" className="text-sm text-foreground hover:underline">
            &larr; Back to logbook
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">QC Review Queue</h1>
          <p className="text-white/60 mt-1">
            Cross-check that the individual and verifier were both on the job. Independent of the AML verification.
          </p>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
            <p>No entries pending QC review at your employer(s).</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead className="hidden md:table-cell">Job No.</TableHead>
                  <TableHead className="hidden md:table-cell">ATA</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {(entry.profiles as { full_name: string })?.full_name ?? 'Unknown'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(entry.task_date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div>{entry.aircraft_type}</div>
                      <div className="text-xs text-muted-foreground">{entry.aircraft_registration}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {entry.job_number ?? '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {label(ATA_CHAPTERS, entry.ata_chapter)}
                    </TableCell>
                    <TableCell>{Number(entry.duration_hours).toFixed(1)}</TableCell>
                    <TableCell>
                      <Link href={`/logbook/${entry.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
