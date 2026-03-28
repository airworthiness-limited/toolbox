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
import {
  MAINTENANCE_CATEGORIES,
  ATA_CHAPTERS,
} from '@/lib/logbook/constants'

const PAGE_SIZE = 25

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Verify the user is an AML holder
  const { data: profile } = await supabase
    .from('profiles')
    .select('aml_licence_number, aml_categories')
    .eq('id', user.id)
    .single()

  if (!profile?.aml_licence_number) {
    return (
      <div className="min-h-screen aw-gradient">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Verification Queue</h1>
          <p className="text-white/60 mb-6">
            You need a Part 66 Aircraft Maintenance Licence to verify logbook entries.
          </p>
          <Link href="/profile">
            <Button>Update your profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  const verifierCategories = profile.aml_categories ?? []

  // Use the database function to filter server-side instead of fetching all entries
  const { data: filteredEntries } = await supabase.rpc('get_verification_queue', {
    p_verifier_id: user.id,
    p_categories: verifierCategories,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  })

  const entries = filteredEntries ?? []
  const hasNextPage = entries.length === PAGE_SIZE

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Verification Queue</h1>
            <p className="text-white/60 mt-1">
              Entries from personnel at your employer(s), matching your AML categories.
            </p>
          </div>
          <Link href="/logbook">
            <Button variant="outline">Back to Logbook</Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border p-4 mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Your AML:</span> {profile.aml_licence_number}, Categories: {verifierCategories.join(', ') || 'None'}
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <p>No entries pending your verification.</p>
            <p className="text-sm mt-1">Entries will appear here when personnel at your employer submit them.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead className="hidden md:table-cell">ATA</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.engineer_name ?? 'Unknown'}
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
                        {label(ATA_CHAPTERS, entry.ata_chapter)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {label(MAINTENANCE_CATEGORIES, entry.category)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              {page > 1 ? (
                <Link href={`/logbook/verify?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">Previous</Button>
                </Link>
              ) : <div />}
              <span className="text-sm text-white/60">Page {page}</span>
              {hasNextPage ? (
                <Link href={`/logbook/verify?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">Next</Button>
                </Link>
              ) : <div />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
