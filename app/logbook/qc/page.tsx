import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function QcPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's employment periods to scope QC to same employer
  const { data: employmentPeriods } = await supabase
    .from('employment_periods')
    .select('employer, start_date, end_date')
    .eq('user_id', user.id)

  const userEmployers = employmentPeriods ?? []

  // Fetch all pending_qc entries (not owned by this user, not verified by this user)
  const { data: pendingEntries } = await supabase
    .from('logbook_entries')
    .select('*, profiles!logbook_entries_user_id_fkey(full_name)')
    .eq('status', 'pending_qc')
    .neq('user_id', user.id)
    .neq('verifier_id', user.id)
    .order('task_date', { ascending: false })

  // Filter by employer overlap
  const filteredEntries = (pendingEntries ?? []).filter(entry => {
    const taskDate = new Date(entry.task_date)
    return userEmployers.some(period => {
      if (period.employer !== entry.employer) return false
      const start = new Date(period.start_date)
      const end = period.end_date ? new Date(period.end_date) : new Date()
      return taskDate >= start && taskDate <= end
    })
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QC Review Queue</h1>
            <p className="text-gray-500 mt-1">
              Cross-check that the engineer and verifier were both on the job. Independent of the AML verification.
            </p>
          </div>
          <Link href="/logbook">
            <Button variant="outline">Back to Logbook</Button>
          </Link>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <p>No entries pending QC review at your employer(s).</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
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
                      <div className="text-xs text-gray-500">{entry.aircraft_registration}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">
                      {entry.job_number ?? '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">
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
